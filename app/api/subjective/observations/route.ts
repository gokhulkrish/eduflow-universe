import { NextRequest, NextResponse } from 'next/server';
import { recordObservation } from '../../../../src/core/scoring/service';
import { isFeatureEnabled } from '../../../../src/config/featureToggles';

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('useNewAssessmentEngine')) {
    return NextResponse.json({ error: 'New scoring engine disabled' }, { status: 400 });
  }

  const body = await req.json();
  await recordObservation(body);
  return NextResponse.json({ ok: true });
}
