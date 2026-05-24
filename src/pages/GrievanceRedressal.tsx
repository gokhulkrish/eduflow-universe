import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { MessageSquare, Plus, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

type Ticket = { id: string; student: string; category: string; description: string; priority: string; status: string; created: string; resolved: string; };
const GRIEVANCES_KEY = "eduflow_grievances";
function tl(): Ticket[] { try { return JSON.parse(localStorage.getItem(GRIEVANCES_KEY) ?? "[]"); } catch { return []; } }
function ts(v: Ticket[]) { localStorage.setItem(GRIEVANCES_KEY, JSON.stringify(v)); emitAppSync(GRIEVANCES_KEY); }

export default function GrievanceRedressal() {
  const [tab, setTab] = useState("open");
  const [items, setItems] = useState(tl);
  const refresh = () => setItems(tl());

  const [open, setOpen] = useState(false); const [student, setStudent] = useState(""); const [cat, setCat] = useState(""); const [desc, setDesc] = useState(""); const [priority, setPriority] = useState("medium");

  useEffect(() => subscribeAppSync([GRIEVANCES_KEY], refresh), []);

  const openTickets = items.filter((t) => t.status !== "resolved" && t.status !== "closed");
  const resolvedTickets = items.filter((t) => t.status === "resolved" || t.status === "closed");

  const pag = usePagination({ data: resolvedTickets, pageSize: 10 });

  return (
    <div>
      <PageHeader title="Grievance Redressal" subtitle="Student complaint tracking & resolution" icon={<MessageSquare className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-4 mb-6">
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total</p><p className="text-2xl font-bold">{items.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Open</p><p className="text-2xl font-bold text-warning">{openTickets.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">Resolved</p><p className="text-2xl font-bold text-success">{resolvedTickets.length}</p></Card>
        <Card className="p-4"><p className="text-[10px] text-muted-foreground">High Priority</p><p className="text-2xl font-bold text-destructive">{items.filter((t) => t.priority === "high" && t.status !== "resolved").length}</p></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="open">Open ({openTickets.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedTickets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="open">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setStudent(""); setCat(""); setDesc(""); setPriority("medium"); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Ticket</Button></div>
          <div className="space-y-3">
            {openTickets.map((t) => (
              <Card key={t.id} className="hover-lift">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[9px] ${t.priority === "high" ? "bg-destructive/15 text-destructive" : t.priority === "medium" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"}`}>{t.priority}</Badge>
                        <Badge className="text-[9px] bg-muted text-muted-foreground">{t.category}</Badge>
                        <span className="text-xs text-muted-foreground">{t.student}</span>
                      </div>
                      <p className="text-sm">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(t.created).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => { ts(tl().map((x) => x.id === t.id ? { ...x, status: "resolved", resolved: new Date().toISOString() } : x)); refresh(); toast.success("Resolved"); }}><CheckCircle2 className="h-3 w-3 mr-1" />Resolve</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {openTickets.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No open grievances</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <TablePagination {...pag} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Category</TableHead><TableHead className="text-xs">Priority</TableHead><TableHead className="text-xs">Description</TableHead><TableHead className="text-xs">Resolved</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag.pageData.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{t.student}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{t.category}</Badge></TableCell>
                  <TableCell><Badge className={`text-[9px] ${t.priority === "high" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>{t.priority}</Badge></TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{t.description}</TableCell>
                  <TableCell className="text-xs">{t.resolved ? new Date(t.resolved).toLocaleDateString() : "—"}</TableCell>
                </TableRow>
              ))}
              {resolvedTickets.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No resolved grievances</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Grievance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Student</Label><Input value={student} onChange={(e) => setStudent(e.target.value)} /></div><div><Label className="text-xs">Category</Label><Select value={cat} onValueChange={setCat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Academic", "Fee", "Facility", "Harassment", "Examination", "Administration", "Other"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label className="text-xs">Description</Label><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></div>
            <div><Label className="text-xs">Priority</Label><Select value={priority} onValueChange={setPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { ts([...tl(), { id: crypto.randomUUID(), student, category: cat, description: desc, priority, status: "open", created: new Date().toISOString(), resolved: "" }]); refresh(); setOpen(false); toast.success("Filed"); }} disabled={!student || !cat || !desc}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
