import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Procurement & Assets Fields",
      fields: [
      { key: "requestTitle", label: "Request Title", aliases: ["request_title", "request title", "title", "item"], required: true },
      { key: "vendorName", label: "Vendor Name", aliases: ["vendor_name", "vendor name", "vendor", "supplier"] },
      { key: "assetTag", label: "Asset Tag", aliases: ["asset_tag", "asset tag", "tag", "asset id"] },
      { key: "departmentName", label: "Department", aliases: ["department_name", "department", "dept", "unit"] },
      { key: "procurementStatus", label: "Status", aliases: ["procurement_status", "status", "procurement status", "state"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "requestTitle_only", label: "Request Title Only", fields: ["requestTitle"] },
  { id: "name_only", label: "Vendor Name Only", fields: ["vendorName"] },
  { id: "requestTitle_or_name", label: "Request Title OR Vendor Name", fields: ["requestTitle", "vendorName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("procurement_requests") as any).select("id, request_title, vendor_name, asset_tag, department_name, procurement_status").order("request_title");
  return (data || []).map((r: Record<string, unknown>) => {
    const out: Record<string, unknown> = { id: r.id };
    out["requestTitle"] = r["request_title"] ?? null;     out["vendorName"] = r["vendor_name"] ?? null;     out["assetTag"] = r["asset_tag"] ?? null;     out["departmentName"] = r["department_name"] ?? null;     out["procurementStatus"] = r["procurement_status"] ?? null;
    return out;
  });
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const idVal = row.mapped.requestTitle || row.sourceRow.requestTitle || "";
      if (!idVal) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Request Title is required" }); return; }

      const { data: existing } = await supabase.from("procurement_requests").select("id").eq("request_title", idVal).maybeSingle();
      const db: Record<string, unknown> = {};
      db.request_title = row.mapped.requestTitle ?? row.sourceRow.requestTitle ?? null;
      db.vendor_name = row.mapped.vendorName ?? row.sourceRow.vendorName ?? null;
      db.asset_tag = row.mapped.assetTag ?? row.sourceRow.assetTag ?? null;
      db.department_name = row.mapped.departmentName ?? row.sourceRow.departmentName ?? null;
      db.procurement_status = row.mapped.procurementStatus ?? row.sourceRow.procurementStatus ?? null;

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("procurement_requests") as any).insert(db).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Request Title not found: {idField}" }); return; }
        const { error } = await (supabase.from("procurement_requests") as any).update(db).eq("id", targetId);
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
  emitAppSync("sms.procurement_requests.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("procurement_requests").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("procurement_requests") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const procurementModule: ImportModule = {
  id: "procurement",
  name: "Procurement & Assets",
  description: "Import procurement requests and asset tracking records",
  icon: "Package",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};