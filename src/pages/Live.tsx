import { useEffect, useState } from "react";
import { Video, Plus, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { subscribeAppSync } from "@/lib/app-sync";
import { liveSessionsKey, getLocalSessions, saveLocalSession, deleteLocalSession } from "@/lib/live";

export default function Live() {
  const qc = useQueryClient();
  const [sessions, setSessions] = useState(() => getLocalSessions());
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState(""); const [desc, setDesc] = useState(""); const [date, setDate] = useState(""); const [start, setStart] = useState(""); const [end, setEnd] = useState(""); const [url, setUrl] = useState("");

  const refresh = () => { setSessions(getLocalSessions()); };

  useEffect(() => subscribeAppSync([liveSessionsKey], refresh), []);

  const saveMut = useMutation({
    mutationFn: async () => saveLocalSession(editId ? { id: editId, title, description: desc || null, subject_id: null, class_id: null, meeting_url: url || null, date, start_time: start, end_time: end || null, host_id: null, status: "scheduled", recording_url: null } : { title, description: desc || null, subject_id: null, class_id: null, meeting_url: url || null, date, start_time: start, end_time: end || null, host_id: null, status: "scheduled", recording_url: null }),
    onSuccess: () => { refresh(); setOpen(false); toast.success(editId ? "Updated" : "Created"); },
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => deleteLocalSession(id),
    onSuccess: () => { refresh(); toast.success("Deleted"); },
  });

  const openEdit = (s?: any) => {
    setEditId(s?.id ?? null); setTitle(s?.title ?? ""); setDesc(s?.description ?? ""); setDate(s?.date ?? ""); setStart(s?.start_time ?? ""); setEnd(s?.end_time ?? ""); setUrl(s?.meeting_url ?? ""); setOpen(true);
  };

  return (
    <div>
      <PageHeader title="Live Sessions" subtitle="Schedule & manage online sessions" icon={<Video className="h-6 w-6" />} />

      <div className="flex justify-end mb-4">
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => openEdit()}><Plus className="h-4 w-4 mr-1" /> Schedule Session</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.length === 0 && (
          <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No sessions scheduled</CardContent></Card>
        )}
        {sessions.map((s) => (
          <Card key={s.id} className="border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="text-sm">{s.title}</CardTitle>
                <Badge className="text-[10px] bg-primary/15 text-primary">{s.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {s.description && <p className="text-muted-foreground">{s.description}</p>}
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{new Date(s.date).toLocaleDateString()}</span>
                <span>{s.start_time.slice(0, 5)}{s.end_time ? `-${s.end_time.slice(0, 5)}` : ""}</span>
              </div>
              <div className="flex gap-2 pt-1">
                {s.meeting_url && (
                  <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => window.open(s.meeting_url, "_blank")}>
                    <ExternalLink className="h-3 w-3 mr-1" /> Join
                  </Button>
                )}
                <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => openEdit(s)}>Edit</Button>
                <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => { if (confirm("Delete?")) delMut.mutate(s.id); }} disabled={delMut.isPending}><Trash2 className="h-3 w-3 mr-1" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit" : "Schedule"} Session</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="liveTitle">Title</Label><Input id="liveTitle" name="liveTitle" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="liveDesc">Description</Label><Textarea id="liveDesc" name="liveDesc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="liveDate">Date</Label><Input id="liveDate" name="liveDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="liveStart">Start Time</Label><Input id="liveStart" name="liveStart" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs" htmlFor="liveEnd">End Time</Label><Input id="liveEnd" name="liveEnd" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
              <div><Label className="text-xs" htmlFor="liveUrl">Meeting URL</Label><Input id="liveUrl" name="liveUrl" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/..." /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMut.mutate()} disabled={!title || !date || !start || saveMut.isPending}>{saveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editId ? "Update" : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
