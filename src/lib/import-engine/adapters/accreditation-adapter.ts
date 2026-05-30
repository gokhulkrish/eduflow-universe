import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Accreditation (IQAC) Fields",
      fields: [
      { key: "quality_cycle", label: "Quality Cycle", aliases: ["quality_cycle", "cycle", "quality cycle", "accreditation cycle"], required: true },
      { key: "framework", label: "Framework", aliases: ["framework", "standard", "accreditation framework", "guideline"] },
      { key: "criterion", label: "Criterion", aliases: ["criterion", "criteria", "standard", "parameter"] },
      { key: "evidence_status", label: "Evidence Status", aliases: ["evidence_status", "evidence", "proof status", "document status"] },
      { key: "owner", label: "Owner", aliases: ["owner", "responsible person", "coordinator", "incharge"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "quality_cycle_only", label: "Quality Cycle Only", fields: ["quality_cycle"] },
  { id: "name_only", label: "Name Only", fields: ["framework"] },
  { id: "quality_cycle_or_name", label: "Quality Cycle OR Name", fields: ["quality_cycle", "framework"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("accreditation_records") as any).select("id, quality_cycle, framework, criterion, evidence_status, owner").order("quality_cycle");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["quality_cycle"] = row.mapped["quality_cycle"] || row.sourceRow["quality_cycle"] || null;       record["framework"] = row.mapped["framework"] || row.sourceRow["framework"] || null;       record["criterion"] = row.mapped["criterion"] || row.sourceRow["criterion"] || null;       record["evidence_status"] = row.mapped["evidence_status"] || row.sourceRow["evidence_status"] || null;       record["owner"] = row.mapped["owner"] || row.sourceRow["owner"] || null;

      const firstKey = "quality_cycle";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Quality Cycle is required" }); return; }

      const { data: existing } = await supabase.from("accreditation_records").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("accreditation_records") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Quality Cycle not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("accreditation_records") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.accreditation_records.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("accreditation_records").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("accreditation_records") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const accreditationModule: ImportModule = {
  id: "accreditation",
  name: "Accreditation (IQAC)",
  description: "Import accreditation records including quality cycles and evidence status",
  icon: "Award",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};