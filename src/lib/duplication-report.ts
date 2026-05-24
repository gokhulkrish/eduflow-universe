import { migrationRegistrySnapshot } from "./migration-registry";
import { STORAGE_OWNERSHIP_REGISTRY } from "./storage-registry";

export type DuplicationKind = "registry" | "capability" | "storage";

export interface DuplicationFinding {
  kind: DuplicationKind;
  title: string;
  detail: string;
  count: number;
}

export interface DuplicationReport {
  generatedAt: string;
  summary: {
    registryCollisions: number;
    capabilityClusters: number;
    duplicateStorageKeys: number;
    totalFindings: number;
  };
  findings: DuplicationFinding[];
}

const collectDuplicateStorageKeys = () => {
  const seen = new Map<string, number>();
  for (const namespace of STORAGE_OWNERSHIP_REGISTRY) {
    for (const key of namespace.keys) {
      seen.set(key.key, (seen.get(key.key) ?? 0) + 1);
    }
  }
  return [...seen.entries()].filter(([, count]) => count > 1);
};

export function buildDuplicationReport(): DuplicationReport {
  const duplicateStorageKeys = collectDuplicateStorageKeys();
  const findings: DuplicationFinding[] = [
    {
      kind: "registry" as const,
      title: "Registry collisions",
      detail: "Route and module-key collisions detected in the migration registry.",
      count: migrationRegistrySnapshot.collisions.length,
    },
    {
      kind: "capability" as const,
      title: "Capability clusters",
      detail: "Shared renderers, sections, or workspace keys that should be tracked as reusable engines.",
      count: migrationRegistrySnapshot.capabilityClusters.length,
    },
    {
      kind: "storage" as const,
      title: "Storage key duplication",
      detail: "Duplicate storage ownership keys that should be deduplicated or merged into a single namespace.",
      count: duplicateStorageKeys.length,
    },
  ].filter((finding) => finding.count > 0);

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      registryCollisions: migrationRegistrySnapshot.collisions.length,
      capabilityClusters: migrationRegistrySnapshot.capabilityClusters.length,
      duplicateStorageKeys: duplicateStorageKeys.length,
      totalFindings: findings.length,
    },
    findings,
  };
}

