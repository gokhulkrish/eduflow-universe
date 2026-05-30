import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Leave Master Fields",
      fields: [
      { key: "name", label: "Leave Name", aliases: ["name", "leave name", "leave type", "type"], required: true },
      { key: "days", label: "Days Allowed", aliases: ["days", "max days", "allowed days", "leave days", "count"] },
      { key: "paid", label: "Paid", aliases: ["paid", "is paid", "paid leave"] },
      { key: "carry_forward", label: "Carry Forward", aliases: ["carry_forward", "carryforward", "carry forward", "rollover"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "name_only", label: "Leave Name Only", fields: ["name"] },
  { id: "name_only", label: "Name Only", fields: ["days"] },
  { id: "name_or_name", label: "Leave Name OR Name", fields: ["name", "days"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("leave_types") as any).select("id, name, days, paid, carry_forward").order("name");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["name"] = row.mapped["name"] || row.sourceRow["name"] || null;       record["days"] = row.mapped["days"] || row.sourceRow["days"] || null;       record["paid"] = row.mapped["paid"] || row.sourceRow["paid"] || null;       record["carry_forward"] = row.mapped["carry_forward"] || row.sourceRow["carry_forward"] || null;

      const firstKey = "name";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Leave Name is required" }); return; }

      const { data: existing } = await supabase.from("leave_types").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("leave_types") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Leave Name not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("leave_types") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.leave_types.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("leave_types").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("leave_types") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const leaveMasterModule: ImportModule = {
  id: "leave-master",
  name: "Leave Master",
  description: "Import leave type definitions including day counts and carry-forward rules",
  icon: "Calendar",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};