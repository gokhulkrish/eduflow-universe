import { NextRequest, NextResponse } from "next/server";
import { logErpWorkspaceEvent } from "@/lib/erp-workspace-service";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, userId, moduleKey, workspaceKey, eventType, meta } = body ?? {};
  if (!tenantId || !moduleKey || !eventType) {
    return NextResponse.json({ error: "tenantId, moduleKey, eventType required" }, { status: 400 });
  }

  await logErpWorkspaceEvent({
    tenantId,
    userId: userId ?? null,
    moduleKey,
    workspaceKey: workspaceKey ?? null,
    eventType,
    meta,
  });

  return NextResponse.json({ ok: true });
}

