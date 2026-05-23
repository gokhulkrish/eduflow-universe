import { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, BarChart3, Vote, CheckCircle2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { subscribeAppSync } from "@/lib/app-sync";
import { announcementsKey, pollsKey, getAnnouncements, createAnnouncement, deleteAnnouncement, getPolls, createPoll, votePoll, togglePoll, deletePoll, getDeliveryStats } from "@/lib/comms";

export default function Comms() {
  const [tab, setTab] = useState("announcements");
  const [anns, setAnns] = useState(() => getAnnouncements()); const [polls, setPolls] = useState(() => getPolls());
  const stats = getDeliveryStats();
  const refreshAnns = () => setAnns(getAnnouncements()); const refreshPolls = () => setPolls(getPolls());

  const [aOpen, setAOpen] = useState(false); const [aTitle, setATitle] = useState(""); const [aBody, setABody] = useState(""); const [aAudience, setAAudience] = useState("all"); const [aPriority, setAPriority] = useState("normal");
  const [pOpen, setPOpen] = useState(false); const [pQ, setPQ] = useState(""); const [pOpts, setPOpts] = useState(""); const [pActive, setPActive] = useState(true);
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  useEffect(() => subscribeAppSync([announcementsKey, pollsKey], () => {
    refreshAnns();
    refreshPolls();
  }), []);

  return (
    <div>
      <PageHeader title="Comms Hub" subtitle="Announcements, polls, surveys & delivery stats" icon={<Megaphone className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Total Announcements</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{stats.total}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Total Views</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{stats.totalViews}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Active Polls</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{polls.filter((p) => p.active).length}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="polls">Polls & Surveys</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setATitle(""); setABody(""); setAAudience("all"); setAPriority("normal"); setAOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Announcement</Button></div>
          <div className="space-y-3">
            {anns.map((a) => (
              <Card key={a.id} className={`border ${a.priority === "high" ? "border-destructive/30" : "border-border/40"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{a.title}</p>
                        <Badge className={`text-[9px] ${a.priority === "high" ? "bg-destructive/15 text-destructive" : a.priority === "urgent" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{a.priority}</Badge>
                        <Badge className="text-[9px] bg-muted text-muted-foreground">{a.audience}</Badge>
                        <Badge className="text-[9px] bg-muted text-muted-foreground">{a.views || 0} views</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{a.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()} · {a.author}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 text-destructive" onClick={() => { deleteAnnouncement(a.id); refreshAnns(); }}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {anns.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No announcements</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="polls">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setPQ(""); setPOpts(""); setPActive(true); setPOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Create Poll</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {polls.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No polls created</CardContent></Card>}
            {polls.map((p) => {
              const totalVotes = p.votes.reduce((s, v) => s + v, 0);
              return (
                <Card key={p.id} className="border-border/40">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between"><CardTitle className="text-sm">{p.question}</CardTitle><Badge className={`text-[9px] ${p.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{p.active ? "Active" : "Closed"}</Badge></div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    {p.options.map((opt, oi) => {
                      const pct = totalVotes > 0 ? Math.round((p.votes[oi] / totalVotes) * 100) : 0;
                      return (
                        <div key={oi} className="space-y-0.5">
                          <div className="flex justify-between"><span>{opt}</span><span className="text-muted-foreground">{p.votes[oi]} ({pct}%)</span></div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} /></div>
                        </div>
                      );
                    })}
                    <p className="text-[10px] text-muted-foreground">{totalVotes} total votes</p>
                    <div className="flex gap-2 pt-1">
                      {p.active && !votedPolls.has(p.id) && <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { const r = Math.floor(Math.random() * p.options.length); votePoll(p.id, r); refreshPolls(); setVotedPolls(new Set([...votedPolls, p.id])); toast.success("Voted!"); }}><CheckCircle2 className="h-3 w-3 mr-1" />Vote Random</Button>}
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { togglePoll(p.id); refreshPolls(); toast.success(p.active ? "Closed" : "Reopened"); }}>{p.active ? "Close" : "Reopen"}</Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deletePoll(p.id); refreshPolls(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={aOpen} onOpenChange={setAOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Title</Label><Input value={aTitle} onChange={(e) => setATitle(e.target.value)} /></div>
            <div><Label className="text-xs">Message</Label><Textarea value={aBody} onChange={(e) => setABody(e.target.value)} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Audience</Label><Select value={aAudience} onValueChange={setAAudience}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="students">Students</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="parents">Parents</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs">Priority</Label><Select value={aPriority} onValueChange={setAPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAOpen(false)}>Cancel</Button><Button disabled={!aTitle || !aBody} onClick={() => { createAnnouncement({ title: aTitle, body: aBody, audience: aAudience, priority: aPriority, author: "Current User", views: 0 }); refreshAnns(); setAOpen(false); toast.success("Sent"); }}>Send</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pOpen} onOpenChange={setPOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create Poll</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Question</Label><Input value={pQ} onChange={(e) => setPQ(e.target.value)} /></div>
            <div><Label className="text-xs">Options (comma-separated)</Label><Textarea value={pOpts} onChange={(e) => setPOpts(e.target.value)} rows={3} placeholder="Option 1, Option 2, Option 3" /></div>
            <div className="flex items-center gap-2"><Switch checked={pActive} onCheckedChange={setPActive} id="pActive" /><Label htmlFor="pActive" className="text-xs">Active immediately</Label></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setPOpen(false)}>Cancel</Button><Button disabled={!pQ || !pOpts} onClick={() => { const opts = pOpts.split(",").map((s) => s.trim()).filter(Boolean); createPoll({ question: pQ, options: opts, active: pActive }); refreshPolls(); setPOpen(false); toast.success("Poll created"); }}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
