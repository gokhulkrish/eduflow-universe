import { pool } from '@/db/pool';
import type {
  AuditEventInput,
  CreateMessageInput,
  MessageChannel,
  UpsertWorkspaceSubscriptionInput,
  WorkspaceAuditTrail,
  WorkspaceMessage,
  WorkspaceSubscription,
} from './types';

export class WorkspaceMessagingUnavailableError extends Error {
  constructor(tableName: string) {
    super(`${tableName} table not available`);
    this.name = 'WorkspaceMessagingUnavailableError';
  }
}

async function tableExists(tableName: string): Promise<boolean> {
  const res = await pool.query('select to_regclass($1) is not null as exists', [tableName]);
  return Boolean(res.rows[0]?.exists);
}

async function requireTable(tableName: string): Promise<void> {
  if (!(await tableExists(tableName))) {
    throw new WorkspaceMessagingUnavailableError(tableName);
  }
}

function asRowIds(value: unknown): string[] | null {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : null;
    } catch {
      return [value.trim()];
    }
  }
  return null;
}

function mapMessageRow(row: any): WorkspaceMessage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    channel: row.channel,
    title: row.title,
    body: row.body,
    sourceModule: row.source_module ?? null,
    sourceWorkspace: row.source_workspace ?? null,
    rowIds: asRowIds(row.row_ids),
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
    meta: row.meta ?? null,
  };
}

function mapSubscriptionRow(row: any): WorkspaceSubscription {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id ?? null,
    scope: row.scope,
    targetKey: row.target_key ?? null,
    enabled: Boolean(row.enabled),
    delivery: row.delivery,
    meta: row.meta ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditRow(row: any): WorkspaceAuditTrail {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id ?? null,
    action: row.action,
    subjectType: row.subject_type ?? null,
    subjectId: row.subject_id ?? null,
    messageId: row.message_id ?? null,
    meta: row.meta ?? null,
    createdAt: row.created_at,
  };
}

export async function createWorkspaceMessage(input: CreateMessageInput): Promise<WorkspaceMessage> {
  await requireTable('public.workspace_messages');

  const res = await pool.query(
    `insert into public.workspace_messages
      (tenant_id, channel, title, body, source_module, source_workspace, row_ids, created_by, meta)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning id, tenant_id, channel, title, body, source_module, source_workspace, row_ids, created_by, meta, created_at`,
    [
      input.tenantId,
      input.channel,
      input.title,
      input.body,
      input.sourceModule ?? null,
      input.sourceWorkspace ?? null,
      input.rowIds ?? null,
      input.createdBy ?? null,
      input.meta ?? null,
    ],
  );

  return mapMessageRow(res.rows[0]);
}

export async function listWorkspaceMessages(params: {
  tenantId: string;
  channel?: MessageChannel | string | null;
  sourceModule?: string | null;
  sourceWorkspace?: string | null;
  createdBy?: string | null;
  limit?: number;
}): Promise<WorkspaceMessage[]> {
  if (!(await tableExists('public.workspace_messages'))) return [];

  const limit = Math.min(250, Math.max(1, params.limit ?? 250));
  const values: unknown[] = [params.tenantId];
  const where: string[] = ['tenant_id = $1'];

  if (params.channel) {
    values.push(params.channel);
    where.push(`channel = $${values.length}`);
  }

  if (params.sourceModule) {
    values.push(params.sourceModule);
    where.push(`source_module = $${values.length}`);
  }

  if (params.sourceWorkspace) {
    values.push(params.sourceWorkspace);
    where.push(`source_workspace = $${values.length}`);
  }

  if (params.createdBy) {
    values.push(params.createdBy);
    where.push(`created_by = $${values.length}`);
  }

  values.push(limit);
  const res = await pool.query(
    `select id, tenant_id, channel, title, body, source_module, source_workspace, row_ids, created_by, meta, created_at
     from public.workspace_messages
     where ${where.join(' and ')}
     order by created_at desc
     limit $${values.length}`,
    values,
  );

  return res.rows.map(mapMessageRow);
}

export async function upsertWorkspaceSubscription(input: UpsertWorkspaceSubscriptionInput): Promise<WorkspaceSubscription> {
  await requireTable('public.workspace_subscriptions');

  const res = await pool.query(
    `insert into public.workspace_subscriptions
      (tenant_id, user_id, scope, target_key, enabled, delivery, meta)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (tenant_id, user_id, scope, target_key)
     do update set
       enabled = excluded.enabled,
       delivery = excluded.delivery,
       meta = excluded.meta,
       updated_at = now()
     returning id, tenant_id, user_id, scope, target_key, enabled, delivery, meta, created_at, updated_at`,
    [
      input.tenantId,
      input.userId ?? null,
      input.scope,
      input.targetKey ?? null,
      input.enabled ?? true,
      input.delivery ?? 'in_app',
      input.meta ?? null,
    ],
  );

  return mapSubscriptionRow(res.rows[0]);
}

export async function updateWorkspaceSubscription(input: {
  id?: string;
  tenantId: string;
  userId?: string | null;
  scope?: string;
  targetKey?: string | null;
  enabled?: boolean;
  delivery?: string;
  meta?: unknown;
}): Promise<WorkspaceSubscription> {
  await requireTable('public.workspace_subscriptions');

  const patch: string[] = [];
  const values: unknown[] = [];

  if (input.enabled !== undefined) {
    values.push(input.enabled);
    patch.push(`enabled = $${values.length}`);
  }

  if (input.delivery !== undefined) {
    values.push(input.delivery);
    patch.push(`delivery = $${values.length}`);
  }

  if (input.meta !== undefined) {
    values.push(input.meta);
    patch.push(`meta = $${values.length}`);
  }

  if (input.scope !== undefined) {
    values.push(input.scope);
    patch.push(`scope = $${values.length}`);
  }

  if (input.targetKey !== undefined) {
    values.push(input.targetKey);
    patch.push(`target_key = $${values.length}`);
  }

  if (input.userId !== undefined) {
    values.push(input.userId);
    patch.push(`user_id = $${values.length}`);
  }

  patch.push('updated_at = now()');

  const where: string[] = [];
  if (input.id) {
    values.push(input.id);
    where.push(`id = $${values.length}`);
  } else {
    values.push(input.tenantId);
    where.push(`tenant_id = $${values.length}`);

    values.push(input.userId ?? null);
    where.push(`user_id is not distinct from $${values.length}`);

    values.push(input.scope ?? null);
    where.push(`scope is not distinct from $${values.length}`);

    values.push(input.targetKey ?? null);
    where.push(`target_key is not distinct from $${values.length}`);
  }

  const res = await pool.query(
    `update public.workspace_subscriptions
     set ${patch.join(', ')}
     where ${where.join(' and ')}
     returning id, tenant_id, user_id, scope, target_key, enabled, delivery, meta, created_at, updated_at`,
    values,
  );

  const row = res.rows[0];
  if (!row) {
    throw new Error('Workspace subscription not found');
  }
  return mapSubscriptionRow(row);
}

export async function listWorkspaceSubscriptions(params: {
  tenantId: string;
  userId?: string | null;
  scope?: string | null;
  targetKey?: string | null;
  enabled?: boolean | null;
}): Promise<WorkspaceSubscription[]> {
  if (!(await tableExists('public.workspace_subscriptions'))) return [];

  const values: unknown[] = [params.tenantId];
  const where: string[] = ['tenant_id = $1'];

  if (params.userId !== undefined) {
    values.push(params.userId);
    where.push(`user_id is not distinct from $${values.length}`);
  }

  if (params.scope) {
    values.push(params.scope);
    where.push(`scope = $${values.length}`);
  }

  if (params.targetKey !== undefined) {
    values.push(params.targetKey);
    where.push(`target_key is not distinct from $${values.length}`);
  }

  if (params.enabled !== undefined && params.enabled !== null) {
    values.push(params.enabled);
    where.push(`enabled = $${values.length}`);
  }

  const res = await pool.query(
    `select id, tenant_id, user_id, scope, target_key, enabled, delivery, meta, created_at, updated_at
     from public.workspace_subscriptions
     where ${where.join(' and ')}
     order by created_at desc`,
    values,
  );

  return res.rows.map(mapSubscriptionRow);
}

export async function recordWorkspaceAuditEvent(input: AuditEventInput): Promise<WorkspaceAuditTrail> {
  await requireTable('public.workspace_audit_trail');

  const res = await pool.query(
    `insert into public.workspace_audit_trail
      (tenant_id, user_id, action, subject_type, subject_id, message_id, meta)
     values ($1,$2,$3,$4,$5,$6,$7)
     returning id, tenant_id, user_id, action, subject_type, subject_id, message_id, meta, created_at`,
    [
      input.tenantId,
      input.userId ?? null,
      input.action,
      input.subjectType ?? null,
      input.subjectId ?? null,
      input.messageId ?? null,
      input.meta ?? null,
    ],
  );

  return mapAuditRow(res.rows[0]);
}

export async function listWorkspaceAuditTrail(params: {
  tenantId: string;
  userId?: string | null;
  action?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  messageId?: string | null;
  limit?: number;
}): Promise<WorkspaceAuditTrail[]> {
  if (!(await tableExists('public.workspace_audit_trail'))) return [];

  const limit = Math.min(250, Math.max(1, params.limit ?? 250));
  const values: unknown[] = [params.tenantId];
  const where: string[] = ['tenant_id = $1'];

  if (params.userId !== undefined) {
    values.push(params.userId);
    where.push(`user_id is not distinct from $${values.length}`);
  }

  if (params.action) {
    values.push(params.action);
    where.push(`action = $${values.length}`);
  }

  if (params.subjectType) {
    values.push(params.subjectType);
    where.push(`subject_type = $${values.length}`);
  }

  if (params.subjectId) {
    values.push(params.subjectId);
    where.push(`subject_id = $${values.length}`);
  }

  if (params.messageId) {
    values.push(params.messageId);
    where.push(`message_id = $${values.length}`);
  }

  values.push(limit);
  const res = await pool.query(
    `select id, tenant_id, user_id, action, subject_type, subject_id, message_id, meta, created_at
     from public.workspace_audit_trail
     where ${where.join(' and ')}
     order by created_at desc
     limit $${values.length}`,
    values,
  );

  return res.rows.map(mapAuditRow);
}
