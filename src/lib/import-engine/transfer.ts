import type {
  ImportBatch,
  ImportCommitResult,
  ImportRollbackEntry,
} from "./types";
import { nowIso } from "./core";

export async function transferCurrentBatch(
  batch: ImportBatch,
  options: {
    onProgress?: (current: number, total: number) => void;
    commitFn: (
      rows: ImportBatch["previewRows"],
      batch: ImportBatch,
    ) => Promise<ImportCommitResult>;
    rollbackFn?: (
      rollbackData: ImportRollbackEntry[],
    ) => Promise<{ success: boolean; restored: number }>;
  },
): Promise<ImportCommitResult> {
  if (!batch) {
    throw new Error("No active batch to transfer.");
  }

  batch.startedAt = nowIso();

  const result: ImportCommitResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  const previewRows = batch.previewRows;
  const total = previewRows.length;

  try {
    const commitResult = await options.commitFn(previewRows, batch);
    result.inserted = commitResult.inserted;
    result.updated = commitResult.updated;
    result.skipped = commitResult.skipped;
    result.failed = commitResult.failed;
    result.errors = commitResult.errors || [];

    batch.insertedCount = result.inserted;
    batch.updatedCount = result.updated;
    batch.skippedCount = result.skipped;
    batch.transferredCount = result.inserted + result.updated;
    batch.completedAt = nowIso();
    batch.status = "transferred";

    if (options.onProgress) {
      options.onProgress(total, total);
    }
  } catch (error) {
    batch.status = "draft";
    batch.completedAt = null;
    throw error;
  }

  return result;
}

export async function rollbackImport(
  batch: ImportBatch,
  options: {
    rollbackFn: (
      rollbackData: ImportRollbackEntry[],
    ) => Promise<{ success: boolean; restored: number }>;
  },
): Promise<{ success: boolean; restored: number; deleted: number }> {
  if (!batch.rollbackData?.length) {
    throw new Error("No rollback data available for this batch.");
  }

  const result = await options.rollbackFn(batch.rollbackData);
  batch.status = "rolled_back";
  batch.updatedAt = nowIso();
  return {
    success: result.success,
    restored: result.restored,
    deleted: 0,
  };
}

export function storeRollbackSnapshot(
  batch: ImportBatch,
  studentKey: string,
  previousState: Record<string, unknown>,
  changeType: ImportRollbackEntry["changeType"],
): void {
  if (!batch.rollbackData) {
    batch.rollbackData = [];
  }

  batch.rollbackData.push({
    studentKey,
    previousState,
    changeType,
  });
}
