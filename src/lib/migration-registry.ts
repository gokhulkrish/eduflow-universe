import { allModules, type ModuleDefinition } from "../../lib/module-registry";

export type MigrationCompatibilityState = "compatible" | "bridge-required" | "deferred";
export type MigrationOwnershipState = "new-system" | "compatibility-bridge" | "legacy-pack" | "migration-backlog";
export type MigrationGapKind = "bridge" | "workflow" | "capability-shared" | "registry" | "duplicate-surface";
export type MigrationIssueSeverity = "info" | "warning" | "critical";

export interface MigrationModuleRecord {
  key: string;
  label: string;
  status: ModuleDefinition["status"] | "unknown";
  kind: ModuleDefinition["kind"] | "unknown";
  domainKey: string;
  domainLabel: string;
  launchType: ModuleDefinition["launchType"] | "unknown";
  sectionId: string;
  workspaceKey: string;
  moduleKey: string;
  renderer: string;
  route: string;
  sourceLine: number | null;
  compatibility: MigrationCompatibilityState;
  ownership: MigrationOwnershipState;
  notes: string[];
}

export interface MigrationGap {
  id: string;
  moduleKey: string;
  moduleLabel: string;
  kind: MigrationGapKind;
  severity: MigrationIssueSeverity;
  title: string;
  detail: string;
}

export interface MigrationCollision {
  id: string;
  scope: "route" | "moduleKey";
  key: string;
  severity: MigrationIssueSeverity;
  detail: string;
  modules: string[];
}

export interface MigrationCapabilityCluster {
  id: string;
  scope: "renderer" | "sectionId" | "workspaceKey";
  key: string;
  modules: string[];
  detail: string;
}

export interface MigrationRegistrySummary {
  totalModules: number;
  liveModules: number;
  bridgeModules: number;
  deferredModules: number;
  legacyPackModules: number;
  domains: number;
  gaps: number;
  collisions: number;
  capabilityClusters: number;
}

export interface MigrationRegistrySnapshot {
  generatedAt: string;
  summary: MigrationRegistrySummary;
  modules: MigrationModuleRecord[];
  ownershipMap: Record<string, MigrationOwnershipState>;
  gapAnalysis: MigrationGap[];
  collisions: MigrationCollision[];
  capabilityClusters: MigrationCapabilityCluster[];
}

const toCleanString = (value: unknown) => String(value ?? "").trim();

const normalizeKey = (value: unknown) =>
  toCleanString(value)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*[:/|]\s*/g, " ")
    .trim();

const recordCompatibility = (module: ModuleDefinition): MigrationCompatibilityState => {
  if (module.status === "live") return "compatible";
  if (module.status === "needs-wiring") return "bridge-required";
  if (module.status === "coming-soon") return "deferred";
  return module.kind === "legacy-pack" ? "deferred" : "compatible";
};

const recordOwnership = (module: ModuleDefinition): MigrationOwnershipState => {
  if (module.status === "live") return "new-system";
  if (module.status === "needs-wiring") return "compatibility-bridge";
  if (module.status === "coming-soon") return "migration-backlog";
  return module.kind === "legacy-pack" ? "legacy-pack" : "new-system";
};

const buildNotes = (module: ModuleDefinition): string[] => {
  const notes: string[] = [];
  if (module.status === "needs-wiring") notes.push("Compatibility bridge still required.");
  if (module.status === "coming-soon") notes.push("Rollout is intentionally deferred.");
  if (module.kind === "legacy-pack") notes.push("Legacy-pack surface kept isolated for incremental migration.");
  if (module.launchType === "import-step") notes.push("Import workflow step; verify downstream state invalidation.");
  if (module.launchType === "erp-workspace") notes.push("ERP workspace; preserve contextual navigation contracts.");
  return notes;
};

const buildModuleRecord = (module: ModuleDefinition): MigrationModuleRecord => ({
  key: module.key,
  label: module.label,
  status: module.status ?? "unknown",
  kind: module.kind ?? "unknown",
  domainKey: module.domainKey ?? "",
  domainLabel: module.domainLabel ?? "Unclassified",
  launchType: module.launchType ?? "unknown",
  sectionId: toCleanString(module.sectionId),
  workspaceKey: toCleanString(module.workspaceKey),
  moduleKey: toCleanString(module.moduleKey),
  renderer: toCleanString(module.renderer),
  route: toCleanString(module.route),
  sourceLine: typeof module.sourceLine === "number" ? module.sourceLine : null,
  compatibility: recordCompatibility(module),
  ownership: recordOwnership(module),
  notes: buildNotes(module),
});

const groupBy = <T,>(items: T[], selector: (item: T) => string) => {
  const buckets = new Map<string, T[]>();
  for (const item of items) {
    const key = selector(item);
    if (!key) continue;
    const current = buckets.get(key) ?? [];
    current.push(item);
    buckets.set(key, current);
  }
  return buckets;
};

const buildGapAnalysis = (modules: MigrationModuleRecord[]): MigrationGap[] => {
  const gaps: MigrationGap[] = [];

  for (const module of modules) {
    if (module.compatibility === "bridge-required") {
      gaps.push({
        id: `${module.key}:bridge`,
        moduleKey: module.key,
        moduleLabel: module.label,
        kind: "bridge",
        severity: "warning",
        title: `${module.label} still needs a compatibility bridge`,
        detail: `The ${module.label} surface is present in the new system, but the legacy behavior still needs incremental wiring before it can be considered feature-complete.`,
      });
    }

    if (module.compatibility === "deferred") {
      gaps.push({
        id: `${module.key}:workflow`,
        moduleKey: module.key,
        moduleLabel: module.label,
        kind: "workflow",
        severity: module.kind === "legacy-pack" ? "info" : "warning",
        title: `${module.label} rollout is deferred`,
        detail: `Keep ${module.label} behind the migration gate until its workflow, persistence, and state contracts are confirmed safe.`,
      });
    }

    if (module.kind === "legacy-pack") {
      gaps.push({
        id: `${module.key}:registry`,
        moduleKey: module.key,
        moduleLabel: module.label,
        kind: "registry",
        severity: "info",
        title: `${module.label} remains in the legacy-pack registry`,
        detail: "This surface should stay isolated until its compatibility bridge is explicitly promoted into the new registry.",
      });
    }
  }

  return gaps;
};

const buildCollisions = (modules: MigrationModuleRecord[]): MigrationCollision[] => {
  const collisions: MigrationCollision[] = [];

  const routeGroups = groupBy(modules.filter((module) => module.route), (module) => normalizeKey(module.route));
  const moduleKeyGroups = groupBy(modules.filter((module) => module.moduleKey), (module) => normalizeKey(module.moduleKey));

  for (const [route, members] of routeGroups.entries()) {
    if (members.length <= 1) continue;
    collisions.push({
      id: `route:${route}`,
      scope: "route",
      key: route,
      severity: "critical",
      detail: "Multiple modules resolve to the same route token and should be checked for a collision before activation.",
      modules: members.map((member) => member.key),
    });
  }

  for (const [moduleKey, members] of moduleKeyGroups.entries()) {
    if (members.length <= 1) continue;
    collisions.push({
      id: `moduleKey:${moduleKey}`,
      scope: "moduleKey",
      key: moduleKey,
      severity: "critical",
      detail: "Multiple module definitions share the same module key. This should stay unique across the migration registry.",
      modules: members.map((member) => member.key),
    });
  }

  return collisions;
};

const buildCapabilityClusters = (modules: MigrationModuleRecord[]): MigrationCapabilityCluster[] => {
  const clusters: MigrationCapabilityCluster[] = [];

  const rendererGroups = groupBy(modules.filter((module) => module.renderer), (module) => normalizeKey(module.renderer));
  const sectionGroups = groupBy(modules.filter((module) => module.sectionId), (module) => normalizeKey(module.sectionId));
  const workspaceGroups = groupBy(modules.filter((module) => module.workspaceKey), (module) => normalizeKey(module.workspaceKey));

  for (const [renderer, members] of rendererGroups.entries()) {
    if (members.length <= 1) continue;
    clusters.push({
      id: `renderer:${renderer}`,
      scope: "renderer",
      key: renderer,
      modules: members.map((member) => member.key),
      detail: "Shared renderer contract detected. This is expected for shell-level reuse, but it is still useful to track as a capability cluster.",
    });
  }

  for (const [sectionId, members] of sectionGroups.entries()) {
    if (members.length <= 1) continue;
    clusters.push({
      id: `section:${sectionId}`,
      scope: "sectionId",
      key: sectionId,
      modules: members.map((member) => member.key),
      detail: "Shared section container detected. The new system should preserve this shell-level coordination without cloning the UI.",
    });
  }

  for (const [workspaceKey, members] of workspaceGroups.entries()) {
    if (members.length <= 1) continue;
    clusters.push({
      id: `workspace:${workspaceKey}`,
      scope: "workspaceKey",
      key: workspaceKey,
      modules: members.map((member) => member.key),
      detail: "Shared workspace key detected. This helps highlight module families that rely on the same context engine.",
    });
  }

  return clusters;
};

export function buildMigrationRegistrySnapshot(modules: ModuleDefinition[] = allModules): MigrationRegistrySnapshot {
  const records = modules.map(buildModuleRecord);
  const ownershipMap = Object.fromEntries(records.map((record) => [record.key, record.ownership])) as Record<string, MigrationOwnershipState>;
  const gapAnalysis = buildGapAnalysis(records);
  const collisions = buildCollisions(records);
  const capabilityClusters = buildCapabilityClusters(records);

  const summary: MigrationRegistrySummary = {
    totalModules: records.length,
    liveModules: records.filter((record) => record.compatibility === "compatible").length,
    bridgeModules: records.filter((record) => record.compatibility === "bridge-required").length,
    deferredModules: records.filter((record) => record.compatibility === "deferred").length,
    legacyPackModules: records.filter((record) => record.kind === "legacy-pack").length,
    domains: new Set(records.map((record) => record.domainLabel || "Unclassified")).size,
    gaps: gapAnalysis.length,
    collisions: collisions.length,
    capabilityClusters: capabilityClusters.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    modules: records,
    ownershipMap,
    gapAnalysis,
    collisions,
    capabilityClusters,
  };
}

export const migrationRegistrySnapshot = buildMigrationRegistrySnapshot();

export function getMigrationModule(key: string): MigrationModuleRecord | undefined {
  return migrationRegistrySnapshot.modules.find((module) => module.key === key);
}

export function getMigrationModulesByDomain() {
  const grouped = groupBy(migrationRegistrySnapshot.modules, (module) => module.domainLabel || "Unclassified");
  return Array.from(grouped.entries()).map(([domainLabel, modules]) => ({
    domainLabel,
    total: modules.length,
    modules,
  }));
}

export function getMigrationModulesByOwnership() {
  const grouped = groupBy(migrationRegistrySnapshot.modules, (module) => module.ownership);
  return Array.from(grouped.entries()).map(([ownership, modules]) => ({
    ownership,
    total: modules.length,
    modules,
  }));
}

export function getMigrationRegistrySummary() {
  return migrationRegistrySnapshot.summary;
}

