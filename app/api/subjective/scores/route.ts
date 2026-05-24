import { NextRequest, NextResponse } from 'next/server';
import { getScoresForStudent } from '../../../../src/core/scoring/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const studentId = searchParams.get('studentId');
  const date = searchParams.get('date');

  if (!tenantId || !studentId || !date) {
    return NextResponse.json({ error: 'tenantId, studentId, date required' }, { status: 400 });
  }

  const scores = await getScoresForStudent(tenantId, studentId, date);
  return NextResponse.json({ scores });
}
