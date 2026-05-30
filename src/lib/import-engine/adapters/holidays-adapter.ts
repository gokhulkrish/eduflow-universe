import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Holidays Fields",
      fields: [
      { key: "name", label: "Holiday Name", aliases: ["name", "holiday name", "occasion", "festival", "event"], required: true },
      { key: "date", label: "Date", aliases: ["date", "holiday date", "day", "occurs on"] },
      { key: "type", label: "Type", aliases: ["type", "holiday type", "category", "nature"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "name_only", label: "Holiday Name Only", fields: ["name"] },
  { id: "name_only", label: "Name Only", fields: ["date"] },
  { id: "name_or_name", label: "Holiday Name OR Name", fields: ["name", "date"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("holidays") as any).select("id, name, date, type").order("name");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["name"] = row.mapped["name"] || row.sourceRow["name"] || null;       record["date"] = row.mapped["date"] || row.sourceRow["date"] || null;       record["type"] = row.mapped["type"] || row.sourceRow["type"] || null;

      const firstKey = "name";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Holiday Name is required" }); return; }

      const { data: existing } = await supabase.from("holidays").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("holidays") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Holiday Name not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("holidays") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.holidays.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("holidays").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("holidays") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const holidaysModule: ImportModule = {
  id: "holidays",
  name: "Holidays",
  description: "Import holiday schedules including dates and holiday types",
  icon: "CalendarDays",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};