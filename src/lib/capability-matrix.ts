export type CapabilityLevel = "none" | "view" | "create" | "edit" | "approve" | "delete" | "export" | "manage";

export const CAPABILITY_LEVELS = ["none", "view", "create", "edit", "approve", "delete", "export", "manage"] as const;

export const CAPABILITY_LEVEL_CHAR: Record<CapabilityLevel, string> = {
  none: "–",
  view: "V",
  create: "C",
  edit: "E",
  approve: "A",
  delete: "D",
  export: "X",
  manage: "M",
};

export const CAPABILITY_LEVEL_COLOR: Record<CapabilityLevel, string> = {
  none: "bg-muted text-muted-foreground",
  view: "bg-primary/15 text-primary",
  create: "bg-success/15 text-success",
  edit: "bg-warning/15 text-warning",
  approve: "bg-accent/20 text-accent-foreground",
  delete: "bg-destructive/15 text-destructive",
  export: "bg-secondary text-secondary-foreground",
  manage: "bg-gradient-primary text-primary-foreground",
};

export interface CapabilityPermissionRecord {
  id: string;
  module_key: string;
  action: string;
  label: string;
}

export interface CapabilityRoleSummary<TRole extends string = string> {
  role: TRole;
  grantedCount: number;
  dirtyCount: number;
  highestLevel: CapabilityLevel;
}

export interface CapabilityModuleSummary<TRole extends string = string> {
  moduleKey: string;
  label: string;
  permissionCount: number;
  grantedCount: number;
  dirtyCount: number;
  highestLevel: CapabilityLevel;
  roleCoverage: Record<TRole, {
    grantedCount: number;
    highestLevel: CapabilityLevel;
  }>;
}

export interface CapabilityMatrixSummary {
  moduleCount: number;
  permissionCount: number;
  assignedCount: number;
  dirtyCount: number;
  roleCount: number;
}

export interface CapabilityMatrixBuildInput<TRole extends string = string> {
  permissions: readonly CapabilityPermissionRecord[];
  roles: readonly TRole[];
  matrix: Map<string, CapabilityLevel>;
  dirtyKeys?: Set<string>;
  labelByModuleKey?: (moduleKey: string) => string;
}

export interface CapabilityMatrixModel<TRole extends string = string> {
  groups: CapabilityModuleSummary<TRole>[];
  roleSummaries: CapabilityRoleSummary<TRole>[];
  summary: CapabilityMatrixSummary;
}

function levelRank(level: CapabilityLevel): number {
  return CAPABILITY_LEVELS.indexOf(level);
}

function highestLevel(levels: CapabilityLevel[]): CapabilityLevel {
  return levels.reduce<CapabilityLevel>((current, next) => {
    return levelRank(next) > levelRank(current) ? next : current;
  }, "none");
}

function normalizeLevel(value: unknown): CapabilityLevel {
  return CAPABILITY_LEVELS.includes(value as CapabilityLevel) ? (value as CapabilityLevel) : "none";
}

export function isCapabilityAtLeast(level: CapabilityLevel, required: CapabilityLevel): boolean {
  return levelRank(level) >= levelRank(required);
}

export function buildCapabilityMatrix<TRole extends string = string>(
  input: CapabilityMatrixBuildInput<TRole>,
): CapabilityMatrixModel<TRole> {
  const grouped = new Map<string, CapabilityPermissionRecord[]>();
  for (const permission of input.permissions) {
    const bucket = grouped.get(permission.module_key) ?? [];
    bucket.push(permission);
    grouped.set(permission.module_key, bucket);
  }

  const groups = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([moduleKey, permissions]) => {
      const roleCoverage = Object.fromEntries(
        input.roles.map((role) => {
          const levels = permissions.map((permission) => normalizeLevel(input.matrix.get(`${role}:${permission.id}`)));
          const grantedCount = levels.filter((level) => level !== "none").length;
          return [
            role,
            {
              grantedCount,
              highestLevel: highestLevel(levels),
            },
          ] as const;
        }),
      ) as Record<TRole, { grantedCount: number; highestLevel: CapabilityLevel }>;

      const coverageValues = Object.values(roleCoverage) as { grantedCount: number; highestLevel: CapabilityLevel }[];
      const levels = coverageValues.map((entry) => entry.highestLevel);
      const grantedCount = coverageValues.reduce((total, entry) => total + entry.grantedCount, 0);
      const dirtyCount = permissions.reduce((total, permission) => {
        return total + input.roles.filter((role) => input.dirtyKeys?.has(`${role}:${permission.id}`)).length;
      }, 0);

      return {
        moduleKey,
        label: input.labelByModuleKey?.(moduleKey) ?? moduleKey.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
        permissionCount: permissions.length,
        grantedCount,
        dirtyCount,
        highestLevel: highestLevel(levels),
        roleCoverage,
      } satisfies CapabilityModuleSummary<TRole>;
    });

  const roleSummaries = input.roles.map((role) => {
    const levels = input.permissions.map((permission) => normalizeLevel(input.matrix.get(`${role}:${permission.id}`)));
    const grantedCount = levels.filter((level) => level !== "none").length;
    const dirtyCount = input.permissions.reduce(
      (total, permission) => total + (input.dirtyKeys?.has(`${role}:${permission.id}`) ? 1 : 0),
      0,
    );
    return {
      role,
      grantedCount,
      dirtyCount,
      highestLevel: highestLevel(levels),
    } satisfies CapabilityRoleSummary<TRole>;
  });

  const assignedCount = roleSummaries.reduce((total, role) => total + role.grantedCount, 0);
  const dirtyCount = roleSummaries.reduce((total, role) => total + role.dirtyCount, 0);

  return {
    groups,
    roleSummaries,
    summary: {
      moduleCount: groups.length,
      permissionCount: input.permissions.length,
      assignedCount,
      dirtyCount,
      roleCount: input.roles.length,
    },
  };
}
