import { NextRequest, NextResponse } from 'next/server';
import {
  createWorkspaceMessage,
  listWorkspaceAuditTrail,
  recordWorkspaceAuditEvent,
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
  const userId = searchParams.get('userId');
  const action = searchParams.get('action');
  const subjectType = searchParams.get('subjectType');
  const subjectId = searchParams.get('subjectId');
  const messageId = searchParams.get('messageId');
  const limit = parseLimit(searchParams.get('limit'));

  if (!tenantId) return json({ error: 'tenantId required' }, 400);

  try {
    const rows = await listWorkspaceAuditTrail({
      tenantId,
      userId: userId ?? undefined,
      action: action ?? undefined,
      subjectType: subjectType ?? undefined,
      subjectId: subjectId ?? undefined,
      messageId: messageId ?? undefined,
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
      userId,
      action,
      subjectType,
      subjectId,
      messageId,
      meta,
      message,
    } = body ?? {};

    if (!tenantId || !action) {
      return json({ error: 'tenantId and action required' }, 400);
    }

    let createdMessageId = messageId ?? null;
    let createdMessage = null;

    if (message && !createdMessageId) {
      const messageChannel = (message.channel ?? 'audit') as MessageChannel;
      createdMessage = await createWorkspaceMessage({
        tenantId,
        channel: messageChannel,
        title: message.title ?? action,
        body: message.body ?? action,
        sourceModule: message.sourceModule ?? meta?.sourceModule ?? undefined,
        sourceWorkspace: message.sourceWorkspace ?? meta?.sourceWorkspace ?? undefined,
        rowIds: Array.isArray(message.rowIds) ? message.rowIds : Array.isArray(meta?.rowIds) ? meta.rowIds : undefined,
        createdBy: message.createdBy ?? userId ?? undefined,
        meta: message.meta ?? meta ?? null,
      });
      createdMessageId = createdMessage.id;
    }

    const row = await recordWorkspaceAuditEvent({
      tenantId,
      userId,
      action,
      subjectType,
      subjectId,
      messageId: createdMessageId ?? undefined,
      meta,
    });

    return json({ ok: true, row, message: createdMessage }, 201);
  } catch (error) {
    if (error instanceof WorkspaceMessagingUnavailableError) {
      return json({ error: error.message }, 503);
    }
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 400);
  }
}

