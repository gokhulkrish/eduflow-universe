import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
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
import { PROGRAMS } from "@/lib/promotion";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

type Mapping = { id: string; course: string; grade: string; section: string; };
const COURSE_MAPPINGS_KEY = "eduflow_course_mappings";
function ml(): Mapping[] { try { return JSON.parse(localStorage.getItem(COURSE_MAPPINGS_KEY) ?? "[]"); } catch { return []; } }
function ms(v: Mapping[]) { localStorage.setItem(COURSE_MAPPINGS_KEY, JSON.stringify(v)); emitAppSync(COURSE_MAPPINGS_KEY); }

type Seat = { id: string; course: string; grade: string; total: number; filled: number; };
const SANCTIONED_SEATS_KEY = "eduflow_sanctioned_seats";
function sl(): Seat[] { try { return JSON.parse(localStorage.getItem(SANCTIONED_SEATS_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Seat[]) { localStorage.setItem(SANCTIONED_SEATS_KEY, JSON.stringify(v)); emitAppSync(SANCTIONED_SEATS_KEY); }

export default function CourseInformation() {
  const [tab, setTab] = useState("mapping");
  const [mappings, setMappings] = useState(ml); const [seats, setSeats] = useState(sl);
  const rm = () => setMappings(ml()); const rs = () => setSeats(sl());

  const [mOpen, setMOpen] = useState(false); const [mCourse, setMCourse] = useState(""); const [mProgram, setMProgram] = useState(""); const [mSec, setMSec] = useState("");
  const [sOpen, setSOpen] = useState(false); const [sCourse, setSCourse] = useState(""); const [sProgram, setSProgram] = useState(""); const [sTotal, setSTotal] = useState(""); const [sFilled, setSFilled] = useState("");

  useEffect(() => subscribeAppSync([COURSE_MAPPINGS_KEY, SANCTIONED_SEATS_KEY], () => {
    setMappings(ml());
    setSeats(sl());
  }), []);

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
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setMCourse(""); setMProgram(""); setMSec(""); setMOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Mapping</Button></div>
          <TablePagination {...pag1} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Course</TableHead><TableHead className="text-xs">Program</TableHead><TableHead className="text-xs">Section</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag1.pageData.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-xs font-medium">{m.course}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{m.grade}</Badge></TableCell>
                  <TableCell className="text-xs">{m.section || "—"}</TableCell>
                  <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { const d = mappings.filter((x) => x.id !== m.id); ms(d); rm(); toast.success("Removed"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
              {mappings.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No course mappings</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="seats">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setSCourse(""); setSProgram(""); setSTotal(""); setSFilled(""); setSOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Seats</Button></div>
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
                  <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { const d = seats.filter((x) => x.id !== s.id); ss(d); rs(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
              {seats.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No seat records</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={mOpen} onOpenChange={setMOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Course Mapping</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="mCourse">Course Name</Label><Input id="mCourse" name="mCourse" value={mCourse} onChange={(e) => setMCourse(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="mProgram">Program</Label><Select name="mProgram" value={mProgram} onValueChange={setMProgram}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs" htmlFor="mSec">Section</Label><Select name="mSec" value={mSec} onValueChange={setMSec}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["A", "B", "C", "D"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setMOpen(false)}>Cancel</Button><Button onClick={() => { const n: Mapping = { id: crypto.randomUUID(), course: mCourse, grade: mProgram, section: mSec }; const next = [...mappings, n]; ms(next); rm(); setMOpen(false); toast.success("Mapped"); }} disabled={!mCourse || !mProgram}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sOpen} onOpenChange={setSOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Sanctioned Seats</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="sCourse">Course</Label><Input id="sCourse" name="sCourse" value={sCourse} onChange={(e) => setSCourse(e.target.value)} /></div><div><Label className="text-xs" htmlFor="sProgram">Program</Label><Select name="sProgram" value={sProgram} onValueChange={setSProgram}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="sTotal">Total Seats</Label><Input id="sTotal" name="sTotal" type="number" value={sTotal} onChange={(e) => setSTotal(e.target.value)} /></div><div><Label className="text-xs" htmlFor="sFilled">Filled</Label><Input id="sFilled" name="sFilled" type="number" value={sFilled} onChange={(e) => setSFilled(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setSOpen(false)}>Cancel</Button><Button onClick={() => { const n: Seat = { id: crypto.randomUUID(), course: sCourse, grade: sProgram, total: Number(sTotal) || 0, filled: Number(sFilled) || 0 }; const next = [...seats, n]; ss(next); rs(); setSOpen(false); toast.success("Saved"); }} disabled={!sCourse || !sProgram || !sTotal}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
