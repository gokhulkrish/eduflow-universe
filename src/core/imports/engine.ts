import type { ImportContext, ImportEntityConfig, ImportBatchStatus, ImportValidationIssue } from './types';
import { createImportBatch as legacyCreateBatch, saveCurrentImportBatch, getImportBatchById, loadImportBatchesFromDB } from '../../lib/import-engine/batch';
import { parseImportFile } from '../../lib/import-engine/parser';
import { validateBatch as legacyValidateBatch } from '../../lib/import-engine/validation';
import type { ImportBatch } from '../../lib/import-engine/types';

export async function createImportBatch(params: {
  tenantId: string;
  entityType: ImportContext['entityType'];
  name: string;
  matchKey?: string;
  templateVersion?: string;
  schemaVersion?: string;
  options?: Record<string, unknown>;
}) {
  const batch: ImportBatch = legacyCreateBatch({
    batchName: params.name,
    moduleId: params.entityType,
    matchStrategy: params.matchKey || 'admission_only',
  });

  (batch as any).tenantId = params.tenantId;
  (batch as any).templateVersion = params.templateVersion || 'umis-legacy-v1';
  (batch as any).schemaVersion = params.schemaVersion || 'core-v1';
  (batch as any).options = params.options || {};

  await saveCurrentImportBatch(batch);
  return batch;
}

export async function attachFileToBatch(
  ctx: ImportContext,
  file: { storagePath: string; originalFilename: string; mimeType: string },
) {
  const batch = await getImportBatchById(ctx.batchId);
  if (!batch) throw new Error(`Batch ${ctx.batchId} not found`);
  (batch as any).fileRef = file;
  await saveCurrentImportBatch(batch);
}

export async function parseAndStageRows(
  ctx: ImportContext,
  file: File,
): Promise<void> {
  const parsed = await parseImportFile(file);
  const batch = await getImportBatchById(ctx.batchId);
  if (!batch) throw new Error(`Batch ${ctx.batchId} not found`);
  batch.sourceRows = parsed.rows as Record<string, string>[];
  batch.importHeaders = parsed.headers;
  batch.rowCount = parsed.rows.length;
  await saveCurrentImportBatch(batch);
}

export async function validateBatch<TNormalized>(
  ctx: ImportContext,
  entityConfig: ImportEntityConfig<TNormalized>,
): Promise<{ issues: ImportValidationIssue[] }> {
  const batch = await getImportBatchById(ctx.batchId);
  if (!batch) throw new Error(`Batch ${ctx.batchId} not found`);

  const issues: ImportValidationIssue[] = [];
  for (const raw of batch.sourceRows) {
    const normalized = entityConfig.normalizeRow(raw as Record<string, unknown>, ctx);
    const rowIssues = entityConfig.validateRow(normalized, ctx);
    issues.push(...rowIssues);
  }

  legacyValidateBatch(batch);
  batch.status = 'validated' as any;
  await saveCurrentImportBatch(batch);

  return { issues };
}

export async function applyBatch<TNormalized>(
  ctx: ImportContext,
  entityConfig: ImportEntityConfig<TNormalized>,
): Promise<void> {
  const batch = await getImportBatchById(ctx.batchId);
  if (!batch) throw new Error(`Batch ${ctx.batchId} not found`);

  for (const raw of batch.sourceRows) {
    const normalized = entityConfig.normalizeRow(raw as Record<string, unknown>, ctx);
    await entityConfig.applyRow(normalized, ctx);
  }

  batch.status = 'transferred' as any;
  batch.transferredCount = batch.rowCount;
  await saveCurrentImportBatch(batch);
}

export async function updateBatchStatus(
  batchId: string,
  status: ImportBatchStatus,
) {
  const batch = await getImportBatchById(batchId);
  if (!batch) throw new Error(`Batch ${batchId} not found`);
  batch.status = status as any;
  await saveCurrentImportBatch(batch);
}

export async function listBatches(tenantId?: string): Promise<ImportBatch[]> {
  const batches = await loadImportBatchesFromDB();
  if (tenantId) {
    return batches.filter((b: any) => b.tenantId === tenantId);
  }
  return batches;
}
