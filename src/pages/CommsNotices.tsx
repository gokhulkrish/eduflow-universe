import { useEffect, useState, useRef } from "react";
import { ClipboardList, Plus, Trash2, Pin, Bold, Italic, Heading, List, ListOrdered, Link, Image, Send, Clock } from "lucide-react";
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

type NoticeStatus = "draft" | "published" | "scheduled";

interface Notice {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "high" | "urgent";
  pinned: boolean;
  audience: string;
  schedule?: string;
  status: NoticeStatus;
  attachments: { name: string; url: string }[];
  created_at: string;
}

const NOTICES_KEY = "eduflow_comms_notices";

function ls(): Notice[] {
  try { return JSON.parse(localStorage.getItem(NOTICES_KEY) ?? "[]"); } catch { return []; }
}
function ss(v: Notice[]) {
  localStorage.setItem(NOTICES_KEY, JSON.stringify(v));
  emitAppSync(NOTICES_KEY);
}

const PRIORITY_BADGE: Record<string, string> = {
  normal: "bg-muted text-muted-foreground",
  high: "bg-destructive/15 text-destructive",
  urgent: "bg-warning/15 text-warning",
};

const AUDIENCE_PRESETS = ["All Students", "All Staff", "All Parents", "All Teachers", "Entire Institution"];

export default function CommsNotices() {
  const [items, setItems] = useState<Notice[]>(ls());
  const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Notice["priority"]>("normal");
  const [audience, setAudience] = useState("All Students");
  const [schedule, setSchedule] = useState("");
  const [status, setStatus] = useState<NoticeStatus>("published");
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("");

  useEffect(() => subscribeAppSync([NOTICES_KEY], refresh), []);

  const openCreate = () => {
    setEditingId(null);
    setTitle(""); setBody(""); setPriority("normal"); setAudience("All Students");
    setSchedule(""); setStatus("published"); setAttachments([]); setOpen(true);
  };

  const openEdit = (n: Notice) => {
    setEditingId(n.id);
    setTitle(n.title); setBody(n.body); setPriority(n.priority);
    setAudience(n.audience); setSchedule(n.schedule ?? "");
    setStatus(n.status); setAttachments(n.attachments);
    setOpen(true);
  };

  const handleSave = () => {
    if (!title || !body) { toast.error("Title and body are required"); return; }
    const now = new Date().toISOString();
    if (editingId) {
      ss(ls().map((x) => x.id === editingId ? {
        ...x, title, body, priority, audience,
        schedule: schedule || undefined,
        status: schedule ? "scheduled" : status,
        attachments,
      } : x));
      toast.success("Notice updated");
    } else {
      const items = ls();
      items.unshift({
        id: generateId(), title, body, priority,
        pinned: false, audience,
        schedule: schedule || undefined,
        status: schedule ? "scheduled" : status,
        attachments,
        created_at: now,
      });
      ss(items);
      toast.success("Notice created");
    }
    setOpen(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    ss(ls().filter((x) => x.id !== id));
    refresh();
    toast.success("Notice deleted");
  };

  const handlePin = (id: string) => {
    ss(ls().map((x) => x.id === id ? { ...x, pinned: !x.pinned } : x));
    refresh();
  };

  const insertFormat = (before: string, after: string) => {
    const ta = bodyRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.substring(start, end);
    const newBody = body.substring(0, start) + before + selected + after + body.substring(end);
    setBody(newBody);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const addAttachment = () => {
    if (!attachName || !attachUrl) return;
    setAttachments([...attachments, { name: attachName, url: attachUrl }]);
    setAttachName(""); setAttachUrl("");
  };

  const removeAttachment = (i: number) => {
    setAttachments(attachments.filter((_, idx) => idx !== i));
  };

  const sorted = [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div>
      <PageHeader title="Notice Composition" subtitle="Create rich formatted notices with targeting & scheduling" icon={<ClipboardList className="h-6 w-6" />} />

      <div className="flex justify-end mb-4">
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Notice
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 && (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No notices composed yet</CardContent></Card>
        )}
        {sorted.map((n) => (
          <Card key={n.id} className={`${n.pinned ? "border-primary/30" : "border-border/40"} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => openEdit(n)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {n.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <Badge className={`text-[9px] ${PRIORITY_BADGE[n.priority]}`}>{n.priority}</Badge>
                    <Badge className={`text-[9px] ${n.status === "published" ? "bg-success/15 text-success" : n.status === "scheduled" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>{n.status}</Badge>
                    <Badge className="text-[9px] bg-muted text-muted-foreground">{n.audience}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{n.body}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</p>
                    {n.schedule && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(n.schedule).toLocaleString()}
                      </p>
                    )}
                    {n.attachments.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">{n.attachments.length} attachment(s)</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => handlePin(n.id)} title={n.pinned ? "Unpin" : "Pin"}>
                    <Pin className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => handleDelete(n.id)} title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>{editingId ? "Edit Notice" : "Compose Notice"}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="notTitle">Title</Label>
                <Input id="notTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notice headline" />
              </div>
              <div>
                <Label className="text-xs" htmlFor="notAudience">Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_PRESETS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="notPriority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="notStatus">Status</Label>
                <Select value={status} onValueChange={setStatus as any}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Body (formatted)</Label>
              <div className="flex items-center gap-1 p-1.5 bg-muted/50 rounded-t-lg border border-border/40 border-b-0">
                {[
                  { icon: Bold, before: "**", after: "**", title: "Bold" },
                  { icon: Italic, before: "*", after: "*", title: "Italic" },
                  { icon: Heading, before: "## ", after: "", title: "Heading" },
                  { icon: List, before: "- ", after: "", title: "Bullet list" },
                  { icon: ListOrdered, before: "1. ", after: "", title: "Numbered list" },
                  { icon: Link, before: "[", after: "](url)", title: "Link" },
                  { icon: Image, before: "![", after: "](url)", title: "Image" },
                ].map((fmt) => (
                  <Button key={fmt.title} variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => insertFormat(fmt.before, fmt.after)} title={fmt.title}>
                    <fmt.icon className="h-3.5 w-3.5" />
                  </Button>
                ))}
              </div>
              <Textarea ref={bodyRef} id="notBody" value={body} onChange={(e) => setBody(e.target.value)} rows={6} className="rounded-t-none font-mono text-xs" placeholder="Write your notice content here... Use the toolbar for formatting." />
            </div>

            <div>
              <Label className="text-xs" htmlFor="notSchedule">Schedule publish (optional)</Label>
              <Input id="notSchedule" type="datetime-local" value={schedule} onChange={(e) => setSchedule(e.target.value)} />
            </div>

            <div>
              <Label className="text-xs">Attachments</Label>
              <div className="flex gap-2 mt-1">
                <Input size={1} placeholder="File name" value={attachName} onChange={(e) => setAttachName(e.target.value)} className="h-8 text-xs" />
                <Input size={1} placeholder="URL" value={attachUrl} onChange={(e) => setAttachUrl(e.target.value)} className="h-8 text-xs" />
                <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs shrink-0" onClick={addAttachment}>Add</Button>
              </div>
              {attachments.length > 0 && (
                <div className="mt-1 space-y-1">
                  {attachments.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-1.5 bg-muted/30 rounded">
                      <span className="truncate">{a.name}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 rounded-lg text-destructive" onClick={() => removeAttachment(i)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!title || !body} onClick={handleSave}>
              <Send className="h-4 w-4 mr-1" /> {editingId ? "Update" : schedule ? "Schedule" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
