import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { BookOpen, Plus, Pencil, Trash2, FileText, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useRealtime } from "@/lib/use-realtime";
import { getLessons, createLesson, updateLesson, deleteLesson, lessonsKey, type Lesson } from "@/lib/lessons";

export default function LessonManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Lesson[]>([]);
  const [tab, setTab] = useState("plans");
  const [loading, setLoading] = useState(true);
  const refresh = async () => setItems(await getLessons());
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [title, setTitle] = useState(""); const [subject, setSubject] = useState(""); const [topic, setTopic] = useState(""); const [objectives, setObjectives] = useState(""); const [materials, setMaterials] = useState(""); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setTitle(""); setSubject(""); setTopic(""); setObjectives(""); setMaterials(""); setOpen(true); };
  const openEdit = (l: Lesson) => { setEditId(l.id); setTitle(l.title); setSubject(l.subject); setTopic(l.topic); setObjectives(l.objectives); setMaterials(l.materials || ""); setOpen(true); };

  useEffect(() => { refresh().then(() => setLoading(false)); }, []); useRealtime("lesson_plans", refresh);

  const exportCols = [{key:"title",label:"Title"},{key:"status",label:"Status"},{key:"subject",label:"Subject"},{key:"topic",label:"Topic"},{key:"objectives",label:"Objectives"},{key:"materials",label:"Materials"}];

  return (
    <div>
      <PageHeader title="Lesson Management" subtitle="Lesson plans & syllabus tracking" icon={<BookOpen className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="plans">Lesson Plans</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus Status</TabsTrigger>
        </TabsList>
        <TabsContent value="plans">
          <div className="flex justify-end mb-4"><Button size="sm" variant="outline" className="rounded-xl mr-2" onClick={() => navigate("/import?module=lessons")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl mr-2" onClick={() => exportToCsv(items, "lesson-plans", exportCols)}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New Lesson Plan</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <Card key={l.id} className="border-border/40">
                <CardHeader className="pb-2"><div className="flex items-start justify-between"><CardTitle className="text-sm">{l.title}</CardTitle><Badge className={`text-[9px] ${l.status === "completed" ? "bg-success/15 text-success" : l.status === "in-progress" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{l.status}</Badge></div><p className="text-xs text-muted-foreground">{l.subject} · {l.topic}</p></CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="text-muted-foreground"><strong>Objectives:</strong> {l.objectives}</p>
                  <p className="text-muted-foreground"><strong>Materials:</strong> {l.materials || "—"}</p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={async () => { await updateLesson(l.id, { status: l.status === "completed" ? "draft" : l.status === "in-progress" ? "completed" : "in-progress" }); await refresh(); toast.success("Updated"); }}>Advance</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openEdit(l)}><Pencil className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => setDeleteId(l.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {items.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No lesson plans created</CardContent></Card>}
          </div>
        </TabsContent>
        <TabsContent value="syllabus">
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">Syllabus coverage tracking — connect to subject & timetable data.</CardContent></Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Lesson Plan</AlertDialogTitle><AlertDialogDescription>This will permanently remove this lesson plan. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteLesson(deleteId); await refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Lesson Plan" : "New Lesson Plan"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="lessonTitle">Title</Label><Input id="lessonTitle" name="lessonTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="lessonSubject">Subject</Label><Input id="lessonSubject" name="lessonSubject" value={subject} onChange={(e) => setSubject(e.target.value)} /></div><div><Label className="text-xs" htmlFor="lessonTopic">Topic</Label><Input id="lessonTopic" name="lessonTopic" value={topic} onChange={(e) => setTopic(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="lessonObjectives">Objectives</Label><Textarea id="lessonObjectives" name="lessonObjectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} /></div>
            <div><Label className="text-xs" htmlFor="lessonMaterials">Materials/Resources</Label><Textarea id="lessonMaterials" name="lessonMaterials" value={materials} onChange={(e) => setMaterials(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title || !subject} onClick={async () => { if (editId) { await updateLesson(editId, { title, subject, topic, objectives, materials }); } else { await createLesson({ title, subject, class_id: "", topic, objectives, materials, status: "draft" }); } await refresh(); setOpen(false); toast.success(editId ? "Updated" : "Created"); }}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
