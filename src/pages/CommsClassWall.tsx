import { useEffect, useState } from "react";
import { LayoutPanelTop, Plus, Trash2, Pin, Send, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { generateId } from "@/lib/utils";

interface WallPost {
  id: string;
  classId: string;
  className: string;
  title: string;
  body: string;
  author: string;
  priority: "normal" | "high" | "urgent";
  pinned: boolean;
  attachments: { name: string; url: string }[];
  broadcastToComms: boolean;
  created_at: string;
}

const KEY = "eduflow_comms_class_wall";
function ls(): WallPost[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
function ss(v: WallPost[]) {
  localStorage.setItem(KEY, JSON.stringify(v));
  emitAppSync(KEY);
}

const CLASSES = [
  "1-A","1-B","2-A","2-B","3-A","3-B","4-A","5-A","6-A","7-A",
  "8-A","8-B","9-A","9-B","10-A","10-B","11-A","11-B","12-A","12-B",
];

const PRIORITY_BADGE: Record<string, string> = {
  normal: "bg-muted text-muted-foreground",
  high: "bg-destructive/15 text-destructive",
  urgent: "bg-warning/15 text-warning",
};

export default function CommsClassWall() {
  const [items, setItems] = useState<WallPost[]>(ls());
  const refresh = () => setItems(ls());
  const [filterClass, setFilterClass] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [priority, setPriority] = useState<WallPost["priority"]>("normal");
  const [pinned, setPinned] = useState(false);
  const [broadcast, setBroadcast] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const [attachName, setAttachName] = useState("");
  const [attachUrl, setAttachUrl] = useState("");

  useEffect(() => subscribeAppSync([KEY], refresh), []);

  const filtered = items.filter((p) => filterClass === "all" || p.classId === filterClass);
  const sorted = [...filtered].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const openCreate = () => {
    setEditingId(null);
    setClassId(""); setTitle(""); setBody(""); setAuthor("");
    setPriority("normal"); setPinned(false); setBroadcast(false);
    setAttachments([]);
    setOpen(true);
  };

  const openEdit = (p: WallPost) => {
    setEditingId(p.id);
    setClassId(p.classId); setTitle(p.title); setBody(p.body);
    setAuthor(p.author); setPriority(p.priority); setPinned(p.pinned);
    setBroadcast(p.broadcastToComms); setAttachments(p.attachments);
    setOpen(true);
  };

  const handleSave = () => {
    if (!classId || !body) { toast.error("Class and content are required"); return; }
    const className = CLASSES.find((c) => c === classId) ?? classId;
    const now = new Date().toISOString();
    if (editingId) {
      ss(ls().map((x) => x.id === editingId ? {
        ...x, classId, className, title, body, author, priority, pinned,
        broadcastToComms: broadcast, attachments,
      } : x));
      toast.success("Post updated");
    } else {
      const posts = ls();
      posts.unshift({
        id: generateId(), classId, className, title, body, author,
        priority, pinned, attachments, broadcastToComms: broadcast,
        created_at: now,
      });
      ss(posts);
      toast.success(broadcast ? "Post created and broadcast to comms channels" : "Post created");
    }
    setOpen(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    ss(ls().filter((x) => x.id !== id));
    refresh();
    toast.success("Post deleted");
  };

  const handlePin = (id: string) => {
    ss(ls().map((x) => x.id === id ? { ...x, pinned: !x.pinned } : x));
    refresh();
  };

  const addAttachment = () => {
    if (!attachName || !attachUrl) return;
    setAttachments([...attachments, { name: attachName, url: attachUrl }]);
    setAttachName(""); setAttachUrl("");
  };

  return (
    <div>
      <PageHeader title="Class Wall" subtitle="Class-level posts & announcements with comms broadcast" icon={<LayoutPanelTop className="h-6 w-6" />} />

      <div className="flex gap-3 mb-4 items-center">
        <Select value={filterClass} onValueChange={setFilterClass}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Classes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{sorted.length} post(s)</span>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow ml-auto" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" /> New Post
        </Button>
      </div>

      <div className="space-y-3">
        {sorted.length === 0 && (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No posts for this class</CardContent></Card>
        )}
        {sorted.map((p) => (
          <Card key={p.id} className={`${p.pinned ? "border-primary/30" : "border-border/40"} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => openEdit(p)}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                    <Badge className="text-[9px] bg-muted text-muted-foreground">{p.className}</Badge>
                    {p.title && <span className="text-sm font-medium truncate">{p.title}</span>}
                    <Badge className={`text-[9px] ${PRIORITY_BADGE[p.priority]}`}>{p.priority}</Badge>
                    {p.broadcastToComms && <Badge className="text-[9px] bg-primary/10 text-primary">Broadcast</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.body}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                    <span>{p.author || "Anonymous"}</span>
                    <span>{new Date(p.created_at).toLocaleString()}</span>
                    {p.attachments.length > 0 && (
                      <span className="flex items-center gap-1"><Paperclip className="h-3 w-3" />{p.attachments.length}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => handlePin(p.id)} title={p.pinned ? "Unpin" : "Pin"}>
                    <Pin className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => handleDelete(p.id)} title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingId ? "Edit Post" : "New Class Post"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="wallClass">Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="wallPriority">Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="wallTitle">Title (optional)</Label>
                <Input id="wallTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post headline" />
              </div>
              <div>
                <Label className="text-xs" htmlFor="wallAuthor">Author</Label>
                <Input id="wallAuthor" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
              </div>
            </div>
            <div>
              <Label className="text-xs" htmlFor="wallBody">Content</Label>
              <Textarea id="wallBody" value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Write your post..." />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="rounded" />
                <span className="text-xs">Pin to top</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={broadcast} onChange={(e) => setBroadcast(e.target.checked)} className="rounded" />
                <span className="text-xs">Broadcast via Comms</span>
              </label>
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
                      <Button variant="ghost" size="sm" className="h-5 w-5 rounded-lg text-destructive" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!classId || !body} onClick={handleSave}>
              <Send className="h-4 w-4 mr-1" /> {editingId ? "Update" : "Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
