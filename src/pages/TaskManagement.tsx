import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { CheckSquare, Plus, Trash2, CheckCircle2, Clock } from "lucide-react";
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
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { generateId } from "@/lib/utils";

type Task = { id: string; title: string; description: string; assignee: string; priority: string; status: string; due_date: string; created_at: string; };
const TASKS_KEY = "eduflow_tasks";
function ls(): Task[] { try { return JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Task[]) { localStorage.setItem(TASKS_KEY, JSON.stringify(v)); emitAppSync(TASKS_KEY); }

export default function TaskManagement() {
  const [items, setItems] = useState(ls()); const [filter, setFilter] = useState("all"); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [assignee, setAssignee] = useState(""); const [priority, setPriority] = useState("medium"); const [due, setDue] = useState("");
  const filtered = items.filter((t) => filter === "all" || t.status === filter);

  useEffect(() => subscribeAppSync([TASKS_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Task Management" subtitle="Assign & track tasks" icon={<CheckSquare className="h-6 w-6" />} />
      <div className="flex gap-3 mb-4">
        <Select name="taskFilter" value={filter} onValueChange={setFilter}><SelectTrigger className="w-36 h-9"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow ml-auto" onClick={() => { setTitle(""); setDesc(""); setAssignee(""); setPriority("medium"); setDue(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Task</Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <Card key={t.id} className={`border ${t.priority === "high" ? "border-destructive/30" : t.priority === "low" ? "border-border/40" : "border-warning/30"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2"><p className="text-sm font-medium">{t.title}</p><Badge className={`text-[9px] ${t.priority === "high" ? "bg-destructive/15 text-destructive" : t.priority === "low" ? "bg-muted text-muted-foreground" : "bg-warning/15 text-warning"}`}>{t.priority}</Badge></div>
                  <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground"><span>👤 {t.assignee}</span>{t.due_date && <span><Clock className="h-3 w-3 inline mr-1" />{new Date(t.due_date).toLocaleDateString()}</span>}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge className={`text-[9px] cursor-pointer ${t.status === "completed" ? "bg-success/15 text-success" : t.status === "in-progress" ? "bg-info/15 text-info" : "bg-warning/15 text-warning"}`} onClick={() => {
                      const next = t.status === "pending" ? "in-progress" : t.status === "in-progress" ? "completed" : "pending";
                      ss(ls().map((x) => x.id === t.id ? { ...x, status: next } : x)); refresh(); toast.success(`Status: ${next}`);
                    }}>{t.status}</Badge>
                    <Button variant="ghost" size="sm" className="rounded-lg h-6 w-6 text-destructive p-0" onClick={() => { ss(ls().filter((x) => x.id !== t.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No tasks</CardContent></Card>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="taskTitle">Title</Label><Input id="taskTitle" name="taskTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="taskDesc">Description</Label><Textarea id="taskDesc" name="taskDesc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="taskAssignee">Assignee</Label><Input id="taskAssignee" name="taskAssignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} /></div><div><Label className="text-xs" htmlFor="taskDue">Due Date</Label><Input id="taskDue" name="taskDue" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="taskPriority">Priority</Label><Select name="taskPriority" value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title || !assignee} onClick={() => { const items = ls(); items.unshift({ id: generateId(), title, description: desc, assignee, priority, status: "pending", due_date: due ? new Date(due).toISOString() : "", created_at: new Date().toISOString() }); ss(items); refresh(); setOpen(false); toast.success("Created"); }}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
