import { pool } from '@/db/pool';

export interface AuditLogInput {
  tenantId: string;
  actorId?: string;
  actorRole?: string;
  source: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  meta?: Record<string, unknown> | null;
}

function redactSensitive(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  const copy = JSON.parse(JSON.stringify(obj));
  const sensitiveKeys = ['password', 'token', 'otp', 'secret'];

  const visit = (node: Record<string, unknown>) => {
    if (!node || typeof node !== 'object') return;
    for (const key of Object.keys(node)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        node[key] = '[REDACTED]';
      } else if (typeof node[key] === 'object' && node[key] !== null) {
        visit(node[key] as Record<string, unknown>);
      }
    }
  };

  visit(copy);
  return copy;
}

export async function logAudit(entry: AuditLogInput): Promise<void> {
  await pool.query(
    `insert into public.audit_log (
      institution_id, actor, actor_role, source, action, entity, entity_id, before_state, after_state, metadata
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      entry.tenantId,
      entry.actorId ?? null,
      entry.actorRole ?? null,
      entry.source,
      entry.action,
      entry.entityType,
      entry.entityId,
      redactSensitive(entry.before ?? null),
      redactSensitive(entry.after ?? null),
      redactSensitive(entry.meta ?? null),
    ],
  );
}
