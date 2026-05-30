import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Users, Plus, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useRealtime } from "@/lib/use-realtime";
import { getFaculty, createFaculty, deleteFaculty, EMPLOYMENT_STATUSES, type FacultyHr } from "@/lib/faculty-hr";

export default function FacultyHR() {
  const [items, setItems] = useState<FacultyHr[]>([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(""); const refresh = async () => setItems(await getFaculty());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [code, setCode] = useState(""); const [designation, setDesignation] = useState(""); const [department, setDepartment] = useState(""); const [workload, setWorkload] = useState(""); const [status, setStatus] = useState("");
  const filtered = items.filter((e) => !search || e.facultyName.toLowerCase().includes(search.toLowerCase()) || e.employeeCode.toLowerCase().includes(search.toLowerCase()) || e.departmentName.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => { refresh().then(() => setLoading(false)); }, []); useRealtime("faculty_hr", refresh);

  return (
    <div>
      <PageHeader title="Faculty & HR" subtitle="Faculty profiles, workload, appointments, leave, and compliance documentation" icon={<Users className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Faculty</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Departments</p><p className="text-2xl font-bold">{new Set(items.map((e) => e.departmentName).filter(Boolean)).size}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Workload</p><p className="text-2xl font-bold">{items.reduce((s, e) => s + e.workloadHours, 0)} hrs</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Active</p><p className="text-2xl font-bold">{items.filter((e) => e.employmentStatus === "Active").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="facultySearch" name="facultySearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search faculty..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setCode(""); setDesignation(""); setDepartment(""); setWorkload(""); setStatus(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Faculty</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Code</TableHead><TableHead className="text-xs">Designation</TableHead><TableHead className="text-xs">Department</TableHead><TableHead className="text-xs">Workload</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="text-xs font-medium">{e.facultyName}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{e.employeeCode}</Badge></TableCell>
              <TableCell className="text-xs">{e.designation || "—"}</TableCell>
              <TableCell className="text-xs">{e.departmentName || "—"}</TableCell>
              <TableCell className="text-xs">{e.workloadHours || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${e.employmentStatus === "Active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{e.employmentStatus || "—"}</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={async () => { await deleteFaculty(e.id); await refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching faculty" : "No faculty added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Faculty / Staff</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="facultyName">Faculty / Staff Name</Label><Input id="facultyName" name="facultyName" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="employeeCode">Employee Code</Label><Input id="employeeCode" name="employeeCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. EMP001" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="designation">Designation</Label><Input id="designation" name="designation" value={designation} onChange={(e) => setDesignation(e.target.value)} /></div><div><Label className="text-xs" htmlFor="departmentName">Department</Label><Input id="departmentName" name="departmentName" value={department} onChange={(e) => setDepartment(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="workloadHours">Weekly Workload Hours</Label><Input id="workloadHours" name="workloadHours" type="number" value={workload} onChange={(e) => setWorkload(e.target.value)} /></div><div><Label className="text-xs" htmlFor="employmentStatus">Employment Status</Label><Select name="employmentStatus" value={status} onValueChange={setStatus}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{EMPLOYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !code} onClick={async () => { await createFaculty({ facultyName: name, employeeCode: code, designation, departmentName: department, workloadHours: Number(workload) || 0, employmentStatus: status }); await refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
