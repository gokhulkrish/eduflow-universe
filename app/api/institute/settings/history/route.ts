import { NextRequest, NextResponse } from 'next/server';
import { getSettingsHistory } from '../../../../../src/core/institute/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const institutionId = searchParams.get('institutionId');
  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId required' }, { status: 400 });
  }

  const history = await getSettingsHistory(institutionId);
  return NextResponse.json({ history });
}
