import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { generateId } from "@/lib/utils";

type Lesson = { id: string; title: string; subject: string; class_id: string; topic: string; objectives: string; materials: string; status: string; created_at: string; };
export const lessonsKey = "eduflow_lessons";
function ls(): Lesson[] { try { return JSON.parse(localStorage.getItem(lessonsKey) ?? "[]"); } catch { return []; } }
function ss(v: Lesson[]) { localStorage.setItem(lessonsKey, JSON.stringify(v)); emitAppSync(lessonsKey); }

export default function LessonManagement() {
  const [items, setItems] = useState(ls());
  const [tab, setTab] = useState("plans");
  const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [subject, setSubject] = useState(""); const [topic, setTopic] = useState(""); const [objectives, setObjectives] = useState(""); const [materials, setMaterials] = useState("");

  useEffect(() => subscribeAppSync([lessonsKey], refresh), []);

  return (
    <div>
      <PageHeader title="Lesson Management" subtitle="Lesson plans & syllabus tracking" icon={<BookOpen className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="plans">Lesson Plans</TabsTrigger>
          <TabsTrigger value="syllabus">Syllabus Status</TabsTrigger>
        </TabsList>
        <TabsContent value="plans">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTitle(""); setSubject(""); setTopic(""); setObjectives(""); setMaterials(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Lesson Plan</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((l) => (
              <Card key={l.id} className="border-border/40">
                <CardHeader className="pb-2"><div className="flex items-start justify-between"><CardTitle className="text-sm">{l.title}</CardTitle><Badge className={`text-[9px] ${l.status === "completed" ? "bg-success/15 text-success" : l.status === "in-progress" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{l.status}</Badge></div><p className="text-xs text-muted-foreground">{l.subject} · {l.topic}</p></CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="text-muted-foreground"><strong>Objectives:</strong> {l.objectives}</p>
                  <p className="text-muted-foreground"><strong>Materials:</strong> {l.materials || "—"}</p>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => { ss(ls().map((x) => x.id === l.id ? { ...x, status: x.status === "completed" ? "draft" : x.status === "in-progress" ? "completed" : "in-progress" } : x)); refresh(); toast.success("Updated"); }}>Advance</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== l.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Lesson Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="lessonTitle">Title</Label><Input id="lessonTitle" name="lessonTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="lessonSubject">Subject</Label><Input id="lessonSubject" name="lessonSubject" value={subject} onChange={(e) => setSubject(e.target.value)} /></div><div><Label className="text-xs" htmlFor="lessonTopic">Topic</Label><Input id="lessonTopic" name="lessonTopic" value={topic} onChange={(e) => setTopic(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="lessonObjectives">Objectives</Label><Textarea id="lessonObjectives" name="lessonObjectives" value={objectives} onChange={(e) => setObjectives(e.target.value)} rows={2} /></div>
            <div><Label className="text-xs" htmlFor="lessonMaterials">Materials/Resources</Label><Textarea id="lessonMaterials" name="lessonMaterials" value={materials} onChange={(e) => setMaterials(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title || !subject} onClick={() => { const items = ls(); items.push({ id: generateId(), title, subject, class_id: "", topic, objectives, materials, status: "draft", created_at: new Date().toISOString() }); ss(items); refresh(); setOpen(false); toast.success("Created"); }}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
