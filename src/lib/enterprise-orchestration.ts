import { emitAppSync, subscribeAppSync } from "./app-sync";
import { runSingletonEffect } from "./module-deduplication";
import { buildDuplicationReport } from "./duplication-report";
import { buildLegacyAdapterReport, LEGACY_ADAPTER_SYNC_KEY } from "./legacy-adapter";
import { buildMigrationRegistrySnapshot } from "./migration-registry";
import { getMigrationRuntimeSnapshot } from "./migrationRuntime";
import { getRuntimeDiagnostics, RUNTIME_DIAGNOSTICS_STORAGE_KEY } from "./runtime-diagnostics";
import { buildStorageOwnershipReport } from "./storage-registry";
import { getShellRuntimeSnapshot, SHELL_RUNTIME_STORAGE_KEY } from "./shell-runtime";
import { THEME_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY } from "./theme-runtime";
import { MIGRATION_FLAGS_STORAGE_KEY } from "./featureFlags";
import { MIGRATION_ROLLBACK_STORAGE_KEY } from "./rollbackRegistry";
import { GROUP_MODEL_STORAGE_KEY } from "./group-model";
import { importStorageKeys } from "./student-import";
import { getMobileShellSnapshot, MOBILE_SHELL_RUNTIME_SYNC_KEY } from "./mobile-shell";
import { moduleConfigs } from "@/pages/module-configs";
import { registryStorageKey, instituteRegistryStorageKey } from "./header-registry";

export type OrchestrationHealth = "healthy" | "watch" | "blocked";
export type EnterpriseOrchestrationScope = "global" | "workspace" | "erp" | "registry" | "diagnostics";

export interface EnterpriseOrchestrationEventDetail {
  scope: EnterpriseOrchestrationScope;
  reason: string;
  signal: string;
  createdAt: string;
}

export interface OrchestrationChannel {
  key: string;
  label: string;
  status: OrchestrationHealth;
  detail: string;
}

export interface EnterpriseOrchestrationSnapshot {
  generatedAt: string;
  health: OrchestrationHealth;
  channels: OrchestrationChannel[];
  summary: {
    modules: number;
    domains: number;
    activePatches: number;
    rollbackArmed: number;
    diagnostics: number;
    storageNamespaces: number;
    duplicateFindings: number;
    routeAliases: number;
    workspaceConfigs: number;
    erpModules: number;
    syncTargets: number;
    signals: number;
    lastScope: EnterpriseOrchestrationScope;
    lastReason: string;
  };
}

export const ENTERPRISE_ORCHESTRATION_SYNC_KEY = "sms.enterprise-orchestration.v1";
export const ENTERPRISE_ORCHESTRATION_EVENT_TYPE = "sms:enterprise-orchestration-event";

const ORCHESTRATION_SYNC_KEYS = [
  SHELL_RUNTIME_STORAGE_KEY,
  MOBILE_SHELL_RUNTIME_SYNC_KEY,
  THEME_STORAGE_KEY,
  LEGACY_THEME_STORAGE_KEY,
  MIGRATION_FLAGS_STORAGE_KEY,
  MIGRATION_ROLLBACK_STORAGE_KEY,
  GROUP_MODEL_STORAGE_KEY,
  RUNTIME_DIAGNOSTICS_STORAGE_KEY,
  registryStorageKey,
  instituteRegistryStorageKey,
  importStorageKeys.customFields,
  importStorageKeys.profiles,
  LEGACY_ADAPTER_SYNC_KEY,
];

const ORCHESTRATION_SCOPE_SYNC_KEYS: Record<EnterpriseOrchestrationScope, string[]> = {
  global: ORCHESTRATION_SYNC_KEYS,
  workspace: [
    SHELL_RUNTIME_STORAGE_KEY,
    MOBILE_SHELL_RUNTIME_SYNC_KEY,
    GROUP_MODEL_STORAGE_KEY,
    LEGACY_ADAPTER_SYNC_KEY,
    ENTERPRISE_ORCHESTRATION_SYNC_KEY,
  ],
  erp: [
    MIGRATION_FLAGS_STORAGE_KEY,
    MIGRATION_ROLLBACK_STORAGE_KEY,
    registryStorageKey,
    instituteRegistryStorageKey,
    importStorageKeys.customFields,
    importStorageKeys.profiles,
    ENTERPRISE_ORCHESTRATION_SYNC_KEY,
  ],
  registry: [
    registryStorageKey,
    instituteRegistryStorageKey,
    importStorageKeys.customFields,
    importStorageKeys.profiles,
    ENTERPRISE_ORCHESTRATION_SYNC_KEY,
  ],
  diagnostics: [
    RUNTIME_DIAGNOSTICS_STORAGE_KEY,
    ENTERPRISE_ORCHESTRATION_SYNC_KEY,
  ],
};

const ORCHESTRATION_SUBSCRIPTION_KEYS = [
  ...new Set([
    ...ORCHESTRATION_SYNC_KEYS,
    ...Object.values(ORCHESTRATION_SCOPE_SYNC_KEYS).reduce<string[]>((all, keys) => all.concat(keys), []),
  ]),
];

const rollUpHealth = (statuses: OrchestrationHealth[]) => {
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.includes("watch")) return "watch";
  return "healthy";
};

let orchestrationSignals = 0;
let lastBroadcastScope: EnterpriseOrchestrationScope = "global";
let lastBroadcastReason = "bootstrap";

interface EnterpriseOrchestrationSources {
  migration: ReturnType<typeof getMigrationRuntimeSnapshot>;
  registry: ReturnType<typeof buildMigrationRegistrySnapshot>;
  diagnostics: ReturnType<typeof getRuntimeDiagnostics>;
  storage: ReturnType<typeof buildStorageOwnershipReport>;
  duplication: ReturnType<typeof buildDuplicationReport>;
  legacy: ReturnType<typeof buildLegacyAdapterReport>;
  shell: ReturnType<typeof getShellRuntimeSnapshot>;
  mobile: ReturnType<typeof getMobileShellSnapshot>;
}

function collectEnterpriseOrchestrationSources(): EnterpriseOrchestrationSources {
  return {
    migration: getMigrationRuntimeSnapshot(),
    registry: buildMigrationRegistrySnapshot(),
    diagnostics: getRuntimeDiagnostics(),
    storage: buildStorageOwnershipReport(),
    duplication: buildDuplicationReport(),
    legacy: buildLegacyAdapterReport(),
    shell: getShellRuntimeSnapshot(),
    mobile: getMobileShellSnapshot(),
  };
}

function buildChannels(sources: EnterpriseOrchestrationSources): OrchestrationChannel[] {
  const { migration, registry, diagnostics, storage, duplication, legacy, shell, mobile } = sources;

  return [
    {
      key: "bus",
      label: "Runtime event bus",
      status: orchestrationSignals > 0 ? "healthy" : "watch",
      detail: `${orchestrationSignals} orchestration signal${orchestrationSignals === 1 ? "" : "s"} · last ${lastBroadcastScope} (${lastBroadcastReason})`,
    },
    {
      key: "shell",
      label: "Shell runtime",
      status: shell.focusMode === "deep" ? "watch" : "healthy",
      detail: `${shell.layoutMode} layout · ${shell.focusMode} mode · ${shell.theme} theme`,
    },
    {
      key: "migration",
      label: "Migration runtime",
      status: migration.summary.rollbackActive > 0 ? "watch" : migration.summary.active > 0 ? "healthy" : "watch",
      detail: `${migration.summary.active}/${migration.summary.total} patches ready · ${migration.summary.rollbackActive} rollback armed`,
    },
    {
      key: "registry",
      label: "Registry sync",
      status: registry.collisions.length > 0 ? "blocked" : registry.gapAnalysis.length > 0 ? "watch" : "healthy",
      detail: `${registry.summary.totalModules} modules · ${registry.summary.domains} domains · ${registry.summary.collisions} collisions`,
    },
    {
      key: "diagnostics",
      label: "Global diagnostics",
      status: diagnostics.entries.some((entry) => entry.kind === "error" && !entry.recoverable) ? "blocked" : diagnostics.entries.length > 0 ? "watch" : "healthy",
      detail: `${diagnostics.entries.length} entries currently buffered`,
    },
    {
      key: "storage",
      label: "Storage ownership",
      status: duplication.summary.duplicateStorageKeys > 0 ? "blocked" : storage.some((namespace) => namespace.missingKeys.length > 0) ? "watch" : "healthy",
      detail: `${storage.length} namespaces · ${duplication.summary.duplicateStorageKeys} duplicate keys`,
    },
    {
      key: "legacy",
      label: "Legacy bridge",
      status: legacy.seededStorageAliases > 0 ? "watch" : "healthy",
      detail: `${legacy.routeAliases} route aliases · ${legacy.storageAliases} storage aliases`,
    },
    {
      key: "mobile",
      label: "Mobile shell",
      status: mobile.overflowLocked ? "watch" : "healthy",
      detail: `${mobile.viewportWidth}x${mobile.viewportHeight} · ${mobile.isMobile ? "mobile" : "desktop"}`,
    },
  ];
}

export function getEnterpriseOrchestrationSnapshot(): EnterpriseOrchestrationSnapshot {
  const sources = collectEnterpriseOrchestrationSources();
  const channels = buildChannels(sources);
  const { migration, registry, diagnostics, storage, duplication, legacy } = sources;
  const erpModules = Object.keys(moduleConfigs).length;
  const syncTargets = new Set([
    ...ORCHESTRATION_SYNC_KEYS,
    ...Object.values(ORCHESTRATION_SCOPE_SYNC_KEYS).flat(),
  ]).size;

  return {
    generatedAt: new Date().toISOString(),
    health: rollUpHealth(channels.map((channel) => channel.status)),
    channels,
    summary: {
      modules: registry.summary.totalModules,
      domains: registry.summary.domains,
      activePatches: migration.summary.active,
      rollbackArmed: migration.summary.rollbackActive,
      diagnostics: diagnostics.entries.length,
      storageNamespaces: storage.length,
      duplicateFindings: duplication.summary.totalFindings,
      routeAliases: legacy.routeAliases,
      workspaceConfigs: Object.keys(moduleConfigs).length,
      erpModules,
      syncTargets,
      signals: orchestrationSignals,
      lastScope: lastBroadcastScope,
      lastReason: lastBroadcastReason,
    },
  };
}

export function buildEnterpriseOrchestrationSnapshot(): EnterpriseOrchestrationSnapshot {
  return getEnterpriseOrchestrationSnapshot();
}

export function subscribeEnterpriseOrchestration(listener: () => void) {
  return subscribeAppSync(ORCHESTRATION_SUBSCRIPTION_KEYS, listener);
}

export function subscribeEnterpriseOrchestrationEvents(listener: (detail: EnterpriseOrchestrationEventDetail) => void) {
  if (typeof window === "undefined") return () => {};

  const handleEvent = (event: Event) => {
    const detail = (event as CustomEvent<EnterpriseOrchestrationEventDetail>).detail;
    if (!detail?.scope) return;
    listener(detail);
  };

  window.addEventListener(ENTERPRISE_ORCHESTRATION_EVENT_TYPE, handleEvent as EventListener);

  return () => {
    window.removeEventListener(ENTERPRISE_ORCHESTRATION_EVENT_TYPE, handleEvent as EventListener);
  };
}

export function broadcastEnterpriseOrchestration(
  scope: EnterpriseOrchestrationScope = "global",
  reason = "manual broadcast",
) {
  if (typeof window !== "undefined") {
    const detail: EnterpriseOrchestrationEventDetail = {
      scope,
      reason,
      signal: `${scope}:${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
    };
    window.dispatchEvent(new CustomEvent<EnterpriseOrchestrationEventDetail>(ENTERPRISE_ORCHESTRATION_EVENT_TYPE, { detail }));
  }

  for (const key of ORCHESTRATION_SCOPE_SYNC_KEYS[scope] ?? ORCHESTRATION_SYNC_KEYS) {
    emitAppSync(key);
  }

  orchestrationSignals += 1;
  lastBroadcastScope = scope;
  lastBroadcastReason = reason;
  emitAppSync(ENTERPRISE_ORCHESTRATION_SYNC_KEY);
  return getEnterpriseOrchestrationSnapshot();
}

export function resetEnterpriseOrchestrationRuntime() {
  orchestrationSignals = 0;
  lastBroadcastScope = "global";
  lastBroadcastReason = "bootstrap";
}

export function bootstrapEnterpriseOrchestration() {
  runSingletonEffect("bootstrap:enterprise-orchestration", "Enterprise orchestration bus", "utility", () => undefined);
  return broadcastEnterpriseOrchestration("global", "bootstrap");
}
