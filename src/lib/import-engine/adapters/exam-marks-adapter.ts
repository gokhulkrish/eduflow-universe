import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";
import { ensureStudentExists } from "@/lib/student-records";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Student Identity",
    fields: [
      { key: "admissionNo", label: "Admission No", aliases: ["admission_no", "admission number", "registration_no", "reg_no", "roll_no", "student_id"] },
      { key: "fullName", label: "Student Name", aliases: ["name", "student_name", "studentname", "full_name"] },
    ],
  },
  {
    title: "Exam & Marks",
    fields: [
      { key: "examTitle", label: "Exam Title", aliases: ["exam", "exam_title", "exam name", "test", "examination"], required: true },
      { key: "subject", label: "Subject", aliases: ["subject", "sub", "subject_name"] },
      { key: "marksObtained", label: "Marks Obtained", aliases: ["marks_obtained", "marks", "score", "obtained", "marks obtained"], required: true },
      { key: "maxMarks", label: "Max Marks", aliases: ["max_marks", "maximum marks", "total marks", "out of"] },
      { key: "grade", label: "Grade", aliases: ["grade", "exam_grade"] },
      { key: "remarks", label: "Remarks", aliases: ["remarks", "notes", "comment"] },
    ],
  },
  {
    title: "Schedule",
    fields: [
      { key: "date", label: "Exam Date", aliases: ["date", "exam_date", "exam date"] },
      { key: "grade", label: "Grade / Class", aliases: ["grade", "class", "standard"] },
      { key: "section", label: "Section", aliases: ["section", "division"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "admission_only", label: "Admission Number Only", fields: ["admissionNo"] },
  { id: "name_only", label: "Student Name Only", fields: ["fullName"] },
  { id: "admission_or_name", label: "Admission No OR Name", fields: ["admissionNo", "fullName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("students") as any).select("id, admission_no, first_name, last_name");
  return (data || []).map((s: Record<string, unknown>) => ({
    studentId: s.id,
    admissionNo: s.admission_no,
    fullName: [s.first_name, s.last_name].filter(Boolean).join(" "),
  }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    let newStudentId: string | null = null;

    try {
      const admissionNo = row.mapped.admissionNo || row.sourceRow.admissionNo || "";
      const { data: preExisting } = await supabase.from("students").select("id").eq("admission_no", admissionNo).maybeSingle();
      const studentId = await ensureStudentExists(admissionNo, row.mapped.fullName || row.sourceRow.fullName || "");
      if (!preExisting) newStudentId = studentId;

      const examTitle = row.mapped.examTitle || row.sourceRow.examTitle || "";
      const subject = row.mapped.subject || row.sourceRow.subject || "";
      const marksObtained = parseFloat(row.mapped.marksObtained || "0");
      const maxMarks = row.mapped.maxMarks ? parseFloat(row.mapped.maxMarks) : null;
      const grade = row.mapped.grade || null;
      const remarks = row.mapped.remarks || null;

      if (isNaN(marksObtained)) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: `Invalid marks: ${row.mapped.marksObtained}` }); return; }

      let examId: string | null = null;
      if (examTitle) {
        const { data: exams } = await supabase.from("exam_schedules").select("id").eq("title", examTitle).limit(1);
        if (exams && exams.length > 0) examId = exams[0].id;
      }

      if (row.action === "insert") {
        const payload: Record<string, unknown> = {
          student_id: studentId,
          marks_obtained: marksObtained,
          grade,
          remarks: remarks || "",
          status: "pending",
        };
        if (examId) payload.exam_id = examId;
        const { data: res, error } = await (supabase.from("exam_marks") as any).insert(payload).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { newStudentId = null; result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update") {
        const { data: existing } = await (supabase.from("exam_marks") as any)
          .select("id").eq("student_id", studentId).maybeSingle();
        if (existing) {
          const { error } = await (supabase.from("exam_marks") as any)
            .update({ marks_obtained: marksObtained, grade, remarks: remarks || "" })
            .eq("id", existing.id);
          if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { newStudentId = null; result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: existing.id, action: "updated" }); }
        } else {
          const payload: Record<string, unknown> = {
            student_id: studentId,
            marks_obtained: marksObtained,
            grade,
            remarks: remarks || "",
            status: "pending",
          };
          if (examId) payload.exam_id = examId;
          const { data: res, error } = await (supabase.from("exam_marks") as any).insert(payload).select().single();
          if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { newStudentId = null; result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
        }
      }
    } catch (err) {
      if (newStudentId) {
        await supabase.from("students").delete().eq("id", newStudentId).maybeSingle();
      }
      result.failed++;
      result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    if (signal?.aborted) break;
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processRow));
  }

  emitAppSync("sms.exam-marks.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("exam_marks").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await supabase.from("exam_marks").update(entry.previousState as any).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const examMarksModule: ImportModule = {
  id: "exam-marks",
  name: "Exam Marks",
  description: "Import exam scores, grades, and marks by student and subject",
  icon: "GraduationCap",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};
