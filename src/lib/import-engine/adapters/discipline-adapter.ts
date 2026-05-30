import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Discipline Records Fields",
      fields: [
      { key: "student", label: "Student", aliases: ["student", "student name", "pupil", "offender"], required: true },
      { key: "type", label: "Incident Type", aliases: ["type", "incident type", "category", "nature"], required: true },
      { key: "description", label: "Description", aliases: ["description", "details", "incident details", "report"] },
      { key: "date", label: "Date", aliases: ["date", "incident date", "occured on", "event date"] },
      { key: "severity", label: "Severity", aliases: ["severity", "level", "seriousness", "grade"] },
      { key: "action", label: "Action Taken", aliases: ["action", "disciplinary action", "resolution", "outcome"] },
      { key: "status", label: "Status", aliases: ["status", "case status", "state", "resolution status"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "student_only", label: "Student Only", fields: ["student"] },
  { id: "name_only", label: "Name Only", fields: ["type"] },
  { id: "student_or_name", label: "Student OR Name", fields: ["student", "type"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("discipline_incidents") as any).select("id, student, type, description, date, severity, action, status").order("student");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["student"] = row.mapped["student"] || row.sourceRow["student"] || null;       record["type"] = row.mapped["type"] || row.sourceRow["type"] || null;       record["description"] = row.mapped["description"] || row.sourceRow["description"] || null;       record["date"] = row.mapped["date"] || row.sourceRow["date"] || null;       record["severity"] = row.mapped["severity"] || row.sourceRow["severity"] || null;       record["action"] = row.mapped["action"] || row.sourceRow["action"] || null;       record["status"] = row.mapped["status"] || row.sourceRow["status"] || null;

      const firstKey = "student";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Student is required" }); return; }

      const { data: existing } = await supabase.from("discipline_incidents").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("discipline_incidents") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Student not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("discipline_incidents") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.discipline_incidents.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("discipline_incidents").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("discipline_incidents") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const disciplineModule: ImportModule = {
  id: "discipline",
  name: "Discipline Records",
  description: "Import discipline incidents with severity and resolution tracking",
  icon: "ShieldAlert",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};