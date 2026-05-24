import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db/pool';

function csvEscape(v: unknown) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const date = searchParams.get('date');
  if (!tenantId || !date) {
    return NextResponse.json({ error: 'tenantId and date required' }, { status: 400 });
  }

  const rows = await pool.query(
    `select a.student_id, s.admission_no, s.full_name, a.date, a.period, a.status
     from public.attendance a
     left join public.students s on s.id = a.student_id
     where a.institution_id = $1 and a.date = $2
     order by s.full_name asc`,
    [tenantId, date],
  );

  const header = ['StudentID', 'AdmissionNo', 'Name', 'Date', 'Period', 'Status'];
  const lines = [header.join(',')];
  for (const r of rows.rows) {
    lines.push(
      [csvEscape(r.student_id), csvEscape(r.admission_no), csvEscape(r.full_name), csvEscape(r.date), csvEscape(r.period), csvEscape(r.status)].join(','),
    );
  }

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="attendance.csv"',
    },
  });
}
