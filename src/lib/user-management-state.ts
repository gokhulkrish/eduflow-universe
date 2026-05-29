/**
 * User Management State Contracts & Persistence
 * 
 * This module defines the contracts and state management for User Management module.
 * Used to defer rollout until workflow, persistence, and state contracts are confirmed safe.
 */

export interface UserManagementState {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "active" | "inactive" | "suspended" | "pending";
  permissions: string[];
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleContract {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
}

export interface PermissionContract {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
}

export const SYSTEM_PERMISSIONS: PermissionContract[] = [
  {
    id: "perm-001",
    key: "view_students",
    label: "View Students",
    description: "View student records and details",
    category: "students",
  },
  {
    id: "perm-002",
    key: "edit_students",
    label: "Edit Students",
    description: "Create, update, and modify student records",
    category: "students",
  },
  {
    id: "perm-003",
    key: "view_fees",
    label: "View Fees",
    description: "View fee structures and payments",
    category: "fees",
  },
  {
    id: "perm-004",
    key: "edit_fees",
    label: "Edit Fees",
    description: "Create and manage fee structures",
    category: "fees",
  },
  {
    id: "perm-005",
    key: "view_attendance",
    label: "View Attendance",
    description: "View attendance records",
    category: "attendance",
  },
  {
    id: "perm-006",
    key: "edit_attendance",
    label: "Edit Attendance",
    description: "Mark and modify attendance",
    category: "attendance",
  },
  {
    id: "perm-007",
    key: "manage_users",
    label: "Manage Users",
    description: "Create, update, and delete user accounts",
    category: "admin",
  },
  {
    id: "perm-008",
    key: "manage_roles",
    label: "Manage Roles",
    description: "Create and modify roles and permissions",
    category: "admin",
  },
];

export const STANDARD_ROLES: RoleContract[] = [
  {
    id: "role-admin",
    name: "Administrator",
    description: "Full system access",
    permissions: SYSTEM_PERMISSIONS.map(p => p.key),
    isSystemRole: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "role-principal",
    name: "Principal",
    description: "Institute head with oversight permissions",
    permissions: ["view_students", "view_fees", "view_attendance", "manage_users"],
    isSystemRole: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "role-staff",
    name: "Staff",
    description: "Standard staff permissions",
    permissions: ["view_students", "edit_attendance", "view_attendance"],
    isSystemRole: true,
    createdAt: new Date().toISOString(),
  },
];

const USERS_STORAGE_KEY = "eduflow.user-management.users.v1";
const ROLES_STORAGE_KEY = "eduflow.user-management.roles.v1";

const LEGACY_USERS_KEY = "eduflow_users";
const LEGACY_ROLES_KEY = "eduflow_roles";

const PERMISSION_LABEL_TO_KEY: Record<string, string> = {
  "View Students": "view_students",
  "Edit Students": "edit_students",
  "View Fees": "view_fees",
  "Edit Fees": "edit_fees",
  "View Attendance": "view_attendance",
  "Edit Attendance": "edit_attendance",
  "Manage Users": "manage_users",
  "Manage Roles": "manage_roles",
  "Manage Exams": "manage_exams",
  "View Reports": "view_reports",
  "Manage Settings": "manage_settings",
};

export function migrateFromLegacyKeys(): { migrated: boolean; userCount: number; roleCount: number } {
  try {
    const oldUsersRaw = localStorage.getItem(LEGACY_USERS_KEY);
    const oldRolesRaw = localStorage.getItem(LEGACY_ROLES_KEY);
    if (!oldUsersRaw && !oldRolesRaw) return { migrated: false, userCount: 0, roleCount: 0 };
    const newUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
    const newRolesRaw = localStorage.getItem(ROLES_STORAGE_KEY);
    if (newUsersRaw || newRolesRaw) return { migrated: false, userCount: 0, roleCount: 0 };
    let userCount = 0;
    let roleCount = 0;
    if (oldUsersRaw) {
      const oldUsers = JSON.parse(oldUsersRaw) as Array<Record<string, unknown>>;
      const migrated: UserManagementState[] = oldUsers.map((u) => ({
        id: String(u.id ?? ""),
        name: String(u.name ?? ""),
        email: String(u.email ?? ""),
        role: String(u.role ?? ""),
        department: String(u.department ?? ""),
        status: (u.status === "active" || u.status === "inactive" || u.status === "suspended" ? u.status : "active") as UserManagementState["status"],
        permissions: [],
        lastLogin: null,
        createdAt: String(u.created ?? u.createdAt ?? new Date().toISOString()),
        updatedAt: String(u.updatedAt ?? new Date().toISOString()),
      }));
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(migrated));
      userCount = migrated.length;
    }
    if (oldRolesRaw) {
      const oldRoles = JSON.parse(oldRolesRaw) as Array<Record<string, unknown>>;
      const migrated: RoleContract[] = oldRoles.map((r) => ({
        id: String(r.id ?? ""),
        name: String(r.name ?? ""),
        description: String(r.description ?? r.name ?? ""),
        permissions: (r.permissions as string[] ?? []).map((p: string) => PERMISSION_LABEL_TO_KEY[p] ?? p),
        isSystemRole: false,
        createdAt: String(r.createdAt ?? new Date().toISOString()),
      }));
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(migrated));
      roleCount = migrated.length;
    }
    localStorage.removeItem(LEGACY_USERS_KEY);
    localStorage.removeItem(LEGACY_ROLES_KEY);
    return { migrated: true, userCount, roleCount };
  } catch {
    return { migrated: false, userCount: 0, roleCount: 0 };
  }
}

export function loadUserManagementState(): {
  users: UserManagementState[];
  roles: RoleContract[];
  permissions: PermissionContract[];
} {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]") as UserManagementState[];
    const roles = JSON.parse(localStorage.getItem(ROLES_STORAGE_KEY) || JSON.stringify(STANDARD_ROLES)) as RoleContract[];
    return {
      users,
      roles,
      permissions: SYSTEM_PERMISSIONS,
    };
  } catch {
    return {
      users: [],
      roles: STANDARD_ROLES,
      permissions: SYSTEM_PERMISSIONS,
    };
  }
}

export function saveUserManagementState(
  users: UserManagementState[],
  roles: RoleContract[]
): { success: boolean; error?: string } {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function validateUserManagementState(
  state: Partial<{ users: UserManagementState[]; roles: RoleContract[] }>
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (state.users) {
    for (const user of state.users) {
      if (!user.name?.trim()) errors.push(`User name required for ${user.id || "user"}`);
      if (!user.email?.trim()) errors.push(`User email required for ${user.id || "user"}`);
      if (!user.role?.trim()) errors.push(`User role required for ${user.id || "user"}`);
      if (!user.department?.trim()) errors.push(`User department required for ${user.id || "user"}`);
    }
  }

  if (state.roles) {
    for (const role of state.roles) {
      if (!role.name?.trim()) errors.push(`Role name required for ${role.id || "role"}`);
      if (!Array.isArray(role.permissions)) errors.push(`Role permissions must be an array for ${role.id || "role"}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserInvitation {
  id: string;
  token: string;
  email: string;
  role: string;
  department: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  redeemedAt: string | null;
  status: "pending" | "accepted" | "expired";
}

const GROUPS_STORAGE_KEY = "eduflow.user-management.groups.v1";
const INVITES_STORAGE_KEY = "eduflow.user-management.invites.v1";

export function loadUserGroups(): UserGroup[] {
  try {
    return JSON.parse(localStorage.getItem(GROUPS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveUserGroups(groups: UserGroup[]): { success: boolean; error?: string } {
  try {
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function loadUserInvitations(): UserInvitation[] {
  try {
    return JSON.parse(localStorage.getItem(INVITES_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveUserInvitations(invites: UserInvitation[]): { success: boolean; error?: string } {
  try {
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invites));
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export function validateUserGroup(group: Partial<UserGroup>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!group.name?.trim()) errors.push("Group name is required");
  return { valid: errors.length === 0, errors };
}
