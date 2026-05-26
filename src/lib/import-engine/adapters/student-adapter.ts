import type { ImportModule, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { supabase } from "@/integrations/supabase/client";
import {
  loadExistingStudentsForImport,
  commitImportRows,
  importFieldGroups,
  importMatchDesigns,
  importTargetFields,
  type ImportPreviewRow as SupabaseImportPreviewRow,
  type ExistingStudentRecord as SupabaseExistingStudentRecord,
  type ImportCommitResult as SupabaseImportCommitResult,
  type ImportTransferRule,
  type ImportMatchDesign,
} from "@/lib/student-import";

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
  const result = await commitImportRows(rows as unknown as SupabaseImportPreviewRow[], {
    fileName: batch.batchName,
    batchName: batch.batchName,
    description: batch.batchDescription,
    rule: (batch.transferRule
      ?? (batch.defaultImportType === "newentry"
        ? "New Entry Only"
        : batch.defaultImportType === "update"
          ? "Update Existing Only"
          : "Insert New, Ignore Existing")) as ImportTransferRule,
    design: batch.matchStrategy as ImportMatchDesign,
    threshold: 80,
  });

  return toEngineCommitResult(result);
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
  fieldGroups: importFieldGroups.map((g) => ({ title: g.title, fields: g.fields.map((f) => ({ key: f.key, label: f.label, aliases: [...f.aliases] })) })),
  matchStrategies: importMatchDesigns.map((d) => ({
    id: d.v,
    label: d.l,
    fields: d.v === "reg_umis_emis" ? ["admissionNo", "umisId", "emisId"]
      : d.v === "registration_only" ? ["admissionNo"]
      : d.v === "umis_only" ? ["umisId"]
      : d.v === "name_dob" || d.v === "fuzzy_name_dob" ? ["fullName", "dob"]
      : ["admissionNo", "fullName", "dob"],
  })),
  adapter: {
    loadExistingRecords,
    commitRows,
    rollbackRows,
  },
};
