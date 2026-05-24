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
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const rows = await pool.query(
    `select admission_no, full_name, class_name, section_name
     from public.student_search_view
     where tenant_id = $1
     order by full_name asc`,
    [tenantId],
  );

  const header = ['AdmissionNo', 'Name', 'Class', 'Section'];
  const lines = [header.join(',')];
  for (const r of rows.rows) {
    lines.push(
      [
        csvEscape(r.admission_no),
        csvEscape(r.full_name),
        csvEscape(r.class_name),
        csvEscape(r.section_name),
      ].join(','),
    );
  }

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="students.csv"',
    },
  });
}
