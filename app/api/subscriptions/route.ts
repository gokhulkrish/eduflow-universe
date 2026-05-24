import { NextRequest, NextResponse } from 'next/server';
import {
  listWorkspaceSubscriptions,
  updateWorkspaceSubscription,
  upsertWorkspaceSubscription,
  WorkspaceMessagingUnavailableError,
} from '@/core/workspace-messaging';

export const runtime = 'nodejs';

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const userId = searchParams.get('userId');
  const scope = searchParams.get('scope');
  const targetKey = searchParams.get('targetKey');
  const enabledParam = searchParams.get('enabled');

  if (!tenantId) return json({ error: 'tenantId required' }, 400);

  try {
    const rows = await listWorkspaceSubscriptions({
      tenantId,
      userId: userId ?? undefined,
      scope: scope ?? undefined,
      targetKey: targetKey ?? undefined,
      enabled:
        enabledParam === null
          ? undefined
          : enabledParam === 'true'
            ? true
            : enabledParam === 'false'
              ? false
              : undefined,
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
    const { tenantId, userId, scope, targetKey, enabled, delivery, meta } = body ?? {};

    if (!tenantId || !scope) {
      return json({ error: 'tenantId and scope required' }, 400);
    }

    const row = await upsertWorkspaceSubscription({
      tenantId,
      userId: userId ?? null,
      scope,
      targetKey: targetKey ?? null,
      enabled: enabled ?? true,
      delivery: delivery ?? 'in_app',
      meta,
    });

    return json({ ok: true, row }, 201);
  } catch (error) {
    if (error instanceof WorkspaceMessagingUnavailableError) {
      return json({ error: error.message }, 503);
    }
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 400);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, tenantId, userId, scope, targetKey, enabled, delivery, meta } = body ?? {};

    if (!tenantId) {
      return json({ error: 'tenantId required' }, 400);
    }

    if (!id && !scope) {
      return json({ error: 'id or scope required for update' }, 400);
    }

    const row = id
      ? await updateWorkspaceSubscription({
          id,
          tenantId,
          userId: userId ?? null,
          scope,
          targetKey: targetKey ?? undefined,
          enabled,
          delivery,
          meta,
        })
      : await upsertWorkspaceSubscription({
          tenantId,
          userId: userId ?? null,
          scope,
          targetKey: targetKey ?? null,
          enabled,
          delivery,
          meta,
        });

    return json({ ok: true, row });
  } catch (error) {
    if (error instanceof WorkspaceMessagingUnavailableError) {
      return json({ error: error.message }, 503);
    }
    return json({ error: error instanceof Error ? error.message : 'Unknown error' }, 400);
  }
}

