import { pool } from '@/db/pool';
import type { TraceCategory, AppendTraceInput } from './types';

export async function appendTrace(input: AppendTraceInput): Promise<void> {
  await pool.query(
    `insert into public.activity_traces
      (institution_id, category, title, detail, source, section, meta)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.tenantId,
      input.category,
      input.title,
      input.detail ?? null,
      input.source ?? null,
      input.section ?? null,
      input.meta ?? null,
    ],
  );
}

export async function getTraces(tenantId: string, limit = 260): Promise<any[]> {
  const res = await pool.query(
    `select id, category, title, detail, source, section, created_at
     from public.activity_traces
     where institution_id = $1
     order by created_at desc
     limit $2`,
    [tenantId, limit],
  );
  return res.rows;
}

export async function exportTraceJson(tenantId: string): Promise<object[]> {
  return getTraces(tenantId, 5000);
}

export function logWorkspaceEvent(
  category: TraceCategory,
  title: string,
  detail?: string,
  section?: string,
): void {
  appendTrace({
    tenantId: '',
    category,
    title,
    detail,
    section,
  }).catch(() => {});
}
