import "@/lib/runtime-storage";
import { removeStoredKey, readStoredJson } from "./state-normalization";
import { SHELL_RUNTIME_STORAGE_KEY } from "./shell-runtime";
import { THEME_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY } from "./theme-runtime";
import { MIGRATION_FLAGS_STORAGE_KEY } from "./featureFlags";
import { MIGRATION_ROLLBACK_STORAGE_KEY } from "./rollbackRegistry";
import { GROUP_MODEL_STORAGE_KEY } from "./group-model";
import { RUNTIME_DIAGNOSTICS_STORAGE_KEY } from "./runtime-diagnostics";
import {
  registryColumnSettingsStorageKey,
  registryFetchedHeaderMetaStorageKey,
  registryFetchedHeadersStorageKey,
  registryFieldOverridesStorageKey,
  registryFilterPresetsStorageKey,
  registrySnapshotStorageKey,
  registryStorageKey,
  instituteRegistryStorageKey,
} from "./header-registry";

export interface StorageKeyDescriptor {
  key: string;
  label: string;
  namespace: string;
  owner: "shell" | "settings" | "migration" | "workspace" | "registry" | "diagnostics";
}

export interface StorageNamespaceDescriptor {
  namespace: string;
  label: string;
  owner: StorageKeyDescriptor["owner"];
  keys: StorageKeyDescriptor[];
}

export interface StorageOwnershipEntry extends StorageNamespaceDescriptor {
  presentKeys: string[];
  missingKeys: string[];
  byteSize: number;
}

const isBrowser = () => typeof window !== "undefined";

export const STORAGE_OWNERSHIP_REGISTRY: StorageNamespaceDescriptor[] = [
  {
    namespace: "shell",
    label: "Shell runtime",
    owner: "shell",
    keys: [
      { key: SHELL_RUNTIME_STORAGE_KEY, label: "Shell snapshot", namespace: "shell", owner: "shell" },
    ],
  },
  {
    namespace: "settings",
    label: "Settings runtime",
    owner: "settings",
    keys: [
      { key: THEME_STORAGE_KEY, label: "Theme snapshot", namespace: "settings", owner: "settings" },
      { key: LEGACY_THEME_STORAGE_KEY, label: "Legacy theme", namespace: "settings", owner: "settings" },
    ],
  },
  {
    namespace: "migration",
    label: "Migration controls",
    owner: "migration",
    keys: [
      { key: MIGRATION_FLAGS_STORAGE_KEY, label: "Migration flags", namespace: "migration", owner: "migration" },
      { key: MIGRATION_ROLLBACK_STORAGE_KEY, label: "Rollback registry", namespace: "migration", owner: "migration" },
    ],
  },
  {
    namespace: "workspace",
    label: "Workspace runtime",
    owner: "workspace",
    keys: [
      { key: GROUP_MODEL_STORAGE_KEY, label: "Group visibility", namespace: "workspace", owner: "workspace" },
    ],
  },
  {
    namespace: "registry",
    label: "Registry persistence",
    owner: "registry",
    keys: [
      { key: registryStorageKey, label: "Registry settings", namespace: "registry", owner: "registry" },
      { key: instituteRegistryStorageKey, label: "Institute registry", namespace: "registry", owner: "registry" },
      { key: registryFieldOverridesStorageKey, label: "Field overrides", namespace: "registry", owner: "registry" },
      { key: registrySnapshotStorageKey, label: "Registry snapshot", namespace: "registry", owner: "registry" },
      { key: registryFetchedHeadersStorageKey, label: "Fetched headers", namespace: "registry", owner: "registry" },
      { key: registryFetchedHeaderMetaStorageKey, label: "Fetched header meta", namespace: "registry", owner: "registry" },
      { key: registryColumnSettingsStorageKey, label: "Column settings", namespace: "registry", owner: "registry" },
      { key: registryFilterPresetsStorageKey, label: "Filter presets", namespace: "registry", owner: "registry" },
    ],
  },
  {
    namespace: "diagnostics",
    label: "Runtime diagnostics",
    owner: "diagnostics",
    keys: [
      { key: RUNTIME_DIAGNOSTICS_STORAGE_KEY, label: "Diagnostics log", namespace: "diagnostics", owner: "diagnostics" },
    ],
  },
];

function readStorageBytes(key: string): number {
  if (!isBrowser()) return 0;
  try {
    return window.localStorage.getItem(key)?.length ?? 0;
  } catch {
    return 0;
  }
}

export function buildStorageOwnershipReport(): StorageOwnershipEntry[] {
  return STORAGE_OWNERSHIP_REGISTRY.map((namespace) => {
    const presentKeys = namespace.keys.filter((entry) => {
      if (!isBrowser()) return false;
      return window.localStorage.getItem(entry.key) != null;
    }).map((entry) => entry.key);
    const presentKeySet = new Set(presentKeys);
    const missingKeys = namespace.keys.filter((entry) => !presentKeySet.has(entry.key)).map((entry) => entry.key);
    const byteSize = namespace.keys.reduce((sum, entry) => sum + readStorageBytes(entry.key), 0);

    return {
      ...namespace,
      presentKeys,
      missingKeys,
      byteSize,
    };
  });
}

export function clearStorageNamespace(namespace: string): void {
  const entry = STORAGE_OWNERSHIP_REGISTRY.find((item) => item.namespace === namespace);
  if (!entry) return;
  for (const key of entry.keys) {
    removeStoredKey(key.key);
  }
}

export function clearOwnedRuntimeStorage(): void {
  for (const namespace of STORAGE_OWNERSHIP_REGISTRY) {
    for (const key of namespace.keys) {
      removeStoredKey(key.key);
    }
  }
}

export function readStorageValue<T>(key: string, fallback: T): T {
  return readStoredJson<T>(key, fallback);
}
