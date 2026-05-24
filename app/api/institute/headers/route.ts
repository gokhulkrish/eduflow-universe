import { NextRequest, NextResponse } from 'next/server';
import { resolveHeaderMapping } from '../../../../src/core/institute/service';
import { loadProfile } from '../../../../src/core/institute/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const institutionId = searchParams.get('institutionId');
  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId required' }, { status: 400 });
  }

  const profile = await loadProfile(institutionId);
  const headers = profile?.headerConfig ?? [];
  const resolved = resolveHeaderMapping(headers);

  return NextResponse.json({ headers, resolved });
}
