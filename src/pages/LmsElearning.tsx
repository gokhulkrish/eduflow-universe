import "@/lib/runtime-storage";
import { useCallback, useEffect, useState } from "react";
import { GraduationCap, Plus, Pencil, Trash2, Search, Download, Upload } from "lucide-react";
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
import { getLmsCourses, createLmsCourse, updateLmsCourse, deleteLmsCourse, LmsCourse } from "@/lib/lms-courses";

export default function LmsElearning() {
  const navigate = useNavigate();
  const [items, setItems] = useState<LmsCourse[]>([]); const [search, setSearch] = useState("");
  const refresh = useCallback(async () => { setItems(await getLmsCourses()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("lms_courses", refresh);
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [room, setRoom] = useState(""); const [unit, setUnit] = useState(""); const [faculty, setFaculty] = useState(""); const [engagement, setEngagement] = useState(""); const [completion, setCompletion] = useState(""); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setRoom(""); setUnit(""); setFaculty(""); setEngagement(""); setCompletion(""); setOpen(true); };
  const openEdit = (c: LmsCourse) => { setEditId(c.id); setRoom(c.courseRoom); setUnit(c.contentUnit); setFaculty(c.facultyOwner); setEngagement(String(c.engagementPercent)); setCompletion(c.completionStatus); setOpen(true); };
  const filtered = items.filter((c) => !search || c.courseRoom.toLowerCase().includes(search.toLowerCase()) || c.facultyOwner?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  return (
    <div>
      <PageHeader title="LMS & E-Learning" subtitle="Course rooms, digital content & engagement tracking" icon={<GraduationCap className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Course Rooms</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Avg Engagement</p><p className="text-2xl font-bold">{items.length ? Math.round(items.reduce((s, c) => s + (c.engagementPercent || 0), 0) / items.length) : 0}%</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Completed</p><p className="text-2xl font-bold">{items.filter((c) => c.completionStatus === "Completed").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Needs Intervention</p><p className="text-2xl font-bold text-destructive">{items.filter((c) => c.completionStatus === "Needs Intervention").length}</p></Card>
      </div>
      <div className="flex gap-3 mb-4">
        <Input id="lmsSearch" name="lmsSearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search course rooms..." className="flex-1 h-9 text-xs" />
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=lms")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(items, "lms-courses", [{key:"courseRoom",label:"Course Room"},{key:"contentUnit",label:"Content Unit"},{key:"facultyOwner",label:"Faculty"},{key:"engagementPercent",label:"Engagement %"},{key:"completionStatus",label:"Status"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Course Room</Button>
      </div>
      <TablePagination {...pag} />
      <Table>
        <TableHeader><TableRow><TableHead className="text-xs">Course Room</TableHead><TableHead className="text-xs">Content Unit</TableHead><TableHead className="text-xs">Faculty</TableHead><TableHead className="text-xs">Engagement</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {pag.pageData.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="text-xs font-medium">{c.courseRoom}</TableCell>
              <TableCell className="text-xs">{c.contentUnit || "—"}</TableCell>
              <TableCell className="text-xs">{c.facultyOwner || "—"}</TableCell>
              <TableCell className="text-xs">{c.engagementPercent ? `${c.engagementPercent}%` : "—"}</TableCell>
              <TableCell><Badge className={`text-[9px] ${c.completionStatus === "Completed" ? "bg-success/15 text-success" : c.completionStatus === "In Progress" ? "bg-info/15 text-info" : c.completionStatus === "Needs Intervention" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{c.completionStatus || "Not Started"}</Badge></TableCell>
              <TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setDeleteId(c.id)}><Trash2 className="h-3 w-3" /></Button></div></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching courses" : "No course rooms added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Course Room</AlertDialogTitle><AlertDialogDescription>This will permanently remove this course room. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteLmsCourse(deleteId); refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Course Room" : "Add Course Room"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="courseRoom">Course Room</Label><Input id="courseRoom" name="courseRoom" value={room} onChange={(e) => setRoom(e.target.value)} /></div><div><Label className="text-xs" htmlFor="contentUnit">Content Unit</Label><Input id="contentUnit" name="contentUnit" value={unit} onChange={(e) => setUnit(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="facultyOwner">Faculty Owner</Label><Input id="facultyOwner" name="facultyOwner" value={faculty} onChange={(e) => setFaculty(e.target.value)} /></div><div><Label className="text-xs" htmlFor="engagementPct">Engagement %</Label><Input id="engagementPct" name="engagementPct" type="number" value={engagement} onChange={(e) => setEngagement(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="completionStatus">Completion Status</Label><Select name="completionStatus" value={completion} onValueChange={setCompletion}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Not Started">Not Started</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Needs Intervention">Needs Intervention</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!room} onClick={async () => { if (editId) { await updateLmsCourse(editId, { courseRoom: room, contentUnit: unit, facultyOwner: faculty, engagementPercent: Number(engagement) || 0, completionStatus: completion }); } else { await createLmsCourse({ courseRoom: room, contentUnit: unit, facultyOwner: faculty, engagementPercent: Number(engagement) || 0, completionStatus: completion }); } refresh(); setOpen(false); toast.success(editId ? "Updated" : "Added"); }}>{editId ? "Update" : "Add"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
