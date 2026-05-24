import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { ClipboardList, Plus, Trash2, Pin } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

type Notice = { id: string; title: string; body: string; priority: string; pinned: boolean; created_at: string; };
const NOTICES_KEY = "eduflow_notices";
function ls(): Notice[] { try { return JSON.parse(localStorage.getItem(NOTICES_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Notice[]) { localStorage.setItem(NOTICES_KEY, JSON.stringify(v)); emitAppSync(NOTICES_KEY); }

export default function NoticeBoard() {
  const [items, setItems] = useState(ls());
  const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [priority, setPriority] = useState("normal");

  useEffect(() => subscribeAppSync([NOTICES_KEY], refresh), []);

  return (
    <div>
      <PageHeader title="Notice Board" subtitle="Pin important notices & announcements" icon={<ClipboardList className="h-6 w-6" />} />
      <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setTitle(""); setBody(""); setPriority("normal"); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Notice</Button></div>
      {[...items].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map((n) => (
        <Card key={n.id} className={`mb-3 ${n.pinned ? "border-primary/30" : "border-border/40"}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {n.pinned && <Pin className="h-3 w-3 text-primary" />}
                  <p className="text-sm font-medium">{n.title}</p>
                  <Badge className={`text-[9px] ${n.priority === "high" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{n.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => { ss(ls().map((x) => x.id === n.id ? { ...x, pinned: !x.pinned } : x)); refresh(); toast.success(n.pinned ? "Unpinned" : "Pinned"); }}><Pin className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== n.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No notices posted</CardContent></Card>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Notice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs">Body</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} /></div>
            <div><Label className="text-xs">Priority</Label><select className="w-full h-9 rounded-md border px-3 text-xs" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title || !body} onClick={() => { const items = ls(); items.unshift({ id: crypto.randomUUID(), title, body, priority, pinned: false, created_at: new Date().toISOString() }); ss(items); refresh(); setOpen(false); toast.success("Posted"); }}>Post</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
