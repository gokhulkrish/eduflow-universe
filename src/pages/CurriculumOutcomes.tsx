import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { BookOpen, Plus, Pencil, Trash2, Search, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useRealtime } from "@/lib/use-realtime";
import { getCurricula, createCurriculum, updateCurriculum, deleteCurriculum, CURR_KEY, type Curriculum } from "@/lib/curriculum";

export default function CurriculumOutcomes() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Curriculum[]>([]); const [search, setSearch] = useState(""); const [loading, setLoading] = useState(true); const refresh = async () => setItems(await getCurricula());
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [name, setName] = useState(""); const [code, setCode] = useState(""); const [sem, setSem] = useState(""); const [mapStatus, setMapStatus] = useState(""); const [coverage, setCoverage] = useState(""); const [band, setBand] = useState(""); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setName(""); setCode(""); setSem(""); setMapStatus(""); setCoverage(""); setBand(""); setOpen(true); };
  const openEdit = (c: Curriculum) => { setEditId(c.id); setName(c.curriculum_name); setCode(c.course_code); setSem(c.semester); setMapStatus(c.outcome_map_status); setCoverage(String(c.syllabus_coverage)); setBand(c.attainment_band); setOpen(true); };
  const filtered = items.filter((c) => !search || c.curriculum_name.toLowerCase().includes(search.toLowerCase()) || c.course_code?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => { refresh().then(() => setLoading(false)); }, []);
  useRealtime("curriculum_outcomes", refresh);

  const exportCols = [{key:"curriculum_name",label:"Curriculum"},{key:"course_code",label:"Course Code"},{key:"semester",label:"Semester"},{key:"outcome_map_status",label:"Map Status"},{key:"syllabus_coverage",label:"Coverage"},{key:"attainment_band",label:"Attainment"}];

  return (
    <div>
      <PageHeader title="Curriculum & Outcomes" subtitle="Curriculum versioning, CO-PO mapping & outcome attainment" icon={<BookOpen className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Curricula</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Mapped</p><p className="text-2xl font-bold">{items.filter((c) => c.outcome_map_status === "Approved" || c.outcome_map_status === "Reviewed").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Avg Coverage</p><p className="text-2xl font-bold">{items.length ? Math.round(items.reduce((s, c) => s + (c.syllabus_coverage || 0), 0) / items.length) : 0}%</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">High Attainment</p><p className="text-2xl font-bold">{items.filter((c) => c.attainment_band === "High" || c.attainment_band === "Excellent").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="curriculaSearch" name="curriculaSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search curricula..." className="flex-1 h-9 text-xs" />
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=curriculum")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(items, "curricula", exportCols)}><Download className="h-4 w-4 mr-1" /> Export</Button>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Curriculum</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Curriculum</TableHead><TableHead className="text-xs">Course Code</TableHead><TableHead className="text-xs">Semester</TableHead><TableHead className="text-xs">Map Status</TableHead><TableHead className="text-xs">Coverage</TableHead><TableHead className="text-xs">Attainment</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs font-medium">{c.curriculum_name}</TableCell>
              <TableCell className="text-xs">{c.course_code || "—"}</TableCell>
              <TableCell className="text-xs">{c.semester || "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${c.outcome_map_status === "Approved" ? "bg-success/15 text-success" : c.outcome_map_status === "Mapped" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>{c.outcome_map_status || "Draft"}</Badge></TableCell>
              <TableCell className="text-xs">{c.syllabus_coverage ? `${c.syllabus_coverage}%` : "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${c.attainment_band === "Excellent" ? "bg-success/15 text-success" : c.attainment_band === "High" ? "bg-info/15 text-info" : "bg-muted text-muted-foreground"}`}>{c.attainment_band || "—"}</Badge></TableCell>
              <TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3 w-3" /></Button></div></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching curricula" : "No curricula added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Curriculum</AlertDialogTitle><AlertDialogDescription>This will permanently remove this curriculum. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteCurriculum(deleteId); await refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Curriculum" : "Add Curriculum"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="currName">Curriculum Name</Label><Input id="currName" name="currName" value={name} onChange={(e) => setName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="courseCode">Course Code</Label><Input id="courseCode" name="courseCode" value={code} onChange={(e) => setCode(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="semester">Semester</Label><Input id="semester" name="semester" value={sem} onChange={(e) => setSem(e.target.value)} /></div><div><Label className="text-xs" htmlFor="mapStatus">Map Status</Label><Select name="mapStatus" value={mapStatus} onValueChange={setMapStatus}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Mapped">Mapped</SelectItem><SelectItem value="Reviewed">Reviewed</SelectItem><SelectItem value="Approved">Approved</SelectItem></SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="coverage">Syllabus Coverage %</Label><Input id="coverage" name="coverage" type="number" value={coverage} onChange={(e) => setCoverage(e.target.value)} /></div><div><Label className="text-xs" htmlFor="band">Attainment Band</Label><Select name="band" value={band} onValueChange={setBand}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Excellent">Excellent</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!name} onClick={async () => { if (editId) { await updateCurriculum(editId, { curriculum_name: name, course_code: code, semester: sem, outcome_map_status: mapStatus, syllabus_coverage: Number(coverage) || 0, attainment_band: band }); } else { await createCurriculum({ curriculum_name: name, course_code: code, semester: sem, outcome_map_status: mapStatus, syllabus_coverage: Number(coverage) || 0, attainment_band: band }); } await refresh(); setOpen(false); toast.success(editId ? "Updated" : "Added"); }}>{editId ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
