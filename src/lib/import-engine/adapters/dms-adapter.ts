import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Document DMS Fields",
      fields: [
      { key: "documentTitle", label: "Document Title", aliases: ["document_title", "document title", "title", "doc name"], required: true },
      { key: "documentType", label: "Document Type", aliases: ["document_type", "document type", "type", "category"] },
      { key: "owner", label: "Owner", aliases: ["owner", "document owner", "responsible", "custodian"] },
      { key: "expiryDate", label: "Expiry Date", aliases: ["expiry_date", "expiry date", "expires", "valid until"] },
      { key: "documentStatus", label: "Status", aliases: ["document_status", "status", "document status", "state"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "documentTitle_only", label: "Document Title Only", fields: ["documentTitle"] },
  { id: "name_only", label: "Document Type Only", fields: ["documentType"] },
  { id: "documentTitle_or_name", label: "Document Title OR Document Type", fields: ["documentTitle", "documentType"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("documents") as any).select("id, document_title, document_type, owner, expiry_date, document_status").order("document_title");
  return (data || []).map((r: Record<string, unknown>) => {
    const out: Record<string, unknown> = { id: r.id };
    out["documentTitle"] = r["document_title"] ?? null;     out["documentType"] = r["document_type"] ?? null;     out["owner"] = r["owner"] ?? null;     out["expiryDate"] = r["expiry_date"] ?? null;     out["documentStatus"] = r["document_status"] ?? null;
    return out;
  });
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const idVal = row.mapped.documentTitle || row.sourceRow.documentTitle || "";
      if (!idVal) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Document Title is required" }); return; }

      const { data: existing } = await supabase.from("documents").select("id").eq("document_title", idVal).maybeSingle();
      const db: Record<string, unknown> = {};
      db.document_title = row.mapped.documentTitle ?? row.sourceRow.documentTitle ?? null;
      db.document_type = row.mapped.documentType ?? row.sourceRow.documentType ?? null;
      db.owner = row.mapped.owner ?? row.sourceRow.owner ?? null;
      db.expiry_date = row.mapped.expiryDate ?? row.sourceRow.expiryDate ?? null;
      db.document_status = row.mapped.documentStatus ?? row.sourceRow.documentStatus ?? null;

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("documents") as any).insert(db).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Document Title not found: {idField}" }); return; }
        const { error } = await (supabase.from("documents") as any).update(db).eq("id", targetId);
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    if (signal?.aborted) break;
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processRow));
  }
  emitAppSync("sms.documents.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("documents").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("documents") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const documentsModule: ImportModule = {
  id: "documents",
  name: "Document DMS",
  description: "Import document management records including expiry tracking",
  icon: "FileText",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};