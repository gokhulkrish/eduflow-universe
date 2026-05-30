import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { ClipboardList, Plus, Pencil, Trash2, Pin, Download, Upload } from "lucide-react";
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
import { useRealtime } from "@/lib/use-realtime";
import { getNotices, createNotice, updateNotice, deleteNotice, NOTICES_KEY, type Notice } from "@/lib/notices";

export default function NoticeBoard() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = async () => setItems(await getNotices());
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null); const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [priority, setPriority] = useState("normal"); const [deleteId, setDeleteId] = useState<string | null>(null);
  const openAdd = () => { setEditId(null); setTitle(""); setBody(""); setPriority("normal"); setOpen(true); };
  const openEdit = (n: Notice) => { setEditId(n.id); setTitle(n.title); setBody(n.body); setPriority(n.priority); setOpen(true); };

  useEffect(() => { refresh().then(() => setLoading(false)); }, []); useRealtime("notices", refresh);

  const exportCols = [{key:"title",label:"Title"},{key:"priority",label:"Priority"},{key:"body",label:"Body"},{key:"pinned",label:"Pinned"},{key:"created_at",label:"Created"}];

  return (
    <div>
      <PageHeader title="Notice Board" subtitle="Pin important notices & announcements" icon={<ClipboardList className="h-6 w-6" />} />
      <div className="flex justify-end mb-4"><Button size="sm" variant="outline" className="rounded-xl mr-2" onClick={() => navigate("/import?module=notices")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl mr-2" onClick={() => exportToCsv(items, "notices", exportCols)}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New Notice</Button></div>
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
                <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={() => openEdit(n)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7" onClick={async () => { await updateNotice(n.id, { pinned: !n.pinned }); await refresh(); toast.success(n.pinned ? "Unpinned" : "Pinned"); }}><Pin className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => setDeleteId(n.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No notices posted</CardContent></Card>}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Notice</AlertDialogTitle><AlertDialogDescription>This will permanently remove this notice. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (deleteId) { await deleteNotice(deleteId); await refresh(); toast.success("Deleted"); } setDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Notice" : "New Notice"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="noticeTitle">Title</Label><Input id="noticeTitle" name="noticeTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="noticeBody">Body</Label><Textarea id="noticeBody" name="noticeBody" value={body} onChange={(e) => setBody(e.target.value)} rows={3} /></div>
            <div><Label className="text-xs" htmlFor="noticePriority">Priority</Label><select id="noticePriority" name="noticePriority" className="w-full h-9 rounded-md border px-3 text-xs" value={priority} onChange={(e) => setPriority(e.target.value)}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={!title || !body} onClick={async () => { if (editId) { await updateNotice(editId, { title, body, priority }); } else { await createNotice({ title, body, priority, pinned: false }); } await refresh(); setOpen(false); toast.success(editId ? "Updated" : "Posted"); }}>{editId ? "Update" : "Post"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
