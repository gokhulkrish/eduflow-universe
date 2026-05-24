import { NextRequest, NextResponse } from 'next/server';
import { getTraces, appendTrace } from '../../../src/core/trace/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');
  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const rows = await getTraces(tenantId);
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, category, title, detail, source, section, meta } = body;

  if (!tenantId || !category || !title) {
    return NextResponse.json({ error: 'tenantId, category, title required' }, { status: 400 });
  }

  await appendTrace({ tenantId, category, title, detail, source, section, meta });
  return NextResponse.json({ ok: true });
}
