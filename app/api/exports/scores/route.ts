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
  const studentId = searchParams.get('studentId');
  const date = searchParams.get('date');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  let query = `select sc.id, sc.student_id, s.admission_no, s.full_name, sc.rubric_code, sc.period_start, sc.period_end, sc.scores, sc.composite_score
     from public.subjective_scores sc
     left join public.students s on s.id = sc.student_id
     where sc.institution_id = $1`;
  const params: any[] = [tenantId];

  if (studentId) {
    params.push(studentId);
    query += ` and sc.student_id = $2`;
  }

  if (date) {
    params.push(date);
    query += studentId ? ` and sc.period_start = $3` : ` and sc.period_start = $2`;
  }

  query += ` order by s.full_name asc, sc.period_start desc`;

  const rows = await pool.query(query, params);

  const header = ['ScoreID', 'StudentID', 'AdmissionNo', 'Name', 'RubricCode', 'PeriodStart', 'PeriodEnd', 'Scores', 'Composite'];
  const lines = [header.join(',')];
  for (const r of rows.rows) {
    lines.push(
      [csvEscape(r.id), csvEscape(r.student_id), csvEscape(r.admission_no), csvEscape(r.full_name), csvEscape(r.rubric_code), csvEscape(r.period_start), csvEscape(r.period_end), csvEscape(JSON.stringify(r.scores)), csvEscape(r.composite_score)].join(','),
    );
  }

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="subjective-scores.csv"',
    },
  });
}
