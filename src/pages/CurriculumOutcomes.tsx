import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2, Search } from "lucide-react";
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

type Curriculum = { id: string; curriculumName: string; courseCode: string; semester: string; outcomeMapStatus: string; syllabusCoverage: number; attainmentBand: string; };
const CURR_KEY = "eduflow_curriculum";
function ls(): Curriculum[] { try { return JSON.parse(localStorage.getItem(CURR_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Curriculum[]) { localStorage.setItem(CURR_KEY, JSON.stringify(v)); emitAppSync(CURR_KEY); }

export default function CurriculumOutcomes() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [name, setName] = useState(""); const [code, setCode] = useState(""); const [sem, setSem] = useState(""); const [mapStatus, setMapStatus] = useState(""); const [coverage, setCoverage] = useState(""); const [band, setBand] = useState("");
  const filtered = items.filter((c) => !search || c.curriculumName.toLowerCase().includes(search.toLowerCase()) || c.courseCode?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([CURR_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Curriculum & Outcomes" subtitle="Curriculum versioning, CO-PO mapping & outcome attainment" icon={<BookOpen className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Curricula</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Mapped</p><p className="text-2xl font-bold">{items.filter((c) => c.outcomeMapStatus === "Approved" || c.outcomeMapStatus === "Reviewed").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Avg Coverage</p><p className="text-2xl font-bold">{items.length ? Math.round(items.reduce((s, c) => s + (c.syllabusCoverage || 0), 0) / items.length) : 0}%</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">High Attainment</p><p className="text-2xl font-bold">{items.filter((c) => c.attainmentBand === "High" || c.attainmentBand === "Excellent").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="curriculaSearch" name="curriculaSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search curricula..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setName(""); setCode(""); setSem(""); setMapStatus(""); setCoverage(""); setBand(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Curriculum</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Curriculum</TableHead><TableHead className="text-xs">Course Code</TableHead><TableHead className="text-xs">Semester</TableHead><TableHead className="text-xs">Map Status</TableHead><TableHead className="text-xs">Coverage</TableHead><TableHead className="text-xs">Attainment</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs font-medium">{c.curriculumName}</TableCell>
              <TableCell className="text-xs">{c.courseCode || "—"}</TableCell>
              <TableCell className="text-xs">{c.semester || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${c.outcomeMapStatus === "Approved" ? "bg-success/15 text-success" : c.outcomeMapStatus === "Mapped" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>{c.outcomeMapStatus || "Draft"}</Badge></TableCell>
              <TableCell className="text-xs">{c.syllabusCoverage ? `${c.syllabusCoverage}%` : "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${c.attainmentBand === "Excellent" ? "bg-success/15 text-success" : c.attainmentBand === "High" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>{c.attainmentBand || "—"}</Badge></TableCell>
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== c.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching curricula" : "No curricula added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Curriculum</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="currName">Curriculum Name</Label><Input id="currName" name="currName" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="courseCode">Course Code</Label><Input id="courseCode" name="courseCode" value={code} onChange={(e) => setCode(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="semester">Semester</Label><Input id="semester" name="semester" value={sem} onChange={(e) => setSem(e.target.value)} /></div><div><Label className="text-xs" htmlFor="mapStatus">Map Status</Label><Select name="mapStatus" value={mapStatus} onValueChange={setMapStatus}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Mapped">Mapped</SelectItem><SelectItem value="Reviewed">Reviewed</SelectItem><SelectItem value="Approved">Approved</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="coverage">Syllabus Coverage %</Label><Input id="coverage" name="coverage" type="number" value={coverage} onChange={(e) => setCoverage(e.target.value)} /></div><div><Label className="text-xs" htmlFor="band">Attainment Band</Label><Select name="band" value={band} onValueChange={setBand}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Excellent">Excellent</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), curriculumName: name, courseCode: code, semester: sem, outcomeMapStatus: mapStatus, syllabusCoverage: Number(coverage) || 0, attainmentBand: band }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
