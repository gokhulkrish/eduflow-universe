import { useState, useEffect, useCallback } from "react";
import {
  Bell, CheckSquare, ClipboardList, AlertTriangle, Radio, MessageSquare,
  Plus, Trash2, Pin, PinOff, Edit3, Archive, ToggleLeft, ToggleRight,
  Circle, CheckCircle2, Mail, MailOpen, Eye, EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useFlashNews, type FlashNewsItem, type FlashNewsSeverity, type FlashNewsPosition, type FlashNewsStyle } from "@/stores/flashNews";
import { generateId } from "@/lib/utils";

// ── Notifications store ────────────────────────────────────────

interface NotificationItem { id: string; title: string; message: string; type: "info" | "success" | "warning" | "error"; read: boolean; createdAt: string; }
const NOTIFICATIONS_KEY = "sms.notifications.v1";
function loadNotifications(): NotificationItem[] { try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) ?? "[]"); } catch { return []; } }
function saveNotifications(v: NotificationItem[]) { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(v)); }

// ── Reminders store ────────────────────────────────────────────

interface ReminderItem { id: string; title: string; description: string; dueDate: string; priority: "low" | "medium" | "high"; completed: boolean; createdAt: string; }
const REMINDERS_KEY = "sms.reminders.v1";
function loadReminders(): ReminderItem[] { try { return JSON.parse(localStorage.getItem(REMINDERS_KEY) ?? "[]"); } catch { return []; } }
function saveReminders(v: ReminderItem[]) { localStorage.setItem(REMINDERS_KEY, JSON.stringify(v)); }

// ── Alerts store ───────────────────────────────────────────────

interface AlertItem { id: string; title: string; message: string; severity: "low" | "medium" | "high" | "critical"; acknowledged: boolean; createdAt: string; }
const ALERTS_KEY = "sms.alerts.v1";
function loadAlerts(): AlertItem[] { try { return JSON.parse(localStorage.getItem(ALERTS_KEY) ?? "[]"); } catch { return []; } }
function saveAlerts(v: AlertItem[]) { localStorage.setItem(ALERTS_KEY, JSON.stringify(v)); }

// ── Existing surface storage readers ──────────────────────────

interface NoticeItem { id: string; title: string; body: string; priority: string; pinned: boolean; created_at: string; }
const NOTICES_KEY = "eduflow_notices";
function loadNotices(): NoticeItem[] { try { return JSON.parse(localStorage.getItem(NOTICES_KEY) ?? "[]"); } catch { return []; } }
function saveNotices(v: NoticeItem[]) { localStorage.setItem(NOTICES_KEY, JSON.stringify(v)); }

interface TaskItem { id: string; title: string; description: string; assignee: string; priority: string; status: string; due_date: string; created_at: string; }
const TASKS_KEY = "eduflow_tasks";
function loadTasks(): TaskItem[] { try { return JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]"); } catch { return []; } }
function saveTasks(v: TaskItem[]) { localStorage.setItem(TASKS_KEY, JSON.stringify(v)); }

// ── Sidebar tabs ──────────────────────────────────────────────

type TabId = "reminders" | "todos" | "notifications" | "notices" | "alerts" | "flash-news";

interface TabDef { id: TabId; label: string; icon: typeof Bell; description: string; }

const TABS: TabDef[] = [
  { id: "reminders", label: "Reminders", icon: Bell, description: "Date-driven follow-ups" },
  { id: "todos", label: "To-Dos", icon: CheckSquare, description: "Actionable task list" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Live information updates" },
  { id: "notices", label: "Notices", icon: ClipboardList, description: "Public-facing notes" },
  { id: "alerts", label: "Alerts", icon: AlertTriangle, description: "High-visibility items" },
  { id: "flash-news", label: "Flash News", icon: Radio, description: "Scrolling ticker messages" },
];

const SEVERITY_LABELS: Record<FlashNewsSeverity, string> = { info: "Info", success: "Success", warning: "Warning", critical: "Critical" };
const SEVERITY_COLORS: Record<FlashNewsSeverity, string> = { info: "bg-blue-500/10 text-blue-600", success: "bg-emerald-500/10 text-emerald-600", warning: "bg-amber-500/10 text-amber-600", critical: "bg-red-500/10 text-red-600" };

// ── Flash News Editor Modal ───────────────────────────────────

function FlashNewsEditor({
  open, onClose, editItem,
}: { open: boolean; onClose: () => void; editItem?: FlashNewsItem }) {
  const { addItem, updateItem } = useFlashNews();
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [message, setMessage] = useState(editItem?.message ?? "");
  const [severity, setSeverity] = useState<FlashNewsSeverity>(editItem?.severity ?? "info");
  const [liveFrom, setLiveFrom] = useState(editItem?.liveFrom ?? new Date().toISOString().slice(0, 16));
  const [liveUntil, setLiveUntil] = useState(editItem?.liveUntil ?? "");

  const handleSave = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (editItem) {
      updateItem(editItem.id, {
        title: title.trim(),
        message: message.trim(),
        severity,
        liveFrom: new Date(liveFrom).toISOString(),
        liveUntil: liveUntil ? new Date(liveUntil).toISOString() : undefined,
      });
      toast.success("Flash news updated");
    } else {
      addItem({
        title: title.trim(),
        message: message.trim(),
        severity,
        pinned: false,
        liveFrom: new Date(liveFrom).toISOString(),
        liveUntil: liveUntil ? new Date(liveUntil).toISOString() : undefined,
        createdBy: "admin",
      });
      toast.success("Flash news added");
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? "Edit Flash News" : "Add Flash News"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fn-title">Title</Label>
            <Input id="fn-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short headline" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fn-message">Message (optional, shown on hover)</Label>
            <Textarea id="fn-message" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fn-severity">Severity</Label>
            <Select value={severity} onValueChange={(v) => setSeverity(v as FlashNewsSeverity)}>
              <SelectTrigger id="fn-severity"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["info", "success", "warning", "critical"] as const).map((s) => (
                  <SelectItem key={s} value={s}>{SEVERITY_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fn-from">Live from</Label>
              <Input id="fn-from" type="datetime-local" value={liveFrom} onChange={(e) => setLiveFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fn-until">Live until (optional)</Label>
              <Input id="fn-until" type="datetime-local" value={liveUntil} onChange={(e) => setLiveUntil(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{editItem ? "Update" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Existing surface list helpers ──────────────────────────────

function NoticeList() {
  const [items, setItems] = useState(loadNotices);
  const refresh = () => setItems(loadNotices());

  const togglePin = (id: string) => {
    const next = items.map((n) => n.id === id ? { ...n, pinned: !n.pinned } : n);
    saveNotices(next); setItems(next);
  };

  const remove = (id: string) => {
    const next = items.filter((n) => n.id !== id);
    saveNotices(next); setItems(next);
    toast.success("Notice removed");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{items.length} total</span>
        <span>{items.filter((n) => n.pinned).length} pinned</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No notices yet. Add one from the Notice Board page.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/40 p-2.5 text-sm">
              <Badge variant="outline" className="text-[10px] shrink-0">{item.priority}</Badge>
              <span className="flex-1 min-w-0 truncate">{item.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">{new Date(item.created_at).toLocaleDateString()}</span>
              <button onClick={() => togglePin(item.id)} className="shrink-0 text-muted-foreground hover:text-foreground" title={item.pinned ? "Unpin" : "Pin"}>
                {item.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(item.id)} className="shrink-0 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TodoList() {
  const [items, setItems] = useState(loadTasks);
  const refresh = () => setItems(loadTasks());

  const toggleStatus = (id: string) => {
    const next = items.map((t) => t.id === id ? { ...t, status: t.status === "completed" ? "open" : "completed" } : t);
    saveTasks(next); setItems(next);
  };

  const remove = (id: string) => {
    const next = items.filter((t) => t.id !== id);
    saveTasks(next); setItems(next);
    toast.success("Task removed");
  };

  const stats = { total: items.length, open: items.filter((t) => t.status !== "completed").length, completed: items.filter((t) => t.status === "completed").length };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{stats.total} total</span>
        <span>{stats.open} open</span>
        <span>{stats.completed} completed</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No tasks yet. Add one from the Tasks page.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/40 p-2.5 text-sm">
              <button onClick={() => toggleStatus(item.id)} className="shrink-0 text-muted-foreground hover:text-foreground" title={item.status === "completed" ? "Reopen" : "Mark done"}>
                {item.status === "completed" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
              </button>
              <span className={`flex-1 min-w-0 truncate ${item.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
              <Badge variant="outline" className="text-[10px] shrink-0">{item.priority}</Badge>
              {item.due_date && <span className="text-[10px] text-muted-foreground shrink-0">{new Date(item.due_date).toLocaleDateString()}</span>}
              <button onClick={() => remove(item.id)} className="shrink-0 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Notifications ──────────────────────────────────────────────

const NOTIFICATION_TYPE_COLORS: Record<NotificationItem["type"], string> = {
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function NotificationEditor({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationItem["type"]>("info");

  const handleSave = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const all = loadNotifications();
    all.push({
      id: generateId(),
      title: title.trim(),
      message: message.trim(),
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });
    saveNotifications(all);
    toast.success("Notification created");
    setTitle(""); setMessage(""); setType("info");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>New Notification</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notif-title">Title</Label>
            <Input id="notif-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification headline" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-msg">Message (optional)</Label>
            <Textarea id="notif-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notif-type">Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as NotificationItem["type"])}>
              <SelectTrigger id="notif-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NotificationList() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const refresh = useCallback(() => setItems(loadNotifications()), []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { const iv = setInterval(refresh, 30000); return () => clearInterval(iv); }, [refresh]);

  const markRead = (id: string) => {
    const next = items.map((n) => n.id === id ? { ...n, read: !n.read } : n);
    saveNotifications(next); setItems(next);
  };

  const remove = (id: string) => {
    const next = items.filter((n) => n.id !== id);
    saveNotifications(next); setItems(next);
    toast.success("Notification removed");
  };

  const clearAll = () => {
    saveNotifications([]); setItems([]);
    toast.success("All notifications cleared");
  };

  const unread = items.filter((n) => !n.read).length;
  const UNREAD_LABELS: Record<NotificationItem["type"], string> = { info: "Info", success: "Success", warning: "Warning", error: "Error" };

  return (
    <div className="space-y-2">
      <NotificationEditor open={editorOpen} onClose={() => setEditorOpen(false)} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{items.length} total</span>
          <span className="font-medium text-foreground">{unread} unread</span>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearAll}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />Clear all
            </Button>
          )}
          <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setEditorOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No notifications yet.</p>
      ) : (
        <div className="space-y-1.5">
          {[...items].reverse().map((item) => (
            <div key={item.id} className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
              item.read ? "border-border/40 opacity-70" : "border-primary/20 bg-primary/5"
            }`}>
              <Badge variant="secondary" className={`text-[10px] shrink-0 ${NOTIFICATION_TYPE_COLORS[item.type]}`}>{UNREAD_LABELS[item.type]}</Badge>
              <div className="flex-1 min-w-0">
                <p className={`truncate ${item.read ? "text-muted-foreground" : "font-medium"}`}>{item.title}</p>
                {item.message && <p className="truncate text-[11px] text-muted-foreground">{item.message}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
              <button onClick={() => markRead(item.id)} className="shrink-0 text-muted-foreground hover:text-foreground" title={item.read ? "Mark unread" : "Mark read"}>
                {item.read ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(item.id)} className="shrink-0 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reminders ──────────────────────────────────────────────────

const REMINDER_PRIORITY_COLORS: Record<ReminderItem["priority"], string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function ReminderEditor({ open, onClose, editItem }: { open: boolean; onClose: () => void; editItem?: ReminderItem }) {
  const [title, setTitle] = useState(editItem?.title ?? "");
  const [description, setDescription] = useState(editItem?.description ?? "");
  const [dueDate, setDueDate] = useState(editItem?.dueDate ?? "");
  const [priority, setPriority] = useState<ReminderItem["priority"]>(editItem?.priority ?? "medium");

  const handleSave = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!dueDate.trim()) { toast.error("Due date is required"); return; }
    const all = loadReminders();
    if (editItem) {
      const idx = all.findIndex((r) => r.id === editItem.id);
      if (idx >= 0) { all[idx] = { ...all[idx], title: title.trim(), description: description.trim(), dueDate, priority }; }
      saveReminders(all);
      toast.success("Reminder updated");
    } else {
      all.push({ id: generateId(), title: title.trim(), description: description.trim(), dueDate, priority, completed: false, createdAt: new Date().toISOString() });
      saveReminders(all);
      toast.success("Reminder created");
    }
    setTitle(""); setDescription(""); setDueDate(""); setPriority("medium");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{editItem ? "Edit Reminder" : "New Reminder"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rem-title">Title</Label>
            <Input id="rem-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reminder title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rem-desc">Description (optional)</Label>
            <Textarea id="rem-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rem-due">Due Date</Label>
              <Input id="rem-due" type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rem-priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as ReminderItem["priority"])}>
                <SelectTrigger id="rem-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>{editItem ? "Update" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReminderList() {
  const [items, setItems] = useState<ReminderItem[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<ReminderItem | undefined>();
  const refresh = useCallback(() => setItems(loadReminders()), []);

  useEffect(() => { refresh(); }, [refresh]);

  const toggleComplete = (id: string) => {
    const next = items.map((r) => r.id === id ? { ...r, completed: !r.completed } : r);
    saveReminders(next); setItems(next);
  };

  const remove = (id: string) => {
    const next = items.filter((r) => r.id !== id);
    saveReminders(next); setItems(next);
    toast.success("Reminder removed");
  };

  const openEditor = (item?: ReminderItem) => { setEditing(item); setEditorOpen(true); };
  const overdue = items.filter((r) => !r.completed && new Date(r.dueDate).getTime() < Date.now()).length;
  const upcoming = items.filter((r) => !r.completed && new Date(r.dueDate).getTime() >= Date.now()).length;
  const PRIORITY_LABEL: Record<ReminderItem["priority"], string> = { low: "Low", medium: "Medium", high: "High" };

  return (
    <div className="space-y-2">
      <ReminderEditor open={editorOpen} onClose={() => { setEditorOpen(false); setEditing(undefined); }} editItem={editing} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{items.length} total</span>
          <span className="text-amber-600 font-medium">{overdue} overdue</span>
          <span>{upcoming} upcoming</span>
          <span>{items.filter((r) => r.completed).length} done</span>
        </div>
        <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => openEditor()}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No reminders yet.</p>
      ) : (
        <div className="space-y-1.5">
          {[...items].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((item) => {
            const isOverdue = !item.completed && new Date(item.dueDate).getTime() < Date.now();
            return (
              <div key={item.id} className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
                item.completed ? "border-border/40 opacity-60" : isOverdue ? "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800" : "border-border/40"
              }`}>
                <button onClick={() => toggleComplete(item.id)} className="shrink-0 text-muted-foreground hover:text-emerald-500" title={item.completed ? "Reopen" : "Mark done"}>
                  {item.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4" />}
                </button>
                <Badge variant="secondary" className={`text-[10px] shrink-0 ${REMINDER_PRIORITY_COLORS[item.priority]}`}>{PRIORITY_LABEL[item.priority]}</Badge>
                <div className="flex-1 min-w-0">
                  <p className={`truncate ${item.completed ? "line-through text-muted-foreground" : ""}`}>{item.title}</p>
                  {item.description && <p className="truncate text-[11px] text-muted-foreground">{item.description}</p>}
                </div>
                <span className={`text-[10px] shrink-0 ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                  {isOverdue ? "Overdue" : new Date(item.dueDate).toLocaleDateString()}
                </span>
                <button onClick={() => openEditor(item)} className="shrink-0 text-muted-foreground hover:text-foreground" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => remove(item.id)} className="shrink-0 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Alerts ─────────────────────────────────────────────────────

const ALERT_SEVERITY_COLORS: Record<AlertItem["severity"], string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400",
  medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  high: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function AlertList() {
  const [items, setItems] = useState<AlertItem[]>([]);
  const refresh = useCallback(() => setItems(loadAlerts()), []);

  useEffect(() => { refresh(); }, [refresh]);

  const acknowledge = (id: string) => {
    const next = items.map((a) => a.id === id ? { ...a, acknowledged: !a.acknowledged } : a);
    saveAlerts(next); setItems(next);
  };

  const remove = (id: string) => {
    const next = items.filter((a) => a.id !== id);
    saveAlerts(next); setItems(next);
    toast.success("Alert dismissed");
  };

  const clearAll = () => {
    saveAlerts([]); setItems([]);
    toast.success("All alerts cleared");
  };

  const unacknowledged = items.filter((a) => !a.acknowledged).length;
  const SEVERITY_LABEL: Record<AlertItem["severity"], string> = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{items.length} total</span>
          <span className="font-medium text-foreground">{unacknowledged} unacknowledged</span>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={clearAll}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />Clear all
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No alerts yet.</p>
      ) : (
        <div className="space-y-1.5">
          {[...items].reverse().map((item) => (
            <div key={item.id} className={`flex items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
              item.acknowledged ? "border-border/40 opacity-70" : "border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
            }`}>
              <Badge variant="secondary" className={`text-[10px] shrink-0 ${ALERT_SEVERITY_COLORS[item.severity]}`}>{SEVERITY_LABEL[item.severity]}</Badge>
              <div className="flex-1 min-w-0">
                <p className={`truncate ${item.acknowledged ? "text-muted-foreground" : "font-medium"}`}>{item.title}</p>
                {item.message && <p className="truncate text-[11px] text-muted-foreground">{item.message}</p>}
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
              <button onClick={() => acknowledge(item.id)} className="shrink-0 text-muted-foreground hover:text-foreground" title={item.acknowledged ? "Mark unresolved" : "Acknowledge"}>
                {item.acknowledged ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => remove(item.id)} className="shrink-0 text-muted-foreground hover:text-destructive" title="Dismiss"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Flash News Panel ──────────────────────────────────────────

function FlashNewsPanel() {
  const { items, settings, deleteItem, togglePin, updateSettings } = useFlashNews();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<FlashNewsItem | undefined>();

  const now = Date.now();
  const active = items.filter((item) => {
    const from = new Date(item.liveFrom).getTime();
    if (now < from) return false;
    if (item.liveUntil && now > new Date(item.liveUntil).getTime()) return false;
    return true;
  });

  const openEditor = (item?: FlashNewsItem) => { setEditing(item); setEditorOpen(true); };

  return (
    <div className="space-y-5">
      <FlashNewsEditor open={editorOpen} onClose={() => { setEditorOpen(false); setEditing(undefined); }} editItem={editing} />

      <Card className="border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Flash News Settings</CardTitle>
          <CardDescription className="text-xs">Control how the Live Flash News Scroll bar behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Live Flash News Scroll</Label>
              <p className="text-xs text-muted-foreground">Show a scrolling ticker bar across the workspace</p>
            </div>
            <Switch checked={settings.enabled} onCheckedChange={(v) => updateSettings({ enabled: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Scroll Position</Label>
              <Select value={settings.position} onValueChange={(v) => updateSettings({ position: v as FlashNewsPosition })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="top">Top (below topbar)</SelectItem>
                  <SelectItem value="bottom">Bottom (above footer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Style</Label>
              <Select value={settings.style} onValueChange={(v) => updateSettings({ style: v as FlashNewsStyle })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="emphasized">Emphasized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{items.length} total</span>
          <span>{active.length} active now</span>
          <span>{items.filter((i) => i.pinned).length} pinned</span>
        </div>
        <Button size="sm" onClick={() => openEditor()} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Flash News
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No flash news items yet. Create one to get started.</p>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => {
            const isActive = active.some((a) => a.id === item.id);
            return (
              <div key={item.id} className="flex items-center gap-2 rounded-lg border border-border/40 p-2.5 text-sm">
                <span className={`shrink-0 h-2 w-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/30"}`} title={isActive ? "Active" : "Inactive"} />
                <Badge variant="secondary" className={`text-[10px] shrink-0 ${SEVERITY_COLORS[item.severity]}`}>{SEVERITY_LABELS[item.severity]}</Badge>
                <span className="flex-1 min-w-0 truncate">{item.title}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {isActive ? "live now" : `live ${new Date(item.liveFrom).toLocaleDateString()}`}
                </span>
                <span className="text-[10px] text-muted-foreground shrink-0">{new Date(item.createdAt).toLocaleDateString()}</span>
                <button onClick={() => { setEditing(item); setEditorOpen(true); }} className="shrink-0 text-muted-foreground hover:text-foreground" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => togglePin(item.id)} className="shrink-0 text-muted-foreground hover:text-foreground" title={item.pinned ? "Unpin" : "Pin"}>
                  {item.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { deleteItem(item.id); toast.success("Flash news deleted"); }} className="shrink-0 text-muted-foreground hover:text-destructive" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────

const TAB_RENDER: Record<TabId, () => JSX.Element> = {
  reminders: ReminderList,
  todos: TodoList,
  notifications: NotificationList,
  notices: NoticeList,
  alerts: AlertList,
  "flash-news": FlashNewsPanel,
};

export default function MessagingControlCenter() {
  const [tab, setTab] = useState<TabId>("flash-news");

  const activeTab = TABS.find((t) => t.id === tab)!;
  const Content = TAB_RENDER[tab];

  return (
    <div>
      <PageHeader
        title="Messaging & Control Center"
        subtitle="Unified management for reminders, to-dos, notices, alerts, and flash news"
        icon={<MessageSquare className="h-6 w-6" />}
      />

      <div className="flex gap-6">
        <div className="w-52 shrink-0 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  tab === t.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{activeTab.label}</h2>
            <p className="text-xs text-muted-foreground">{activeTab.description}</p>
          </div>
          <Content />
        </div>
      </div>
    </div>
  );
}
