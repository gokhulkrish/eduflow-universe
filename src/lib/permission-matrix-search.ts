import { CAPABILITY_LEVEL_CHAR, type CapabilityLevel, type CapabilityPermissionRecord } from "@/lib/capability-matrix";

export interface PermissionMatrixSearchInput<TRole extends string = string> {
  permissions: readonly CapabilityPermissionRecord[];
  query: string;
  roles: readonly TRole[];
  roleLabels: Record<TRole, string>;
  matrix: Map<string, CapabilityLevel>;
  labelByModuleKey?: (moduleKey: string) => string;
}

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export function filterPermissionMatrixRows<TRole extends string = string>({
  permissions,
  query,
  roles,
  roleLabels,
  matrix,
  labelByModuleKey,
}: PermissionMatrixSearchInput<TRole>) {
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (!tokens.length) return [...permissions];

  const roleTokenLookup = new Map<string, TRole>();
  for (const role of roles) {
    roleTokenLookup.set(normalize(String(role)), role);
    roleTokenLookup.set(normalize(roleLabels[role]), role);
  }

  return permissions.filter((permission) => {
    const moduleLabel = labelByModuleKey?.(permission.module_key) ?? permission.module_key;
    const moduleSearchText = normalize([
      permission.module_key,
      permission.module_key.replace(/([a-z])([A-Z])/g, "$1 $2"),
      permission.action,
      permission.label,
      moduleLabel,
    ].join(" "));
    if (normalizedQuery && moduleSearchText.includes(normalizedQuery)) return true;

    const roleEntries = roles.map((role) => {
      const level = matrix.get(`${role}:${permission.id}`) ?? "none";
      return {
        role,
        level,
        text: normalize(`${role} ${roleLabels[role]} ${level} ${CAPABILITY_LEVEL_CHAR[level]}`),
      };
    });

    return tokens.every((token) => {
      const matchedRole = roleTokenLookup.get(token);
      if (matchedRole) {
        return roleEntries.some((entry) => entry.role === matchedRole && entry.level !== "none");
      }

      if ((["none", "view", "create", "edit", "approve", "delete", "export", "manage"] as const).includes(token as CapabilityLevel)) {
        return roleEntries.some((entry) => entry.level === token);
      }

      if (moduleSearchText.includes(token)) return true;

      return roleEntries.some((entry) => entry.text.includes(token));
    });
  });
}
