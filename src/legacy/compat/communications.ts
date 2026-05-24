import { pool } from '@/db/pool';
import type { MessageChannel } from '@/core/workspace-messaging';

export interface LegacyMessageFilter {
  tenantId?: string;
  templateId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LegacyMessageSummary {
  id: string;
  templateName: string;
  recipient: string;
  status: string;
  sentAt: string;
}

const WORKSPACE_CHANNELS = new Set<MessageChannel>([
  'notice',
  'internal_note',
  'counselor_note',
  'principal_note',
  'parent_request',
  'subscription',
  'audit',
  'system_event',
]);

const NOTE_CHANNEL_ALIASES: Record<string, MessageChannel> = {
  parent_request_log: 'parent_request',
};

async function tableExists(tableName: string): Promise<boolean> {
  const { rows } = await pool.query('select to_regclass($1) is not null as exists', [tableName]);
  return Boolean(rows[0]?.exists);
}

function normalizeChannel(type?: string | null): MessageChannel | string | null {
  if (!type) return null;
  return NOTE_CHANNEL_ALIASES[type] ?? type;
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function parseIsoDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapWorkspaceMessage(row: any): LegacyMessageSummary {
  const recipient =
    asText(row.meta?.recipient) ??
    asText(row.meta?.targetKey) ??
    asText(row.meta?.scope) ??
    asText(row.source_workspace) ??
    'workspace';

  return {
    id: row.id,
    templateName: asText(row.title) ?? 'Message',
    recipient,
    status: asText(row.meta?.status) ?? asText(row.meta?.noticeStatus) ?? 'sent',
    sentAt: row.created_at,
  };
}

function mapLogRow(row: any): LegacyMessageSummary {
  return {
    id: row.id,
    templateName: asText(row.template_name) ?? 'Message',
    recipient: asText(row.recipient) ?? 'unknown',
    status: asText(row.status) ?? 'sent',
    sentAt: row.sent_at ?? row.created_at,
  };
}

export async function getMessagesLegacyCompatible(
  filter: LegacyMessageFilter,
): Promise<LegacyMessageSummary[]> {
  if (!filter.tenantId) return [];

  const results: Array<LegacyMessageSummary & { sortKey: string }> = [];
  const channel = normalizeChannel(filter.type);
  const dateFrom = parseIsoDate(filter.dateFrom);
  const dateTo = parseIsoDate(filter.dateTo);

  if (await tableExists('public.workspace_messages')) {
    const values: unknown[] = [filter.tenantId];
    const where: string[] = ['tenant_id = $1'];

    if (channel && WORKSPACE_CHANNELS.has(channel as MessageChannel)) {
      values.push(channel);
      where.push(`channel = $${values.length}`);
    }

    if (dateFrom) {
      values.push(dateFrom);
      where.push(`created_at >= $${values.length}`);
    }

    if (dateTo) {
      values.push(dateTo);
      where.push(`created_at <= $${values.length}`);
    }

    if (filter.templateId) {
      values.push(filter.templateId);
      where.push(`(source_module = $${values.length} or source_workspace = $${values.length} or coalesce(meta->>'templateId','') = $${values.length})`);
    }

    const { rows } = await pool.query(
      `select id, title, body, source_module, source_workspace, meta, created_at
       from public.workspace_messages
       where ${where.join(' and ')}
       order by created_at desc
       limit 250`,
      values,
    );

    for (const row of rows) {
      results.push({
        ...mapWorkspaceMessage(row),
        sortKey: row.created_at,
      });
    }
  }

  if (await tableExists('public.message_logs')) {
    const values: unknown[] = [filter.tenantId];
    const where: string[] = ['institution_id = $1'];

    if (channel && !WORKSPACE_CHANNELS.has(channel as MessageChannel)) {
      values.push(channel);
      where.push(`channel = $${values.length}`);
    } else if (channel && ['sms', 'email', 'push', 'notice'].includes(String(channel))) {
      values.push(channel);
      where.push(`channel = $${values.length}`);
    }

    if (filter.templateId) {
      values.push(filter.templateId);
      where.push(`template_id = $${values.length}`);
    }

    if (dateFrom) {
      values.push(dateFrom);
      where.push(`created_at >= $${values.length}`);
    }

    if (dateTo) {
      values.push(dateTo);
      where.push(`created_at <= $${values.length}`);
    }

    const { rows } = await pool.query(
      `select l.id,
              l.recipient,
              l.status,
              l.created_at as sent_at,
              t.name as template_name
       from public.message_logs l
       left join public.message_templates t on t.id = l.template_id
       where ${where.join(' and ')}
       order by l.created_at desc
       limit 250`,
      values,
    );

    for (const row of rows) {
      results.push({
        ...mapLogRow(row),
        sortKey: row.sent_at ?? row.created_at,
      });
    }
  }

  return results
    .sort((a, b) => new Date(b.sortKey).getTime() - new Date(a.sortKey).getTime())
    .map(({ sortKey, ...row }) => row);
}
