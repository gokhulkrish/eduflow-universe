import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Departments Fields",
      fields: [
      { key: "department_name", label: "Department Name", aliases: ["department_name", "department name", "dept name", "department"], required: true },
      { key: "department_code", label: "Department Code", aliases: ["department_code", "dept code", "code", "dept_code"] },
      { key: "hod_name", label: "HOD Name", aliases: ["hod_name", "hod", "head of department", "head"] },
      { key: "program_level", label: "Program Level", aliases: ["program_level", "level", "program", "degree level"] },
      { key: "sanctioned_intake", label: "Sanctioned Intake", aliases: ["sanctioned_intake", "intake", "capacity", "seats"] },
      { key: "naac_nba_status", label: "NAAC/NBA Status", aliases: ["naac_nba_status", "accreditation status", "naac status", "nba status"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "department_name_only", label: "Department Name Only", fields: ["department_name"] },
  { id: "name_only", label: "Name Only", fields: ["department_code"] },
  { id: "department_name_or_name", label: "Department Name OR Name", fields: ["department_name", "department_code"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("departments") as any).select("id, department_name, department_code, hod_name, program_level, sanctioned_intake, naac_nba_status").order("department_name");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["department_name"] = row.mapped["department_name"] || row.sourceRow["department_name"] || null;       record["department_code"] = row.mapped["department_code"] || row.sourceRow["department_code"] || null;       record["hod_name"] = row.mapped["hod_name"] || row.sourceRow["hod_name"] || null;       record["program_level"] = row.mapped["program_level"] || row.sourceRow["program_level"] || null;       record["sanctioned_intake"] = row.mapped["sanctioned_intake"] || row.sourceRow["sanctioned_intake"] || null;       record["naac_nba_status"] = row.mapped["naac_nba_status"] || row.sourceRow["naac_nba_status"] || null;

      const firstKey = "department_name";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Department Name is required" }); return; }

      const { data: existing } = await supabase.from("departments").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("departments") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Department Name not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("departments") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.departments.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("departments").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("departments") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const departmentsModule: ImportModule = {
  id: "departments",
  name: "Departments",
  description: "Import department records including HOD assignments and program levels",
  icon: "Building2",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};