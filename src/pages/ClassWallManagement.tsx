import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { LayoutPanelTop, Plus, Trash2, Send } from "lucide-react";
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

type Post = { id: string; class: string; author: string; content: string; attachment: string; created_at: string; };
export const classWallKey = "eduflow_class_wall";
function ls(): Post[] { try { return JSON.parse(localStorage.getItem(classWallKey) ?? "[]"); } catch { return []; } }
function ss(v: Post[]) { localStorage.setItem(classWallKey, JSON.stringify(v)); emitAppSync(classWallKey); }

const CLASSES = ["1-A","1-B","2-A","2-B","3-A","3-B","4-A","5-A","6-A","7-A","8-A","9-A","10-A","11-A","12-A"];

export default function ClassWallManagement() {
  const [items, setItems] = useState(ls()); const [filterClass, setFilterClass] = useState("all"); const refresh = () => setItems(ls());
  const [open, setOpen] = useState(false); const [selClass, setSelClass] = useState(""); const [author, setAuthor] = useState(""); const [content, setContent] = useState(""); const [attachment, setAttachment] = useState("");
  const filtered = items.filter((p) => filterClass === "all" || p.class === filterClass);

  useEffect(() => subscribeAppSync([classWallKey], refresh), []);

  return (
    <div>
      <PageHeader title="Campus Wall Management" subtitle="Cohort-specific posts & announcements" icon={<LayoutPanelTop className="h-6 w-6" />} />
      <div className="flex gap-3 mb-4">
        <Select name="filterClass" value={filterClass} onValueChange={setFilterClass}><SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Cohorts" /></SelectTrigger><SelectContent><SelectItem value="all">All Cohorts</SelectItem>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow ml-auto" onClick={() => { setSelClass(""); setAuthor(""); setContent(""); setAttachment(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Post</Button>
      </div>
      {filtered.map((p) => (
        <Card key={p.id} className="mb-3 border-border/40">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2"><Badge className="text-[9px] bg-muted text-muted-foreground">{p.class}</Badge><span className="text-xs font-medium">{p.author}</span><span className="text-[10px] text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span></div>
                <p className="text-sm mt-2">{p.content}</p>
                {p.attachment && <p className="text-xs text-primary mt-1">📎 {p.attachment}</p>}
              </div>
              <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => { ss(ls().filter((x) => x.id !== p.id)); refresh(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}
      {filtered.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No posts</CardContent></Card>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Post</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="selClass">Cohort</Label><Select name="selClass" value={selClass} onValueChange={setSelClass}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs" htmlFor="author">Author</Label><Input id="author" name="author" value={author} onChange={(e) => setAuthor(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="content">Content</Label><Textarea id="content" name="content" value={content} onChange={(e) => setContent(e.target.value)} rows={3} /></div>
            <div><Label className="text-xs" htmlFor="attachment">Attachment URL (optional)</Label><Input id="attachment" name="attachment" value={attachment} onChange={(e) => setAttachment(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!selClass || !content} onClick={() => { const items = ls(); items.unshift({ id: generateId(), class: selClass, author, content, attachment, created_at: new Date().toISOString() }); ss(items); refresh(); setOpen(false); toast.success("Posted"); }}>Post</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
