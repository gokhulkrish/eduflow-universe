import { NextRequest, NextResponse } from 'next/server';
import { correctAttendance } from '../../../../src/core/attendance/service';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { recordId, newStatus, reason, correctedBy } = body;

  if (!recordId || !newStatus || !reason) {
    return NextResponse.json({ error: 'recordId, newStatus, and reason are required' }, { status: 400 });
  }

  await correctAttendance({ recordId, newStatus, reason, correctedBy: correctedBy ?? null });

  return NextResponse.json({ ok: true });
}
