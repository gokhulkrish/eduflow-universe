import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { GraduationCap, Plus, Trash2, Search } from "lucide-react";
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

type Course = { id: string; courseRoom: string; contentUnit: string; facultyOwner: string; engagementPercent: number; completionStatus: string; };
const LMS_KEY = "eduflow_lms";
function ls(): Course[] { try { return JSON.parse(localStorage.getItem(LMS_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Course[]) { localStorage.setItem(LMS_KEY, JSON.stringify(v)); emitAppSync(LMS_KEY); }

export default function LmsElearning() {
  const [items, setItems] = useState(ls()); const [search, setSearch] = useState(""); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [room, setRoom] = useState(""); const [unit, setUnit] = useState(""); const [faculty, setFaculty] = useState(""); const [engagement, setEngagement] = useState(""); const [completion, setCompletion] = useState("");
  const filtered = items.filter((c) => !search || c.courseRoom.toLowerCase().includes(search.toLowerCase()) || c.facultyOwner?.toLowerCase().includes(search.toLowerCase()));
  const pag = usePagination({ data: filtered, pageSize: 10 });

  useEffect(() => subscribeAppSync([LMS_KEY], refresh), []);

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
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search course rooms..." className="flex-1 h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setRoom(""); setUnit(""); setFaculty(""); setEngagement(""); setCompletion(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Course Room</Button>
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
              <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== c.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">{search ? "No matching courses" : "No course rooms added"}</TableCell></TableRow>}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Course Room</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Course Room</Label><Input value={room} onChange={(e) => setRoom(e.target.value)} /></div><div><Label className="text-xs">Content Unit</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Faculty Owner</Label><Input value={faculty} onChange={(e) => setFaculty(e.target.value)} /></div><div><Label className="text-xs">Engagement %</Label><Input type="number" value={engagement} onChange={(e) => setEngagement(e.target.value)} /></div></div>
            <div><Label className="text-xs">Completion Status</Label><Select value={completion} onValueChange={setCompletion}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="Not Started">Not Started</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Needs Intervention">Needs Intervention</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!room} onClick={() => { const items = ls(); items.push({ id: crypto.randomUUID(), courseRoom: room, contentUnit: unit, facultyOwner: faculty, engagementPercent: Number(engagement) || 0, completionStatus: completion }); ss(items); refresh(); setOpen(false); toast.success("Added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
