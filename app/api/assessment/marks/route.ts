import { NextRequest, NextResponse } from 'next/server';
import { upsertMark, getMarksForTerm } from '../../../../src/core/assessment/service';
import { calculateTermScore, type ComponentMarkInput, legacyRound } from '../../../../src/core/assessment/scoringEngine';
import { isFeatureEnabled } from '../../../../src/config/featureToggles';

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('useNewAssessmentEngine')) {
    return NextResponse.json({ error: 'New assessment engine disabled' }, { status: 400 });
  }

  const body = await req.json();
  await upsertMark(body);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const termId = searchParams.get('termId');
  const studentId = searchParams.get('studentId');

  if (!tenantId || !termId || !studentId) {
    return NextResponse.json({ error: 'tenantId, termId, and studentId required' }, { status: 400 });
  }

  const rows = await getMarksForTerm({ tenantId, termId, studentId });
  const components: ComponentMarkInput[] = rows.map((r) => ({
    componentId: r.componentId,
    subjectId: r.subjectId,
    maxMarks: r.maxMarks,
    obtainedMarks: r.rawMarks,
    weight: 100,
  }));

  const score = await calculateTermScore({
    tenantId,
    studentId,
    termId,
    gradeSchemeCode: 'G9',
    components,
  });

  return NextResponse.json({ marks: rows, termScore: score });
}
