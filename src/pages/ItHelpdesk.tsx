import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Headset, Plus, Clock, AlertTriangle, CheckCircle2, UserCheck, Search, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { generateId } from "@/lib/utils";

type TicketCategory = "hardware" | "software" | "network" | "account" | "printer" | "other";
type TicketPriority = "low" | "medium" | "high" | "critical";
type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

type ItTicket = {
  id: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  reported_by: string;
  reported_by_id: string;
  reported_by_type: "faculty" | "staff" | "student";
  description: string;
  assigned_to: string;
  solution: string;
  sla_hours: number;
  created_at: string;
  resolved_at: string;
};

const TICKETS_KEY = "eduflow_it_tickets";
const CATEGORIES: TicketCategory[] = ["hardware", "software", "network", "account", "printer", "other"];
const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "critical"];
const STATUSES: TicketStatus[] = ["open", "in_progress", "resolved", "closed"];

function tl(): ItTicket[] { try { return JSON.parse(localStorage.getItem(TICKETS_KEY) ?? "[]"); } catch { return []; } }
function ts(v: ItTicket[]) { localStorage.setItem(TICKETS_KEY, JSON.stringify(v)); emitAppSync(TICKETS_KEY); }

const PRIORITY_COLORS: Record<TicketPriority, string> = { low: "bg-info/15 text-info", medium: "bg-warning/15 text-warning", high: "bg-orange-500/15 text-orange-500", critical: "bg-destructive/15 text-destructive" };
const STATUS_COLORS: Record<TicketStatus, string> = { open: "bg-destructive/15 text-destructive", in_progress: "bg-info/15 text-info", resolved: "bg-success/15 text-success", closed: "bg-muted text-muted-foreground" };

export default function ItHelpdesk() {
  const [tickets, setTickets] = useState<ItTicket[]>(tl);
  const refresh = () => setTickets(tl());
  const [tab, setTab] = useState("open");
  const [search, setSearch] = useState("");

  useEffect(() => subscribeAppSync([TICKETS_KEY], refresh), []);

  const filtered = tickets.filter((t) => {
    if (tab === "open") return t.status === "open" || t.status === "in_progress";
    if (tab === "resolved") return t.status === "resolved" || t.status === "closed";
    return true;
  }).filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.reported_by.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.assigned_to.toLowerCase().includes(q);
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [formTitle, setFormTitle] = useState(""); const [formCat, setFormCat] = useState<TicketCategory>("hardware"); const [formPri, setFormPri] = useState<TicketPriority>("medium"); const [formRep, setFormRep] = useState(""); const [formRepType, setFormRepType] = useState<"faculty" | "staff" | "student">("faculty"); const [formDesc, setFormDesc] = useState(""); const [formSLA, setFormSLA] = useState("24");

  const [detailTicket, setDetailTicket] = useState<ItTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignText, setAssignText] = useState("");
  const [solutionText, setSolutionText] = useState("");

  function createTicket() {
    if (!formTitle.trim() || !formRep.trim() || !formDesc.trim()) { toast.error("Title, reporter & description required"); return; }
    ts([...tl(), { id: generateId(), title: formTitle.trim(), category: formCat, priority: formPri, status: "open", reported_by: formRep.trim(), reported_by_id: "", reported_by_type: formRepType, description: formDesc, assigned_to: "", solution: "", sla_hours: parseInt(formSLA) || 24, created_at: new Date().toISOString(), resolved_at: "" }]);
    refresh(); setOpenCreate(false); toast.success("Ticket created");
  }

  function updateStatus(t: ItTicket, status: TicketStatus) {
    const list = tl(); const idx = list.findIndex((x) => x.id === t.id);
    if (idx >= 0) { list[idx] = { ...list[idx], status, resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : list[idx].resolved_at }; ts(list); refresh(); toast.success(`Ticket ${status}`); }
  }

  function assignTicket() {
    if (!detailTicket || !assignText.trim()) return;
    const list = tl(); const idx = list.findIndex((x) => x.id === detailTicket.id);
    if (idx >= 0) { list[idx] = { ...list[idx], assigned_to: assignText.trim(), status: list[idx].status === "open" ? "in_progress" : list[idx].status }; ts(list); refresh(); setDetailTicket(list[idx]); setAssignText(""); toast.success("Assigned"); }
  }

  function resolveTicket() {
    if (!detailTicket || !solutionText.trim()) return;
    const list = tl(); const idx = list.findIndex((x) => x.id === detailTicket.id);
    if (idx >= 0) { list[idx] = { ...list[idx], solution: solutionText.trim(), status: "resolved", resolved_at: new Date().toISOString() }; ts(list); refresh(); setDetailTicket(list[idx]); setSolutionText(""); toast.success("Ticket resolved"); }
  }

  function slaRemaining(t: ItTicket): string {
    if (t.resolved_at) return "Resolved";
    const created = new Date(t.created_at).getTime();
    const deadline = created + t.sla_hours * 3600000;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return "Overdue!";
    const hrs = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  }

  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;
  const overdueCount = tickets.filter((t) => (t.status === "open" || t.status === "in_progress") && new Date(t.created_at).getTime() + t.sla_hours * 3600000 < Date.now()).length;

  return (
    <div>
      <PageHeader title="IT Helpdesk" subtitle="Ticket management with SLA tracking & assignment" icon={<Headset className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-5 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Tickets</p><p className="text-2xl font-bold">{tickets.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Open / In Progress</p><p className="text-2xl font-bold text-info">{openCount}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Overdue SLA</p><p className="text-2xl font-bold text-destructive">{overdueCount}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Resolved</p><p className="text-2xl font-bold text-success">{tickets.filter((t) => t.status === "resolved" || t.status === "closed").length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Critical</p><p className="text-2xl font-bold text-destructive">{tickets.filter((t) => t.priority === "critical" && t.status !== "resolved" && t.status !== "closed").length}</p></Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tickets..." className="flex-1 min-w-[200px] h-9 text-xs" />
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setFormTitle(""); setFormCat("hardware"); setFormPri("medium"); setFormRep(""); setFormRepType("faculty"); setFormDesc(""); setFormSLA("24"); setOpenCreate(true); }}><Plus className="h-4 w-4 mr-1" /> New Ticket</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4"><TabsTrigger value="open">Open ({openCount})</TabsTrigger><TabsTrigger value="resolved">Resolved/Closed ({tickets.length - openCount})</TabsTrigger></TabsList>

        <TabsContent value="open">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <Card key={t.id} className="hover-lift cursor-pointer p-4" onClick={() => { setDetailTicket(t); setAssignText(""); setSolutionText(""); setDetailOpen(true); }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex gap-2 flex-wrap"><Badge className={`text-[9px] border ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</Badge><Badge className={`text-[9px] border ${STATUS_COLORS[t.status]}`}>{t.status.replace("_", " ")}</Badge></div>
                  <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-medium mb-1">{t.title}</p>
                <p className="text-[10px] text-muted-foreground mb-2">{t.category} · {t.reported_by} ({t.reported_by_type})</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{t.description}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className={slaRemaining(t) === "Overdue!" ? "text-destructive font-bold" : "text-muted-foreground"}><Clock className="h-3 w-3 inline mr-1" />{slaRemaining(t)}</span>
                  <span>{t.assigned_to ? <><UserCheck className="h-3 w-3 inline mr-1" />{t.assigned_to}</> : "Unassigned"}</span>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && <div className="col-span-full text-center text-xs text-muted-foreground py-12">{search ? "No matching tickets" : "No open tickets"}</div>}
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <div className="space-y-2">
            {filtered.map((t) => (
              <Card key={t.id} className="hover-lift cursor-pointer p-3" onClick={() => { setDetailTicket(t); setAssignText(""); setSolutionText(""); setDetailOpen(true); }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className={`h-4 w-4 ${t.status === "resolved" ? "text-success" : "text-muted-foreground"}`} />
                    <div><p className="text-sm font-medium">{t.title}</p><p className="text-[10px] text-muted-foreground">{t.category} · {t.reported_by}</p></div>
                  </div>
                  <div className="flex items-center gap-2"><Badge className={`text-[9px] border ${STATUS_COLORS[t.status]}`}>{t.status}</Badge><span className="text-[10px] text-muted-foreground">{t.resolved_at ? new Date(t.resolved_at).toLocaleDateString() : "—"}</span></div>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && <div className="text-center text-xs text-muted-foreground py-12">No resolved tickets</div>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New IT Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Title</Label><Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Brief issue summary" /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Category</Label><Select value={formCat} onValueChange={(v) => setFormCat(v as TicketCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs">Priority</Label><Select value={formPri} onValueChange={(v) => setFormPri(v as TicketPriority)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Reported By</Label><Input value={formRep} onChange={(e) => setFormRep(e.target.value)} placeholder="Name" /></div><div><Label className="text-xs">Type</Label><Select value={formRepType} onValueChange={(v) => setFormRepType(v as "faculty" | "staff" | "student")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="faculty">Faculty</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="student">Student</SelectItem></SelectContent></Select></div></div>
            <div><Label className="text-xs">Description</Label><Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} placeholder="Detailed description of the issue" /></div>
            <div><Label className="text-xs">SLA Target (hours)</Label><Input type="number" value={formSLA} onChange={(e) => setFormSLA(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpenCreate(false)}>Cancel</Button><Button className="bg-gradient-primary shadow-glow" onClick={createTicket}>Create Ticket</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{detailTicket?.title}</DialogTitle></DialogHeader>
          {detailTicket && (<div className="space-y-4">
            <div className="flex gap-2 flex-wrap"><Badge className={`text-[9px] border ${PRIORITY_COLORS[detailTicket.priority]}`}>{detailTicket.priority}</Badge><Badge className={`text-[9px] border ${STATUS_COLORS[detailTicket.status]}`}>{detailTicket.status.replace("_", " ")}</Badge><Badge variant="outline" className="text-[9px]">{detailTicket.category}</Badge></div>
            <div className="grid grid-cols-2 gap-2 text-xs"><div><span className="text-muted-foreground">Reported by:</span> {detailTicket.reported_by} ({detailTicket.reported_by_type})</div><div><span className="text-muted-foreground">Created:</span> {new Date(detailTicket.created_at).toLocaleString()}</div><div><span className="text-muted-foreground">Assigned to:</span> {detailTicket.assigned_to || "Unassigned"}</div><div><span className="text-muted-foreground">SLA:</span> <span className={slaRemaining(detailTicket) === "Overdue!" ? "text-destructive font-bold" : ""}>{slaRemaining(detailTicket)}</span></div></div>
            <div><Label className="text-xs text-muted-foreground">Description</Label><p className="text-xs mt-1 whitespace-pre-wrap">{detailTicket.description}</p></div>
            {detailTicket.solution && <div><Label className="text-xs text-muted-foreground">Solution</Label><p className="text-xs mt-1 whitespace-pre-wrap">{detailTicket.solution}</p></div>}
            {(detailTicket.status === "open" || detailTicket.status === "in_progress") && <>
              <div className="border-t pt-3"><Label className="text-xs">Assign to IT Staff</Label><div className="flex gap-2 mt-1"><Input value={assignText} onChange={(e) => setAssignText(e.target.value)} placeholder="Staff name" className="flex-1 h-9 text-xs" /><Button size="sm" className="rounded-xl" onClick={assignTicket}><UserCheck className="h-3 w-3 mr-1" />Assign</Button></div></div>
              <div className="border-t pt-3"><Label className="text-xs">Resolution Notes</Label><div className="flex gap-2 mt-1"><Input value={solutionText} onChange={(e) => setSolutionText(e.target.value)} placeholder="Describe the solution" className="flex-1 h-9 text-xs" /><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={resolveTicket}><CheckCircle2 className="h-3 w-3 mr-1" />Resolve</Button></div></div>
            </>}
          </div>)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
