import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Lesson Plans Fields",
      fields: [
      { key: "title", label: "Lesson Title", aliases: ["title", "lesson title", "lesson name", "plan name"], required: true },
      { key: "subject", label: "Subject", aliases: ["subject", "subject name", "course", "topic area"] },
      { key: "class_id", label: "Class", aliases: ["class_id", "class", "grade", "class name", "section"] },
      { key: "topic", label: "Topic", aliases: ["topic", "lesson topic", "focus area", "theme"] },
      { key: "objectives", label: "Objectives", aliases: ["objectives", "goals", "learning objectives", "outcomes"] },
      { key: "materials", label: "Materials", aliases: ["materials", "resources", "teaching aids", "supplies"] },
      { key: "status", label: "Status", aliases: ["status", "state", "phase"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "title_only", label: "Lesson Title Only", fields: ["title"] },
  { id: "name_only", label: "Name Only", fields: ["subject"] },
  { id: "title_or_name", label: "Lesson Title OR Name", fields: ["title", "subject"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("lesson_plans") as any).select("id, title, subject, class_id, topic, objectives, materials, status").order("title");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["title"] = row.mapped["title"] || row.sourceRow["title"] || null;       record["subject"] = row.mapped["subject"] || row.sourceRow["subject"] || null;       record["class_id"] = row.mapped["class_id"] || row.sourceRow["class_id"] || null;       record["topic"] = row.mapped["topic"] || row.sourceRow["topic"] || null;       record["objectives"] = row.mapped["objectives"] || row.sourceRow["objectives"] || null;       record["materials"] = row.mapped["materials"] || row.sourceRow["materials"] || null;       record["status"] = row.mapped["status"] || row.sourceRow["status"] || null;

      const firstKey = "title";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Lesson Title is required" }); return; }

      const { data: existing } = await supabase.from("lesson_plans").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("lesson_plans") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Lesson Title not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("lesson_plans") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.lesson_plans.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("lesson_plans").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("lesson_plans") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const lessonsModule: ImportModule = {
  id: "lessons",
  name: "Lesson Plans",
  description: "Import lesson plans with topics, objectives, and materials",
  icon: "BookOpen",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};