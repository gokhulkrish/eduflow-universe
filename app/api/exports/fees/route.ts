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
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  let query = `select l.id, l.student_id, s.admission_no, s.full_name, l.due_amount, l.paid_amount, l.concession_amount, l.adjustment_amount, l.due_date, l.status, l.risk_state
     from public.fee_ledgers l
     left join public.students s on s.id = l.student_id
     where l.institution_id = $1`;
  const params: any[] = [tenantId];

  if (studentId) {
    params.push(studentId);
    query += ` and l.student_id = $2`;
  }

  query += ` order by s.full_name asc, l.due_date asc`;

  const rows = await pool.query(query, params);

  const header = ['LedgerID', 'StudentID', 'AdmissionNo', 'Name', 'DueAmount', 'PaidAmount', 'Concession', 'Adjustment', 'DueDate', 'Status', 'RiskState'];
  const lines = [header.join(',')];
  for (const r of rows.rows) {
    lines.push(
      [csvEscape(r.id), csvEscape(r.student_id), csvEscape(r.admission_no), csvEscape(r.full_name), csvEscape(r.due_amount), csvEscape(r.paid_amount), csvEscape(r.concession_amount), csvEscape(r.adjustment_amount), csvEscape(r.due_date), csvEscape(r.status), csvEscape(r.risk_state)].join(','),
    );
  }

  return new NextResponse(lines.join('\n'), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fees.csv"',
    },
  });
}
