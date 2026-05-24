import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { logAudit } from '@/core/audit/log';

export async function POST(
  _req: NextRequest,
  { params }: { params: { batchId: string } },
) {
  const { batchId } = params;

  const res = await pool.query(
    `update public.import_batches
     set status = 'draft', updated_at = now()
     where id = $1 and status in ('uploaded', 'keying', 'duplicates', 'validating', 'preview', 'failed')
     returning id, institution_id`,
    [batchId],
  );

  if (res.rows.length === 0) {
    return NextResponse.json({ error: 'Batch not found or not recoverable' }, { status: 404 });
  }

  await logAudit({
    tenantId: res.rows[0].institution_id,
    action: 'import_batch_recovered',
    entityType: 'import_batches',
    entityId: batchId,
    source: 'import-engine',
    meta: { previousStatus: 'recoverable' },
  });

  return NextResponse.json({ ok: true, batchId });
}
