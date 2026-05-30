import { useEffect, useState } from "react";
import { BookOpen, Plus, Pencil, Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { PROGRAMS } from "@/lib/promotion";
import { useRealtime } from "@/lib/use-realtime";
import { getCourseMappings, createCourseMapping, updateCourseMapping, deleteCourseMapping, COURSE_MAPPINGS_KEY, type CourseMapping } from "@/lib/course-mappings";
import { getSanctionedSeats, createSanctionedSeat, updateSanctionedSeat, deleteSanctionedSeat, SANCTIONED_SEATS_KEY, type SanctionedSeat } from "@/lib/sanctioned-seats";

export default function CourseInformation() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("mapping");
  const [mappings, setMappings] = useState<CourseMapping[]>([]); const [seats, setSeats] = useState<SanctionedSeat[]>([]);
  const [loading, setLoading] = useState(true);
  const rm = async () => setMappings(await getCourseMappings()); const rs = async () => setSeats(await getSanctionedSeats());

  const [mOpen, setMOpen] = useState(false); const [mEditId, setMEditId] = useState<string | null>(null); const [mCourse, setMCourse] = useState(""); const [mProgram, setMProgram] = useState(""); const [mSec, setMSec] = useState(""); const [mDeleteId, setMDeleteId] = useState<string | null>(null);
  const openMAdd = () => { setMEditId(null); setMCourse(""); setMProgram(""); setMSec(""); setMOpen(true); };
  const openMEdit = (m: CourseMapping) => { setMEditId(m.id); setMCourse(m.course); setMProgram(m.grade); setMSec(m.section); setMOpen(true); };

  const [sOpen, setSOpen] = useState(false); const [sEditId, setSEditId] = useState<string | null>(null); const [sCourse, setSCourse] = useState(""); const [sProgram, setSProgram] = useState(""); const [sTotal, setSTotal] = useState(""); const [sFilled, setSFilled] = useState(""); const [sDeleteId, setSDeleteId] = useState<string | null>(null);
  const openSAdd = () => { setSEditId(null); setSCourse(""); setSProgram(""); setSTotal(""); setSFilled(""); setSOpen(true); };
  const openSEdit = (s: SanctionedSeat) => { setSEditId(s.id); setSCourse(s.course); setSProgram(s.grade); setSTotal(String(s.total)); setSFilled(String(s.filled)); setSOpen(true); };

  useEffect(() => { Promise.all([rm(), rs()]).then(() => setLoading(false)); }, []);
  useRealtime("course_mappings", rm);
  useRealtime("sanctioned_seats", rs);

  const pag1 = usePagination({ data: mappings, pageSize: 10 });
  const pag2 = usePagination({ data: seats, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Course Information" subtitle="Program mapping & sanctioned seats" icon={<BookOpen className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="mapping">Course Mapping</TabsTrigger>
          <TabsTrigger value="seats">Sanctioned Seats</TabsTrigger>
        </TabsList>

        <TabsContent value="mapping">
          <div className="flex justify-end gap-2 mb-4"><Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=course-info")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(mappings, "course-mappings", [{key:"course",label:"Course"},{key:"grade",label:"Program"},{key:"section",label:"Section"}])}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openMAdd}><Plus className="h-4 w-4 mr-1" /> Add Mapping</Button></div>
          <TablePagination {...pag1} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Course</TableHead><TableHead className="text-xs">Program</TableHead><TableHead className="text-xs">Section</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag1.pageData.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs font-medium">{m.course}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{m.grade}</Badge></TableCell>
                  <TableCell className="text-xs">{m.section || "—"}</TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openMEdit(m)}><Pencil className="h-3 w-3" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setMDeleteId(m.id)}><Trash2 className="h-3 w-3" /></Button></div></TableCell>
                </TableRow>
              ))}
              {mappings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No course mappings</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="seats">
          <div className="flex justify-end gap-2 mb-4"><Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=course-info")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(seats, "sanctioned-seats", [{key:"course",label:"Course"},{key:"grade",label:"Program"},{key:"total",label:"Total"},{key:"filled",label:"Filled"}])}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openSAdd}><Plus className="h-4 w-4 mr-1" /> Add Seats</Button></div>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Courses</p><p className="text-2xl font-bold">{new Set(seats.map((s) => s.course)).size}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Seats</p><p className="text-2xl font-bold">{seats.reduce((s, x) => s + x.total, 0)}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Filled</p><p className="text-2xl font-bold">{seats.reduce((s, x) => s + x.filled, 0)}</p></Card>
          </div>
          <TablePagination {...pag2} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Course</TableHead><TableHead className="text-xs">Program</TableHead><TableHead className="text-xs">Total</TableHead><TableHead className="text-xs">Filled</TableHead><TableHead className="text-xs">Vacant</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag2.pageData.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs font-medium">{s.course}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{s.grade}</Badge></TableCell>
                  <TableCell className="text-xs">{s.total}</TableCell>
                  <TableCell className="text-xs">{s.filled}</TableCell>
                  <TableCell className="text-xs"><Badge className={`text-[9px] ${s.total - s.filled > 0 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{s.total - s.filled}</Badge></TableCell>
                  <TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => openSEdit(s)}><Pencil className="h-3 w-3" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setSDeleteId(s.id)}><Trash2 className="h-3 w-3" /></Button></div></TableCell>
                </TableRow>
              ))}
              {seats.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No seat records</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!mDeleteId} onOpenChange={(o) => !o && setMDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Mapping</AlertDialogTitle><AlertDialogDescription>This will permanently remove this course mapping. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setMDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (mDeleteId) { await deleteCourseMapping(mDeleteId); await rm(); toast.success("Removed"); } setMDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={mOpen} onOpenChange={setMOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{mEditId ? "Edit Mapping" : "Course Mapping"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="mCourse">Course Name</Label><Input id="mCourse" name="mCourse" value={mCourse} onChange={(e) => setMCourse(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="mProgram">Program</Label><Select name="mProgram" value={mProgram} onValueChange={setMProgram}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs" htmlFor="mSec">Section</Label><Select name="mSec" value={mSec} onValueChange={setMSec}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["A", "B", "C", "D"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMOpen(false)}>Cancel</Button><Button onClick={async () => { if (mEditId) { await updateCourseMapping(mEditId, { course: mCourse, grade: mProgram, section: mSec }); } else { await createCourseMapping({ course: mCourse, grade: mProgram, section: mSec }); } await rm(); setMOpen(false); toast.success(mEditId ? "Updated" : "Mapped"); }} disabled={!mCourse || !mProgram}>{mEditId ? "Update" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!sDeleteId} onOpenChange={(o) => !o && setSDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Seat Record</AlertDialogTitle><AlertDialogDescription>This will permanently remove this seat record. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setSDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (sDeleteId) { await deleteSanctionedSeat(sDeleteId); await rs(); toast.success("Deleted"); } setSDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={sOpen} onOpenChange={setSOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{sEditId ? "Edit Seats" : "Sanctioned Seats"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="sCourse">Course</Label><Input id="sCourse" name="sCourse" value={sCourse} onChange={(e) => setSCourse(e.target.value)} /></div><div><Label className="text-xs" htmlFor="sProgram">Program</Label><Select name="sProgram" value={sProgram} onValueChange={setSProgram}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="sTotal">Total Seats</Label><Input id="sTotal" name="sTotal" type="number" value={sTotal} onChange={(e) => setSTotal(e.target.value)} /></div><div><Label className="text-xs" htmlFor="sFilled">Filled</Label><Input id="sFilled" name="sFilled" type="number" value={sFilled} onChange={(e) => setSFilled(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSOpen(false)}>Cancel</Button><Button onClick={async () => { if (sEditId) { await updateSanctionedSeat(sEditId, { course: sCourse, grade: sProgram, total: Number(sTotal) || 0, filled: Number(sFilled) || 0 }); } else { await createSanctionedSeat({ course: sCourse, grade: sProgram, total: Number(sTotal) || 0, filled: Number(sFilled) || 0 }); } await rs(); setSOpen(false); toast.success(sEditId ? "Updated" : "Saved"); }} disabled={!sCourse || !sProgram || !sTotal}>{sEditId ? "Update" : "Save"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
