import "@/lib/runtime-storage";
import { useEffect, useState } from "react";
import { Award, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
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
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

type Scheme = { id: string; name: string; provider: string; amount: number; criteria: string; };
export const scholarshipSchemesKey = "eduflow_scholarship_schemes";
function sl(): Scheme[] { try { return JSON.parse(localStorage.getItem(scholarshipSchemesKey) ?? "[]"); } catch { return []; } }
function ss(v: Scheme[]) { localStorage.setItem(scholarshipSchemesKey, JSON.stringify(v)); emitAppSync(scholarshipSchemesKey); }

type Application = { id: string; student: string; scheme: string; amount: number; status: string; applied: string; };
export const scholarshipApplicationsKey = "eduflow_scholarship_apps";
function apl(): Application[] { try { return JSON.parse(localStorage.getItem(scholarshipApplicationsKey) ?? "[]"); } catch { return []; } }
function aps(v: Application[]) { localStorage.setItem(scholarshipApplicationsKey, JSON.stringify(v)); emitAppSync(scholarshipApplicationsKey); }

export default function Scholarship() {
  const [tab, setTab] = useState("schemes");
  const [schemes, setSchemes] = useState(sl); const [apps, setApps] = useState(apl);
  const rs = () => setSchemes(sl); const ra = () => setApps(apl);

  const pag = usePagination({ data: apps, pageSize: 10 });

  useEffect(() => subscribeAppSync([scholarshipSchemesKey, scholarshipApplicationsKey], () => { rs(); ra(); }), []);

  const [scOpen, setScOpen] = useState(false); const [scName, setScName] = useState(""); const [scProv, setScProv] = useState(""); const [scAmt, setScAmt] = useState(""); const [scCrit, setScCrit] = useState("");
  const [apOpen, setApOpen] = useState(false); const [apStudent, setApStudent] = useState(""); const [apScheme, setApScheme] = useState(""); const [apAmt, setApAmt] = useState("");

  return (
    <div>
      <PageHeader title="Scholarship Management" subtitle="Schemes & applications" icon={<Award className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="schemes">Schemes</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="schemes">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setScName(""); setScProv(""); setScAmt(""); setScCrit(""); setScOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Scheme</Button></div>
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Schemes</p><p className="text-2xl font-bold">{schemes.length}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Budget</p><p className="text-2xl font-bold">₹{schemes.reduce((s, x) => s + x.amount, 0).toLocaleString()}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Applications</p><p className="text-2xl font-bold">{apps.length}</p></Card>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schemes.map((s) => (
              <Card key={s.id}>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Award className="h-4 w-4 text-yellow-500" />{s.name}</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-1">
                  <p className="text-muted-foreground">Provider: {s.provider}</p>
                  <p className="font-semibold">₹{s.amount.toLocaleString()}</p>
                  <p className="text-muted-foreground">{s.criteria}</p>
                  <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive mt-2" onClick={() => { ss(sl().filter((x) => x.id !== s.id)); rs(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3 mr-1" />Remove</Button>
                </CardContent>
              </Card>
            ))}
            {schemes.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No schemes defined</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setApStudent(""); setApScheme(""); setApAmt(""); setApOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Application</Button></div>
          <TablePagination {...pag} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Scheme</TableHead><TableHead className="text-xs">Amount</TableHead><TableHead className="text-xs">Applied</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {pag.pageData.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{a.student}</TableCell>
                  <TableCell className="text-xs">{a.scheme}</TableCell>
                  <TableCell className="text-xs font-mono">₹{a.amount.toLocaleString()}</TableCell>
                  <TableCell className="text-xs">{new Date(a.applied).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${a.status === "approved" ? "bg-success/15 text-success" : a.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>{a.status}</Badge></TableCell>
                  <TableCell>{a.status === "pending" ? <div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-success" onClick={() => { aps(apl().map((x) => x.id === a.id ? { ...x, status: "approved" } : x)); ra(); toast.success("Approved"); }}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { aps(apl().map((x) => x.id === a.id ? { ...x, status: "rejected" } : x)); ra(); toast.success("Rejected"); }}><XCircle className="h-3 w-3 mr-1" />Reject</Button></div> : null}</TableCell>
                </TableRow>
              ))}
              {apps.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No applications</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={scOpen} onOpenChange={setScOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Scheme</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Name</Label><Input value={scName} onChange={(e) => setScName(e.target.value)} /></div><div><Label className="text-xs">Provider</Label><Input value={scProv} onChange={(e) => setScProv(e.target.value)} /></div></div>
            <div><Label className="text-xs">Amount (₹)</Label><Input type="number" value={scAmt} onChange={(e) => setScAmt(e.target.value)} /></div>
            <div><Label className="text-xs">Eligibility Criteria</Label><Input value={scCrit} onChange={(e) => setScCrit(e.target.value)} placeholder="e.g. Grade 10+, 90%+" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setScOpen(false)}>Cancel</Button><Button onClick={() => { ss([...sl(), { id: crypto.randomUUID(), name: scName, provider: scProv, amount: Number(scAmt) || 0, criteria: scCrit }]); rs(); setScOpen(false); toast.success("Scheme created"); }} disabled={!scName || !scProv || !scAmt}>Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={apOpen} onOpenChange={setApOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Scholarship Application</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Student</Label><Input value={apStudent} onChange={(e) => setApStudent(e.target.value)} /></div><div><Label className="text-xs">Scheme</Label><Select value={apScheme} onValueChange={setApScheme}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{schemes.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label className="text-xs">Amount (₹)</Label><Input type="number" value={apAmt} onChange={(e) => setApAmt(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setApOpen(false)}>Cancel</Button><Button onClick={() => { aps([...apl(), { id: crypto.randomUUID(), student: apStudent, scheme: apScheme, amount: Number(apAmt) || 0, status: "pending", applied: new Date().toISOString() }]); ra(); setApOpen(false); toast.success("Applied"); }} disabled={!apStudent || !apScheme || !apAmt}>Apply</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
