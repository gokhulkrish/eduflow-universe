import { useState } from "react";
import { NotebookPen, Plus, Trash2, CalendarDays, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { generateId } from "@/lib/utils";

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  className: string;
  dueDate: string;
  status: "pending" | "submitted" | "overdue";
  createdAt: string;
}

const STORAGE_KEY = "sms.homework.v1";
const CLASSES = ["Class 1-A", "Class 1-B", "Class 2-A", "Class 2-B", "Class 3-A", "Class 4-A", "Class 5-A", "Class 6-A", "Class 7-A", "Class 8-A", "Class 9-A", "Class 10-A", "Class 11-A", "Class 11-B", "Class 12-A", "Class 12-B"];
const SUBJECTS = ["Mathematics", "English", "Hindi", "Science", "Social Studies", "Physics", "Chemistry", "Biology", "History", "Geography", "Computer Science", "Physical Education"];

function load(): HomeworkItem[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function save(items: HomeworkItem[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

export default function Homework() {
  const [tab, setTab] = useState("all");
  const [items, setItems] = useState(load);
  const refresh = () => setItems(load());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [subject, setSubject] = useState(""); const [cls, setCls] = useState(""); const [due, setDue] = useState("");

  const handleCreate = () => {
    if (!title || !subject || !cls || !due) { toast.error("Fill all fields"); return; }
    const all = load();
    all.push({ id: generateId(), title, description: desc, subject, className: cls, dueDate: due, status: "pending", createdAt: new Date().toISOString() });
    save(all); refresh(); setOpen(false); setTitle(""); setDesc(""); setSubject(""); setCls(""); setDue(""); toast.success("Homework assigned");
  };

  const markSubmitted = (id: string) => {
    const all = load().map((h) => h.id === id ? { ...h, status: "submitted" as const } : h);
    save(all); refresh(); toast.success("Marked submitted");
  };

  const deleteItem = (id: string) => {
    const all = load().filter((h) => h.id !== id);
    save(all); refresh(); toast.success("Deleted");
  };

  const filtered = tab === "all" ? items : items.filter((h) => h.status === tab);

  return (
    <div>
      <PageHeader title="Homework Planner" subtitle="Assign, track & manage homework" icon={<NotebookPen className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1" /> Assign Homework</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No homework assigned</CardContent></Card>}
            {filtered.map((h) => (
              <Card key={h.id} className="border-border/40">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-sm">{h.title}</CardTitle>
                    <Badge className={`text-[9px] ${h.status === "submitted" ? "bg-success/15 text-success" : h.status === "overdue" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>{h.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-xs">
                  <p className="text-muted-foreground line-clamp-2">{h.description || "No description"}</p>
                  <p><Badge className="text-[9px] bg-muted text-muted-foreground">{h.subject}</Badge> <Badge className="text-[9px] bg-muted text-muted-foreground">{h.className}</Badge></p>
                  <p><CalendarDays className="h-3 w-3 inline mr-1" />Due: {new Date(h.dueDate).toLocaleDateString()}</p>
                  {h.status === "pending" && new Date(h.dueDate) < new Date() && <p className="text-destructive text-[10px]">Overdue</p>}
                  <div className="flex gap-2 pt-2">
                    {h.status === "pending" && <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => markSubmitted(h.id)}><CheckCircle className="h-3 w-3 mr-1" />Mark Done</Button>}
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => deleteItem(h.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign Homework</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label htmlFor="hwTitle">Title</Label><Input id="hwTitle" name="hwTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Homework title" /></div>
            <div><Label htmlFor="hwDesc">Description</Label><Textarea id="hwDesc" name="hwDesc" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Details..." /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="hwSubject">Subject</Label><Select name="hwSubject" value={subject} onValueChange={setSubject}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
              <div><Label htmlFor="hwClass">Class</Label><Select name="hwClass" value={cls} onValueChange={setCls}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label htmlFor="hwDueDate">Due Date</Label><Input id="hwDueDate" name="hwDueDate" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
          </div>
          <DialogFooter className="mt-2"><Button className="rounded-xl bg-gradient-primary shadow-glow" onClick={handleCreate}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
