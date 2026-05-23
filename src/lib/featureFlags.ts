import { emitAppSync, subscribeAppSync } from "./app-sync";

export type MigrationFlagSource = "default" | "storage" | "environment";

export interface MigrationFlagDefinition {
  key: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export interface MigrationFlagRuntimeState {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  defaultEnabled: boolean;
  source: MigrationFlagSource;
}

export interface MigrationFlagSnapshot {
  updatedAt: string;
  flags: Record<string, MigrationFlagRuntimeState>;
}

export const MIGRATION_FLAGS_STORAGE_KEY = "sms.migration.flags.v1";

export const MIGRATION_PATCH_FLAGS: MigrationFlagDefinition[] = [
  {
    key: "patch-001-foundation-audit",
    label: "Patch 001: Foundation audit",
    description: "Compatibility registry, ownership map, and gap analysis.",
    defaultEnabled: true,
  },
  {
    key: "patch-002-safe-feature-flags",
    label: "Patch 002: Safe feature flags",
    description: "Runtime toggles, rollback registry, and scoped activation.",
    defaultEnabled: true,
  },
  {
    key: "patch-003-runtime-shell-compatibility",
    label: "Patch 003: Runtime shell compatibility",
    description: "Desktop/mobile shell intelligence and hydration stability.",
    defaultEnabled: false,
  },
  {
    key: "patch-004-state-normalization",
    label: "Patch 004: State normalization",
    description: "Unified state adapters for focus, workspace, settings, and registry state.",
    defaultEnabled: false,
  },
  {
    key: "patch-005-workspace-actions",
    label: "Patch 005: Workspace actions",
    description: "Workspace menus, focus orchestration, and floating actions.",
    defaultEnabled: false,
  },
  {
    key: "patch-006-settings-orchestration",
    label: "Patch 006: Settings orchestration",
    description: "Advanced settings tabs, panels, and persistence.",
    defaultEnabled: false,
  },
  {
    key: "patch-007-registry-core",
    label: "Patch 007: Registry core",
    description: "Unified registry model, metadata, grouping, and persistence contracts.",
    defaultEnabled: false,
  },
  {
    key: "patch-008-registry-explorer",
    label: "Patch 008: Registry explorer",
    description: "Inspector tooling, JSON views, and list virtualization.",
    defaultEnabled: false,
  },
  {
    key: "patch-009-student-workspace",
    label: "Patch 009: Student workspace",
    description: "Student contextual tabs, detail panels, and flyout orchestration.",
    defaultEnabled: false,
  },
  {
    key: "patch-010-erp-context",
    label: "Patch 010: ERP context",
    description: "ERP module grouping, contextual navigation, and activation engine.",
    defaultEnabled: false,
  },
];

const isBrowser = () => typeof window !== "undefined";

const readEnvValue = (name: string) => {
  if (typeof process === "undefined") return undefined;
  return process.env?.[name];
};

const parseBoolean = (value: string | undefined) => {
  if (value == null) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (["1", "true", "yes", "on", "enabled"].includes(normalized)) return true;
  if (["0", "false", "no", "off", "disabled"].includes(normalized)) return false;
  return undefined;
};

const parseFlagOverridePairs = (raw: string | undefined) => {
  const overrides: Record<string, boolean> = {};
  if (!raw) return overrides;
  for (const chunk of raw.split(/[,\n;]/)) {
    const token = chunk.trim();
    if (!token) continue;
    const [keyPart, valuePart] = token.split("=", 2);
    const key = keyPart.trim();
    if (!key) continue;
    const parsed = parseBoolean(valuePart);
    overrides[key] = parsed ?? true;
  }
  return overrides;
};

const readStoredSnapshot = (): Partial<MigrationFlagSnapshot> => {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(MIGRATION_FLAGS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<MigrationFlagSnapshot>;
  } catch {
    return {};
  }
};

const writeStoredSnapshot = (snapshot: MigrationFlagSnapshot) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(MIGRATION_FLAGS_STORAGE_KEY, JSON.stringify(snapshot));
  emitAppSync(MIGRATION_FLAGS_STORAGE_KEY);
};

const getEnvironmentOverrides = () => {
  const raw =
    readEnvValue("VITE_MIGRATION_FLAGS") ??
    readEnvValue("NEXT_PUBLIC_MIGRATION_FLAGS") ??
    readEnvValue("MIGRATION_FLAGS");
  return parseFlagOverridePairs(raw);
};

const buildState = (): MigrationFlagSnapshot => {
  const stored = readStoredSnapshot();
  const envOverrides = getEnvironmentOverrides();
  const storedFlags = stored.flags ?? {};
  const flags = Object.fromEntries(
    MIGRATION_PATCH_FLAGS.map((definition) => {
      const storedFlag = storedFlags[definition.key];
      const envOverride = Object.prototype.hasOwnProperty.call(envOverrides, definition.key)
        ? envOverrides[definition.key]
        : undefined;
      const source: MigrationFlagSource = envOverride !== undefined ? "environment" : storedFlag ? "storage" : "default";
      const enabled = envOverride ?? storedFlag?.enabled ?? definition.defaultEnabled;
      return [
        definition.key,
        {
          key: definition.key,
          label: definition.label,
          description: definition.description,
          enabled,
          defaultEnabled: definition.defaultEnabled,
          source,
        } satisfies MigrationFlagRuntimeState,
      ] as const;
    }),
  ) as Record<string, MigrationFlagRuntimeState>;

  return {
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : new Date().toISOString(),
    flags,
  };
};

export function loadMigrationFlagSnapshot(): MigrationFlagSnapshot {
  return buildState();
}

export function getMigrationFlagState(key: string): MigrationFlagRuntimeState | undefined {
  return buildState().flags[key];
}

export function isMigrationFlagEnabled(key: string): boolean {
  return getMigrationFlagState(key)?.enabled ?? false;
}

export function setMigrationFlag(key: string, enabled: boolean): MigrationFlagSnapshot {
  const current = buildState();
  if (!current.flags[key]) {
    throw new Error(`Unknown migration flag: ${key}`);
  }

  const next: MigrationFlagSnapshot = {
    updatedAt: new Date().toISOString(),
    flags: {
      ...current.flags,
      [key]: {
        ...current.flags[key],
        enabled,
        source: "storage",
      },
    },
  };

  writeStoredSnapshot(next);
  return next;
}

export function toggleMigrationFlag(key: string): MigrationFlagSnapshot {
  const current = getMigrationFlagState(key);
  if (!current) {
    throw new Error(`Unknown migration flag: ${key}`);
  }
  return setMigrationFlag(key, !current.enabled);
}

export function resetMigrationFlags(): MigrationFlagSnapshot {
  if (isBrowser()) {
    window.localStorage.removeItem(MIGRATION_FLAGS_STORAGE_KEY);
    emitAppSync(MIGRATION_FLAGS_STORAGE_KEY);
  }

  return buildState();
}

export function subscribeMigrationFlags(listener: () => void) {
  return subscribeAppSync([MIGRATION_FLAGS_STORAGE_KEY], listener);
}
