import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";
import {
  loadUserManagementState,
  saveUserManagementState,
  type UserManagementState,
  type RoleContract,
  type PermissionContract,
  type UserGroup,
  type UserInvitation,
  loadUserGroups,
  saveUserGroups,
  loadUserInvitations,
  saveUserInvitations,
} from "@/lib/user-management-state";

async function writeAudit(
  action: string,
  entityId: string,
  metadata: Record<string, unknown>
) {
  try {
    if (!(await tableExists("audit_log"))) return;
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert({
      actor: auth?.user?.id ?? null,
      action,
      entity: "user_management_user",
      entity_id: entityId,
      metadata,
    });
  } catch {
    // audit is non-critical
  }
}

type DbUser = {
  id: string;
  name: string;
  email: string;
  role_id: string | null;
  role_name: string;
  department: string;
  status: string;
  permissions: string[];
  last_login: string | null;
  created_at: string;
  updated_at: string;
};

type DbRole = {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
};

type DbPermission = {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
};

const toUserState = (db: DbUser): UserManagementState => ({
  id: db.id,
  name: db.name,
  email: db.email,
  role: db.role_name,
  department: db.department,
  status: (["active", "inactive", "suspended", "pending"].includes(db.status)
    ? db.status
    : "active") as UserManagementState["status"],
  permissions: db.permissions ?? [],
  lastLogin: db.last_login,
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

const toRoleContract = (db: DbRole): RoleContract => ({
  id: db.id,
  name: db.name,
  description: db.description,
  permissions: db.permissions ?? [],
  isSystemRole: db.is_system_role,
  createdAt: db.created_at,
});

const toPermissionContract = (db: DbPermission): PermissionContract => ({
  id: db.id,
  key: db.key,
  label: db.label,
  description: db.description,
  category: db.category,
});

let _useSupabase: boolean | null = null;

async function checkSupabaseTables(): Promise<boolean> {
  if (_useSupabase !== null) return _useSupabase;
  try {
    _useSupabase = await tableExists("user_management_roles");
  } catch {
    _useSupabase = false;
  }
  return _useSupabase;
}

export async function loadUsers(): Promise<UserManagementState[]> {
  if (await checkSupabaseTables()) {
    const { data, error } = await supabase
      .from("user_management_users")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as DbUser[] ?? []).map(toUserState);
  }
  return loadUserManagementState().users;
}

export async function loadRoles(): Promise<RoleContract[]> {
  if (await checkSupabaseTables()) {
    const { data, error } = await supabase
      .from("user_management_roles")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data as DbRole[] ?? []).map(toRoleContract);
  }
  return loadUserManagementState().roles;
}

export async function loadPermissions(): Promise<PermissionContract[]> {
  if (await checkSupabaseTables()) {
    const { data, error } = await supabase
      .from("user_management_permissions")
      .select("*")
      .order("category");
    if (error) throw error;
    return (data as DbPermission[] ?? []).map(toPermissionContract);
  }
  return loadUserManagementState().permissions;
}

export async function saveUser(
  user: UserManagementState
): Promise<{ success: boolean; error?: string }> {
  if (await checkSupabaseTables()) {
    const existing = await supabase
      .from("user_management_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    const record = {
      name: user.name,
      email: user.email,
      role_id: null,
      role_name: user.role,
      department: user.department,
      status: user.status,
      permissions: user.permissions,
      last_login: user.lastLogin,
      updated_at: new Date().toISOString(),
    };

    const isUpdate = existing.data !== null;
    if (isUpdate) {
      const { error } = await supabase
        .from("user_management_users")
        .update(record)
        .eq("id", user.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from("user_management_users")
        .insert({ ...record, id: user.id, created_at: user.createdAt });
      if (error) return { success: false, error: error.message };
    }
    writeAudit(
      isUpdate ? "user_management.user.updated" : "user_management.user.created",
      user.id,
      { name: user.name, email: user.email, role: user.role, status: user.status }
    );
    return { success: true };
  }

  const state = loadUserManagementState();
  const idx = state.users.findIndex((u) => u.id === user.id);
  const next = [...state.users];
  if (idx !== -1) {
    next[idx] = user;
  } else {
    next.push(user);
  }
  return saveUserManagementState(next, state.roles);
}

export async function deleteUser(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (await checkSupabaseTables()) {
    const { data: target } = await supabase
      .from("user_management_users")
      .select("name, email")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase
      .from("user_management_users")
      .delete()
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    writeAudit("user_management.user.deleted", id, {
      name: (target as { name?: string })?.name ?? "unknown",
    });
    return { success: true };
  }
  const state = loadUserManagementState();
  return saveUserManagementState(
    state.users.filter((u) => u.id !== id),
    state.roles
  );
}

export async function saveRole(
  role: RoleContract
): Promise<{ success: boolean; error?: string }> {
  if (await checkSupabaseTables()) {
    const existing = await supabase
      .from("user_management_roles")
      .select("id")
      .eq("id", role.id)
      .maybeSingle();

    const record = {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      is_system_role: role.isSystemRole,
      updated_at: new Date().toISOString(),
    };

    const isUpdate = existing.data !== null;
    if (isUpdate) {
      const { error } = await supabase
        .from("user_management_roles")
        .update(record)
        .eq("id", role.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase
        .from("user_management_roles")
        .insert({ ...record, id: role.id, created_at: role.createdAt });
      if (error) return { success: false, error: error.message };
    }
    writeAudit(
      isUpdate ? "user_management.role.updated" : "user_management.role.created",
      role.id,
      { name: role.name, permissions: role.permissions }
    );
    return { success: true };
  }

  const state = loadUserManagementState();
  const idx = state.roles.findIndex((r) => r.id === role.id);
  const next = [...state.roles];
  if (idx !== -1) {
    next[idx] = role;
  } else {
    next.push(role);
  }
  return saveUserManagementState(state.users, next);
}

export async function deleteRole(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (await checkSupabaseTables()) {
    const { data: target } = await supabase
      .from("user_management_roles")
      .select("name")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase
      .from("user_management_roles")
      .delete()
      .eq("id", id);
    if (error) return { success: false, error: error.message };
    writeAudit("user_management.role.deleted", id, {
      name: (target as { name?: string })?.name ?? "unknown",
    });
    return { success: true };
  }
  const state = loadUserManagementState();
  return saveUserManagementState(
    state.users,
    state.roles.filter((r) => r.id !== id)
  );
}

export async function loadAuditLogs(): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await supabase
      .from("audit_log")
      .select("*")
      .eq("entity", "user_management_user")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return (data as Record<string, unknown>[]) ?? [];
  } catch {
    return [];
  }
}

export async function loadGroups(): Promise<UserGroup[]> {
  try {
    if (await tableExists("user_groups" as any)) {
      const { data, error } = await (supabase as any)
        .from("user_groups")
        .select("*")
        .order("name");
      if (error) throw error;
      return (data ?? []).map((g: any) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? "",
        memberIds: g.member_ids ?? [],
        createdAt: g.created_at,
        updatedAt: g.updated_at,
      }));
    }
  } catch {}
  return loadUserGroups();
}

export async function saveGroup(group: UserGroup): Promise<{ success: boolean; error?: string }> {
  try {
    if (await tableExists("user_groups" as any)) {
      const existing = await (supabase as any)
        .from("user_groups")
        .select("id")
        .eq("id", group.id)
        .maybeSingle();
      const record = {
        name: group.name,
        description: group.description,
        member_ids: group.memberIds,
        updated_at: new Date().toISOString(),
      };
      if (existing?.data) {
        const { error } = await (supabase as any)
          .from("user_groups")
          .update(record)
          .eq("id", group.id);
        if (error) return { success: false, error: error.message };
      } else {
        const { error } = await (supabase as any)
          .from("user_groups")
          .insert({ ...record, id: group.id, created_at: group.createdAt });
        if (error) return { success: false, error: error.message };
      }
      return { success: true };
    }
  } catch {}
  const groups = loadUserGroups();
  const idx = groups.findIndex((g) => g.id === group.id);
  if (idx !== -1) groups[idx] = group;
  else groups.push(group);
  return saveUserGroups(groups);
}

export async function deleteGroup(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (await tableExists("user_groups" as any)) {
      const { error } = await (supabase as any)
        .from("user_groups")
        .delete()
        .eq("id", id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }
  } catch {}
  const groups = loadUserGroups();
  return saveUserGroups(groups.filter((g) => g.id !== id));
}

export async function bulkImportUsers(
  rows: Array<{ name: string; email: string; role: string; department: string }>
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;
  for (const row of rows) {
    if (!row.name?.trim()) { errors.push(`Row ${created + 1}: name missing`); continue; }
    if (!row.email?.trim()) { errors.push(`Row ${created + 1}: email missing for "${row.name}"`); continue; }
    const user: UserManagementState = {
      id: generateId(),
      name: row.name.trim(),
      email: row.email.trim(),
      role: row.role?.trim() || "",
      department: row.department?.trim() || "",
      status: "pending",
      permissions: [],
      lastLogin: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await saveUser(user);
    if (result.success) created++;
    else errors.push(`Failed to create "${row.name}": ${result.error}`);
  }
  return { success: errors.length === 0 || created > 0, created, errors };
}

export async function createInvitation(
  email: string,
  role: string,
  department: string,
  createdBy: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const token = generateId().replace(/-/g, "").substring(0, 16);
  const invite: UserInvitation = {
    id: generateId(),
    token,
    email,
    role,
    department,
    createdBy,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedAt: null,
    status: "pending",
  };
  const result = saveUserInvitations([...loadUserInvitations(), invite]);
  if (!result.success) return { success: false, error: result.error };
  return { success: true, token };
}

export async function loadInvitations(): Promise<UserInvitation[]> {
  return loadUserInvitations();
}

export async function redeemInvitation(token: string): Promise<{ success: boolean; error?: string }> {
  const invites = loadUserInvitations();
  const idx = invites.findIndex((i) => i.token === token);
  if (idx === -1) return { success: false, error: "Invalid or expired invitation" };
  if (invites[idx].status !== "pending") return { success: false, error: "Invitation already used" };
  if (new Date(invites[idx].expiresAt) < new Date()) {
    invites[idx].status = "expired";
    saveUserInvitations(invites);
    return { success: false, error: "Invitation has expired" };
  }
  invites[idx].status = "accepted";
  invites[idx].redeemedAt = new Date().toISOString();
  saveUserInvitations(invites);
  return { success: true };
}
