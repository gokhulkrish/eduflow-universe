import { emitAppSync, subscribeAppSync } from "./app-sync";
import { coerceBoolean, coerceString, coerceStringArray, readStoredJson, writeStoredJson, removeStoredKey } from "./state-normalization";
import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "./supabase-health";
import { allModules, getModuleDefinition, type ModuleDefinition } from "@/lib/module-registry";
import { APP_ACCESS_RULES } from "@/lib/global-access-registry";

export interface ErpWorkspaceState {
  activeModule: string;
  activeWorkspaceKey: string;
  activeTab?: string;
  sidebarExpanded: boolean;
  lastOpenedAt?: string;
  pinnedModules: string[];
  recentModules: string[];
}

export interface ErpModuleDefinition {
  key: string;
  label: string;
  description?: string;
  icon?: string;
  workspaces: Array<{
    key: string;
    label: string;
    description?: string;
  }>;
}

export interface SwitchModuleInput {
  tenantId: string;
  userId?: string;
  moduleKey: string;
  workspaceKey: string;
  tabKey?: string;
  reason?: string;
}

export const ERP_WORKSPACE_STORAGE_KEY = "sms.erp.workspace.v1";
export const ERP_WORKSPACE_SYNC_KEYS = [ERP_WORKSPACE_STORAGE_KEY];

const DEFAULT_WORKSPACE_KEY = "overview";
const DEFAULT_RECENT_LIMIT = 8;

const ERP_MODULE_ROUTE_MAP: Record<string, string> = {
  admissions: "/admissions",
  administration: "/administration",
  academics: "/class-mgmt",
  alumni: "/alumni",
  assignments: "/assignments",
  attendance: "/attendance",
  certificates: "/certificates",
  chat: "/chat",
  collegeInfo: "/settings/institute",
  communication: "/comms",
  courseInfo: "/course-information",
  events: "/events",
  exams: "/exams",
  fees: "/fees",
  homework: "/homework",
  hostel: "/hostel",
  inventory: "/inventory",
  library: "/library",
  media: "/media",
  people: "/student-information",
  placement: "/placement",
  payroll: "/hr",
  quiz: "/quiz",
  reception: "/reception",
  reportsAnalytics: "/reports",
  scholarships: "/scholarship",
  settingsBackup: "/settings",
  system: "/system",
  taskManagement: "/tasks",
  timetable: "/timetable",
  transport: "/transport",
  userManagement: "/user-management",
  videoRooms: "/video-rooms",
};

const isBrowser = () => typeof window !== "undefined";

const humanize = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const uniqueStrings = (values: string[]) => Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

function getWorkspaceLabels(module: ModuleDefinition): Array<{ key: string; label: string; description?: string }> {
  const workspaceKeys = uniqueStrings([module.workspaceKey || DEFAULT_WORKSPACE_KEY, DEFAULT_WORKSPACE_KEY, ...module.submodules]);
  return workspaceKeys.map((key, index) => ({
    key,
    label: humanize(key),
    description:
      index === 0
        ? "Primary workspace"
        : key === DEFAULT_WORKSPACE_KEY
          ? "Workspace overview"
          : undefined,
  }));
}

export function buildErpModuleDefinitions(): ErpModuleDefinition[] {
  return allModules
    .filter((module) => module.launchType === "erp-workspace")
    .map((module) => ({
      key: module.key,
      label: module.label,
      description: module.description || module.domainLabel || module.category,
      icon: module.label.slice(0, 1).toUpperCase(),
      workspaces: getWorkspaceLabels(module),
    }));
}

export const erpModuleDefinitions = buildErpModuleDefinitions();

export function getErpModuleDefinition(moduleKey: string): ErpModuleDefinition | null {
  return erpModuleDefinitions.find((module) => module.key === moduleKey) ?? null;
}

export function getErpModuleRecord(moduleKey: string): ModuleDefinition | undefined {
  return getModuleDefinition(moduleKey);
}

export function resolveErpModuleRoute(moduleKey: string): string | null {
  return ERP_MODULE_ROUTE_MAP[moduleKey] ?? APP_ACCESS_RULES.find((rule) => rule.key === moduleKey && rule.path)?.path ?? null;
}

export function buildErpWorkspaceUrl(moduleKey: string, workspaceKey: string, tabKey?: string): string | null {
  const route = resolveErpModuleRoute(moduleKey);
  if (!route) return null;
  const params = new URLSearchParams();
  if (workspaceKey) params.set("workspace", workspaceKey);
  if (tabKey) params.set("tab", tabKey);
  const query = params.toString();
  return query ? `${route}?${query}` : route;
}

export function mergeRecentModules(current: string[] = [], moduleKey: string, limit = DEFAULT_RECENT_LIMIT): string[] {
  const next = uniqueStrings([moduleKey, ...current]);
  return next.slice(0, limit);
}

export function togglePinnedModule(current: string[] = [], moduleKey: string): string[] {
  if (!moduleKey) return uniqueStrings(current);
  return current.includes(moduleKey)
    ? current.filter((key) => key !== moduleKey)
    : uniqueStrings([moduleKey, ...current]);
}

export function resolveErpWorkspaceKey(moduleKey: string, requestedWorkspaceKey?: string): string {
  const definition = getErpModuleDefinition(moduleKey);
  const workspaces = definition?.workspaces ?? [];
  const candidate = coerceString(requestedWorkspaceKey, workspaces[0]?.key ?? DEFAULT_WORKSPACE_KEY);
  if (!candidate) return workspaces[0]?.key ?? DEFAULT_WORKSPACE_KEY;
  return workspaces.some((workspace) => workspace.key === candidate)
    ? candidate
    : workspaces[0]?.key ?? DEFAULT_WORKSPACE_KEY;
}

export function normalizeErpWorkspaceState(input: Partial<ErpWorkspaceState> | Record<string, unknown> = {}): ErpWorkspaceState {
  const data = input as Partial<ErpWorkspaceState> & Record<string, unknown>;
  const fallbackModule = erpModuleDefinitions[0]?.key ?? "home";
  const activeModule = coerceString(data.activeModule, fallbackModule);
  const resolvedWorkspaceKey = resolveErpWorkspaceKey(activeModule, data.activeWorkspaceKey);
  return {
    activeModule,
    activeWorkspaceKey: resolvedWorkspaceKey,
    activeTab: coerceString(data.activeTab) || undefined,
    sidebarExpanded: coerceBoolean(data.sidebarExpanded, true),
    lastOpenedAt: coerceString(data.lastOpenedAt) || new Date().toISOString(),
    pinnedModules: uniqueStrings(coerceStringArray(data.pinnedModules)),
    recentModules: uniqueStrings(coerceStringArray(data.recentModules)),
  };
}

export function resolveNextErpWorkspaceState(
  current: ErpWorkspaceState,
  input: Partial<SwitchModuleInput> & {
    sidebarExpanded?: boolean;
    pinnedModules?: string[];
    recentModules?: string[];
  } = {},
): ErpWorkspaceState {
  const moduleKey = coerceString(input.moduleKey, current.activeModule || erpModuleDefinitions[0]?.key || "home");
  const activeModule = getErpModuleDefinition(moduleKey)?.key ?? moduleKey;
  const activeWorkspaceKey = resolveErpWorkspaceKey(activeModule, input.workspaceKey ?? current.activeWorkspaceKey);
  const recentModules = mergeRecentModules(input.recentModules ?? current.recentModules, activeModule);

  return normalizeErpWorkspaceState({
    activeModule,
    activeWorkspaceKey,
    activeTab: input.tabKey ?? current.activeTab,
    sidebarExpanded: input.sidebarExpanded ?? current.sidebarExpanded,
    lastOpenedAt: new Date().toISOString(),
    pinnedModules: uniqueStrings(input.pinnedModules ?? current.pinnedModules),
    recentModules,
  });
}

export function readErpWorkspaceSnapshot(): ErpWorkspaceState {
  return normalizeErpWorkspaceState(readStoredJson<Partial<ErpWorkspaceState>>(ERP_WORKSPACE_STORAGE_KEY, {}));
}

export function writeErpWorkspaceSnapshot(snapshot: ErpWorkspaceState) {
  if (!isBrowser()) return;
  writeStoredJson(ERP_WORKSPACE_STORAGE_KEY, snapshot);
  emitAppSync(ERP_WORKSPACE_STORAGE_KEY);
}

export function clearErpWorkspaceSnapshot() {
  removeStoredKey(ERP_WORKSPACE_STORAGE_KEY);
  emitAppSync(ERP_WORKSPACE_STORAGE_KEY);
}

export function subscribeErpWorkspace(listener: () => void) {
  return subscribeAppSync(ERP_WORKSPACE_SYNC_KEYS, listener);
}

async function getDefaultInstitutionId(): Promise<string | null> {
  if (!(await tableExists("institutions"))) return null;
  const { data, error } = await supabase
    .from("institutions")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function resolveErpWorkspaceScope(): Promise<{ tenantId: string | null; userId: string | null }> {
  const [{ data: authData }, tenantId] = await Promise.all([
    supabase.auth.getUser(),
    getDefaultInstitutionId(),
  ]);

  return {
    tenantId,
    userId: authData.user?.id ?? null,
  };
}
