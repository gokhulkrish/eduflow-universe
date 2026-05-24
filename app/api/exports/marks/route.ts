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
  const termId = searchParams.get('termId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  let query = `select m.id, m.student_id, s.admission_no, s.full_name, m.term_id, m.subject_id, m.component_id, m.raw_marks, m.max_marks
     from public.exam_marks m
     left join public.students s on s.id = m.student_id
     where m.institution_id = $1`;
  const params: any[] = [tenantId];

  if (termId) {
    params.push(termId);
    query += ` and m.term_id = $2`;
  }

  query += ` order by s.full_name asc`;

  const rows = await pool.query(query, params);

  const header = ['MarkID', 'StudentID', 'AdmissionNo', 'Name', 'TermID', 'SubjectID', 'ComponentID', 'RawMarks', 'MaxMarks'];
  const lines = [header.join(',')];
  for (const r of rows.rows) {
    lines.push(
      [csvEscape(r.id), csvEscape(r.student_id), csvEscape(r.admission_no), csvEscape(r.full_name), csvEscape(r.term_id), csvEscape(r.subject_id), csvEscape(r.component_id), csvEscape(r.raw_marks), csvEscape(r.max_marks)].join(','),
    );
  }

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="marks.csv"',
    },
  });
}
