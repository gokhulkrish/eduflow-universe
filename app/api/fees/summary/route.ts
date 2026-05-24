import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db/pool';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const studentId = searchParams.get('studentId');

  if (!tenantId || !studentId) {
    return NextResponse.json({ error: 'tenantId and studentId are required' }, { status: 400 });
  }

  const result = await pool.query(
    `select
      coalesce(sum(due_amount + adjustment_amount - concession_amount), 0) as net_due,
      coalesce(sum(paid_amount), 0) as paid_amount,
      coalesce(sum(greatest(0, due_amount + adjustment_amount - concession_amount - paid_amount)), 0) as outstanding_amount
     from public.fee_ledgers
     where institution_id = $1 and student_id = $2`,
    [tenantId, studentId],
  );

  const riskRows = await pool.query(
    `select risk_state from public.fee_ledgers where institution_id = $1 and student_id = $2`,
    [tenantId, studentId],
  );

  const severity = { normal: 1, warning: 2, critical: 3 } as const;
  let summaryRisk: 'normal' | 'warning' | 'critical' = 'normal';
  for (const row of riskRows.rows) {
    const r = row.risk_state as keyof typeof severity;
    if (severity[r] > severity[summaryRisk]) {
      summaryRisk = r;
    }
  }

  return NextResponse.json({
    summary: {
      ...result.rows[0],
      risk_state: summaryRisk,
    },
  });
}
