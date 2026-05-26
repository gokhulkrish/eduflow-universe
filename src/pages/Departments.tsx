import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Building2, Plus, Trash2, Search } from "lucide-react";
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
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

type Department = { id: string; departmentName: string; departmentCode: string; hodName: string; programLevel: string; sanctionedIntake: number; naacNbaStatus: string; };
const DEPT_KEY = "eduflow_departments";
function ls(): Department[] { try { return JSON.parse(localStorage.getItem(DEPT_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Department[]) { localStorage.setItem(DEPT_KEY, JSON.stringify(v)); emitAppSync(DEPT_KEY); }

export default function Departments() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [code, setCode] = useState(""); const [hod, setHod] = useState(""); const [level, setLevel] = useState(""); const [intake, setIntake] = useState(""); const [naac, setNaac] = useState("");
  const filtered = items.filter((d) => !search || d.departmentName.toLowerCase().includes(search.toLowerCase()) || d.departmentCode.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([DEPT_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Departments & Programs" subtitle="Department registry, HOD ownership & accreditation mapping" icon={<Building2 className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Departments</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Program Levels</p><p className="text-2xl font-bold">{new Set(items.map((d) => d.programLevel).filter(Boolean)).size}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Intake</p><p className="text-2xl font-bold">{items.reduce((s, d) => s + d.sanctionedIntake, 0)}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Accredited</p><p className="text-2xl font-bold">{items.filter((d) => d.naacNbaStatus === "Accredited").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="deptSearch" name="deptSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setCode(""); setHod(""); setLevel(""); setIntake(""); setNaac(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Department</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Department</TableHead><TableHead className="text-xs">Code</TableHead><TableHead className="text-xs">HOD</TableHead><TableHead className="text-xs">Level</TableHead><TableHead className="text-xs">Intake</TableHead><TableHead className="text-xs">NAAC/NBA</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((d) => (
            <TableRow key={d.id}>
              <TableCell className="text-xs font-medium">{d.departmentName}</TableCell>
              <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{d.departmentCode}</Badge></TableCell>
              <TableCell className="text-xs">{d.hodName || "—"}</TableCell>
              <TableCell className="text-xs">{d.programLevel || "—"}</TableCell>
              <TableCell className="text-xs">{d.sanctionedIntake || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${d.naacNbaStatus === "Accredited" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{d.naacNbaStatus || "—"}</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== d.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching departments" : "No departments added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Department</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="deptName">Department Name</Label><Input id="deptName" name="deptName" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="deptCode">Department Code</Label><Input id="deptCode" name="deptCode" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. CSE" /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="hod">HOD / Coordinator</Label><Input id="hod" name="hod" value={hod} onChange={(e) => setHod(e.target.value)} /></div><div><Label className="text-xs" htmlFor="level">Program Level</Label><Select name="level" value={level} onValueChange={setLevel}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="UG">UG</SelectItem><SelectItem value="PG">PG</SelectItem><SelectItem value="Research">Research</SelectItem><SelectItem value="Diploma">Diploma</SelectItem><SelectItem value="Certificate">Certificate</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="intake">Sanctioned Intake</Label><Input id="intake" name="intake" type="number" value={intake} onChange={(e) => setIntake(e.target.value)} /></div><div><Label className="text-xs" htmlFor="naac">NAAC / NBA Status</Label><Select name="naac" value={naac} onValueChange={setNaac}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Not Applied">Not Applied</SelectItem><SelectItem value="Applied">Applied</SelectItem><SelectItem value="Accredited">Accredited</SelectItem><SelectItem value="Re-Accreditation Due">Re-Accreditation Due</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name || !code} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), departmentName: name, departmentCode: code, hodName: hod, programLevel: level, sanctionedIntake: Number(intake) || 0, naacNbaStatus: naac }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
