import "@/lib/runtime-storage";
import { useCallback, useEffect, useState } from "react";
import { CheckSquare, Plus, Pencil, Trash2, CheckCircle2, Clock, Download, Upload } from "lucide-react";
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
import { useRealtime } from "@/lib/use-realtime";
import { getTasks, createTask, updateTask, deleteTask, Task } from "@/lib/tasks";

export default function TaskManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Task[]>([]); const [filter, setFilter] = useState("all");
  const refresh = useCallback(async () => { setItems(await getTasks()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("tasks", refresh);
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [assignee, setAssignee] = useState(""); const [priority, setPriority] = useState("medium"); const [due, setDue] = useState(""); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setTitle(""); setDesc(""); setAssignee(""); setPriority("medium"); setDue(""); setOpen(true); };
  const openEdit = (t: Task) => { setEditId(t.id); setTitle(t.title); setDesc(t.description); setAssignee(t.assignee); setPriority(t.priority); setDue(t.due_date ? t.due_date.slice(0, 10) : ""); setOpen(true); };
  const filtered = items.filter((t) => filter === "all" || t.status === filter);

  return (
    <div>
      <PageHeader title="Task Management" subtitle="Assign & track tasks" icon={<CheckSquare className="h-6 w-6" />} />
      <div className="flex gap-3 mb-4">
        <Select name="taskFilter" value={filter} onValueChange={setFilter}><SelectTrigger className="w-36 h-9"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=tasks")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(filtered, "tasks", [{key:"title",label:"Title"},{key:"description",label:"Description"},{key:"assignee",label:"Assignee"},{key:"priority",label:"Priority"},{key:"status",label:"Status"},{key:"due_date",label:"Due Date"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow ml-auto" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New Task</Button>
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
                    <Badge className={`text-[9px] cursor-pointer ${t.status === "completed" ? "bg-success/15 text-success" : t.status === "in-progress" ? "bg-info/15 text-info" : "bg-warning/15 text-warning"}`} onClick={async () => {
                      const next = t.status === "pending" ? "in-progress" : t.status === "in-progress" ? "completed" : "pending";
                      await updateTask(t.id, { status: next }); refresh(); toast.success(`Status: ${next}`);
                    }}>{t.status}</Badge>
                    <Button variant="ghost" size="sm" className="rounded-lg h-6 w-6 p-0" onClick={() => openEdit(t)}><Pencil className="h-3 w-3" /></Button><Button variant="ghost" size="sm" className="rounded-lg h-6 w-6 text-destructive p-0" onClick={() => setDeleteId(t.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No tasks</CardContent></Card>}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Task</AlertDialogTitle><AlertDialogDescription>This will permanently remove this task. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteTask(deleteId); refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Task" : "New Task"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="taskTitle">Title</Label><Input id="taskTitle" name="taskTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="taskDesc">Description</Label><Textarea id="taskDesc" name="taskDesc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="taskAssignee">Assignee</Label><Input id="taskAssignee" name="taskAssignee" value={assignee} onChange={(e) => setAssignee(e.target.value)} /></div><div><Label className="text-xs" htmlFor="taskDue">Due Date</Label><Input id="taskDue" name="taskDue" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="taskPriority">Priority</Label><Select name="taskPriority" value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title || !assignee} onClick={async () => { if (editId) { await updateTask(editId, { title, description: desc, assignee, priority, due_date: due ? new Date(due).toISOString() : "" }); } else { await createTask({ title, description: desc, assignee, priority, status: "pending", due_date: due ? new Date(due).toISOString() : "" }); } refresh(); setOpen(false); toast.success(editId ? "Updated" : "Created"); }}>{editId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
