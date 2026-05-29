import "@/lib/runtime-storage";
import { useEffect, useState, useCallback } from "react";
import { Shield, Plus, Trash2, UserCog, Lock, Unlock, Pencil, Loader2, CheckCircle, XCircle, Eye, Ban, Upload, History, Users, Mail, Copy, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { Separator } from "@/components/ui/separator";
import { generateId } from "@/lib/utils";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import UserImportDialog from "@/components/UserImportDialog";
import UserGroupManager from "@/components/UserGroupManager";
import UserInviteDialog from "@/components/UserInviteDialog";
import {
  loadUsers,
  loadRoles,
  loadPermissions,
  saveUser,
  deleteUser as deleteUserSvc,
  saveRole,
  deleteRole as deleteRoleSvc,
  loadAuditLogs,
  createInvitation,
  bulkImportUsers,
} from "@/lib/user-management-service";
import {
  validateUserManagementState,
  migrateFromLegacyKeys,
  type UserManagementState,
  type RoleContract,
  type PermissionContract,
  SYSTEM_PERMISSIONS,
} from "@/lib/user-management-state";

const permissionLabelMap: Record<string, string> = Object.fromEntries(
  SYSTEM_PERMISSIONS.map((p) => [p.key, p.label])
);

const permissionKeyToLabel = (key: string): string => permissionLabelMap[key] ?? key;
const defaultPermissions = SYSTEM_PERMISSIONS.map((p) => p.key);

const ADMIN_ROLES: AppRole[] = ["super_admin", "admin"];

const statusBadge = (status: string) => {
  if (status === "active") return "bg-success/15 text-success";
  if (status === "pending") return "bg-warning/15 text-warning";
  return "bg-muted text-muted-foreground";
};

export default function UserManagement() {
  const { user, roles: appRoles, loading: authLoading } = useAuth();
  const isAdmin = appRoles.some((r) => ADMIN_ROLES.includes(r));
  const canManage = isAdmin;

  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortCol, setSortCol] = useState<"name" | "email" | "role" | "createdAt">("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<UserManagementState[]>([]);
  const [roles, setRoles] = useState<RoleContract[]>([]);
  const [_permissions, setPermissions] = useState<PermissionContract[]>([]);

  const refresh = useCallback(async () => {
    migrateFromLegacyKeys();
    try {
      const [u, r, p] = await Promise.all([loadUsers(), loadRoles(), loadPermissions()]);
      setUsers(u);
      setRoles(r);
      setPermissions(p);
    } catch (err) {
      toast.error("Failed to load: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleSort = (col: typeof sortCol) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };
  const SortIcon = ({ col }: { col: typeof sortCol }) => (
    <span className="ml-1 text-muted-foreground">{sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}</span>
  );

  const pending = users.filter((u) => u.status === "pending");
  const active = users.filter((u) => u.status === "active");
  const inactive = users.filter((u) => u.status !== "active" && u.status !== "pending");

  const uniqueRoles = [...new Set(users.map((u) => u.role))].filter(Boolean).sort();
  const uniqueDepts = [...new Set(users.map((u) => u.department))].filter(Boolean).sort();

  const filtered = (tab === "approvals" ? pending : users)
    .filter((u) => {
      if (!search) return true;
      const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
      const haystack = [u.name, u.email, u.role, u.department].filter(Boolean).join(" ").toLowerCase();
      return terms.every((term) => haystack.includes(term));
    })
    .filter((u) => filterRole === "all" || u.role === filterRole)
    .filter((u) => filterDept === "all" || u.department === filterDept)
    .filter((u) => filterStatus === "all" || u.status === filterStatus)
    .sort((a, b) => {
      const av = a[sortCol] ?? "";
      const bv = b[sortCol] ?? "";
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
  const pag = usePagination({ data: filtered, pageSize: 10 });

  const [uOpen, setUOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUser, setPreviewUser] = useState<UserManagementState | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [uName, setUName] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uRole, setURole] = useState("");
  const [uDept, setUDept] = useState("");
  const [requireApproval, setRequireApproval] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<Record<string, unknown>[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const logs = await loadAuditLogs();
      setAuditLogs(logs);
    } catch {} finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === "audit") loadAudit(); }, [tab, loadAudit]);

  const openAddUser = () => {
    setEditingUserId(null);
    setUName(""); setUEmail(""); setURole(""); setUDept("");
    setRequireApproval(true);
    setUOpen(true);
  };

  const openEditUser = (u: UserManagementState) => {
    setEditingUserId(u.id);
    setUName(u.name);
    setUEmail(u.email);
    setURole(u.role);
    setUDept(u.department);
    setRequireApproval(false);
    setUOpen(true);
  };

  const showPreview = () => {
    const now = new Date().toISOString();
    const target: UserManagementState = editingUserId
      ? { ...users.find((x) => x.id === editingUserId)!, name: uName, email: uEmail, role: uRole, department: uDept, updatedAt: now }
      : {
          id: generateId(),
          name: uName,
          email: uEmail,
          role: uRole,
          department: uDept,
          status: requireApproval ? "pending" : "active",
          permissions: roles.find((r) => r.name === uRole)?.permissions ?? [],
          lastLogin: null,
          createdAt: now,
          updatedAt: now,
        };
    setPreviewUser(target);
    setUOpen(false);
    setPreviewOpen(true);
  };

  const confirmSave = async () => {
    if (!previewUser) return;
    const target = previewUser;
    const val = validateUserManagementState({
      users: editingUserId ? users.map((u) => (u.id === editingUserId ? target : u)) : [...users, target],
    });
    if (!val.valid) {
      val.errors.forEach((e) => toast.error(e));
      return;
    }
    const result = await saveUser(target);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save");
      return;
    }
    await refresh();
    setPreviewOpen(false);
    setPreviewUser(null);
    toast.success(editingUserId ? "User updated" : editingUserId ? "User updated" : requireApproval ? "User created — pending approval" : "User created");
  };

  const toggleUserStatus = async (u: UserManagementState) => {
    const nextStatus: UserManagementState["status"] = u.status === "active" ? "inactive" : "active";
    const updated = { ...u, status: nextStatus, updatedAt: new Date().toISOString() };
    const result = await saveUser(updated);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update");
      return;
    }
    await refresh();
    toast.success(nextStatus === "active" ? "User activated" : "User deactivated");
  };

  const approveUser = async (u: UserManagementState) => {
    const updated = { ...u, status: "active" as const, updatedAt: new Date().toISOString() };
    const result = await saveUser(updated);
    if (!result.success) {
      toast.error(result.error ?? "Failed to approve");
      return;
    }
    await refresh();
    toast.success(`${u.name} approved`);
  };

  const rejectUser = async (u: UserManagementState) => {
    const result = await deleteUserSvc(u.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to reject");
      return;
    }
    await refresh();
    toast.success(`${u.name} rejected and removed`);
  };

  const deleteUserAction = async (id: string) => {
    const result = await deleteUserSvc(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete");
      return;
    }
    await refresh();
    toast.success("User deleted");
  };

  const [roleOpen, setRoleOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleName, setRoleName] = useState("");
  const [rolePerms, setRolePerms] = useState<string[]>([]);

  const openAddRole = () => {
    setEditingRoleId(null);
    setRoleName("");
    setRolePerms([]);
    setRoleOpen(true);
  };

  const openEditRole = (r: RoleContract) => {
    setEditingRoleId(r.id);
    setRoleName(r.name);
    setRolePerms(r.permissions);
    setRoleOpen(true);
  };

  const saveRoleAction = async () => {
    const now = new Date().toISOString();
    let target: RoleContract;
    if (editingRoleId) {
      const existing = roles.find((r) => r.id === editingRoleId);
      if (!existing) return;
      target = { ...existing, name: roleName, permissions: rolePerms, description: roleName };
    } else {
      target = {
        id: generateId(),
        name: roleName,
        description: roleName,
        permissions: rolePerms,
        isSystemRole: false,
        createdAt: now,
      };
    }
    const val = validateUserManagementState({
      roles: editingRoleId ? roles.map((r) => (r.id === editingRoleId ? target : r)) : [...roles, target],
    });
    if (!val.valid) {
      val.errors.forEach((e) => toast.error(e));
      return;
    }
    const result = await saveRole(target);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save");
      return;
    }
    await refresh();
    setRoleOpen(false);
    toast.success(editingRoleId ? "Role updated" : "Role created");
  };

  const deleteRoleAction = async (id: string) => {
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    const assignedUsers = users.filter((u) => u.role === role.name);
    if (assignedUsers.length > 0) {
      toast.error(
        `Cannot delete "${role.name}" — ${assignedUsers.length} user${assignedUsers.length > 1 ? "s" : ""} assigned (${assignedUsers.map((u) => u.name).join(", ")})`
      );
      return;
    }
    const result = await deleteRoleSvc(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete");
      return;
    }
    await refresh();
    toast.success("Role deleted");
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelected((prev) => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map((u) => u.id));
    });
  };
  const bulkApprove = async () => {
    for (const id of selected) {
      const u = users.find((x) => x.id === id);
      if (u && u.status === "pending") await approveUser(u);
    }
    setSelected(new Set());
  };
  const bulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} selected user(s)?`)) return;
    for (const id of selected) await deleteUserAction(id);
    setSelected(new Set());
  };
  const exportCsv = () => {
    const header = "Name,Email,Role,Department,Status,Created\n";
    const rows = filtered.map((u) =>
      [u.name, u.email, u.role, u.department, u.status, new Date(u.createdAt).toLocaleDateString()].join(",")
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-management-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported users to CSV");
  };

  if (loading || authLoading) {
    return (
      <div>
        <PageHeader title="User Management" subtitle="Manage users, roles & permissions" icon={<Shield className="h-6 w-6" />} />
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="User Management" subtitle="Manage users, roles & permissions" icon={<Shield className="h-6 w-6" />} />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Ban className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">Authentication required</p>
            <p className="text-sm text-muted-foreground">Please sign in to access User Management</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div>
        <PageHeader title="User Management" subtitle="Manage users, roles & permissions" icon={<Shield className="h-6 w-6" />} />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 max-w-md text-center">
            <Shield className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">Access Restricted</p>
            <p className="text-sm text-muted-foreground">
              You need an <strong>Administrator</strong> or <strong>Super Admin</strong> role to manage users and roles.
              Your current roles: {appRoles.join(", ") || "none"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage users, roles & permissions" icon={<Shield className="h-6 w-6" />} />
      <Card className="mb-4 p-3">
        <div className="flex items-center gap-3 text-sm">
          <UserCog className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{user.email ?? "Authenticated"}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">Roles: {appRoles.join(", ")}</span>
          <span className="text-muted-foreground">·</span>
          <Badge className={`text-[9px] ${canManage ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
            {canManage ? "Full access" : "Read only"}
          </Badge>
        </div>
      </Card>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users ({active.length})</TabsTrigger>
          <TabsTrigger value="approvals" className="relative">
            Approvals
            {pending.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[8px] rounded-full h-4 w-4 flex items-center justify-center font-medium">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="groups">Groups</TabsTrigger>
          <TabsTrigger value="audit">
            <History className="h-3.5 w-3.5 mr-1" /> Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="flex justify-between mb-4 gap-3">
            <Input
              id="userSearch"
              name="userSearch"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs h-9 rounded-xl"
            />
            <div className="flex gap-2 items-center">
              <select
                name="filterRole"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="h-9 rounded-lg border bg-background px-2 text-xs"
              >
                <option value="all">All Roles</option>
                {uniqueRoles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                name="filterDept"
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="h-9 rounded-lg border bg-background px-2 text-xs"
              >
                <option value="all">All Departments</option>
                {uniqueDepts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select
                name="filterStatus"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 rounded-lg border bg-background px-2 text-xs"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
              <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAddUser}>
                <Plus className="h-4 w-4 mr-1" /> Add User
              </Button>
            </div>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={bulkApprove}>Approve</Button>
              <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={bulkDelete}>Delete</Button>
              <Button size="sm" variant="outline" className="rounded-xl ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          )}
          <div className="flex items-center gap-2 mb-3">
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setImportOpen(true)}>
              <Upload className="h-3.5 w-3.5 mr-1" /> Import CSV
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setInviteOpen(true)}>
              <Mail className="h-3.5 w-3.5 mr-1" /> Invite User
            </Button>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={exportCsv}>Export CSV</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="p-4">
              <p className="text-[10px] text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-success">{active.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[10px] text-muted-foreground">Pending Approval</p>
              <p className="text-2xl font-bold text-warning">{pending.length}</p>
            </Card>
          </div>
          <TablePagination {...pag} />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs w-8">
                  <input type="checkbox" name="selectAll" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
                </TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("name")}>Name <SortIcon col="name" /></TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("email")}>Email <SortIcon col="email" /></TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("role")}>Role <SortIcon col="role" /></TableHead>
                <TableHead className="text-xs">Department</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>Created <SortIcon col="createdAt" /></TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="w-8">
                    <input type="checkbox" name="selectUser" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded" />
                  </TableCell>
                  <TableCell className="text-xs font-medium">{u.name}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell>
                    <Badge className="text-[9px] bg-primary/15 text-primary">{u.role}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{u.department || "—"}</TableCell>
                  <TableCell>
                    <Badge className={`text-[9px] ${statusBadge(u.status)}`}>{u.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openEditUser(u)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => toggleUserStatus(u)}>
                        {u.status === "active" ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => deleteUserAction(u.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">
                    {search ? "No matching users" : "No users created"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="approvals">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              {pending.length === 0 ? "No pending approvals" : `${pending.length} user${pending.length > 1 ? "s" : ""} pending approval`}
            </p>
          </div>
          <div className="space-y-3">
            {pending.map((u) => (
              <Card key={u.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email} · {u.role} · {u.department || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">Requested {new Date(u.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-xl bg-success text-success-foreground" onClick={() => approveUser(u)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={() => rejectUser(u)}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex flex-wrap gap-1">
                    {u.permissions.map((p) => (
                      <Badge key={p} className="text-[8px] bg-muted text-muted-foreground">
                        {permissionKeyToLabel(p)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {pending.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No pending approvals</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <div className="flex justify-end mb-4">
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAddRole}>
              <Plus className="h-4 w-4 mr-1" /> New Role
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserCog className="h-4 w-4" />
                    {r.name}
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEditRole(r)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {!r.isSystemRole && (
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteRoleAction(r.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {r.permissions.map((p) => (
                      <Badge key={p} className="text-[8px] bg-muted text-muted-foreground">
                        {permissionKeyToLabel(p)}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {roles.length === 0 && (
              <Card className="col-span-full">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">No roles defined</CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="groups">
          <UserGroupManager users={users} onRefresh={refresh} />
        </TabsContent>

        <TabsContent value="audit">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">Recent activity for user and role management</p>
          </div>
          {auditLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No audit entries found</div>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Target</TableHead>
                    <TableHead className="text-xs">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-[10px] whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge className="text-[9px] bg-muted text-muted-foreground">
                          {(entry.action as string)?.replace(/^user_management\./, "") || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{entry.entity_id ? String(entry.entity_id).substring(0, 8) + "…" : "—"}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground max-w-xs truncate">
                        {entry.metadata ? JSON.stringify(entry.metadata) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="mt-3">
            <Button size="sm" variant="outline" className="rounded-xl" onClick={loadAudit}>
              <History className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={uOpen} onOpenChange={setUOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editingUserId ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="userName">Name</Label>
                <Input id="userName" name="userName" value={uName} onChange={(e) => setUName(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs" htmlFor="userEmail">Email</Label>
                <Input id="userEmail" name="userEmail" type="email" value={uEmail} onChange={(e) => setUEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="userRole">Role</Label>
                <Select name="userRole" value={uRole} onValueChange={setURole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="userDept">Department</Label>
                <Input id="userDept" name="userDept" value={uDept} onChange={(e) => setUDept(e.target.value)} />
              </div>
            </div>
            {!editingUserId && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} className="rounded" />
                Require approval before activation
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUOpen(false)}>Cancel</Button>
            <Button onClick={showPreview} disabled={!uName || !uEmail || !uRole}>
              {editingUserId ? "Save Changes" : "Review & Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Review User</DialogTitle></DialogHeader>
          {previewUser && (
            <Tabs defaultValue="preview">
              <TabsList className="mb-3">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCog className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{previewUser.name}</p>
                      <p className="text-xs text-muted-foreground">{previewUser.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground text-[10px]">Role</span><p className="text-xs font-medium">{previewUser.role}</p></div>
                    <div><span className="text-muted-foreground text-[10px]">Department</span><p className="text-xs font-medium">{previewUser.department || "—"}</p></div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground text-[10px]">Status after creation</span>
                    <p className="text-xs font-medium">{previewUser.status === "pending" ? "Pending approval" : "Active immediately"}</p>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="permissions">
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Permissions inherited from role "{previewUser.role}":</p>
                  <div className="flex flex-wrap gap-1">
                    {previewUser.permissions.length === 0 && <p className="text-xs text-muted-foreground">No specific permissions</p>}
                    {previewUser.permissions.map((p) => (
                      <Badge key={p} className="text-[9px] bg-primary/15 text-primary">{permissionKeyToLabel(p)}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="details">
                <div className="space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Name", previewUser.name],
                      ["Email", previewUser.email],
                      ["Role", previewUser.role],
                      ["Department", previewUser.department],
                      ["Status", previewUser.status],
                      ["Permissions", previewUser.permissions.join(", ") || "—"],
                      ["Created", new Date(previewUser.createdAt).toLocaleString()],
                    ].map(([k, v]) => (
                      <>
                        <span className="text-muted-foreground">{k}</span>
                        <span className="font-medium">{v ?? "—"}</span>
                      </>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreviewOpen(false); setUOpen(true); }}>Back</Button>
            <Button onClick={confirmSave}>
              {editingUserId ? "Save Changes" : previewUser?.status === "pending" ? "Submit for Approval" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editingRoleId ? "Edit Role" : "New Role"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs" htmlFor="roleName">Role Name</Label>
              <Input id="roleName" name="roleName" value={roleName} onChange={(e) => setRoleName(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Permissions</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {defaultPermissions.map((key) => {
                  const label = permissionKeyToLabel(key);
                  return (
                    <Badge
                      key={key}
                      className={`cursor-pointer text-[9px] ${
                        rolePerms.includes(key) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                      onClick={() => setRolePerms(rolePerms.includes(key) ? rolePerms.filter((x) => x !== key) : [...rolePerms, key])}
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleOpen(false)}>Cancel</Button>
            <Button onClick={saveRoleAction} disabled={!roleName}>
              {editingRoleId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={async (rows) => bulkImportUsers(rows)}
        availableRoles={roles.map((r) => r.name)}
      />

      <UserInviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={async (email, role, department) => createInvitation(email, role, department, user?.email ?? "")}
        availableRoles={roles.map((r) => r.name)}
        inviterEmail={user?.email ?? ""}
      />
    </div>
  );
}
