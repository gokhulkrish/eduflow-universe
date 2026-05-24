import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Student Identity",
    fields: [
      { key: "admissionNo", label: "Admission No", aliases: ["admission_no", "admission number", "registration_no", "reg_no", "roll_no", "student_id"] },
      { key: "fullName", label: "Student Name", aliases: ["name", "student_name", "studentname", "full_name"] },
    ],
  },
  {
    title: "Attendance Record",
    fields: [
      { key: "date", label: "Date", aliases: ["date", "attendance_date", "day", "attendance date"], required: true },
      { key: "status", label: "Status", aliases: ["status", "attendance_status", "present", "mark"], required: true },
      { key: "period", label: "Period / Time", aliases: ["period", "time", "slot", "session", "period/time"] },
      { key: "remarks", label: "Remarks", aliases: ["remarks", "notes", "comment", "reason"] },
    ],
  },
  {
    title: "Class Info",
    fields: [
      { key: "grade", label: "Grade / Class", aliases: ["grade", "class", "standard", "level"] },
      { key: "section", label: "Section", aliases: ["section", "division", "sec"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "admission_only", label: "Admission Number Only", fields: ["admissionNo"] },
  { id: "name_only", label: "Student Name Only", fields: ["fullName"] },
  { id: "admission_or_name", label: "Admission No OR Student Name", fields: ["admissionNo", "fullName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("students") as any)
    .select("id, admission_no, first_name, last_name");
  return (data || []).map((s: Record<string, unknown>) => ({
    studentId: s.id,
    admissionNo: s.admission_no,
    fullName: [s.first_name, s.last_name].filter(Boolean).join(" "),
  }));
}

function normalizeStatus(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (["present", "p", "yes", "y", "true", "1", "on"].includes(v)) return "present";
  if (["absent", "a", "no", "n", "false", "0", "off"].includes(v)) return "absent";
  if (["late", "l", "tardy", "delayed"].includes(v)) return "late";
  return raw;
}

async function commitRows(
  rows: ImportPreviewRow[],
  batch: ImportBatch,
): Promise<ImportCommitResult> {
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: { rowNumber: number; message: string }[] = [];

  for (const row of rows) {
    if (row.action === "skip") {
      skipped++;
      continue;
    }

    try {
      const admissionNo = row.mapped.admissionNo || row.sourceRow.admissionNo || "";
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("admission_no", admissionNo)
        .maybeSingle();

      if (!student) {
        failed++;
        errors.push({ rowNumber: row.sourceRowIndex, message: `Student not found: ${admissionNo}` });
        continue;
      }

      const date = row.mapped.date || "";
      if (!date) {
        failed++;
        errors.push({ rowNumber: row.sourceRowIndex, message: "Date is required" });
        continue;
      }

      const status = normalizeStatus(row.mapped.status || "");
      if (!["present", "absent", "late"].includes(status)) {
        failed++;
        errors.push({ rowNumber: row.sourceRowIndex, message: `Invalid status: ${row.mapped.status}` });
        continue;
      }

      const period = row.mapped.period || null;
      const remarks = row.mapped.remarks || null;

      if (row.action === "insert") {
        const { error: insertError } = await (supabase.from("attendance") as any).insert({
          student_id: student.id,
          date,
          period,
          status,
          remarks,
        });

        if (insertError) {
          if (insertError.code === "23505") {
            const { error: upsertError } = await (supabase.from("attendance") as any).upsert(
              { student_id: student.id, date, period, status, remarks },
              { onConflict: "student_id,date,period" },
            );
            if (upsertError) {
              failed++;
              errors.push({ rowNumber: row.sourceRowIndex, message: upsertError.message });
            } else {
              updated++;
            }
          } else {
            failed++;
            errors.push({ rowNumber: row.sourceRowIndex, message: insertError.message });
          }
        } else {
          inserted++;
        }
      } else if (row.action === "update") {
        const { error: upsertError } = await (supabase.from("attendance") as any).upsert(
          { student_id: student.id, date, period, status, remarks },
          { onConflict: "student_id,date,period" },
        );
        if (upsertError) {
          failed++;
          errors.push({ rowNumber: row.sourceRowIndex, message: upsertError.message });
        } else {
          updated++;
        }
      }
    } catch (err) {
      failed++;
      errors.push({
        rowNumber: row.sourceRowIndex,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  emitAppSync("sms.attendance.v1");

  return { inserted, updated, skipped, failed, errors };
}

async function rollbackRows(
  rollbackData: ImportRollbackEntry[],
): Promise<{ success: boolean; restored: number }> {
  let restored = 0;
  let success = true;

  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase
          .from("attendance")
          .delete()
          .eq("id", entry.studentKey);
        if (error) throw error;
        restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await supabase
          .from("attendance")
          .update(entry.previousState as any)
          .eq("id", entry.studentKey);
        if (error) throw error;
        restored++;
      }
    } catch {
      success = false;
    }
  }

  return { success, restored };
}

export const attendanceModule: ImportModule = {
  id: "attendance",
  name: "Attendance",
  description: "Import attendance records by date, period, and status for students",
  icon: "ClipboardCheck",
  fieldGroups,
  matchStrategies,
  adapter: {
    loadExistingRecords,
    commitRows,
    rollbackRows,
  },
};
