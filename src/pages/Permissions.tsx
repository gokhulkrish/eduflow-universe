import "@/lib/runtime-storage";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Search, Save, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { tableExists } from "@/lib/supabase-health";
import { subscribeAppSync } from "@/lib/app-sync";
import { fetchAllSupabaseRows } from "@/lib/supabase-pagination";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import {
  CAPABILITY_LEVELS,
  CAPABILITY_LEVEL_CHAR,
  CAPABILITY_LEVEL_COLOR,
  buildCapabilityMatrix,
  type CapabilityLevel,
  type CapabilityPermissionRecord,
} from "@/lib/capability-matrix";
import {
  buildCapabilityRuntimeBadgeClass,
  buildCapabilitySystemBadges,
  clearCapabilityRuntimeOverrides,
  getCapabilityRuntimeSnapshot,
  setCapabilityRuntimeOverrides,
} from "@/lib/capability-runtime";
import { emitAppSync } from "@/lib/app-sync";
import { getAccessCoverage } from "@/lib/global-access-registry";
import { filterPermissionMatrixRows } from "@/lib/permission-matrix-search";
import {
  buildMissingPermissionSeeds,
  defaultGlobalRolePermissionLevel,
  getCanonicalRegistryLabel,
  getMissingRegistryModuleKeys,
  type GlobalRbacRole,
} from "@/lib/global-rbac-seeder";

const MODULE_ACCESS_SYNC_KEY = "sms.module-access.v1";
const REALTIME_PUBLICATION_SQL = `select pubname, schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in ('permissions', 'role_permissions', 'user_roles')
order by tablename;`;
const REALTIME_PUBLICATION_FIX_SQL = `do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'permissions'
    ) then
      execute 'alter publication supabase_realtime add table public.permissions';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'role_permissions'
    ) then
      execute 'alter publication supabase_realtime add table public.role_permissions';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'user_roles'
    ) then
      execute 'alter publication supabase_realtime add table public.user_roles';
    end if;
  end if;
end $$;`;

const copyToClipboard = async (text: string, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  } catch {
    toast.error(`Could not copy ${label.toLowerCase()}`);
  }
};

const broadcastModuleAccessSync = () => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MODULE_ACCESS_SYNC_KEY, new Date().toISOString());
  }
  emitAppSync(MODULE_ACCESS_SYNC_KEY);
};

const ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "principal",
  "hod",
  "faculty",
  "staff",
  "finance",
  "scholarship",
  "certificate",
  "librarian",
  "hostel_warden",
  "transport",
  "student",
  "parent",
];
const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super",
  admin: "Admin",
  principal: "Princ.",
  hod: "HOD",
  faculty: "Fac.",
  staff: "Staff",
  finance: "Fin.",
  scholarship: "Schol.",
  certificate: "Cert.",
  librarian: "Lib.",
  hostel_warden: "Hostel",
  transport: "Trans.",
  student: "Stud.",
  parent: "Parent",
  it_admin: "IT Admin",
  it_technician: "IT Tech.",
  it_lab_incharge: "Lab IC",
  iot_operator: "IoT Op.",
};
type Level = CapabilityLevel;

interface Perm extends CapabilityPermissionRecord {}
export default function Permissions() {
  const queryClient = useQueryClient();
  const { roles } = useAuth();
  const isSuper = roles.includes("super_admin");
  const [perms, setPerms] = useState<Perm[]>([]);
  const [matrix, setMatrix] = useState<Map<string, Level>>(new Map()); // key `${role}:${pid}`
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [runtimeSnapshot, setRuntimeSnapshot] = useState(() => getCapabilityRuntimeSnapshot());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("connecting");
  const [realtimeEventCount, setRealtimeEventCount] = useState(0);
  const [realtimeLastEvent, setRealtimeLastEvent] = useState<string | null>(null);
  const [repairingMissing, setRepairingMissing] = useState(false);
  const [repairingDefaultMatrix, setRepairingDefaultMatrix] = useState(false);
  const deferredQuery = useDeferredValue(q);

  const loadPermissions = useCallback(async () => {
    if (!(await tableExists("permissions")) || !(await tableExists("role_permissions"))) {
      setPerms([]);
      setMatrix(new Map());
      setLoading(false);
      return;
    }

    const [permissionsResponse, rp] = await Promise.all([
      supabase.from("permissions").select("*").order("module_key").order("action"),
      fetchAllSupabaseRows(async (from, to) =>
        supabase
          .from("role_permissions")
          .select("role,permission_id,level")
          .order("role")
          .order("permission_id")
          .range(from, to),
      ),
    ]);
    setPerms((permissionsResponse.data ?? []) as Perm[]);
    const m = new Map<string, Level>();
    rp.forEach((r: any) => m.set(`${r.role}:${r.permission_id}`, r.level));
    setMatrix(m);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPermissions();

    const channel = supabase
      .channel("permissions-matrix-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "permissions" },
        (payload) => {
          const eventLabel = `${payload.eventType} permissions`;
          setRealtimeEventCount((count) => count + 1);
          setRealtimeLastEvent(`${eventLabel} · ${new Date().toLocaleTimeString()}`);
          toast.info("Permission Matrix updated", {
            description: eventLabel,
          });
          void loadPermissions();
          queryClient.invalidateQueries({ queryKey: ["accessible-module-keys"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "role_permissions" },
        (payload) => {
          const eventLabel = `${payload.eventType} role_permissions`;
          setRealtimeEventCount((count) => count + 1);
          setRealtimeLastEvent(`${eventLabel} · ${new Date().toLocaleTimeString()}`);
          toast.info("Permission Matrix updated", {
            description: eventLabel,
          });
          void loadPermissions();
          queryClient.invalidateQueries({ queryKey: ["module-enabled"] });
          queryClient.invalidateQueries({ queryKey: ["accessible-module-keys"] });
          broadcastModuleAccessSync();
        },
      )
      .subscribe((status) => {
        setRealtimeStatus(status.toLowerCase());
        if (status === "SUBSCRIBED") {
          setRealtimeLastEvent(`Channel subscribed · ${new Date().toLocaleTimeString()}`);
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          toast.error("Realtime connection problem", {
            description: `Supabase channel status: ${status}`,
          });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const sync = () => setRuntimeSnapshot(getCapabilityRuntimeSnapshot());
    sync();
    return subscribeAppSync(["sms.capability-runtime.v1"], sync);
  }, []);

  const moduleLabelByKey = useMemo(
    () => (moduleKey: string) => getCanonicalRegistryLabel(moduleKey),
    [],
  );

  const filtered = useMemo(
    () =>
      filterPermissionMatrixRows({
        permissions: perms,
        query: deferredQuery,
        roles: ROLES,
        roleLabels: ROLE_LABEL,
        matrix,
        labelByModuleKey: moduleLabelByKey,
      }),
    [deferredQuery, matrix, moduleLabelByKey, perms],
  );

  const permissionKeys = useMemo(() => new Set(perms.map((perm) => perm.module_key)), [perms]);
  const globalCoverage = useMemo(() => getAccessCoverage(permissionKeys), [permissionKeys]);
  const missingRegistryModuleKeys = useMemo(
    () => getMissingRegistryModuleKeys(perms.map((perm) => perm.module_key)),
    [perms],
  );

  const defaultRbacAudit = useMemo(() => {
    const rows = perms;
    const roles = ROLES.map((role) => {
      const counts: Record<Level, number> = {
        manage: 0,
        edit: 0,
        create: 0,
        approve: 0,
        delete: 0,
        export: 0,
        view: 0,
        none: 0,
      };

      for (const perm of rows) {
        const level = defaultGlobalRolePermissionLevel(role as GlobalRbacRole, perm.module_key);
        counts[level] += 1;
      }

      const accessCount =
        counts.manage + counts.edit + counts.create + counts.approve + counts.delete + counts.export + counts.view;

      return {
        role,
        total: rows.length,
        accessCount,
        counts,
        sparse: accessCount < Math.ceil(rows.length * 0.25),
      };
    });

    return {
      totalPermissions: rows.length,
      roles,
      sparseRoles: roles.filter((row) => row.sparse),
      fullAccessRoles: roles.filter((row) => row.accessCount === row.total),
    };
  }, [perms]);

  const defaultMatrixRepairPlan = useMemo(() => {
    if (!perms.length) {
      return {
        expectedCells: perms.length * ROLES.length,
        actualCells: matrix.size,
        missingCells: 0,
        rowsToUpsert: [] as Array<{ role: AppRole; permission_id: string; level: Level }>,
      };
    }

    const privilegedRoles = new Set<AppRole>(["super_admin", "admin", "principal"]);
    const rowsToUpsert: Array<{ role: AppRole; permission_id: string; level: Level }> = [];

    for (const perm of perms) {
      for (const role of ROLES) {
        const key = `${role}:${perm.id}`;
        const current = matrix.get(key);
        const expected = defaultGlobalRolePermissionLevel(role as GlobalRbacRole, perm.module_key);

        if (!current) {
          rowsToUpsert.push({ role, permission_id: perm.id, level: expected });
          continue;
        }

        if (privilegedRoles.has(role) && current !== "manage") {
          rowsToUpsert.push({ role, permission_id: perm.id, level: "manage" });
        }
      }
    }

    return {
      expectedCells: perms.length * ROLES.length,
      actualCells: matrix.size,
      missingCells: rowsToUpsert.length,
      rowsToUpsert,
    };
  }, [matrix, perms]);

  const capabilityModel = useMemo(
    () =>
      buildCapabilityMatrix({
        permissions: filtered,
        roles: ROLES,
        matrix,
        dirtyKeys: dirty,
        labelByModuleKey: moduleLabelByKey,
      }),
    [dirty, filtered, matrix, moduleLabelByKey]
  );

  const capabilityBadges = useMemo(() => buildCapabilitySystemBadges(capabilityModel), [capabilityModel]);

  useEffect(() => {
    if (!isSuper || loading || repairingMissing || !missingRegistryModuleKeys.length) return;

    let cancelled = false;
    const repairMissingRegistryCoverage = async () => {
      setRepairingMissing(true);
      try {
        const permissionSeeds = buildMissingPermissionSeeds(missingRegistryModuleKeys);
        const { data: insertedPermissions, error: insertError } = await supabase
          .from("permissions")
          .upsert(permissionSeeds, { onConflict: "module_key,action" })
          .select("id,module_key");

        if (insertError) {
          toast.error(insertError.message);
          return;
        }

        const roleSeeds = (insertedPermissions ?? []).flatMap((permission) =>
          ROLES.map((role) => ({
            role,
            permission_id: permission.id,
            level: defaultGlobalRolePermissionLevel(role as GlobalRbacRole, permission.module_key),
          })),
        );

        if (roleSeeds.length) {
          const { error: roleError } = await supabase
            .from("role_permissions")
            .upsert(roleSeeds as any, { onConflict: "role,permission_id" });

          if (roleError) {
            toast.error(roleError.message);
            return;
          }
        }

        queryClient.invalidateQueries({ queryKey: ["module-enabled"] });
        queryClient.invalidateQueries({ queryKey: ["accessible-module-keys"] });
        broadcastModuleAccessSync();
        await loadPermissions();
        if (!cancelled) {
          toast.success(`Auto-seeded ${permissionSeeds.length} missing registry permission group(s).`);
        }
      } finally {
        if (!cancelled) setRepairingMissing(false);
      }
    };

    void repairMissingRegistryCoverage();

    return () => {
      cancelled = true;
    };
  }, [isSuper, loading, repairingMissing, missingRegistryModuleKeys, queryClient]);

  useEffect(() => {
    if (!isSuper || loading || repairingDefaultMatrix || !defaultMatrixRepairPlan.rowsToUpsert.length) return;

    let cancelled = false;
    const repairDefaultMatrix = async () => {
      setRepairingDefaultMatrix(true);
      try {
        const { error } = await supabase
          .from("role_permissions")
          .upsert(defaultMatrixRepairPlan.rowsToUpsert as any, { onConflict: "role,permission_id" });

        if (error) {
          toast.error(error.message);
          return;
        }

        queryClient.invalidateQueries({ queryKey: ["module-enabled"] });
        queryClient.invalidateQueries({ queryKey: ["accessible-module-keys"] });
        broadcastModuleAccessSync();
        await loadPermissions();
        if (!cancelled) {
          toast.success(`Repaired ${defaultMatrixRepairPlan.rowsToUpsert.length} default RBAC cell(s).`);
        }
      } finally {
        if (!cancelled) setRepairingDefaultMatrix(false);
      }
    };

    void repairDefaultMatrix();

    return () => {
      cancelled = true;
    };
  }, [defaultMatrixRepairPlan, isSuper, loadPermissions, loading, queryClient, repairingDefaultMatrix]);

  const pag = usePagination({ data: filtered, pageSize: 10 });

  const setCell = (role: AppRole, pid: string, level: Level) => {
    if (!isSuper) return;
    const key = `${role}:${pid}`;
    setMatrix((prev) => new Map(prev).set(key, level));
    setDirty((prev) => new Set(prev).add(key));
  };

  const cycle = (role: AppRole, pid: string) => {
    const cur = matrix.get(`${role}:${pid}`) ?? "none";
    const next = CAPABILITY_LEVELS[(CAPABILITY_LEVELS.indexOf(cur) + 1) % CAPABILITY_LEVELS.length];
    setCell(role, pid, next);
  };

  const injectVisibleModules = () => {
    const overrides = capabilityModel.groups.map((group) => ({
      moduleKey: group.moduleKey,
      level: group.highestLevel,
      label: group.label,
      reason: "Injected from the permissions console",
      source: "injected" as const,
    }));
    setCapabilityRuntimeOverrides(overrides);
    queryClient.invalidateQueries({ queryKey: ["module-enabled"] });
    queryClient.invalidateQueries({ queryKey: ["accessible-module-keys"] });
    broadcastModuleAccessSync();
    toast.success(`Injected ${overrides.length} runtime capability override(s).`);
  };

  const clearRuntimeOverrides = () => {
    clearCapabilityRuntimeOverrides();
    queryClient.invalidateQueries({ queryKey: ["module-enabled"] });
    queryClient.invalidateQueries({ queryKey: ["accessible-module-keys"] });
    broadcastModuleAccessSync();
    toast.success("Cleared runtime capability overrides.");
  };

  const save = async () => {
    if (!dirty.size) return;
    if (!(await tableExists("role_permissions"))) {
      toast.error("Role permissions table is not available yet.");
      return;
    }
    setSaving(true);
    const rows = Array.from(dirty).map((k) => {
      const [role, permission_id] = k.split(":") as [AppRole, string];
      return { role, permission_id, level: matrix.get(k) ?? "none" };
    });
    const { error } = await supabase.from("role_permissions").upsert(rows as any, { onConflict: "role,permission_id" });
    if (error) toast.error(error.message);
    else {
      setDirty(new Set());
      queryClient.invalidateQueries({ queryKey: ["module-enabled"] });
      queryClient.invalidateQueries({ queryKey: ["accessible-module-keys"] });
      broadcastModuleAccessSync();
      toast.success(`Saved ${rows.length} permission cells`);
    }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader
        title="Permission Matrix"
        subtitle="Default Permission Matrix · roles × modules × access levels"
        icon={<Shield className="h-6 w-6" />}
        actions={
          <Button onClick={save} disabled={!dirty.size || saving || !isSuper}
            className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save {dirty.size > 0 && <Badge variant="secondary" className="ml-2">{dirty.size}</Badge>}
          </Button>
        }
      />

      <Card className="glass mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-0 w-full sm:min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="permSearch" name="permSearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search modules, roles, or access levels" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CAPABILITY_LEVELS.map((l) => (
              <Badge key={l} variant="secondary" className={cn("font-mono", CAPABILITY_LEVEL_COLOR[l])}>
                {CAPABILITY_LEVEL_CHAR[l]} {l}
              </Badge>
            ))}
          </div>
          {!isSuper && (
            <Badge variant="secondary" className="bg-warning/15 text-warning">Read-only — super admin required to edit</Badge>
          )}
        </div>
      </Card>

      <Card className="glass mb-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            { label: "Permission groups", value: capabilityModel.summary.moduleCount, sub: `${capabilityModel.summary.permissionCount} permissions`, className: "text-primary" },
            { label: "App groups", value: globalCoverage.totalRules, sub: `${globalCoverage.coveredRules} covered`, className: "text-success" },
            { label: "Assigned cells", value: capabilityModel.summary.assignedCount, sub: `${capabilityModel.summary.roleCount} roles`, className: "text-success" },
            { label: "Coverage gap", value: globalCoverage.missingRules, sub: "Need seed or mapping", className: "text-warning" },
          ].map((item) => (
            <Card key={item.label} className="p-4 text-center">
              <p className={cn("font-display text-3xl font-bold", item.className)}>{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{item.sub}</p>
            </Card>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">Default RBAC audit</p>
              <p className="text-xs text-muted-foreground">
                Checks the seeded defaults for every role against the global access registry.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {defaultRbacAudit.totalPermissions} permission rows audited
              </Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {defaultMatrixRepairPlan.actualCells}/{defaultMatrixRepairPlan.expectedCells} loaded cells
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  defaultMatrixRepairPlan.missingCells === 0 ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                )}
              >
                {defaultMatrixRepairPlan.missingCells === 0
                  ? "0 repair cells"
                  : `${defaultMatrixRepairPlan.missingCells} repair cell(s)`}
              </Badge>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                {defaultRbacAudit.fullAccessRoles.length} full-access roles
              </Badge>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {defaultRbacAudit.roles.map((roleAudit) => {
              const detailParts = [
                roleAudit.counts.manage ? `manage ${roleAudit.counts.manage}` : null,
                roleAudit.counts.edit ? `edit ${roleAudit.counts.edit}` : null,
                roleAudit.counts.create ? `create ${roleAudit.counts.create}` : null,
                roleAudit.counts.approve ? `approve ${roleAudit.counts.approve}` : null,
                roleAudit.counts.delete ? `delete ${roleAudit.counts.delete}` : null,
                roleAudit.counts.export ? `export ${roleAudit.counts.export}` : null,
                roleAudit.counts.view ? `view ${roleAudit.counts.view}` : null,
                roleAudit.counts.none ? `none ${roleAudit.counts.none}` : null,
              ].filter(Boolean);

              return (
                <Badge
                  key={roleAudit.role}
                  variant="secondary"
                  className={cn(
                    "gap-1.5",
                    roleAudit.accessCount === roleAudit.total
                      ? "bg-success/15 text-success"
                      : roleAudit.sparse
                        ? "bg-warning/15 text-warning"
                        : "bg-primary/10 text-primary",
                  )}
                >
                  {ROLE_LABEL[roleAudit.role]}
                  <span className="font-mono text-[10px] opacity-80">
                    {roleAudit.accessCount}/{roleAudit.total}
                  </span>
                  <span className="font-mono text-[10px] opacity-70">
                    {detailParts.length ? detailParts.join(" · ") : "none"}
                  </span>
                </Badge>
              );
            })}
          </div>
          {defaultMatrixRepairPlan.missingCells === 0 ? (
            <p className="mt-3 text-xs text-success">
              Matrix defaults are aligned. Super admin, admin, and principal are fully open across the loaded permission rows.
            </p>
          ) : (
            <p className="mt-3 text-xs text-warning">
              Repairing missing defaults for {defaultMatrixRepairPlan.missingCells} matrix cell(s) now.
            </p>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            {filtered.length} visible rows
          </Badge>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {globalCoverage.coveredKeys} controlled keys
          </Badge>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            Search across roles × modules × levels
          </Badge>
          {globalCoverage.missingExamples.map((rule) => (
            <Badge key={rule.path} variant="secondary" className="bg-warning/15 text-warning">
              missing {rule.label}
            </Badge>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3">
            <div>
              <p className="text-sm font-semibold">Realtime diagnostics</p>
              <p className="text-xs text-muted-foreground">
                Shows whether the permissions channel is subscribed and whether change events are arriving.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  realtimeStatus === "subscribed" && "bg-success/15 text-success",
                  realtimeStatus === "connecting" && "bg-primary/15 text-primary",
                  realtimeStatus === "closed" && "bg-muted text-muted-foreground",
                  (realtimeStatus === "channel_error" || realtimeStatus === "timed_out") && "bg-destructive/15 text-destructive",
                )}
              >
                {realtimeStatus}
              </Badge>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {realtimeEventCount} event(s)
              </Badge>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {realtimeLastEvent ?? "No events yet"}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/60 p-3">
            <div>
              <p className="text-sm font-semibold">Runtime capability injection</p>
              <p className="text-xs text-muted-foreground">
                Temporary overrides help test access changes without mutating the database.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {runtimeSnapshot.overrides.length} override(s)
              </Badge>
              <Badge variant="secondary" className="bg-success/10 text-success">
                {runtimeSnapshot.overrides.filter((override) => override.level !== "none").length} enabled
              </Badge>
              <Button variant="outline" className="rounded-xl" onClick={injectVisibleModules} disabled={!capabilityModel.groups.length || !isSuper}>
                Inject visible modules
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={clearRuntimeOverrides} disabled={!runtimeSnapshot.overrides.length || !isSuper}>
                Clear runtime
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Supabase SQL check</p>
                <p className="text-xs text-muted-foreground">
                  Run this in the SQL editor to confirm the realtime publication includes the RBAC tables.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                  exact check
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => void copyToClipboard(REALTIME_PUBLICATION_SQL, "Check SQL")}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy check
                </Button>
              </div>
            </div>
            <pre className="overflow-auto rounded-xl border border-border/60 bg-background/80 p-3 text-[11px] leading-5 text-muted-foreground">
              <code>{REALTIME_PUBLICATION_SQL}</code>
            </pre>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Publication repair SQL</p>
                <p className="text-xs text-muted-foreground">
                  Run this if the check returns no rows, or if you want to re-apply the publication safely.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => void copyToClipboard(REALTIME_PUBLICATION_FIX_SQL, "Repair SQL")}
              >
                <Copy className="mr-1 h-3 w-3" />
                Copy repair
              </Button>
            </div>
            <pre className="overflow-auto rounded-xl border border-border/60 bg-background/80 p-3 text-[11px] leading-5 text-muted-foreground">
              <code>{REALTIME_PUBLICATION_FIX_SQL}</code>
            </pre>
          </div>

          <div className="flex flex-wrap gap-2">
            {capabilityBadges.slice(0, 8).map((badge) => (
              <Badge key={badge.key} variant="secondary" className={cn("gap-1.5", buildCapabilityRuntimeBadgeClass(badge.level))}>
                {badge.label}
                <span className="font-mono text-[10px] opacity-80">{badge.value}</span>
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {capabilityModel.groups.slice(0, 8).map((group) => (
              <Badge
                key={group.moduleKey}
                variant="secondary"
                className={cn(
                  "gap-1.5",
                  group.highestLevel === "manage" && "bg-gradient-primary text-primary-foreground",
                  group.highestLevel === "delete" && "bg-destructive/15 text-destructive",
                  group.highestLevel === "edit" && "bg-warning/15 text-warning",
                  group.highestLevel === "create" && "bg-success/15 text-success",
                  group.highestLevel === "view" && "bg-primary/15 text-primary",
                )}
              >
                {group.label}
                <span className="font-mono text-[10px] opacity-80">{group.permissionCount}</span>
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {capabilityModel.roleSummaries.map((roleSummary) => (
              <Badge
                key={roleSummary.role}
                variant="secondary"
                className={cn(
                  "gap-1.5",
                  CAPABILITY_LEVEL_COLOR[roleSummary.highestLevel],
                )}
              >
                {ROLE_LABEL[roleSummary.role]} {roleSummary.grantedCount}
                <span className="font-mono text-[10px] opacity-80">{CAPABILITY_LEVEL_CHAR[roleSummary.highestLevel]}</span>
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      <Card className="glass overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-auto">
            <TablePagination {...pag} />
            <table className="min-w-full border-collapse text-xs">
              <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <tr>
                  <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-border bg-card/95 p-2 text-left">Module · Action</th>
                  {ROLES.map((r) => (
                    <th key={r} className="border-b border-border p-2 text-center font-medium text-muted-foreground">{ROLE_LABEL[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pag.pageData.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    {(() => {
                      const runtimeOverride = runtimeSnapshot.overrides.find((override) => override.moduleKey === p.module_key);
                      return (
                    <td className="sticky left-0 z-10 border-b border-r border-border bg-card/95 p-2">
                      <div className="font-medium">{p.label}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{p.module_key}.{p.action}</div>
                      {runtimeOverride && (
                        <Badge variant="secondary" className={cn("mt-2 text-[9px]", buildCapabilityRuntimeBadgeClass(runtimeOverride.level))}>
                          runtime {runtimeOverride.level}
                        </Badge>
                      )}
                    </td>
                      );
                    })()}
                    {ROLES.map((r) => {
                      const lvl = matrix.get(`${r}:${p.id}`) ?? "none";
                      const key = `${r}:${p.id}`;
                      return (
                        <td key={r} className="border-b border-border p-1 text-center">
                          <button
                            onClick={() => cycle(r, p.id)}
                            disabled={!isSuper}
                            title={`${r} → ${lvl}`}
                            className={cn(
                              "h-7 w-9 rounded-md font-mono text-[11px] font-semibold transition-all",
                              CAPABILITY_LEVEL_COLOR[lvl],
                              isSuper && "hover:scale-110",
                              dirty.has(key) && "ring-2 ring-primary",
                            )}
                          >{CAPABILITY_LEVEL_CHAR[lvl]}</button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
