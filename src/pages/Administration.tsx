import { useState, useEffect } from "react";
import { Building2, Plus, Trash2, Users, FileText, CalendarCheck, Phone, Mail, Shield } from "lucide-react";
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
import { getTasks, createTask, updateTask, deleteTask, getNotices, createNotice, deleteNotice, type Task, type Notice, PRIORITIES } from "@/lib/administration";
import { useRealtime } from "@/lib/use-realtime";

export default function Administration() {
  const [tab, setTab] = useState("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const refreshT = async () => setTasks(await getTasks());
  const refreshN = async () => setNotices(await getNotices());

  useEffect(() => { Promise.all([refreshT(), refreshN()]).then(() => setLoading(false)); }, []);
  useRealtime("admin_tasks", refreshT);
  useRealtime("admin_notices", refreshN);

  const [tOpen, setTOpen] = useState(false);
  const [tTitle, setTTitle] = useState(""); const [tDesc, setTDesc] = useState(""); const [tAssignee, setTAssignee] = useState(""); const [tPriority, setTPriority] = useState<Task["priority"]>("medium"); const [tCat, setTCat] = useState(""); const [tDue, setTDue] = useState("");

  const [nOpen, setNOpen] = useState(false);
  const [nTitle, setNTitle] = useState(""); const [nContent, setNContent] = useState(""); const [nAudience, setNAudience] = useState("");

  const stats = { total: tasks.length, open: tasks.filter((t) => t.status === "open").length, completed: tasks.filter((t) => t.status === "completed").length, critical: tasks.filter((t) => t.priority === "critical" && t.status !== "completed").length };

  const handleCreateTask = async () => {
    if (!tTitle) { toast.error("Title required"); return; }
    await createTask({ title: tTitle, description: tDesc, assignee: tAssignee, priority: tPriority, status: "open", dueDate: tDue, category: tCat });
    await refreshT(); setTOpen(false); setTTitle(""); setTDesc(""); setTAssignee(""); setTPriority("medium"); setTCat(""); setTDue(""); toast.success("Task created");
  };

  const updateTaskStatus = async (id: string, status: Task["status"]) => {
    await updateTask(id, { status });
    await refreshT(); toast.success(`Task ${status}`);
  };

  const deleteTask = async (id: string) => {
    await deleteTask(id); await refreshT(); toast.success("Deleted");
  };

  const handleCreateNotice = async () => {
    if (!nTitle) { toast.error("Title required"); return; }
    await createNotice({ title: nTitle, content: nContent, audience: nAudience || "All", date: new Date().toISOString() });
    await refreshN(); setNOpen(false); setNTitle(""); setNContent(""); setNAudience(""); toast.success("Notice posted");
  };

  const deleteNotice = async (id: string) => {
    await deleteNotice(id); await refreshN(); toast.success("Deleted");
  };

  return (
    <div>
      <PageHeader title="Administration" subtitle="Admin tasks & notices" icon={<Building2 className="h-6 w-6" />} />
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Tasks", value: stats.total, icon: <FileText className="h-4 w-4" />, color: "text-primary" },
          { label: "Open", value: stats.open, icon: <CalendarCheck className="h-4 w-4" />, color: "text-warning" },
          { label: "Completed", value: stats.completed, icon: <Shield className="h-4 w-4" />, color: "text-success" },
          { label: "Critical", value: stats.critical, icon: <Mail className="h-4 w-4" />, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="py-3 text-center"><div className={`${s.color} mb-1`}>{s.icon}</div><p className="text-lg font-bold">{s.value}</p><p className="text-[10px] text-muted-foreground">{s.label}</p></CardContent></Card>
        ))}
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="notices">Notices</TabsTrigger>
        </TabsList>
        <TabsContent value="tasks">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => setTOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add Task</Button></div>
          <div className="space-y-2">
            {tasks.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No admin tasks</CardContent></Card>}
            {tasks.map((t) => (
              <Card key={t.id} className="border-border/40">
                <CardContent className="py-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{t.title}</span>
                      <Badge className={`text-[9px] ${t.priority === "critical" ? "bg-destructive/15 text-destructive" : t.priority === "high" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{t.priority}</Badge>
                      <Badge className="text-[9px] bg-muted text-muted-foreground">{t.status}</Badge>
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mt-1 truncate">{t.description}</p>}
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      {t.assignee && <span><Users className="h-3 w-3 inline mr-1" />{t.assignee}</span>}
                      {t.category && <span>{t.category}</span>}
                      {t.dueDate && <span><CalendarCheck className="h-3 w-3 inline mr-1" />{new Date(t.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-4 shrink-0">
                    {t.status !== "completed" && <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => updateTaskStatus(t.id, "completed")}>Done</Button>}
                    {t.status === "open" && <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-warning" onClick={() => updateTaskStatus(t.id, "in-progress")}>Start</Button>}
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => deleteTask(t.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="notices">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => setNOpen(true)}><Plus className="h-4 w-4 mr-1" /> Post Notice</Button></div>
          <div className="space-y-2">
            {notices.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No notices</CardContent></Card>}
            {notices.map((n) => (
              <Card key={n.id} className="border-border/40">
                <CardContent className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-medium">{n.title}</span>
                      <Badge className="text-[9px] bg-muted text-muted-foreground ml-2">{n.audience}</Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => deleteNotice(n.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  {n.content && <p className="text-xs text-muted-foreground mt-1">{n.content}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.date).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      <Dialog open={tOpen} onOpenChange={setTOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Admin Task</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label htmlFor="tTitle">Title</Label><Input id="tTitle" name="title" value={tTitle} onChange={(e) => setTTitle(e.target.value)} /></div>
            <div><Label htmlFor="tDesc">Description</Label><Textarea id="tDesc" name="description" value={tDesc} onChange={(e) => setTDesc(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="tAssignee">Assignee</Label><Input id="tAssignee" name="assignee" value={tAssignee} onChange={(e) => setTAssignee(e.target.value)} /></div>
              <div><Label htmlFor="tPriority">Priority</Label><Select value={tPriority} onValueChange={(v) => setTPriority(v as Task["priority"])}><SelectTrigger id="tPriority" name="priority"><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label htmlFor="tCat">Category</Label><Input id="tCat" name="category" value={tCat} onChange={(e) => setTCat(e.target.value)} /></div>
              <div><Label htmlFor="tDue">Due Date</Label><Input id="tDue" name="dueDate" type="date" value={tDue} onChange={(e) => setTDue(e.target.value)} /></div>
            </div>
          </div>
          <DialogFooter className="mt-2"><Button className="rounded-xl bg-gradient-primary shadow-glow" onClick={handleCreateTask}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={nOpen} onOpenChange={setNOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Post Notice</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div><Label htmlFor="nTitle">Title</Label><Input id="nTitle" name="title" value={nTitle} onChange={(e) => setNTitle(e.target.value)} /></div>
            <div><Label htmlFor="nContent">Content</Label><Textarea id="nContent" name="content" value={nContent} onChange={(e) => setNContent(e.target.value)} /></div>
            <div><Label htmlFor="nAudience">Audience</Label><Select value={nAudience} onValueChange={setNAudience}><SelectTrigger id="nAudience" name="audience"><SelectValue placeholder="All" /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem><SelectItem value="Faculty">Faculty</SelectItem><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Students">Students</SelectItem><SelectItem value="Parents">Parents</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter className="mt-2"><Button className="rounded-xl bg-gradient-primary shadow-glow" onClick={handleCreateNotice}>Post</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
