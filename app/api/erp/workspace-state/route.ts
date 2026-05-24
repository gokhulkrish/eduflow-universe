import { NextRequest, NextResponse } from "next/server";
import { loadErpWorkspaceState, saveErpWorkspaceState } from "@/lib/erp-workspace-service";
import { normalizeErpWorkspaceState } from "@/lib/erp-workspace";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const userId = searchParams.get("userId");
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 });

  const row = await loadErpWorkspaceState(tenantId, userId ?? null);
  return NextResponse.json({ row: row ? normalizeErpWorkspaceState(row) : null });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tenantId, userId, activeModule, activeWorkspaceKey, activeTab, sidebarExpanded, pinnedModules, recentModules, lastOpenedAt } = body ?? {};
  if (!tenantId || !activeModule || !activeWorkspaceKey) {
    return NextResponse.json({ error: "tenantId, activeModule, activeWorkspaceKey required" }, { status: 400 });
  }

  const state = normalizeErpWorkspaceState({
    activeModule,
    activeWorkspaceKey,
    activeTab,
    sidebarExpanded,
    pinnedModules,
    recentModules,
    lastOpenedAt,
  });

  await saveErpWorkspaceState(tenantId, userId ?? null, state);
  return NextResponse.json({ ok: true, row: state });
}

