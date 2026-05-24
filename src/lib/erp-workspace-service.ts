import { pool } from "@/db/pool";
import type { ErpWorkspaceState, SwitchModuleInput } from "./erp-workspace";
import {
  mergeRecentModules,
  normalizeErpWorkspaceState,
  resolveErpWorkspaceKey,
} from "./erp-workspace";

type WorkspaceRow = {
  active_module: string;
  active_workspace_key: string;
  active_tab: string | null;
  sidebar_expanded: boolean;
  pinned_modules: string[] | null;
  recent_modules: string[] | null;
  last_opened_at: string;
  updated_at: string;
};

const rowToState = (row: WorkspaceRow | null): ErpWorkspaceState | null => {
  if (!row) return null;
  return normalizeErpWorkspaceState({
    activeModule: row.active_module,
    activeWorkspaceKey: row.active_workspace_key,
    activeTab: row.active_tab ?? undefined,
    sidebarExpanded: row.sidebar_expanded,
    lastOpenedAt: row.last_opened_at,
    pinnedModules: row.pinned_modules ?? [],
    recentModules: row.recent_modules ?? [],
  });
};

export async function loadErpWorkspaceState(tenantId: string, userId?: string | null): Promise<ErpWorkspaceState | null> {
  const result = await pool.query(
    `select active_module, active_workspace_key, active_tab, sidebar_expanded, pinned_modules, recent_modules, last_opened_at, updated_at
     from public.erp_workspace_state
     where tenant_id = $1 and user_id is not distinct from $2
     order by updated_at desc
     limit 1`,
    [tenantId, userId ?? null],
  );

  return rowToState((result.rows[0] as WorkspaceRow | undefined) ?? null);
}

export async function saveErpWorkspaceState(
  tenantId: string,
  userId: string | null | undefined,
  state: ErpWorkspaceState,
): Promise<ErpWorkspaceState> {
  const normalized = normalizeErpWorkspaceState(state);

  await pool.query(
    `insert into public.erp_workspace_state
      (tenant_id, user_id, active_module, active_workspace_key, active_tab, sidebar_expanded, pinned_modules, recent_modules)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (tenant_id, user_id)
     do update set active_module = excluded.active_module,
                   active_workspace_key = excluded.active_workspace_key,
                   active_tab = excluded.active_tab,
                   sidebar_expanded = excluded.sidebar_expanded,
                   pinned_modules = excluded.pinned_modules,
                   recent_modules = excluded.recent_modules,
                   last_opened_at = now(),
                   updated_at = now()`,
    [
      tenantId,
      userId ?? null,
      normalized.activeModule,
      normalized.activeWorkspaceKey,
      normalized.activeTab ?? null,
      normalized.sidebarExpanded,
      JSON.stringify(normalized.pinnedModules ?? []),
      JSON.stringify(normalized.recentModules ?? []),
    ],
  );

  return {
    ...normalized,
    lastOpenedAt: new Date().toISOString(),
  };
}

export async function logErpWorkspaceEvent(input: {
  tenantId: string;
  userId?: string | null;
  moduleKey: string;
  workspaceKey?: string | null;
  eventType: string;
  meta?: unknown;
}) {
  await pool.query(
    `insert into public.erp_workspace_events (tenant_id, user_id, module_key, workspace_key, event_type, meta)
     values ($1,$2,$3,$4,$5,$6)`,
    [
      input.tenantId,
      input.userId ?? null,
      input.moduleKey,
      input.workspaceKey ?? null,
      input.eventType,
      input.meta == null ? null : JSON.stringify(input.meta),
    ],
  );
}

export async function switchErpWorkspace(
  input: SwitchModuleInput & {
    pinnedModules?: string[];
    recentModules?: string[];
    sidebarExpanded?: boolean;
  },
): Promise<ErpWorkspaceState> {
  const current = (await loadErpWorkspaceState(input.tenantId, input.userId)) ?? normalizeErpWorkspaceState({
    activeModule: input.moduleKey,
    activeWorkspaceKey: resolveErpWorkspaceKey(input.moduleKey, input.workspaceKey),
    activeTab: input.tabKey,
  });

  const next = normalizeErpWorkspaceState({
    ...current,
    activeModule: input.moduleKey,
    activeWorkspaceKey: resolveErpWorkspaceKey(input.moduleKey, input.workspaceKey),
    activeTab: input.tabKey ?? current.activeTab,
    sidebarExpanded: input.sidebarExpanded ?? current.sidebarExpanded,
    pinnedModules: input.pinnedModules ?? current.pinnedModules,
    recentModules: mergeRecentModules(input.recentModules ?? current.recentModules, input.moduleKey),
  });

  await saveErpWorkspaceState(input.tenantId, input.userId, next);
  await logErpWorkspaceEvent({
    tenantId: input.tenantId,
    userId: input.userId ?? null,
    moduleKey: input.moduleKey,
    workspaceKey: next.activeWorkspaceKey,
    eventType: input.reason ?? "module-switch",
    meta: {
      activeTab: next.activeTab ?? null,
      sidebarExpanded: next.sidebarExpanded,
    },
  });

  return next;
}

