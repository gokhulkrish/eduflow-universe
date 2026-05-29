import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Applicant Info",
    fields: [
      { key: "fullName", label: "Full Name", aliases: ["full_name", "name", "applicant name", "candidate name"], required: true },
      { key: "dateOfBirth", label: "Date of Birth", aliases: ["date_of_birth", "dob", "birth date"] },
      { key: "gender", label: "Gender", aliases: ["gender", "sex"] },
      { key: "email", label: "Email", aliases: ["email", "e-mail"] },
      { key: "phone", label: "Phone", aliases: ["phone", "mobile", "contact"] },
    ],
  },
  {
    title: "Application Details",
    fields: [
      { key: "applicationNo", label: "Application No", aliases: ["application_no", "application number", "app_no", "ref_no"], required: true },
      { key: "academicYear", label: "Academic Year", aliases: ["academic_year", "year", "session"], required: true },
      { key: "grade", label: "Grade / Class Applying For", aliases: ["grade", "class", "standard", "applying_for"] },
      { key: "status", label: "Status", aliases: ["status", "application_status"] },
      { key: "appliedDate", label: "Applied Date", aliases: ["applied_date", "date applied", "application date"] },
    ],
  },
  {
    title: "Address & Parents",
    fields: [
      { key: "address", label: "Address", aliases: ["address", "permanent address", "residence"] },
      { key: "fatherName", label: "Father Name", aliases: ["father_name", "fathers name", "father"] },
      { key: "motherName", label: "Mother Name", aliases: ["mother_name", "mothers name", "mother"] },
      { key: "guardianName", label: "Guardian Name", aliases: ["guardian_name", "guardian"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "application_no_only", label: "Application Number Only", fields: ["applicationNo"] },
  { id: "name_only", label: "Applicant Name Only", fields: ["fullName"] },
  { id: "app_no_or_name", label: "App No OR Name", fields: ["applicationNo", "fullName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase as any).from("admissions").select("id, application_no, full_name, academic_year, status");
  return (data || []).map((a: Record<string, unknown>) => ({
    admissionId: a.id, applicationNo: a.application_no, fullName: a.full_name,
    academicYear: a.academic_year, status: a.status,
  }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  let inserted = 0, updated = 0, skipped = 0, failed = 0;
  const rowResults: { rowKey: string; id: string; action: "inserted" | "updated" | "skipped" | "failed" }[] = [];
  const errors: { rowNumber: number; message: string }[] = [];

  for (const row of rows) {
    if (row.action === "skip") { skipped++; continue; }
    if (signal?.aborted) break;
    try {
      const applicationNo = row.mapped.applicationNo || row.sourceRow.applicationNo || "";
      const fullName = row.mapped.fullName || row.sourceRow.fullName || "";
      if (!applicationNo || !fullName) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: "Application No and Full Name are required" }); continue; }

      const record = {
        application_no: applicationNo,
        full_name: fullName,
        date_of_birth: row.mapped.dateOfBirth || null,
        gender: row.mapped.gender || null,
        email: row.mapped.email || null,
        phone: row.mapped.phone || null,
        academic_year: row.mapped.academicYear || (new Date().getFullYear()).toString(),
        applying_for: row.mapped.grade || null,
        status: row.mapped.status || "pending",
        applied_date: row.mapped.appliedDate || new Date().toISOString(),
        address: row.mapped.address || null,
        father_name: row.mapped.fatherName || null,
        mother_name: row.mapped.motherName || null,
        guardian_name: row.mapped.guardianName || null,
      };

      const { data: existing } = await (supabase as any).from("admissions").select("id").eq("application_no", applicationNo).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: result, error } = await (supabase as any).from("admissions").insert(record).select().single();
        if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { inserted++; rowResults.push({ rowKey: row.rowKey, id: result.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing!.id;
        const { error } = await (supabase as any).from("admissions").update(record).eq("id", targetId);
        if (error) { failed++; errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { updated++; rowResults.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      failed++; errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }
  emitAppSync("sms.admissions.v1");
  return { inserted, updated, skipped, failed, errors, rowResults };
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await (supabase as any).from("admissions").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase as any).from("admissions").update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const admissionsModule: ImportModule = {
  id: "admissions",
  name: "Admissions",
  description: "Import student applications, inquiries, and admission records",
  icon: "DoorOpen",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};
