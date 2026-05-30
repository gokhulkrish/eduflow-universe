import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Curriculum Outcomes Fields",
      fields: [
      { key: "curriculum_name", label: "Curriculum Name", aliases: ["curriculum_name", "curriculum name", "curriculum", "name"], required: true },
      { key: "course_code", label: "Course Code", aliases: ["course_code", "course code", "code", "subject code"] },
      { key: "semester", label: "Semester", aliases: ["semester", "term", "half", "period"] },
      { key: "outcome_map_status", label: "Outcome Map Status", aliases: ["outcome_map_status", "outcome status", "mapping status", "map status"] },
      { key: "syllabus_coverage", label: "Syllabus Coverage (%)", aliases: ["syllabus_coverage", "coverage", "syllabus completed", "percent covered"] },
      { key: "attainment_band", label: "Attainment Band", aliases: ["attainment_band", "attainment", "band", "grade band"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "curriculum_name_only", label: "Curriculum Name Only", fields: ["curriculum_name"] },
  { id: "name_only", label: "Name Only", fields: ["course_code"] },
  { id: "curriculum_name_or_name", label: "Curriculum Name OR Name", fields: ["curriculum_name", "course_code"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("curriculum_outcomes") as any).select("id, curriculum_name, course_code, semester, outcome_map_status, syllabus_coverage, attainment_band").order("curriculum_name");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["curriculum_name"] = row.mapped["curriculum_name"] || row.sourceRow["curriculum_name"] || null;       record["course_code"] = row.mapped["course_code"] || row.sourceRow["course_code"] || null;       record["semester"] = row.mapped["semester"] || row.sourceRow["semester"] || null;       record["outcome_map_status"] = row.mapped["outcome_map_status"] || row.sourceRow["outcome_map_status"] || null;       record["syllabus_coverage"] = row.mapped["syllabus_coverage"] || row.sourceRow["syllabus_coverage"] || null;       record["attainment_band"] = row.mapped["attainment_band"] || row.sourceRow["attainment_band"] || null;

      const firstKey = "curriculum_name";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Curriculum Name is required" }); return; }

      const { data: existing } = await supabase.from("curriculum_outcomes").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("curriculum_outcomes") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Curriculum Name not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("curriculum_outcomes") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.curriculum_outcomes.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("curriculum_outcomes").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("curriculum_outcomes") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const curriculumModule: ImportModule = {
  id: "curriculum",
  name: "Curriculum Outcomes",
  description: "Import curriculum outcome records and syllabus coverage data",
  icon: "BookCheck",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};