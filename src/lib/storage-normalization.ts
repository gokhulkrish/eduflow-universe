import "@/lib/runtime-storage";
import { emitAppSync, subscribeAppSync } from "./app-sync";
import { initRegistryStorage, registryStorageKey, instituteRegistryStorageKey } from "./header-registry";
import { seedLegacyStorageTranslations } from "./legacy-adapter";
import { buildStorageOwnershipReport, STORAGE_OWNERSHIP_REGISTRY } from "./storage-registry";
import { importStorageKeys } from "./student-import";
import { clearOwnedRuntimeStorage } from "./storage-registry";

export const STORAGE_NORMALIZATION_SYNC_KEY = "sms.storage-normalization.v1";
export const LEGACY_IMPORT_PROFILES_STORAGE_KEY = "sms.import.profiles.v1";

export type StorageNormalizationStatus = "healthy" | "watch" | "blocked";

export interface StorageNormalizationIssue {
  kind: "corrupt" | "collision" | "missing";
  namespace: string;
  key: string;
  detail: string;
  relatedKey?: string;
}

export interface StorageNormalizationNamespaceSummary {
  namespace: string;
  label: string;
  owner: string;
  presentKeys: string[];
  missingKeys: string[];
  corruptedKeys: string[];
  byteSize: number;
}

export interface StorageNormalizationSnapshot {
  generatedAt: string;
  status: StorageNormalizationStatus;
  summary: {
    namespaces: number;
    presentKeys: number;
    missingKeys: number;
    corruptedKeys: number;
    collisions: number;
    repairs: number;
  };
  namespaces: StorageNormalizationNamespaceSummary[];
  issues: StorageNormalizationIssue[];
}

const isBrowser = () => typeof window !== "undefined";

let lastRepairCount = 0;

const getRawStorageValue = (key: string) => {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(key);
};

const parseJsonValue = (raw: string | null) => {
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
};

const valuesMatch = (left: unknown, right: unknown) => {
  try {
    return JSON.stringify(left) === JSON.stringify(right);
  } catch {
    return false;
  }
};

function normalizeImportProfileStorage(): number {
  if (!isBrowser()) return 0;

  const modernRaw = getRawStorageValue(importStorageKeys.profiles);
  const legacyRaw = getRawStorageValue(LEGACY_IMPORT_PROFILES_STORAGE_KEY);
  const modern = parseJsonValue(modernRaw);
  const legacy = parseJsonValue(legacyRaw);
  const canonical = modern ?? legacy;

  if (canonical == null) return 0;

  let repairs = 0;
  const canonicalString = JSON.stringify(canonical);

  if (modernRaw == null || modern === undefined || !valuesMatch(modern, canonical)) {
    window.localStorage.setItem(importStorageKeys.profiles, canonicalString);
    emitAppSync(importStorageKeys.profiles);
    repairs += 1;
  }

  if (legacyRaw == null || legacy === undefined || !valuesMatch(legacy, canonical)) {
    window.localStorage.setItem(LEGACY_IMPORT_PROFILES_STORAGE_KEY, canonicalString);
    emitAppSync(LEGACY_IMPORT_PROFILES_STORAGE_KEY);
    repairs += 1;
  }

  return repairs;
}

function buildNamespaceSummary(namespace: (typeof STORAGE_OWNERSHIP_REGISTRY)[number]): StorageNormalizationNamespaceSummary {
  const presentKeys = namespace.keys.filter((entry) => getRawStorageValue(entry.key) != null).map((entry) => entry.key);
  const corruptedKeys = presentKeys.filter((key) => parseJsonValue(getRawStorageValue(key)) === undefined);
  const missingKeys = namespace.keys.filter((entry) => !presentKeys.includes(entry.key)).map((entry) => entry.key);
  const byteSize = namespace.keys.reduce((sum, entry) => sum + (getRawStorageValue(entry.key)?.length ?? 0), 0);

  return {
    namespace: namespace.namespace,
    label: namespace.label,
    owner: namespace.owner,
    presentKeys,
    missingKeys,
    corruptedKeys,
    byteSize,
  };
}

export function buildStorageNormalizationSnapshot(): StorageNormalizationSnapshot {
  const namespaces = buildStorageOwnershipReport().map((namespace) => buildNamespaceSummary(namespace));
  const issues: StorageNormalizationIssue[] = [];

  for (const namespace of namespaces) {
    for (const key of namespace.corruptedKeys) {
      issues.push({
        kind: "corrupt",
        namespace: namespace.namespace,
        key,
        detail: "Stored value could not be parsed as JSON and should be cleared or repaired.",
      });
    }
    for (const key of namespace.missingKeys) {
      issues.push({
        kind: "missing",
        namespace: namespace.namespace,
        key,
        detail: "Expected storage key is absent and will be seeded on the next runtime pass.",
      });
    }
  }

  const modernRaw = getRawStorageValue(importStorageKeys.profiles);
  const legacyRaw = getRawStorageValue(LEGACY_IMPORT_PROFILES_STORAGE_KEY);
  const modern = parseJsonValue(modernRaw);
  const legacy = parseJsonValue(legacyRaw);

  if (modern != null && legacy != null && !valuesMatch(modern, legacy)) {
    issues.push({
      kind: "collision",
      namespace: "registry",
      key: importStorageKeys.profiles,
      relatedKey: LEGACY_IMPORT_PROFILES_STORAGE_KEY,
      detail: "Modern and legacy import profile storage keys contain different payloads.",
    });
  }

  const corruptedKeys = issues.filter((issue) => issue.kind === "corrupt").length;
  const collisionCount = issues.filter((issue) => issue.kind === "collision").length;
  const missingKeys = issues.filter((issue) => issue.kind === "missing").length;
  const status: StorageNormalizationStatus = corruptedKeys > 0 || collisionCount > 0 ? "blocked" : "healthy";

  return {
    generatedAt: new Date().toISOString(),
    status,
    summary: {
      namespaces: namespaces.length,
      presentKeys: namespaces.reduce((sum, namespace) => sum + namespace.presentKeys.length, 0),
      missingKeys,
      corruptedKeys,
      collisions: collisionCount,
      repairs: lastRepairCount,
    },
    namespaces,
    issues,
  };
}

export function normalizeStoragePersistence(): StorageNormalizationSnapshot {
  if (!isBrowser()) return buildStorageNormalizationSnapshot();

  initRegistryStorage();
  seedLegacyStorageTranslations();
  lastRepairCount = normalizeImportProfileStorage();
  emitAppSync(STORAGE_NORMALIZATION_SYNC_KEY);
  return buildStorageNormalizationSnapshot();
}

export function clearCorruptedStorageEntries(): StorageNormalizationSnapshot {
  const snapshot = buildStorageNormalizationSnapshot();
  if (!isBrowser()) return snapshot;

  for (const issue of snapshot.issues) {
    if (issue.kind !== "corrupt") continue;
    window.localStorage.removeItem(issue.key);
    emitAppSync(issue.key);
  }

  emitAppSync(STORAGE_NORMALIZATION_SYNC_KEY);
  return buildStorageNormalizationSnapshot();
}

export function subscribeStorageNormalization(listener: () => void) {
  const keys = [
    STORAGE_NORMALIZATION_SYNC_KEY,
    ...STORAGE_OWNERSHIP_REGISTRY.flatMap((namespace) => namespace.keys.map((entry) => entry.key)),
    importStorageKeys.profiles,
    LEGACY_IMPORT_PROFILES_STORAGE_KEY,
    registryStorageKey,
    instituteRegistryStorageKey,
  ];
  return subscribeAppSync(keys, listener);
}

export function bootstrapStorageNormalizationLayer() {
  return normalizeStoragePersistence();
}

export function clearStorageNormalizationState() {
  clearOwnedRuntimeStorage();
  emitAppSync(STORAGE_NORMALIZATION_SYNC_KEY);
}
