import { NextRequest, NextResponse } from "next/server";

import { readDashboardSnapshots, refreshMonitoringSnapshot } from "../../../../core/monitoring/snapshot";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const academicYearId = searchParams.get("academicYearId") || undefined;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const rows = await readDashboardSnapshots({ tenantId, academicYearId });
  return NextResponse.json({ rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId.trim() : "";
  const academicYearId = typeof body?.academicYearId === "string" && body.academicYearId.trim() ? body.academicYearId.trim() : undefined;

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId required" }, { status: 400 });
  }

  const result = await refreshMonitoringSnapshot({ tenantId, academicYearId });
  return NextResponse.json({ ok: true, ...result });
}
