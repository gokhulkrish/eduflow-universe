import { NextRequest, NextResponse } from 'next/server';
import {
  createWorkspaceMessage,
  listWorkspaceMessages,
  WorkspaceMessagingUnavailableError,
} from '@/core/workspace-messaging';
import type { MessageChannel } from '@/core/workspace-messaging';

export const runtime = 'nodejs';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? 250);
  if (!Number.isFinite(parsed)) return 250;
  return Math.min(250, Math.max(1, parsed));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const channel = searchParams.get('channel') as MessageChannel | null;
  const sourceModule = searchParams.get('sourceModule');
  const sourceWorkspace = searchParams.get('sourceWorkspace');
  const createdBy = searchParams.get('createdBy');
  const limit = parseLimit(searchParams.get('limit'));

  if (!tenantId) return json({ error: 'tenantId required' }, 400);

  try {
    const rows = await listWorkspaceMessages({
      tenantId,
      channel: channel ?? undefined,
      sourceModule: sourceModule ?? undefined,
      sourceWorkspace: sourceWorkspace ?? undefined,
      createdBy: createdBy ?? undefined,
      limit,
    });

    return json({ rows });
  } catch (error) {
    if (error instanceof WorkspaceMessagingUnavailableError) {
      return json({ error: error.message, rows: [] }, 503);
    }
    return json({ error: error instanceof Error ? error.message : 'Unknown error', rows: [] }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId,
      channel,
      title,
      body: messageBody,
      sourceModule,
      sourceWorkspace,
      rowIds,
      createdBy,
      meta,
      noticeStatus,
      targetScope,
      targetKey,
      targetKeys,
    } = body ?? {};

    if (!tenantId || !channel || !title || !messageBody) {
      return json({ error: 'tenantId, channel, title, body required' }, 400);
    }

    const mergedMeta =
      noticeStatus || targetScope || targetKey || targetKeys
        ? {
            ...(meta && typeof meta === 'object' ? meta : {}),
            ...(noticeStatus ? { noticeStatus } : {}),
            ...(targetScope ? { targetScope } : {}),
            ...(targetKey ? { targetKey } : {}),
            ...(Array.isArray(targetKeys) ? { targetKeys } : {}),
          }
        : meta;

    const row = await createWorkspaceMessage({
      tenantId,
      channel,
      title,
      body: messageBody,
      sourceModule,
      sourceWorkspace,
      rowIds: Array.isArray(rowIds) ? rowIds : undefined,
      createdBy,
      meta: mergedMeta,
    });

    return json({ ok: true, row }, 201);
  } catch (error) {
    if (error instanceof WorkspaceMessagingUnavailableError) {
      return json({ error: error.message }, 503);
    }
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 400);
  }
}

