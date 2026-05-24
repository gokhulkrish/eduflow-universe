import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
import { getCapabilityRuntimeOverride, getCapabilityRuntimeSnapshot } from "@/lib/capability-runtime";
import { fetchAllSupabaseRows } from "@/lib/supabase-pagination";
import { CAPABILITY_LEVELS, type CapabilityLevel } from "@/lib/capability-matrix";
import { APP_ACCESS_RULES } from "@/lib/global-access-registry";

const levelRank = (level: CapabilityLevel) => CAPABILITY_LEVELS.indexOf(level);

const normalizeLevel = (value: unknown): CapabilityLevel =>
  CAPABILITY_LEVELS.includes(value as CapabilityLevel) ? (value as CapabilityLevel) : "none";

function getAllRegisteredModuleKeys(): Set<string> {
  return new Set(APP_ACCESS_RULES.map((r) => r.key).filter(Boolean));
}

async function getCurrentUserRoles(): Promise<string[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return [];

  if (!(await tableExists("user_roles"))) return [];

  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id);

  if (error) return [];
  return (data ?? []).map((row) => String(row.role));
}

async function getPermissionIds(moduleKey: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("permissions")
    .select("id")
    .eq("module_key", moduleKey);

  if (error) return [];
  return (data ?? []).map((row) => row.id);
}

export async function loadAccessibleModuleKeys(requiredLevel: CapabilityLevel = "view"): Promise<Set<string>> {
  const runtimeSnapshot = getCapabilityRuntimeSnapshot();
  const runtimeKeys = new Set(
    runtimeSnapshot.overrides
      .filter((override) => levelRank(normalizeLevel(override.level)) >= levelRank(requiredLevel))
      .map((override) => override.moduleKey),
  );

  if (!(await tableExists("permissions")) || !(await tableExists("role_permissions"))) {
    const allKeys = getAllRegisteredModuleKeys();
    runtimeKeys.forEach((k) => allKeys.add(k));
    return allKeys;
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    const allKeys = getAllRegisteredModuleKeys();
    runtimeKeys.forEach((k) => allKeys.add(k));
    return allKeys;
  }

  if (!(await tableExists("user_roles"))) {
    const allKeys = getAllRegisteredModuleKeys();
    runtimeKeys.forEach((k) => allKeys.add(k));
    return allKeys;
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", authData.user.id);
  const roles = (roleRows ?? []).map((row) => String(row.role));
  if (!roles.length) {
    const allKeys = getAllRegisteredModuleKeys();
    runtimeKeys.forEach((k) => allKeys.add(k));
    return allKeys;
  }

  if (roles.includes("super_admin")) {
    const { data: permissions } = await supabase.from("permissions").select("module_key");
    const keys = new Set((permissions ?? []).map((row) => row.module_key));
    runtimeKeys.forEach((key) => keys.add(key));
    return keys;
  }

  const { data: permissions } = await supabase.from("permissions").select("id,module_key");
  const permissionById = new Map((permissions ?? []).map((row) => [row.id, row.module_key] as const));

  const rolePermissions = await fetchAllSupabaseRows(async (from, to) =>
    supabase
      .from("role_permissions")
      .select("permission_id,level")
      .in("role", roles as any)
      .order("permission_id")
      .range(from, to),
  );

  const keys = new Set(runtimeKeys);
  for (const row of rolePermissions) {
    if (levelRank(normalizeLevel(row.level)) < levelRank(requiredLevel)) continue;
    const moduleKey = permissionById.get(row.permission_id);
    if (moduleKey) keys.add(moduleKey);
  }

  return keys;
}

export async function isModuleEnabled(moduleKey: string, requiredLevel: CapabilityLevel = "view"): Promise<boolean> {
  const runtimeOverride = getCapabilityRuntimeOverride(moduleKey);
  if (runtimeOverride) {
    return levelRank(runtimeOverride.level) >= levelRank(requiredLevel);
  }

  if (!(await tableExists("permissions")) || !(await tableExists("role_permissions"))) return true;

  const roles = await getCurrentUserRoles();
  if (!roles.length) return true;
  if (roles.includes("super_admin")) return true;

  const permissionIds = await getPermissionIds(moduleKey);
  if (!permissionIds.length) return false;

  const data = await fetchAllSupabaseRows(async (from, to) =>
    supabase
      .from("role_permissions")
      .select("role, permission_id, level")
      .in("role", roles as any)
      .order("permission_id")
      .range(from, to),
  );

  return data
    .filter((row) => permissionIds.includes(row.permission_id))
    .some((row) => levelRank(normalizeLevel(row.level)) >= levelRank(requiredLevel));
}
