import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import {
  loadExistingStudentsForImport,
  commitImportRows,
  type ImportPreviewRow as SupabaseImportPreviewRow,
  type ExistingStudentRecord as SupabaseExistingStudentRecord,
  type ImportCommitResult as SupabaseImportCommitResult,
  type ImportTransferRule,
  type ImportMatchDesign,
} from "@/lib/student-import";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Identity",
    fields: [
      { key: "fullName", label: "Full Name", aliases: ["name", "student_name", "studentname", "full_name", "student full name"] },
      { key: "firstName", label: "First Name", aliases: ["first_name", "firstname", "given_name", "student first name"] },
      { key: "lastName", label: "Last Name", aliases: ["last_name", "lastname", "surname", "family_name"] },
      { key: "admissionNo", label: "Admission No", aliases: ["admission_no", "admission number", "registration_no", "register number", "reg_no", "roll_no"] },
      { key: "dob", label: "Date of Birth", aliases: ["dob", "birthdate", "date of birth", "dateofbirth"] },
      { key: "gender", label: "Gender", aliases: ["gender", "sex"] },
      { key: "bloodGroup", label: "Blood Group", aliases: ["blood group", "bloodgroup", "blood"] },
      { key: "nationality", label: "Nationality", aliases: ["nationality", "country"] },
      { key: "status", label: "Student Status", aliases: ["status", "student status"] },
    ],
  },
  {
    title: "Academic",
    fields: [
      { key: "grade", label: "Grade", aliases: ["grade", "class", "standard", "level"] },
      { key: "section", label: "Section", aliases: ["section", "division", "sec"] },
      { key: "roll", label: "Roll Number", aliases: ["roll", "roll_no", "roll number"] },
      { key: "stream", label: "Stream", aliases: ["stream", "group"] },
      { key: "house", label: "House", aliases: ["house"] },
      { key: "academicYear", label: "Academic Year", aliases: ["academic year", "year", "session"] },
      { key: "feeStatus", label: "Fee Status", aliases: ["fee status", "fees", "fee"] },
      { key: "attendancePercent", label: "Attendance Percent", aliases: ["attendance", "attendance percent", "attendance percentage"] },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "email", label: "Email", aliases: ["email", "e-mail"] },
      { key: "phone", label: "Phone", aliases: ["phone", "mobile", "mobile number", "student mobile", "contact"] },
      { key: "alternatePhone", label: "Alternate Phone", aliases: ["alternate phone", "alt phone", "secondary phone"] },
      { key: "address", label: "Address", aliases: ["address", "address line", "mailing address"] },
      { key: "district", label: "District", aliases: ["district"] },
      { key: "block", label: "Block", aliases: ["block"] },
    ],
  },
  {
    title: "Guardian",
    fields: [
      { key: "fatherName", label: "Father's Name", aliases: ["father name", "father_name", "father"] },
      { key: "fatherOccupation", label: "Father's Occupation", aliases: ["father occupation", "father_job"] },
      { key: "motherName", label: "Mother's Name", aliases: ["mother name", "mother_name", "mother"] },
      { key: "motherOccupation", label: "Mother's Occupation", aliases: ["mother occupation", "mother_job"] },
      { key: "guardianName", label: "Guardian Name", aliases: ["guardian name", "guardian", "guardian_full_name"] },
      { key: "guardianOccupation", label: "Guardian Occupation", aliases: ["guardian occupation"] },
      { key: "guardianPhone", label: "Guardian Phone", aliases: ["guardian phone", "parent phone", "parent mobile"] },
      { key: "guardianEmail", label: "Guardian Email", aliases: ["guardian email", "parent email"] },
      { key: "annualIncome", label: "Annual Income", aliases: ["annual income", "income"] },
    ],
  },
  {
    title: "UMIS / Scholarship",
    fields: [
      { key: "umisId", label: "UMIS ID", aliases: ["umis id", "umis_id", "umis", "student umis"] },
      { key: "emisId", label: "EMIS ID", aliases: ["emis id", "emis_id", "emis", "student emis"] },
      { key: "community", label: "Community", aliases: ["community", "caste", "category"] },
      { key: "firstGraduate", label: "First Graduate", aliases: ["first graduate", "first_graduate"] },
      { key: "incomeVerified", label: "Income Verification", aliases: ["income verified", "income verification", "verification status"] },
      { key: "scholarshipNotes", label: "Scholarship Notes", aliases: ["notes", "scholarship notes", "remarks"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "reg_umis_emis", label: "Registration / UMIS / EMIS (recommended)", fields: ["admissionNo", "umisId", "emisId"] },
  { id: "registration_only", label: "Registration Number Only", fields: ["admissionNo"] },
  { id: "umis_only", label: "UMIS ID Only", fields: ["umisId"] },
  { id: "name_dob", label: "Name + Date of Birth (exact)", fields: ["fullName", "dob"] },
  { id: "fuzzy_name_dob", label: "Fuzzy Name + DOB (similarity)", fields: ["fullName", "dob"] },
  { id: "reg_or_name_dob", label: "Registration OR Name + DOB", fields: ["admissionNo", "fullName", "dob"] },
];

function toSupabasePreviewRow(
  engineRow: ImportPreviewRow,
  existingRecords: SupabaseExistingStudentRecord[],
): SupabaseImportPreviewRow {
  const existing = existingRecords.find(
    (r) => r.student_id === (engineRow.existing as SupabaseExistingStudentRecord | null)?.student_id,
  ) ?? null;

  return {
    sourceRowIndex: engineRow.sourceRowIndex,
    rowKey: engineRow.rowKey,
    sourceRow: engineRow.sourceRow,
    mapped: engineRow.mapped as Record<string, string>,
    customValues: engineRow.customValues,
    displayName: engineRow.displayName,
    admissionNo: engineRow.admissionNo,
    identityKey: engineRow.identityKey,
    duplicateGroupSize: engineRow.duplicateGroupSize,
    duplicateStatus: engineRow.duplicateStatus,
    validationIssues: engineRow.validationIssues,
    existing,
    matchScore: engineRow.matchScore,
    matchReason: engineRow.matchReason,
    defaultAction: engineRow.defaultAction,
    action: engineRow.action,
    diffSummary: engineRow.diffSummary,
  };
}

function toEngineCommitResult(
  supabaseResult: SupabaseImportCommitResult,
): ImportCommitResult {
  return {
    inserted: supabaseResult.inserted,
    updated: supabaseResult.updated,
    skipped: supabaseResult.skipped,
    failed: supabaseResult.failed,
    errors: (supabaseResult.errors || []).map((e) => ({
      rowNumber: e.rowNumber,
      message: e.message,
    })),
  };
}

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  return loadExistingStudentsForImport();
}

async function commitRows(
  rows: ImportPreviewRow[],
  batch: ImportBatch,
): Promise<ImportCommitResult> {
  const existingRecords = await loadExistingRecords();

  const convertedRows = rows.map((r) =>
    toSupabasePreviewRow(r, existingRecords as SupabaseExistingStudentRecord[]),
  );

  const result = await commitImportRows(convertedRows, {
    fileName: batch.batchName,
    batchName: batch.batchName,
    description: batch.batchDescription,
    rule: (batch.defaultImportType === "newentry"
      ? "New Entry Only"
      : batch.defaultImportType === "update"
        ? "Update Existing Only"
        : "Insert New, Ignore Existing") as ImportTransferRule,
    design: batch.matchStrategy as ImportMatchDesign,
    threshold: 80,
  });

  return toEngineCommitResult(result);
}

async function rollbackRows(
  rollbackData: ImportRollbackEntry[],
): Promise<{ success: boolean; restored: number }> {
  const { supabase } = await import("@/integrations/supabase/client");

  let restored = 0;
  let success = true;

  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase
          .from("students")
          .delete()
          .eq("id", entry.studentKey);
        if (error) throw error;
        restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await supabase
          .from("students")
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

export const studentsModule: ImportModule = {
  id: "students",
  name: "Students",
  description: "Import student records, including personal info, academics, contacts, and guardians",
  icon: "Users",
  fieldGroups,
  matchStrategies,
  adapter: {
    loadExistingRecords,
    commitRows,
    rollbackRows,
  },
};
