import { emitAppSync, subscribeAppSync } from "./app-sync";
import { MIGRATION_PATCH_FLAGS } from "./featureFlags";

export type RollbackSource = "manual" | "system";

export interface RollbackRecord {
  key: string;
  label: string;
  active: boolean;
  reason: string | null;
  triggeredAt: string | null;
  resolvedAt: string | null;
  source: RollbackSource;
}

export interface RollbackSnapshot {
  updatedAt: string;
  rollbacks: Record<string, RollbackRecord>;
}

export const MIGRATION_ROLLBACK_STORAGE_KEY = "sms.migration.rollbacks.v1";

const isBrowser = () => typeof window !== "undefined";

const readStoredSnapshot = (): Partial<RollbackSnapshot> => {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(MIGRATION_ROLLBACK_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<RollbackSnapshot>;
  } catch {
    return {};
  }
};

const writeStoredSnapshot = (snapshot: RollbackSnapshot) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(MIGRATION_ROLLBACK_STORAGE_KEY, JSON.stringify(snapshot));
  emitAppSync(MIGRATION_ROLLBACK_STORAGE_KEY);
};

const buildDefaultRollbacks = (): Record<string, RollbackRecord> =>
  Object.fromEntries(
    MIGRATION_PATCH_FLAGS.map((definition) => [
      definition.key,
      {
        key: definition.key,
        label: definition.label,
        active: false,
        reason: null,
        triggeredAt: null,
        resolvedAt: null,
        source: "manual" satisfies RollbackSource,
      } satisfies RollbackRecord,
    ]),
  ) as Record<string, RollbackRecord>;

const buildState = (): RollbackSnapshot => {
  const stored = readStoredSnapshot();
  const defaults = buildDefaultRollbacks();
  const storedRollbacks = stored.rollbacks ?? {};
  const rollbacks = Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => {
      const storedEntry = storedRollbacks[key];
      if (!storedEntry) return [key, fallback] as const;
      return [
        key,
        {
          ...fallback,
          ...storedEntry,
          key,
          label: fallback.label,
        } satisfies RollbackRecord,
      ] as const;
    }),
  ) as Record<string, RollbackRecord>;

  return {
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : new Date().toISOString(),
    rollbacks,
  };
};

export function loadRollbackSnapshot(): RollbackSnapshot {
  return buildState();
}

export function getRollbackRecord(key: string): RollbackRecord | undefined {
  return buildState().rollbacks[key];
}

export function isRollbackActive(key: string): boolean {
  return getRollbackRecord(key)?.active ?? false;
}

export function triggerRollback(key: string, reason = "Manual rollback triggered"): RollbackSnapshot {
  const current = buildState();
  if (!current.rollbacks[key]) {
    throw new Error(`Unknown rollback key: ${key}`);
  }

  const next: RollbackSnapshot = {
    updatedAt: new Date().toISOString(),
    rollbacks: {
      ...current.rollbacks,
      [key]: {
        ...current.rollbacks[key],
        active: true,
        reason,
        triggeredAt: new Date().toISOString(),
        resolvedAt: null,
        source: "manual",
      },
    },
  };

  writeStoredSnapshot(next);
  return next;
}

export function clearRollback(key: string): RollbackSnapshot {
  const current = buildState();
  if (!current.rollbacks[key]) {
    throw new Error(`Unknown rollback key: ${key}`);
  }

  const next: RollbackSnapshot = {
    updatedAt: new Date().toISOString(),
    rollbacks: {
      ...current.rollbacks,
      [key]: {
        ...current.rollbacks[key],
        active: false,
        resolvedAt: new Date().toISOString(),
      },
    },
  };

  writeStoredSnapshot(next);
  return next;
}

export function resetRollbackRegistry(): RollbackSnapshot {
  const next: RollbackSnapshot = {
    updatedAt: new Date().toISOString(),
    rollbacks: buildDefaultRollbacks(),
  };

  if (isBrowser()) {
    window.localStorage.removeItem(MIGRATION_ROLLBACK_STORAGE_KEY);
    emitAppSync(MIGRATION_ROLLBACK_STORAGE_KEY);
  }

  return next;
}

export function subscribeMigrationRollbacks(listener: () => void) {
  return subscribeAppSync([MIGRATION_ROLLBACK_STORAGE_KEY], listener);
}

