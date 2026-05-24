import type {
  ImportBatch,
  ImportCommitResult,
  ImportPreviewRow,
  ImportRollbackEntry,
} from "./types";
import { supabase } from "@/integrations/supabase/client";
import {
  commitImportRows,
  loadExistingStudentsForImport,
  loadImportBatchHistory,
  type ImportPreviewRow as SupabaseImportPreviewRow,
  type ExistingStudentRecord as SupabaseExistingStudentRecord,
  type ImportCommitResult as SupabaseImportCommitResult,
  type ImportTransferRule,
  type ImportMatchDesign,
} from "@/lib/student-import";

export function toSupabasePreviewRow(
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

export function toEngineCommitResult(
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

export function createSupabaseCommitFn(
  options: {
    fileName: string;
    batchName: string;
    description?: string;
    rule: string;
    design: string;
    threshold: number;
    existingRecords: SupabaseExistingStudentRecord[];
  },
) {
  return async (
    rows: ImportPreviewRow[],
    _batch: ImportBatch,
  ): Promise<ImportCommitResult> => {
    const convertedRows = rows.map((r) =>
      toSupabasePreviewRow(r, options.existingRecords),
    );

    const result = await commitImportRows(convertedRows, {
      fileName: options.fileName,
      batchName: options.batchName,
      description: options.description,
      rule: options.rule as ImportTransferRule,
      design: options.design as ImportMatchDesign,
      threshold: options.threshold,
    });

    return toEngineCommitResult(result);
  };
}

export function createSupabaseRollbackFn() {
  return async (
    rollbackData: ImportRollbackEntry[],
  ): Promise<{ success: boolean; restored: number }> => {
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
  };
}

export async function loadExistingRecords(): Promise<SupabaseExistingStudentRecord[]> {
  return loadExistingStudentsForImport();
}

export async function loadEngineBatchHistory(
  limit = 10,
): Promise<{ id: string; batchName: string; fileName: string; total: number; inserted: number; updated: number; failed: number; createdAt: string }[]> {
  return loadImportBatchHistory(limit);
}
