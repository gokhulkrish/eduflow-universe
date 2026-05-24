import { emitAppSync, subscribeAppSync } from "./app-sync";
import { readStoredJson, writeStoredJson, removeStoredKey } from "./state-normalization";

export type ModuleDedupCategory = "utility" | "registry" | "state" | "renderer" | "handler";

export interface ModuleDedupEntry {
  key: string;
  label: string;
  category: ModuleDedupCategory;
  executions: number;
  preventedDuplicates: number;
  lastExecutedAt: string | null;
  updatedAt: string;
}

export interface ModuleDedupSnapshot {
  generatedAt: string;
  totalEntries: number;
  totalExecutions: number;
  totalPreventedDuplicates: number;
  categories: Record<ModuleDedupCategory, number>;
  entries: ModuleDedupEntry[];
}

export const MODULE_DEDUP_STORAGE_KEY = "sms.module-dedup.v1";
const MODULE_DEDUP_SYNC_KEYS = [MODULE_DEDUP_STORAGE_KEY];

const isBrowser = () => typeof window !== "undefined";

const CATEGORY_ORDER: ModuleDedupCategory[] = ["utility", "registry", "state", "renderer", "handler"];

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const singletonResults = new Map<string, unknown>();
const singletonExecutions = new Set<string>();

const normalizeEntry = (entry: Partial<ModuleDedupEntry> & Pick<ModuleDedupEntry, "key" | "label" | "category">): ModuleDedupEntry => ({
  key: String(entry.key).trim(),
  label: String(entry.label).trim(),
  category: entry.category,
  executions: Math.max(0, Number(entry.executions ?? 0) || 0),
  preventedDuplicates: Math.max(0, Number(entry.preventedDuplicates ?? 0) || 0),
  lastExecutedAt: typeof entry.lastExecutedAt === "string" && entry.lastExecutedAt.trim() ? entry.lastExecutedAt.trim() : null,
  updatedAt: typeof entry.updatedAt === "string" && entry.updatedAt.trim() ? entry.updatedAt.trim() : new Date().toISOString(),
});

const readSnapshot = (): ModuleDedupSnapshot => {
  const stored = readStoredJson<Partial<ModuleDedupSnapshot>>(MODULE_DEDUP_STORAGE_KEY, {});
  const entries = Array.isArray(stored.entries)
    ? stored.entries.map((entry) => normalizeEntry(entry as ModuleDedupEntry))
    : [];
  return {
    generatedAt: typeof stored.generatedAt === "string" ? stored.generatedAt : new Date().toISOString(),
    totalEntries: entries.length,
    totalExecutions: entries.reduce((sum, entry) => sum + entry.executions, 0),
    totalPreventedDuplicates: entries.reduce((sum, entry) => sum + entry.preventedDuplicates, 0),
    categories: CATEGORY_ORDER.reduce((acc, category) => {
      acc[category] = entries.filter((entry) => entry.category === category).length;
      return acc;
    }, {} as Record<ModuleDedupCategory, number>),
    entries,
  };
};

function writeSnapshot(snapshot: ModuleDedupSnapshot) {
  if (!isBrowser()) return;
  writeStoredJson(MODULE_DEDUP_STORAGE_KEY, snapshot);
  emitAppSync(MODULE_DEDUP_STORAGE_KEY);
}

function upsertEntry(
  key: string,
  label: string,
  category: ModuleDedupCategory,
  updater: (current: ModuleDedupEntry) => ModuleDedupEntry,
): ModuleDedupEntry {
  const snapshot = readSnapshot();
  const current = snapshot.entries.find((entry) => entry.key === key) ?? normalizeEntry({
    key,
    label,
    category,
    executions: 0,
    preventedDuplicates: 0,
    lastExecutedAt: null,
    updatedAt: new Date().toISOString(),
  });

  const next = updater(current);
  const nextEntries = snapshot.entries.some((entry) => entry.key === key)
    ? snapshot.entries.map((entry) => (entry.key === key ? next : entry))
    : [next, ...snapshot.entries];

  writeSnapshot({
    generatedAt: new Date().toISOString(),
    totalEntries: nextEntries.length,
    totalExecutions: nextEntries.reduce((sum, entry) => sum + entry.executions, 0),
    totalPreventedDuplicates: nextEntries.reduce((sum, entry) => sum + entry.preventedDuplicates, 0),
    categories: CATEGORY_ORDER.reduce((acc, category) => {
      acc[category] = nextEntries.filter((entry) => entry.category === category).length;
      return acc;
    }, {} as Record<ModuleDedupCategory, number>),
    entries: nextEntries,
  });

  return next;
}

export function runSingletonEffect<T>(
  key: string,
  label: string,
  category: ModuleDedupCategory,
  effect: () => T,
): T {
  if (singletonExecutions.has(key)) {
    upsertEntry(key, label, category, (current) => ({
      ...normalizeEntry(current),
      label,
      category,
      preventedDuplicates: current.preventedDuplicates + 1,
      updatedAt: new Date().toISOString(),
    }));
    return singletonResults.get(key) as T;
  }

  const result = effect();
  singletonExecutions.add(key);
  singletonResults.set(key, result);
  upsertEntry(key, label, category, (current) => ({
    ...normalizeEntry(current),
    label,
    category,
    executions: current.executions + 1,
    lastExecutedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  return result;
}

export function recordModuleExecution(key: string, label: string, category: ModuleDedupCategory): ModuleDedupEntry {
  return upsertEntry(key, label, category, (current) => ({
    ...normalizeEntry(current),
    label,
    category,
    executions: current.executions + 1,
    lastExecutedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export function buildModuleDedupSnapshot(): ModuleDedupSnapshot {
  return readSnapshot();
}

export function clearModuleDedupSnapshot(): void {
  singletonResults.clear();
  singletonExecutions.clear();
  removeStoredKey(MODULE_DEDUP_STORAGE_KEY);
  emitAppSync(MODULE_DEDUP_STORAGE_KEY);
}

export function resetModuleDedupRuntime(): void {
  singletonResults.clear();
  singletonExecutions.clear();
}

export function subscribeModuleDedup(listener: () => void) {
  return subscribeAppSync(MODULE_DEDUP_SYNC_KEYS, listener);
}

export function makeModuleDedupKey(prefix: string, id = makeId()) {
  return `${prefix}:${id}`;
}
