import legacyInventoryText from "../../INVENTORY.md?raw";

import { buildDuplicationReport } from "./duplication-report";
import { buildEnterpriseOrchestrationSnapshot } from "./enterprise-orchestration";
import { buildLegacyAdapterReport, LEGACY_ROUTE_ALIASES } from "./legacy-adapter";
import { getImportEngineRuntimeSnapshot } from "./import-engine/runtime";
import { buildMigrationRegistrySnapshot } from "./migration-registry";
import { getMigrationRuntimeSnapshot } from "./migrationRuntime";
import { getRuntimeHardeningSnapshot } from "./runtime-hardening";
import { loadRollbackSnapshot } from "./rollbackRegistry";
import { buildStorageOwnershipReport } from "./storage-registry";
import { moduleConfigs } from "@/pages/module-configs";

export type MigrationCertificationStatus = "certified" | "conditional" | "blocked";
export type MigrationParityStatus = "healthy" | "watch" | "blocked";

export interface LegacyInventoryEntry {
  key: string;
  label: string;
  status: string;
  sourceLine: string;
}

export interface CertificationFlowParity {
  total: number;
  healthy: number;
  watch: number;
  blocked: number;
  coverage: number;
  status: MigrationParityStatus;
  flows: Array<{
    key: string;
    label: string;
    status: MigrationParityStatus;
    detail: string;
  }>;
}

export interface CertificationOrchestrationParity {
  channels: number;
  healthy: number;
  watch: number;
  blocked: number;
  signals: number;
  syncTargets: number;
  status: MigrationParityStatus;
}

export interface CertificationRollbackReadiness {
  totalPatches: number;
  ready: number;
  armed: number;
  defaultDisabled: number;
  status: MigrationParityStatus;
}

export interface MigrationCertificationReport {
  generatedAt: string;
  status: MigrationCertificationStatus;
  summary: {
    legacyInventory: number;
    matchedLegacyInventory: number;
    unmatchedLegacyInventory: number;
    legacyCoverage: number;
    currentModules: number;
    bridgeModules: number;
    diagnostics: number;
    duplicateFindings: number;
    storageNamespaces: number;
    runtimeFlows: number;
    healthyRuntimeFlows: number;
    orchestrationChannels: number;
    rollbackReady: number;
    blockers: number;
    orphanedSystems: number;
    duplicateRuntimeOwnership: number;
  };
  flowParity: CertificationFlowParity;
  orchestrationParity: CertificationOrchestrationParity;
  rollbackReadiness: CertificationRollbackReadiness;
  blockers: string[];
  orphanedSystems: string[];
  duplicateRuntimeOwnership: string[];
  matchedLegacyKeys: string[];
  unmatchedLegacyKeys: string[];
  evidence: string[];
}

const normalizeToken = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

function stripTicks(value: string): string {
  return value.replace(/^`+|`+$/g, "").trim();
}

export function parseLegacyInventory(text = legacyInventoryText): LegacyInventoryEntry[] {
  const entries: LegacyInventoryEntry[] = [];
  let inModules = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "## [MODULES]") {
      inModules = true;
      continue;
    }
    if (inModules && line.startsWith("## [FIELD_TABLES]")) {
      break;
    }
    if (!inModules || !line.startsWith("|")) continue;
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;

    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    entries.push({
      key: stripTicks(cells[1] ?? ""),
      label: stripTicks(cells[2] ?? ""),
      status: stripTicks(cells[3] ?? ""),
      sourceLine: stripTicks(cells[cells.length - 1] ?? ""),
    });
  }

  return entries;
}

function collectCurrentTokens() {
  const registry = buildMigrationRegistrySnapshot();
  const tokens = new Set<string>();

  for (const module of registry.modules) {
    [
      module.key,
      module.label,
      module.route,
      module.moduleKey,
      module.workspaceKey,
      module.sectionId,
      module.renderer,
      module.domainKey,
      module.domainLabel,
    ]
      .filter(Boolean)
      .forEach((value) => tokens.add(normalizeToken(String(value))));
  }

  for (const [key, config] of Object.entries(moduleConfigs)) {
    tokens.add(normalizeToken(key));
    tokens.add(normalizeToken(config.title));
    tokens.add(normalizeToken(config.subtitle));
  }

  for (const [legacy, modern] of Object.entries(LEGACY_ROUTE_ALIASES)) {
    tokens.add(normalizeToken(legacy));
    tokens.add(normalizeToken(modern));
  }

  return tokens;
}

function matchesLegacyEntry(entry: LegacyInventoryEntry, currentTokens: Set<string>): boolean {
  const keyToken = normalizeToken(entry.key);
  const labelToken = normalizeToken(entry.label);
  return currentTokens.has(keyToken) || currentTokens.has(labelToken);
}

function determineParityStatus(healthy: number, watch: number, blocked: number): MigrationParityStatus {
  if (blocked > 0) return "blocked";
  if (watch > 0) return "watch";
  return healthy > 0 ? "healthy" : "watch";
}

export function buildMigrationCertificationReport(): MigrationCertificationReport {
  const legacyInventory = parseLegacyInventory();
  const currentTokens = collectCurrentTokens();
  const matchedEntries = legacyInventory.filter((entry) => matchesLegacyEntry(entry, currentTokens));
  const unmatchedEntries = legacyInventory.filter((entry) => !matchesLegacyEntry(entry, currentTokens));

  const duplication = buildDuplicationReport();
  const storage = buildStorageOwnershipReport();
  const orchestration = buildEnterpriseOrchestrationSnapshot();
  const hardening = getRuntimeHardeningSnapshot();
  const legacy = buildLegacyAdapterReport();
  const registry = buildMigrationRegistrySnapshot();
  const runtime = getMigrationRuntimeSnapshot();
  const importRuntime = getImportEngineRuntimeSnapshot();
  const rollbackSnapshot = loadRollbackSnapshot();

  const flowChecks = [
    runtime.summary.active > 0
      ? {
          key: "migration-runtime",
          label: "Migration runtime",
          status: "healthy" as const,
          detail: `${runtime.summary.active}/${runtime.summary.total} patches ready · ${runtime.summary.rollbackActive} rollback armed`,
        }
      : {
          key: "migration-runtime",
          label: "Migration runtime",
          status: "watch" as const,
          detail: `No migration patches are currently ready; ${runtime.summary.rollbackActive} rollback(s) remain armed.`,
        },
    orchestration.health === "blocked"
      ? {
          key: "orchestration",
          label: "Orchestration parity",
          status: "blocked" as const,
          detail: `${orchestration.channels.length} channels tracked · ${orchestration.summary.signals} orchestration signal(s) observed`,
        }
      : orchestration.summary.signals > 0
        ? {
            key: "orchestration",
            label: "Orchestration parity",
            status: "healthy" as const,
            detail: `${orchestration.channels.length} channels tracked · ${orchestration.summary.signals} orchestration signal(s) observed`,
          }
        : {
            key: "orchestration",
            label: "Orchestration parity",
            status: "watch" as const,
            detail: `${orchestration.channels.length} channels tracked but no orchestration signal has been emitted yet.`,
          },
    hardening.summary.blocked > 0
      ? {
          key: "hardening",
          label: "Hardening suite",
          status: "blocked" as const,
          detail: `${hardening.summary.blocked} hardening check(s) are blocked.`,
        }
      : hardening.summary.watch > 0
        ? {
            key: "hardening",
            label: "Hardening suite",
            status: "watch" as const,
            detail: `${hardening.summary.pass}/${hardening.summary.checks} hardening checks passing.`,
          }
        : {
            key: "hardening",
            label: "Hardening suite",
            status: "healthy" as const,
            detail: `${hardening.summary.pass}/${hardening.summary.checks} hardening checks passing.`,
          },
    importRuntime.initError
      ? {
          key: "import-runtime",
          label: "Import flow",
          status: "blocked" as const,
          detail: importRuntime.initError,
        }
      : importRuntime.initializing
        ? {
            key: "import-runtime",
            label: "Import flow",
            status: "watch" as const,
            detail: "Import engine is still initializing.",
          }
        : {
            key: "import-runtime",
            label: "Import flow",
            status: "healthy" as const,
            detail: `${importRuntime.cacheSize} cached parse entr${importRuntime.cacheSize === 1 ? "y" : "ies"} tracked.`,
          },
    duplication.summary.registryCollisions > 0 || duplication.summary.duplicateStorageKeys > 0
      ? {
          key: "ownership",
          label: "Runtime ownership",
          status: "blocked" as const,
          detail: `${duplication.summary.registryCollisions} registry collision(s) and ${duplication.summary.duplicateStorageKeys} duplicate storage key(s) detected.`,
        }
      : storage.some((namespace) => namespace.missingKeys.length > 0)
        ? {
            key: "ownership",
            label: "Runtime ownership",
            status: "watch" as const,
            detail: "Some storage namespaces still have missing keys.",
          }
        : {
            key: "ownership",
            label: "Runtime ownership",
            status: "healthy" as const,
            detail: "No duplicate ownership or storage collisions remain.",
          },
    runtime.summary.rollbackActive > 0 || Object.values(rollbackSnapshot.rollbacks).some((record) => record.active)
      ? {
          key: "rollback",
          label: "Rollback readiness",
          status: "watch" as const,
          detail: `${runtime.summary.rollbackActive} rollback(s) armed across ${runtime.summary.total} migration patch(es).`,
        }
      : {
          key: "rollback",
          label: "Rollback readiness",
          status: "healthy" as const,
          detail: "No active rollbacks remain in the runtime registry.",
        },
  ];

  const healthyFlows = flowChecks.filter((flow) => flow.status === "healthy").length;
  const watchFlows = flowChecks.filter((flow) => flow.status === "watch").length;
  const blockedFlows = flowChecks.filter((flow) => flow.status === "blocked").length;
  const flowParity: CertificationFlowParity = {
    total: flowChecks.length,
    healthy: healthyFlows,
    watch: watchFlows,
    blocked: blockedFlows,
    coverage: flowChecks.length ? (healthyFlows + watchFlows) / flowChecks.length : 1,
    status: determineParityStatus(healthyFlows, watchFlows, blockedFlows),
    flows: flowChecks,
  };

  const orchestrationHealthy = orchestration.channels.filter((channel) => channel.status === "healthy").length;
  const orchestrationWatch = orchestration.channels.filter((channel) => channel.status === "watch").length;
  const orchestrationBlocked = orchestration.channels.filter((channel) => channel.status === "blocked").length;
  const orchestrationParity: CertificationOrchestrationParity = {
    channels: orchestration.channels.length,
    healthy: orchestrationHealthy,
    watch: orchestrationWatch,
    blocked: orchestrationBlocked,
    signals: orchestration.summary.signals,
    syncTargets: orchestration.summary.syncTargets,
    status: determineParityStatus(orchestrationHealthy, orchestrationWatch, orchestrationBlocked),
  };

  const rollbackReady = runtime.patches.filter((patch) => patch.ready).length;
  const rollbackArmed = runtime.summary.rollbackActive;
  const rollbackReadiness: CertificationRollbackReadiness = {
    totalPatches: runtime.summary.total,
    ready: rollbackReady,
    armed: rollbackArmed,
    defaultDisabled: runtime.patches.filter((patch) => !patch.defaultEnabled).length,
    status: rollbackArmed > 0 ? "watch" : rollbackReady === runtime.summary.total ? "healthy" : "watch",
  };

  const orphanedSystems = unmatchedEntries.map((entry) => `${entry.key} · ${entry.label}`);

  const duplicateRuntimeOwnership = [
    ...registry.collisions.map((collision) => `${collision.scope} collision · ${collision.key}`),
    ...duplication.findings
      .filter((finding) => finding.kind === "storage" && finding.count > 0)
      .map((finding) => `${finding.title} · ${finding.count}`),
  ];

  const blockers: string[] = [];
  if (duplication.summary.registryCollisions > 0) blockers.push(`${duplication.summary.registryCollisions} registry collision(s) remain`);
  if (duplication.summary.duplicateStorageKeys > 0) blockers.push(`${duplication.summary.duplicateStorageKeys} storage key duplication(s) remain`);
  if (orchestration.health === "blocked") blockers.push("enterprise orchestration is blocked");
  if (hardening.summary.blocked > 0) blockers.push(`${hardening.summary.blocked} hardening check(s) are blocked`);
  if (flowParity.blocked > 0) blockers.push(`${flowParity.blocked} runtime flow(s) are blocked`);
  if (orphanedSystems.length > 0) blockers.push(`${orphanedSystems.length} orphaned runtime system(s) remain`);
  if (duplicateRuntimeOwnership.length > 0) blockers.push(`${duplicateRuntimeOwnership.length} duplicate runtime ownership issue(s) remain`);
  if (rollbackReadiness.armed > 0) blockers.push(`${rollbackReadiness.armed} rollback(s) are still armed`);
  if (importRuntime.initError) blockers.push("import runtime initialization failed");

  const legacyCoverage = legacyInventory.length ? matchedEntries.length / legacyInventory.length : 1;
  const hasCriticalBlockers =
    blockers.length > 0 ||
    legacyCoverage < 0.75 ||
    flowParity.blocked > 0 ||
    orchestrationParity.blocked > 0 ||
    hardening.summary.blocked > 0 ||
    rollbackReadiness.armed > 0;
  const status: MigrationCertificationStatus =
    hasCriticalBlockers
      ? "blocked"
      : legacyCoverage >= 0.95 &&
          flowParity.coverage >= 0.85 &&
          orchestrationParity.blocked === 0 &&
          rollbackReadiness.armed === 0 &&
          hardening.summary.blocked === 0
        ? "certified"
        : "conditional";

  return {
    generatedAt: new Date().toISOString(),
    status,
    summary: {
      legacyInventory: legacyInventory.length,
      matchedLegacyInventory: matchedEntries.length,
      unmatchedLegacyInventory: unmatchedEntries.length,
      legacyCoverage,
      currentModules: registry.summary.totalModules,
      bridgeModules: registry.summary.bridgeModules,
      diagnostics: orchestration.summary.diagnostics,
      duplicateFindings: duplication.summary.totalFindings,
      storageNamespaces: storage.length,
      runtimeFlows: flowParity.total,
      healthyRuntimeFlows: flowParity.healthy,
      orchestrationChannels: orchestrationParity.channels,
      rollbackReady: rollbackReadiness.ready,
      blockers: blockers.length,
      orphanedSystems: orphanedSystems.length,
      duplicateRuntimeOwnership: duplicateRuntimeOwnership.length,
    },
    flowParity,
    orchestrationParity,
    rollbackReadiness,
    blockers,
    orphanedSystems,
    duplicateRuntimeOwnership,
    matchedLegacyKeys: matchedEntries.map((entry) => entry.key),
    unmatchedLegacyKeys: unmatchedEntries.map((entry) => entry.key),
    evidence: [
      `${legacy.routeAliases} route alias(es) tracked`,
      `${legacy.storageAliases} storage alias(es) tracked`,
      `${registry.summary.bridgeModules} bridge-required module(s) tracked`,
      `${hardening.summary.pass}/${hardening.summary.checks} hardening checks passing`,
      `${flowParity.healthy}/${flowParity.total} runtime flows healthy`,
      `${orchestrationParity.healthy}/${orchestrationParity.channels} orchestration channels healthy`,
      `${rollbackReadiness.ready}/${rollbackReadiness.totalPatches} migration patches ready`,
      `${orchestration.summary.modules} modules and ${orchestration.summary.domains} domains orchestrated`,
    ],
  };
}
