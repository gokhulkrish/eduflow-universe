import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "LMS E-Learning Fields",
      fields: [
      { key: "courseRoom", label: "Course Room", aliases: ["course_room", "course room", "course", "class"], required: true },
      { key: "contentUnit", label: "Content Unit", aliases: ["content_unit", "content unit", "unit", "module"] },
      { key: "facultyOwner", label: "Faculty Owner", aliases: ["faculty_owner", "faculty owner", "faculty", "teacher", "instructor"] },
      { key: "engagementPercent", label: "Engagement %", aliases: ["engagement_percent", "engagement", "engagement %", "participation"] },
      { key: "completionStatus", label: "Completion Status", aliases: ["completion_status", "completion status", "status", "progress"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "courseRoom_only", label: "Course Room Only", fields: ["courseRoom"] },
  { id: "name_only", label: "Content Unit Only", fields: ["contentUnit"] },
  { id: "courseRoom_or_name", label: "Course Room OR Content Unit", fields: ["courseRoom", "contentUnit"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("lms_courses") as any).select("id, course_room, content_unit, faculty_owner, engagement_percent, completion_status").order("course_room");
  return (data || []).map((r: Record<string, unknown>) => {
    const out: Record<string, unknown> = { id: r.id };
    out["courseRoom"] = r["course_room"] ?? null;     out["contentUnit"] = r["content_unit"] ?? null;     out["facultyOwner"] = r["faculty_owner"] ?? null;     out["engagementPercent"] = r["engagement_percent"] ?? null;     out["completionStatus"] = r["completion_status"] ?? null;
    return out;
  });
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const idVal = row.mapped.courseRoom || row.sourceRow.courseRoom || "";
      if (!idVal) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Course Room is required" }); return; }

      const { data: existing } = await supabase.from("lms_courses").select("id").eq("course_room", idVal).maybeSingle();
      const db: Record<string, unknown> = {};
      db.course_room = row.mapped.courseRoom ?? row.sourceRow.courseRoom ?? null;
      db.content_unit = row.mapped.contentUnit ?? row.sourceRow.contentUnit ?? null;
      db.faculty_owner = row.mapped.facultyOwner ?? row.sourceRow.facultyOwner ?? null;
      db.engagement_percent = row.mapped.engagementPercent ?? row.sourceRow.engagementPercent ?? null;
      db.completion_status = row.mapped.completionStatus ?? row.sourceRow.completionStatus ?? null;

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("lms_courses") as any).insert(db).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Course Room not found: {idField}" }); return; }
        const { error } = await (supabase.from("lms_courses") as any).update(db).eq("id", targetId);
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
  emitAppSync("sms.lms_courses.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("lms_courses").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("lms_courses") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const lmsModule: ImportModule = {
  id: "lms",
  name: "LMS E-Learning",
  description: "Import LMS course rooms, content units, and engagement tracking",
  icon: "GraduationCap",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};