import { pool } from '@/db/pool';
import { logAudit } from '@/core/audit/log';
import type { ImportContext, ImportEntityConfig } from './types';
import { refreshMonitoringSnapshot } from '../../../core/monitoring/snapshot';

export interface TransferResult {
  ok: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export async function transferImportBatch<TNormalized>(
  batchId: string,
  institutionId: string,
  entityConfig: ImportEntityConfig<TNormalized>,
): Promise<TransferResult> {
  const client = await pool.connect();

  try {
    await client.query('begin');

    const batchRes = await client.query(
      `select id, status, import_type from public.import_batches
       where id = $1 and institution_id = $2
       for update`,
      [batchId, institutionId],
    );

    if (batchRes.rows.length === 0) {
      throw new Error(`Batch ${batchId} not found for institution ${institutionId}`);
    }

    const batch = batchRes.rows[0];
    if (batch.status !== 'ready_to_transfer') {
      throw new Error(`Batch ${batchId} is in state '${batch.status}', expected 'ready_to_transfer'`);
    }

    await client.query(
      `update public.import_batches set status = 'transferring', updated_at = now() where id = $1`,
      [batchId],
    );

    const rowsRes = await client.query(
      `select id, row_number, source_payload, normalized_payload, decision
       from public.import_batch_rows
       where batch_id = $1 and match_status = 'ready'
       order by row_number`,
      [batchId],
    );

    const rows = rowsRes.rows;
    const errors: string[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    await logAudit({
      tenantId: institutionId,
      action: 'import_transfer_start',
      entityType: 'import_batches',
      entityId: batchId,
      source: 'import-engine',
      meta: { totalRows: rows.length },
    });

    for (const row of rows) {
      try {
        const payload = row.normalized_payload || row.source_payload;
        const ctx: ImportContext = {
          tenantId: institutionId,
          batchId,
          entityType: entityConfig.entityType,
          templateVersion: 'deep-parity-v1',
          schemaVersion: 'core-v1',
        };

        if (row.decision === 'skip') {
          skipped++;
          continue;
        }

        await entityConfig.applyRow(payload as TNormalized, ctx);

        if (row.decision === 'create_new' || row.decision === 'insert') {
          inserted++;
        } else {
          updated++;
        }
      } catch (err: any) {
        errors.push(`Row ${row.row_number}: ${err.message}`);
      }
    }

    const finalStatus = errors.length > 0 ? 'completed' : 'completed';

    await client.query(
      `update public.import_batches
       set status = $1, updated_at = now(),
           inserted_count = $2, updated_count = $3, skipped_count = $4,
           error_count = $5, applied_at = now()
       where id = $6`,
      [finalStatus, inserted, updated, skipped, errors.length, batchId],
    );

    await client.query('commit');

    await logAudit({
      tenantId: institutionId,
      action: 'import_transfer_complete',
      entityType: 'import_batches',
      entityId: batchId,
      source: 'import-engine',
      meta: { inserted, updated, skipped, errorCount: errors.length },
    });

    void refreshMonitoringSnapshot({ tenantId: institutionId }).catch(() => {});

    return { ok: true, inserted, updated, skipped, errors };
  } catch (err: any) {
    await client.query('rollback').catch(() => {});

    await client.query(
      `update public.import_batches set status = 'failed', updated_at = now() where id = $1`,
      [batchId],
    ).catch(() => {});

    await logAudit({
      tenantId: institutionId,
      action: 'import_transfer_failed',
      entityType: 'import_batches',
      entityId: batchId,
      source: 'import-engine',
      meta: { error: err.message },
    });

    void refreshMonitoringSnapshot({ tenantId: institutionId }).catch(() => {});

    throw err;
  } finally {
    client.release();
  }
}

export async function revertImportBatch(
  batchId: string,
  institutionId: string,
): Promise<void> {
  await pool.query(
    `update public.import_batches
     set status = 'draft', updated_at = now()
     where id = $1 and institution_id = $2
       and status in ('failed', 'completed')`,
    [batchId, institutionId],
  );

  void refreshMonitoringSnapshot({ tenantId: institutionId }).catch(() => {});
}
