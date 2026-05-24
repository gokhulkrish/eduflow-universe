import { NextRequest, NextResponse } from 'next/server';
import { saveReportSnapshot, listReportSnapshots } from '../../../../src/core/registered-students/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const institutionId = searchParams.get('institutionId');

  if (!institutionId) {
    return NextResponse.json({ error: 'institutionId required' }, { status: 400 });
  }

  const snapshots = await listReportSnapshots(institutionId);
  return NextResponse.json({ snapshots });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { institutionId, userId, reportName, reportState } = body;

  if (!institutionId || !reportName || !reportState) {
    return NextResponse.json({ error: 'institutionId, reportName, reportState required' }, { status: 400 });
  }

  const id = await saveReportSnapshot({
    institutionId,
    userId: userId ?? null,
    reportName,
    reportState,
  });

  return NextResponse.json({ id });
}
