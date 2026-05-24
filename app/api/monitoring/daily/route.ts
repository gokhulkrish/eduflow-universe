import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { isFeatureEnabled } from '@/config/featureToggles';

export async function GET(req: NextRequest) {
  if (!isFeatureEnabled('useMonitoringProjectionApi')) {
    return NextResponse.json({ error: 'Monitoring projection API disabled' }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  const date = searchParams.get('date');
  const className = searchParams.get('className');
  const sectionName = searchParams.get('sectionName');
  const minFeeRiskRank = searchParams.get('minFeeRiskRank');

  if (!tenantId || !date) {
    return NextResponse.json({ error: 'tenantId and date are required' }, { status: 400 });
  }

  const params: any[] = [tenantId, date];
  const where: string[] = ['institution_id = $1', 'day = $2'];
  let i = 2;

  if (className) {
    params.push(className);
    where.push(`class_name = $${++i}`);
  }

  if (sectionName) {
    params.push(sectionName);
    where.push(`section_name = $${++i}`);
  }

  if (minFeeRiskRank) {
    params.push(Number(minFeeRiskRank));
    where.push(`fee_risk_rank >= $${++i}`);
  }

  const res = await pool.query(
    `select *
     from public.monitoring_daily
     where ${where.join(' and ')}
     order by class_name asc, section_name asc, admission_no asc`,
    params,
  );

  return NextResponse.json({ rows: res.rows });
}
