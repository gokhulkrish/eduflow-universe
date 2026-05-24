import { NextRequest, NextResponse } from 'next/server';
import { loadProfile, saveProfile } from '../../../../src/core/institute/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const institutionId = searchParams.get('institutionId');
  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId required' }, { status: 400 });
  }

  const profile = await loadProfile(institutionId);
  return NextResponse.json({ profile });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { institutionId, identity, headerConfig, settings, userId } = body;

  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId required' }, { status: 400 });
  }

  await saveProfile(institutionId, { identity, headerConfig, settings }, userId);

  return NextResponse.json({ ok: true });
}
