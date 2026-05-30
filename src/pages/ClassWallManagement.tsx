import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { LayoutPanelTop, Plus, Pencil, Trash2, Send, Download, Upload } from "lucide-react";
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
import { getWallPosts, createWallPost, updateWallPost, deleteWallPost, classWallKey, type WallPost } from "@/lib/class-wall";

const CLASSES = ["1-A","1-B","2-A","2-B","3-A","3-B","4-A","5-A","6-A","7-A","8-A","9-A","10-A","11-A","12-A"];

export default function ClassWallManagement() {
  const navigate = useNavigate();
  const [items, setItems] = useState<WallPost[]>([]); const [filterClass, setFilterClass] = useState("all"); const [loading, setLoading] = useState(true); const refresh = async () => setItems(await getWallPosts());
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [selClass, setSelClass] = useState(""); const [author, setAuthor] = useState(""); const [content, setContent] = useState(""); const [attachment, setAttachment] = useState(""); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setSelClass(""); setAuthor(""); setContent(""); setAttachment(""); setOpen(true); };
  const openEdit = (p: WallPost) => { setEditId(p.id); setSelClass(p.class); setAuthor(p.author); setContent(p.content); setAttachment(p.attachment); setOpen(true); };
  const filtered = items.filter((p) => filterClass === "all" || p.class === filterClass);

  useEffect(() => { refresh().then(() => setLoading(false)); }, []);
  useRealtime("class_wall_posts", refresh);

  return (
    <div>
      <PageHeader title="Campus Wall Management" subtitle="Cohort-specific posts & announcements" icon={<LayoutPanelTop className="h-6 w-6" />} />
      <div className="flex gap-3 mb-4">
        <Select name="filterClass" value={filterClass} onValueChange={setFilterClass}><SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Cohorts" /></SelectTrigger><SelectContent><SelectItem value="all">All Cohorts</SelectItem>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=class-wall")}><Upload className="h-4 w-4 mr-1" /> Import</Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(filtered, "wall-posts", [{key:"class",label:"Cohort"},{key:"author",label:"Author"},{key:"content",label:"Content"},{key:"attachment",label:"Attachment"}])}><Download className="h-4 w-4 mr-1" /> Export</Button>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow ml-auto" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New Post</Button>
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
              <div className="flex gap-1"><Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button><Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => setDeleteId(p.id)}><Trash2 className="h-3 w-3" /></Button></div>
            </div>
          </CardContent>
        </Card>
      ))}
      {filtered.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No posts</CardContent></Card>}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Post</AlertDialogTitle><AlertDialogDescription>This will permanently remove this post. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteWallPost(deleteId); await refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Post" : "New Post"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="selClass">Cohort</Label><Select name="selClass" value={selClass} onValueChange={setSelClass}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs" htmlFor="author">Author</Label><Input id="author" name="author" value={author} onChange={(e) => setAuthor(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="content">Content</Label><Textarea id="content" name="content" value={content} onChange={(e) => setContent(e.target.value)} rows={3} /></div>
            <div><Label className="text-xs" htmlFor="attachment">Attachment URL (optional)</Label><Input id="attachment" name="attachment" value={attachment} onChange={(e) => setAttachment(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!selClass || !content} onClick={async () => { if (editId) { await updateWallPost(editId, { class: selClass, author, content, attachment }); } else { await createWallPost({ class: selClass, author, content, attachment }); } await refresh(); setOpen(false); toast.success(editId ? "Updated" : "Posted"); }}>{editId ? "Update" : "Post"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
