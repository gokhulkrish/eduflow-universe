import { NextRequest, NextResponse } from 'next/server';
import { logWorkspaceAction } from '../../../../src/core/registered-students/service';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { institutionId, userId, action, rowIds, meta } = body;

  if (!institutionId || !action) {
    return NextResponse.json({ error: 'institutionId and action required' }, { status: 400 });
  }

  await logWorkspaceAction({
    institutionId,
    userId: userId ?? null,
    action,
    rowIds: rowIds ?? [],
    meta: meta ?? null,
  });

  return NextResponse.json({ ok: true });
}
