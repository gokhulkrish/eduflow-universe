import "@/lib/runtime-storage";
import "@/lib/runtime-storage";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import type {
  CapabilityLevel,
  CapabilityMatrixModel,
  CapabilityModuleSummary,
  CapabilityRoleSummary,
} from "./capability-matrix";

export const CAPABILITY_RUNTIME_STORAGE_KEY = "sms.capability-runtime.v1";
const CAPABILITY_RUNTIME_SYNC_KEYS = [CAPABILITY_RUNTIME_STORAGE_KEY];

export type CapabilityRuntimeSource = "manual" | "injected" | "derived";

export interface CapabilityRuntimeOverride {
  moduleKey: string;
  level: CapabilityLevel;
  label: string;
  reason: string;
  source: CapabilityRuntimeSource;
  updatedAt: string;
}

export interface CapabilityRuntimeSnapshot {
  updatedAt: string;
  overrides: CapabilityRuntimeOverride[];
}

export interface CapabilityRuntimeOverrideInput {
  moduleKey: string;
  level: CapabilityLevel;
  label?: string;
  reason?: string;
  source?: CapabilityRuntimeSource;
}

export interface CapabilitySystemBadge {
  key: string;
  label: string;
  value: string;
  detail: string;
  level: CapabilityLevel;
  kind: "module" | "role";
}

const readStoredJson = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStoredJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeStoredKey = (key: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};

const clean = (value: unknown) => String(value ?? "").trim();

const levelRank = (level: CapabilityLevel) =>
  ["none", "view", "create", "edit", "approve", "delete", "export", "manage"].indexOf(level);

const normalizeLevel = (value: unknown): CapabilityLevel =>
  value === "view" || value === "create" || value === "edit" || value === "approve" || value === "delete" || value === "export" || value === "manage"
    ? value
    : "none";

const normalizeOverride = (override: Partial<CapabilityRuntimeOverride> & Pick<CapabilityRuntimeOverride, "moduleKey" | "level">): CapabilityRuntimeOverride => ({
  moduleKey: clean(override.moduleKey),
  level: normalizeLevel(override.level),
  label: clean(override.label) || clean(override.moduleKey),
  reason: clean(override.reason),
  source: override.source === "manual" || override.source === "injected" || override.source === "derived" ? override.source : "manual",
  updatedAt: clean(override.updatedAt) || new Date().toISOString(),
});

function normalizeSnapshot(input: Partial<CapabilityRuntimeSnapshot>): CapabilityRuntimeSnapshot {
  const overrides = Array.isArray(input.overrides)
    ? input.overrides
        .map((override) => normalizeOverride(override as CapabilityRuntimeOverride))
        .filter((override) => Boolean(override.moduleKey))
    : [];

  return {
    updatedAt: clean(input.updatedAt) || new Date().toISOString(),
    overrides,
  };
}

function persistSnapshot(snapshot: CapabilityRuntimeSnapshot): CapabilityRuntimeSnapshot {
  writeStoredJson(CAPABILITY_RUNTIME_STORAGE_KEY, snapshot);
  emitAppSync(CAPABILITY_RUNTIME_STORAGE_KEY);
  return snapshot;
}

export function getCapabilityRuntimeSnapshot(): CapabilityRuntimeSnapshot {
  return normalizeSnapshot(readStoredJson<Partial<CapabilityRuntimeSnapshot>>(CAPABILITY_RUNTIME_STORAGE_KEY, {}));
}

export function subscribeCapabilityRuntime(listener: () => void): () => void {
  return subscribeAppSync(CAPABILITY_RUNTIME_SYNC_KEYS, listener);
}

export function clearCapabilityRuntimeOverrides(): void {
  removeStoredKey(CAPABILITY_RUNTIME_STORAGE_KEY);
  emitAppSync(CAPABILITY_RUNTIME_STORAGE_KEY);
}

export function setCapabilityRuntimeOverride(input: CapabilityRuntimeOverrideInput): CapabilityRuntimeSnapshot {
  const current = getCapabilityRuntimeSnapshot();
  const updatedAt = new Date().toISOString();
  const nextOverride = normalizeOverride({
    moduleKey: input.moduleKey,
    level: input.level,
    label: input.label ?? input.moduleKey,
    reason: input.reason ?? "",
    source: input.source ?? "manual",
    updatedAt,
  });

  const overrides = current.overrides.filter((override) => override.moduleKey !== nextOverride.moduleKey);
  overrides.unshift(nextOverride);
  return persistSnapshot({ updatedAt, overrides });
}

export function setCapabilityRuntimeOverrides(inputs: CapabilityRuntimeOverrideInput[]): CapabilityRuntimeSnapshot {
  const updatedAt = new Date().toISOString();
  const overrides = inputs
    .map((input) =>
      normalizeOverride({
        moduleKey: input.moduleKey,
        level: input.level,
        label: input.label ?? input.moduleKey,
        reason: input.reason ?? "",
        source: input.source ?? "injected",
        updatedAt,
      }),
    )
    .filter((override) => Boolean(override.moduleKey));

  return persistSnapshot({ updatedAt, overrides });
}

export function clearCapabilityRuntimeOverride(moduleKey: string): CapabilityRuntimeSnapshot {
  const current = getCapabilityRuntimeSnapshot();
  const updatedAt = new Date().toISOString();
  const overrides = current.overrides.filter((override) => override.moduleKey !== clean(moduleKey));
  return persistSnapshot({ updatedAt, overrides });
}

export function resolveCapabilityRuntimeLevel(moduleKey: string): CapabilityLevel {
  const override = getCapabilityRuntimeSnapshot().overrides.find((item) => item.moduleKey === clean(moduleKey));
  return override?.level ?? "none";
}

export function getCapabilityRuntimeOverride(moduleKey: string): CapabilityRuntimeOverride | null {
  return getCapabilityRuntimeSnapshot().overrides.find((item) => item.moduleKey === clean(moduleKey)) ?? null;
}

export function isCapabilityRuntimeEnabled(moduleKey: string, required: CapabilityLevel = "view"): boolean {
  const level = resolveCapabilityRuntimeLevel(moduleKey);
  return levelRank(level) >= levelRank(required);
}

const getModuleTone = (level: CapabilityLevel) => {
  if (level === "manage") return "bg-gradient-primary text-primary-foreground";
  if (level === "delete") return "bg-destructive/15 text-destructive";
  if (level === "approve") return "bg-accent/20 text-accent-foreground";
  if (level === "edit") return "bg-warning/15 text-warning";
  if (level === "create") return "bg-success/15 text-success";
  if (level === "view") return "bg-primary/15 text-primary";
  return "bg-muted text-muted-foreground";
};

export function buildCapabilitySystemBadges(model: CapabilityMatrixModel): CapabilitySystemBadge[] {
  const moduleBadges = model.groups.map((group) => ({
    key: `module:${group.moduleKey}`,
    label: group.label,
    value: `${group.grantedCount}/${group.permissionCount}`,
    detail: `${group.highestLevel} · ${group.dirtyCount} dirty`,
    level: group.highestLevel,
    kind: "module" as const,
  }));

  const roleBadges = model.roleSummaries.map((roleSummary) => ({
    key: `role:${roleSummary.role}`,
    label: String(roleSummary.role).replace(/[_-]+/g, " "),
    value: `${roleSummary.grantedCount}`,
    detail: `${roleSummary.dirtyCount} dirty cells`,
    level: roleSummary.highestLevel,
    kind: "role" as const,
  }));

  return [...moduleBadges, ...roleBadges].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "module" ? -1 : 1;
    if (right.level !== left.level) return levelRank(right.level) - levelRank(left.level);
    return left.label.localeCompare(right.label);
  });
}

export function buildCapabilityRuntimeBadgeClass(level: CapabilityLevel): string {
  return getModuleTone(level);
}

export function summarizeCapabilityRuntime(model: CapabilityMatrixModel) {
  const badges = buildCapabilitySystemBadges(model);
  const overrides = getCapabilityRuntimeSnapshot().overrides;
  return {
    badges,
    overrides,
    moduleCount: model.summary.moduleCount,
    roleCount: model.summary.roleCount,
    assignedCount: model.summary.assignedCount,
    dirtyCount: model.summary.dirtyCount,
    overrideCount: overrides.length,
    enabledOverrideCount: overrides.filter((override) => override.level !== "none").length,
  };
}
