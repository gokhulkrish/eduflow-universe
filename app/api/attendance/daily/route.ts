import { NextRequest, NextResponse } from 'next/server';
import { markDailyAttendance, bulkMarkDailyAttendance, getDailyAttendance } from '../../../../src/core/attendance/service';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (Array.isArray(body.rows)) {
    await bulkMarkDailyAttendance(body);
    return NextResponse.json({ ok: true });
  }

  await markDailyAttendance(body);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  if (!date) {
    return NextResponse.json({ error: 'date required' }, { status: 400 });
  }

  const grade = searchParams.get('grade') || undefined;
  const section = searchParams.get('section') || undefined;

  const records = await getDailyAttendance(date, grade, section);
  return NextResponse.json({ records });
}
