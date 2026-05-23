import { migrationRegistrySnapshot } from "./migration-registry";
import {
  MIGRATION_PATCH_FLAGS,
  isMigrationFlagEnabled,
  loadMigrationFlagSnapshot,
  subscribeMigrationFlags,
} from "./featureFlags";
import {
  isRollbackActive,
  loadRollbackSnapshot,
  subscribeMigrationRollbacks,
} from "./rollbackRegistry";

export interface MigrationRuntimePatchState {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  defaultEnabled: boolean;
  source: "default" | "storage" | "environment";
  rollbackActive: boolean;
  ready: boolean;
}

export interface MigrationRuntimeSnapshot {
  generatedAt: string;
  patches: MigrationRuntimePatchState[];
  summary: {
    total: number;
    active: number;
    disabled: number;
    rollbackActive: number;
  };
  registry: typeof migrationRegistrySnapshot.summary;
  flagsUpdatedAt: string;
  rollbacksUpdatedAt: string;
}

const buildPatchState = (flagSnapshot = loadMigrationFlagSnapshot()): MigrationRuntimePatchState[] =>
  MIGRATION_PATCH_FLAGS.map((definition) => {
    const flag = flagSnapshot.flags[definition.key];
    const rollbackActive = isRollbackActive(definition.key);
    const enabled = flag?.enabled ?? definition.defaultEnabled;
    const source = flag?.source ?? (definition.defaultEnabled ? "default" : "storage");

    return {
      key: definition.key,
      label: definition.label,
      description: definition.description,
      enabled,
      defaultEnabled: definition.defaultEnabled,
      source,
      rollbackActive,
      ready: enabled && !rollbackActive,
    };
  });

export function getMigrationRuntimeSnapshot(): MigrationRuntimeSnapshot {
  const flags = loadMigrationFlagSnapshot();
  const rollbacks = loadRollbackSnapshot();
  const patches = buildPatchState(flags);
  const active = patches.filter((patch) => patch.ready).length;
  const rollbackActive = patches.filter((patch) => patch.rollbackActive).length;

  return {
    generatedAt: new Date().toISOString(),
    patches,
    summary: {
      total: patches.length,
      active,
      disabled: patches.length - active,
      rollbackActive,
    },
    registry: migrationRegistrySnapshot.summary,
    flagsUpdatedAt: flags.updatedAt,
    rollbacksUpdatedAt: rollbacks.updatedAt,
  };
}

export function isMigrationPatchReady(key: string): boolean {
  return getMigrationRuntimeSnapshot().patches.find((patch) => patch.key === key)?.ready ?? false;
}

export function isMigrationPatchEnabled(key: string): boolean {
  return isMigrationFlagEnabled(key) && !isRollbackActive(key);
}

export function getMigrationPatchStatus(key: string): MigrationRuntimePatchState | undefined {
  return getMigrationRuntimeSnapshot().patches.find((patch) => patch.key === key);
}

export function subscribeMigrationRuntime(listener: () => void) {
  const unsubscribeFlags = subscribeMigrationFlags(listener);
  const unsubscribeRollbacks = subscribeMigrationRollbacks(listener);

  return () => {
    unsubscribeFlags();
    unsubscribeRollbacks();
  };
}
