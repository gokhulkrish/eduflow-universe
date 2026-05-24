import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
import {
  buildErpWorkspaceUrl,
  clearErpWorkspaceSnapshot,
  ERP_WORKSPACE_STORAGE_KEY,
  normalizeErpWorkspaceState,
  readErpWorkspaceSnapshot,
  resolveErpWorkspaceKey,
  resolveErpWorkspaceScope,
  resolveNextErpWorkspaceState,
  writeErpWorkspaceSnapshot,
  type ErpWorkspaceState,
} from "@/lib/erp-workspace";
import { emitAppSync } from "@/lib/app-sync";

type HydrationStatus = "idle" | "loading" | "ready" | "error";

interface ErpWorkspaceStore {
  hydrated: boolean;
  hydrationStatus: HydrationStatus;
  scope: { tenantId: string | null; userId: string | null };
  state: ErpWorkspaceState;
  hydrate: () => Promise<void>;
  setSidebarExpanded: (expanded: boolean) => Promise<void>;
  pinModule: (moduleKey: string) => Promise<void>;
  unpinModule: (moduleKey: string) => Promise<void>;
  switchModule: (moduleKey: string, workspaceKey?: string, tabKey?: string, reason?: string) => Promise<string | null>;
  openLastWorkspace: () => Promise<string | null>;
  returnToDashboard: () => Promise<void>;
  syncState: (patch: Partial<ErpWorkspaceState>) => Promise<void>;
  clearLocalState: () => void;
}

const persistLocalState = (state: ErpWorkspaceState) => {
  writeErpWorkspaceSnapshot(state);
  emitAppSync(ERP_WORKSPACE_STORAGE_KEY);
};

let remoteSyncUnavailable = false;

const NEXT_DATA_SCRIPT_ID = "__NEXT_DATA__";

export function isNextClientRuntime(): boolean {
  if (typeof window === "undefined") return false;

  const injectedData = (window as Window & { __NEXT_DATA__?: unknown }).__NEXT_DATA__;
  if (injectedData) return true;

  return Boolean(document.getElementById(NEXT_DATA_SCRIPT_ID));
}

function canUseRemoteErpSync() {
  if (remoteSyncUnavailable) return false;
  return isNextClientRuntime();
}

type ErpRemoteSyncScope = { tenantId: string | null; userId: string | null };

interface ErpRemoteSyncClient {
  readWorkspaceState(scope: ErpRemoteSyncScope): Promise<ErpWorkspaceState | null>;
  saveWorkspaceState(scope: ErpRemoteSyncScope, state: ErpWorkspaceState): Promise<void>;
  logWorkspaceEvent(
    scope: ErpRemoteSyncScope,
    state: ErpWorkspaceState,
    eventType: string,
    meta?: Record<string, unknown>,
  ): Promise<void>;
}

export function resetErpWorkspaceRemoteSyncAvailability() {
  remoteSyncUnavailable = false;
}

async function resolveTenantScope(): Promise<{ tenantId: string | null; userId: string | null }> {
  return resolveErpWorkspaceScope();
}

function createErpRemoteSyncClient(): ErpRemoteSyncClient {
  const canSync = () => !remoteSyncUnavailable && canUseRemoteErpSync();

  const markUnavailableOnNotFound = (response: Response) => {
    if (response.status === 404) {
      remoteSyncUnavailable = true;
    }
  };

  return {
    async readWorkspaceState(scope) {
      if (!scope.tenantId || !canSync()) return null;
      try {
        const params = new URLSearchParams({ tenantId: scope.tenantId });
        if (scope.userId) params.set("userId", scope.userId);
        const response = await fetch(`/api/erp/workspace-state?${params.toString()}`);
        if (!response.ok) {
          markUnavailableOnNotFound(response);
          return null;
        }
        const payload = (await response.json()) as { row?: Record<string, unknown> | null };
        return payload.row ? normalizeErpWorkspaceState(payload.row) : null;
      } catch {
        return null;
      }
    },
    async saveWorkspaceState(scope, state) {
      if (!scope.tenantId || !canSync()) return;
      try {
        const response = await fetch("/api/erp/workspace-state", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: scope.tenantId,
            userId: scope.userId,
            activeModule: state.activeModule,
            activeWorkspaceKey: state.activeWorkspaceKey,
            activeTab: state.activeTab,
            sidebarExpanded: state.sidebarExpanded,
            pinnedModules: state.pinnedModules,
            recentModules: state.recentModules,
            lastOpenedAt: state.lastOpenedAt,
          }),
        });
        markUnavailableOnNotFound(response);
      } catch {
        // Keep local persistence as the fallback source of truth.
      }
    },
    async logWorkspaceEvent(scope, state, eventType, meta) {
      if (!scope.tenantId || !canSync()) return;
      try {
        const response = await fetch("/api/erp/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: scope.tenantId,
            userId: scope.userId,
            moduleKey: state.activeModule,
            workspaceKey: state.activeWorkspaceKey,
            eventType,
            meta,
          }),
        });
        markUnavailableOnNotFound(response);
      } catch {
        // Analytics is best effort only.
      }
    },
  };
}

const erpRemoteSyncClient = createErpRemoteSyncClient();

export async function readServerState(scope: ErpRemoteSyncScope): Promise<ErpWorkspaceState | null> {
  return erpRemoteSyncClient.readWorkspaceState(scope);
}

export async function saveServerState(scope: ErpRemoteSyncScope, state: ErpWorkspaceState) {
  return erpRemoteSyncClient.saveWorkspaceState(scope, state);
}

async function logServerEvent(scope: ErpRemoteSyncScope, state: ErpWorkspaceState, eventType: string, meta?: Record<string, unknown>) {
  return erpRemoteSyncClient.logWorkspaceEvent(scope, state, eventType, meta);
}

function mergeState(base: ErpWorkspaceState, next: Partial<ErpWorkspaceState>): ErpWorkspaceState {
  return normalizeErpWorkspaceState({
    ...base,
    ...next,
  });
}

export const useErpWorkspace = create<ErpWorkspaceStore>((set, get) => ({
  hydrated: false,
  hydrationStatus: "idle",
  scope: { tenantId: null, userId: null },
  state: normalizeErpWorkspaceState(readErpWorkspaceSnapshot()),
  hydrate: async () => {
    set({ hydrationStatus: "loading" });
    try {
      const scope = await resolveTenantScope();
      const local = normalizeErpWorkspaceState(readErpWorkspaceSnapshot());
      const server = await readServerState(scope);
      const state = server ? normalizeErpWorkspaceState({ ...local, ...server }) : local;
      persistLocalState(state);
      set({ hydrated: true, hydrationStatus: "ready", scope, state });
    } catch {
      set({ hydrated: true, hydrationStatus: "error", state: normalizeErpWorkspaceState(readErpWorkspaceSnapshot()) });
    }
  },
  setSidebarExpanded: async (expanded) => {
    const next = resolveNextErpWorkspaceState(get().state, { sidebarExpanded: expanded });
    set({ state: next });
    persistLocalState(next);
    await saveServerState(get().scope, next);
    await logServerEvent(get().scope, next, expanded ? "sidebar-expand" : "sidebar-collapse", { sidebarExpanded: expanded });
  },
  pinModule: async (moduleKey) => {
    const current = get().state;
    if (current.pinnedModules.includes(moduleKey)) return get().unpinModule(moduleKey);
    const next = mergeState(current, { pinnedModules: [moduleKey, ...current.pinnedModules] });
    set({ state: next });
    persistLocalState(next);
    await saveServerState(get().scope, next);
    await logServerEvent(get().scope, next, "module-pin", { moduleKey });
  },
  unpinModule: async (moduleKey) => {
    const current = get().state;
    const next = mergeState(current, { pinnedModules: current.pinnedModules.filter((key) => key !== moduleKey) });
    set({ state: next });
    persistLocalState(next);
    await saveServerState(get().scope, next);
    await logServerEvent(get().scope, next, "module-unpin", { moduleKey });
  },
  switchModule: async (moduleKey, workspaceKey, tabKey, reason = "module-switch") => {
    const next = resolveNextErpWorkspaceState(get().state, {
      moduleKey,
      workspaceKey,
      tabKey,
    });
    set({ state: next });
    persistLocalState(next);
    await saveServerState(get().scope, next);
    await logServerEvent(get().scope, next, reason, { tabKey });
    return buildErpWorkspaceUrl(next.activeModule, next.activeWorkspaceKey, next.activeTab);
  },
  openLastWorkspace: async () => {
    const current = get().state;
    const lastModule = current.recentModules[0] ?? current.activeModule;
    const workspaceKey = resolveErpWorkspaceKey(lastModule, current.activeWorkspaceKey);
    const next = resolveNextErpWorkspaceState(current, {
      moduleKey: lastModule,
      workspaceKey,
      tabKey: current.activeTab,
    });
    set({ state: next });
    persistLocalState(next);
    await saveServerState(get().scope, next);
    await logServerEvent(get().scope, next, "open-last-workspace", { lastModule });
    return buildErpWorkspaceUrl(next.activeModule, next.activeWorkspaceKey, next.activeTab);
  },
  returnToDashboard: async () => {
    const next = mergeState(get().state, {});
    set({ state: next });
    persistLocalState(next);
    await saveServerState(get().scope, next);
    await logServerEvent(get().scope, next, "return-dashboard");
  },
  syncState: async (patch) => {
    const next = mergeState(get().state, patch);
    set({ state: next });
    persistLocalState(next);
    await saveServerState(get().scope, next);
  },
  clearLocalState: () => {
    clearErpWorkspaceSnapshot();
    set({ state: normalizeErpWorkspaceState({}) });
  },
}));
