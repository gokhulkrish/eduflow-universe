import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Shield, Plus, Trash2, UserCog, Lock, Unlock } from "lucide-react";
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
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

type User = { id: string; name: string; email: string; role: string; department: string; status: string; created: string; };
export const usersKey = "eduflow_users";
function ul(): User[] { try { return JSON.parse(localStorage.getItem(usersKey) ?? "[]"); } catch { return []; } }
function us(v: User[]) { localStorage.setItem(usersKey, JSON.stringify(v)); emitAppSync(usersKey); }

type Role = { id: string; name: string; permissions: string[]; };
export const rolesKey = "eduflow_roles";
function rol(): Role[] { try { return JSON.parse(localStorage.getItem(rolesKey) ?? "[]"); } catch { return []; } }
function ros(v: Role[]) { localStorage.setItem(rolesKey, JSON.stringify(v)); emitAppSync(rolesKey); }

const PERMISSIONS = ["View Students", "Edit Students", "View Fees", "Edit Fees", "Manage Users", "View Reports", "Manage Settings", "Edit Attendance", "Manage Exams"];

export default function UserManagement() {
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState(ul); const [roles, setRoles] = useState(rol);
  const ru = () => setUsers(ul); const rr = () => setRoles(rol);
  const [search, setSearch] = useState("");

  const [uOpen, setUOpen] = useState(false); const [uName, setUName] = useState(""); const [uEmail, setUEmail] = useState(""); const [uRole, setURole] = useState(""); const [uDept, setUDept] = useState("");
  const [roleOpen, setRoleOpen] = useState(false); const [roleName, setRoleName] = useState(""); const [rolePerms, setRolePerms] = useState<string[]>([]);

  const filtered = users.filter((u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([usersKey, rolesKey], () => { ru(); rr(); }), []);

  return (
    <div>
      <PageHeader title="User Management" subtitle="Manage users, roles & permissions" icon={<Shield className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="flex justify-between mb-4 gap-3">
            <Input placeholder="Search users…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9 rounded-xl" />
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setUName(""); setUEmail(""); setURole(""); setUDept(""); setUOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add User</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Users</p><p className="text-2xl font-bold">{users.length}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Active</p><p className="text-2xl font-bold text-success">{users.filter((u) => u.status === "active").length}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Inactive</p><p className="text-2xl font-bold text-muted-foreground">{users.filter((u) => u.status !== "active").length}</p></Card>
          </div>
          <TablePagination {...pag} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Email</TableHead><TableHead className="text-xs">Role</TableHead><TableHead className="text-xs">Department</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Created</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag.pageData.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="text-xs font-medium">{u.name}</TableCell>
                  <TableCell className="text-xs">{u.email}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-primary/15 text-primary">{u.role}</Badge></TableCell>
                  <TableCell className="text-xs">{u.department || "—"}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${u.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{u.status}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(u.created).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { const d = ul().map((x) => x.id === u.id ? { ...x, status: u.status === "active" ? "inactive" : "active" } : x); us(d); ru(); toast.success(u.status === "active" ? "Deactivated" : "Activated"); }}>{u.status === "active" ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}</Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { us(ul().filter((x) => x.id !== u.id)); ru(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching users" : "No users created"}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="roles">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setRoleName(""); setRolePerms([]); setRoleOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Role</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((r) => (
              <Card key={r.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><UserCog className="h-4 w-4" />{r.name}</CardTitle></CardHeader>
                <CardContent><div className="flex flex-wrap gap-1">{r.permissions.map((p) => <Badge key={p} className="text-[8px] bg-muted text-muted-foreground">{p}</Badge>)}</div></CardContent>
              </Card>
            ))}
            {roles.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No roles defined</CardContent></Card>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={uOpen} onOpenChange={setUOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Name</Label><Input value={uName} onChange={(e) => setUName(e.target.value)} /></div><div><Label className="text-xs">Email</Label><Input type="email" value={uEmail} onChange={(e) => setUEmail(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Role</Label><Select value={uRole} onValueChange={setURole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs">Department</Label><Input value={uDept} onChange={(e) => setUDept(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setUOpen(false)}>Cancel</Button><Button onClick={() => { us([...ul(), { id: crypto.randomUUID(), name: uName, email: uEmail, role: uRole, department: uDept, status: "active", created: new Date().toISOString() }]); ru(); setUOpen(false); toast.success("Added"); }} disabled={!uName || !uEmail || !uRole}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Role</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Role Name</Label><Input value={roleName} onChange={(e) => setRoleName(e.target.value)} /></div>
            <div><Label className="text-xs">Permissions</Label><div className="flex flex-wrap gap-1 mt-1">{PERMISSIONS.map((p) => <Badge key={p} className={`cursor-pointer text-[9px] ${rolePerms.includes(p) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`} onClick={() => setRolePerms(rolePerms.includes(p) ? rolePerms.filter((x) => x !== p) : [...rolePerms, p])}>{p}</Badge>)}</div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRoleOpen(false)}>Cancel</Button><Button onClick={() => { ros([...rol(), { id: crypto.randomUUID(), name: roleName, permissions: rolePerms }]); rr(); setRoleOpen(false); toast.success("Role created"); }} disabled={!roleName}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
