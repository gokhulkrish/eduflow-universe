import { pool } from '@/db/pool';

export async function expireStaleBatches(tenantId: string, retentionDays = 30) {
  await pool.query(
    `update public.import_batches
     set status = 'expired', updated_at = now()
     where institution_id = $1
       and status in ('draft', 'uploaded', 'validating')
       and created_at < now() - make_interval(days => $2)`,
    [tenantId, retentionDays],
  );
}
