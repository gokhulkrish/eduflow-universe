import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Assignment Info",
    fields: [
      { key: "title", label: "Assignment Title", aliases: ["title", "assignment_title", "assignment name", "task"], required: true },
      { key: "subject", label: "Subject", aliases: ["subject", "subject_name", "sub"] },
      { key: "maxMarks", label: "Max Marks", aliases: ["max_marks", "maximum marks", "total marks"], required: true },
      { key: "dueDate", label: "Due Date", aliases: ["due_date", "due date", "deadline", "submission date"] },
      { key: "description", label: "Description", aliases: ["description", "desc", "instructions"] },
    ],
  },
  {
    title: "Student Submission",
    fields: [
      { key: "admissionNo", label: "Student Admission No", aliases: ["admission_no", "admission number", "student_id", "reg_no", "roll_no"], required: true },
      { key: "fullName", label: "Student Name", aliases: ["name", "student_name", "full_name"] },
      { key: "grade", label: "Grade / Class", aliases: ["grade", "class", "standard"] },
      { key: "section", label: "Section", aliases: ["section", "division"] },
    ],
  },
  {
    title: "Grading",
    fields: [
      { key: "marks", label: "Marks Obtained", aliases: ["marks", "score", "obtained", "grade"] },
      { key: "feedback", label: "Feedback", aliases: ["feedback", "comments", "remarks"] },
      { key: "status", label: "Status", aliases: ["status", "submission_status"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "admission_only", label: "Admission Number Only", fields: ["admissionNo"] },
  { id: "name_only", label: "Student Name Only", fields: ["fullName"] },
  { id: "admission_or_name", label: "Admission No OR Name", fields: ["admissionNo", "fullName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await (supabase.from("students") as any).select("id, admission_no, first_name, last_name");
  return (data || []).map((s: Record<string, unknown>) => ({
    studentId: s.id, admissionNo: s.admission_no, fullName: [s.first_name, s.last_name].filter(Boolean).join(" "),
  }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch): Promise<ImportCommitResult> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { emitAppSync } = await import("@/lib/app-sync");
  let inserted = 0, updated = 0, skipped = 0, failed = 0;
  const rowResults: { rowKey: string; id: string; action: "inserted" | "updated" | "skipped" | "failed" }[] = [];
  const errors: { rowNumber: number; message: string }[] = [];

  for (const row of rows) {
    if (row.action === "skip") { skipped++; continue; }
    try {
      const admissionNo = row.mapped.admissionNo || row.sourceRow.admissionNo || "";
      const { data: student } = await supabase.from("students").select("id").eq("admission_no", admissionNo).maybeSingle();
      if (!student) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: `Student not found: ${admissionNo}` }); continue; }

      const title = row.mapped.title || row.sourceRow.title || "";
      const subject = row.mapped.subject || row.sourceRow.subject || "";
      const maxMarks = parseFloat(row.mapped.maxMarks || "0");
      const dueDate = row.mapped.dueDate || null;
      const description = row.mapped.description || null;

      if (!title) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: "Assignment title is required" }); continue; }

      let assignmentId: string | null = null;
      const { data: assignments } = await supabase.from("assignments").select("id").eq("title", title).limit(1);
      if (assignments && assignments.length > 0) assignmentId = assignments[0].id;
      if (!assignmentId) {
        const { data: newAssignment } = await (supabase.from("assignments") as any).insert({
          title, description, due_date: dueDate, max_marks: maxMarks || 100, subject_id: null, class_id: null, status: "active", attachments: null,
        }).select().single();
        if (newAssignment) assignmentId = newAssignment.id;
      }

      const marks = row.mapped.marks ? parseFloat(row.mapped.marks) : null;
      const feedback = row.mapped.feedback || null;
      const subStatus = row.mapped.status || "submitted";

      if (row.action === "insert") {
        const { data: result, error } = await (supabase.from("submissions") as any).insert({
          assignment_id: assignmentId, student_id: student.id,
          content: null, file_url: null, status: subStatus, marks, feedback,
        }).select().single();
        if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
      } else if (row.action === "update") {
        const { data: existingSub } = await supabase.from("submissions").select("id").eq("assignment_id", assignmentId).eq("student_id", student.id).maybeSingle();
        if (existingSub) {
          const { error } = await (supabase.from("submissions") as any).update({ marks, feedback, status: subStatus }).eq("id", existingSub.id);
          if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { updated++; rowResults.push({ rowKey: row.rowKey, id: existingSub.id, action: "updated" }); }
        } else {
          const { data: result, error } = await (supabase.from("submissions") as any).insert({
            assignment_id: assignmentId, student_id: student.id, status: subStatus, marks, feedback,
          }).select().single();
          if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
          else { inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
        }
      }
    } catch (err) {
      failed++; errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : "Unknown error" });
    }
  }
  emitAppSync("sms.assignments.v1");
  return { inserted, updated, skipped, failed, errors, rowResults };
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  const { supabase } = await import("@/integrations/supabase/client");
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("submissions").delete().eq("id", entry.studentKey);
        if (!error) restored++;
        else { const { error: e2 } = await supabase.from("assignments").delete().eq("id", entry.studentKey); if (!e2) restored++; else throw e2; }
      } else if (entry.changeType === "updated") {
        const { error } = await supabase.from("submissions").update(entry.previousState as any).eq("id", entry.studentKey);
        if (!error) restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const assignmentsModule: ImportModule = {
  id: "assignments",
  name: "Assignments",
  description: "Import assignment submissions, grades, and feedback by student",
  icon: "FileCheck",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};
