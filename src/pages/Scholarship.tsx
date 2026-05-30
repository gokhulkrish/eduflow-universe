import "@/lib/runtime-storage";
import { useCallback, useEffect, useState } from "react";
import { Award, Plus, Pencil, Trash2, CheckCircle2, XCircle, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useRealtime } from "@/lib/use-realtime";
import { getSchemes, createScheme, updateScheme, deleteScheme, getApplications, createApplication, updateApplication, deleteApplication, Scheme, Application } from "@/lib/scholarship";

export default function Scholarship() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("schemes");
  const [schemes, setSchemes] = useState<Scheme[]>([]); const [apps, setApps] = useState<Application[]>([]);
  const refresh = useCallback(async () => { setSchemes(await getSchemes()); setApps(await getApplications()); }, []);
  useEffect(() => { refresh(); }, [refresh]);
  useRealtime("scholarship_schemes", refresh);
  useRealtime("scholarship_applications", refresh);

  const pag = usePagination({ data: apps, pageSize: 10 });

  const [scOpen, setScOpen] = useState(false); const [scEditId, setScEditId] = useState<string | null>(null); const [scName, setScName] = useState(""); const [scProv, setScProv] = useState(""); const [scAmt, setScAmt] = useState(""); const [scCrit, setScCrit] = useState(""); const [scDeleteId, setScDeleteId] = useState<string | null>(null);
  const scOpenAdd = () => { setScEditId(null); setScName(""); setScProv(""); setScAmt(""); setScCrit(""); setScOpen(true); };
  const scOpenEdit = (s: Scheme) => { setScEditId(s.id); setScName(s.name); setScProv(s.provider); setScAmt(s.amount.toString()); setScCrit(s.criteria); setScOpen(true); };
  const [apOpen, setApOpen] = useState(false); const [apEditId, setApEditId] = useState<string | null>(null); const [apStudent, setApStudent] = useState(""); const [apScheme, setApScheme] = useState(""); const [apAmt, setApAmt] = useState(""); const [apDeleteId, setApDeleteId] = useState<string | null>(null);
  const apOpenAdd = () => { setApEditId(null); setApStudent(""); setApScheme(""); setApAmt(""); setApOpen(true); };
  const apOpenEdit = (a: Application) => { setApEditId(a.id); setApStudent(a.student); setApScheme(a.scheme); setApAmt(a.amount.toString()); setApOpen(true); };

  return (
    <div>
      <PageHeader title="Scholarship Management" subtitle="Schemes & applications" icon={<Award className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="schemes">Schemes</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="schemes">
          <div className="flex justify-end gap-2 mb-4"><Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=scholarship")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(schemes, "scholarship-schemes", [{key:"name",label:"Name"},{key:"provider",label:"Provider"},{key:"amount",label:"Amount"},{key:"criteria",label:"Criteria"}])}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={scOpenAdd}><Plus className="h-4 w-4 mr-1" /> New Scheme</Button></div>
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
                  <div className="flex gap-1 mt-2"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => scOpenEdit(s)}><Pencil className="h-3 w-3 mr-1" />Edit</Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setScDeleteId(s.id)}><Trash2 className="h-3 w-3 mr-1" />Remove</Button></div>
                </CardContent>
              </Card>
            ))}
            {schemes.length === 0 && <Card className="col-span-full"><CardContent className="py-12 text-center text-sm text-muted-foreground">No schemes defined</CardContent></Card>}
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <div className="flex justify-end gap-2 mb-4"><Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate("/import?module=scholarship")}><Upload className="h-4 w-4 mr-1" /> Import</Button><Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportToCsv(apps, "scholarship-applications", [{key:"student",label:"Student"},{key:"scheme",label:"Scheme"},{key:"amount",label:"Amount"},{key:"applied",label:"Applied"},{key:"status",label:"Status"}])}><Download className="h-4 w-4 mr-1" /> Export</Button><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={apOpenAdd}><Plus className="h-4 w-4 mr-1" /> New Application</Button></div>
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
                  <TableCell><div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => apOpenEdit(a)}><Pencil className="h-3 w-3" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => setApDeleteId(a.id)}><Trash2 className="h-3 w-3" /></Button>{a.status === "pending" ? <><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-success" onClick={async () => { await updateApplication(a.id, { status: "approved" }); refresh(); toast.success("Approved"); }}><CheckCircle2 className="h-3 w-3 mr-1" />Approve</Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={async () => { await updateApplication(a.id, { status: "rejected" }); refresh(); toast.success("Rejected"); }}><XCircle className="h-3 w-3 mr-1" />Reject</Button></> : null}</div></TableCell>
                </TableRow>
              ))}
              {apps.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No applications</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!scDeleteId} onOpenChange={(o) => !o && setScDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Scheme</AlertDialogTitle><AlertDialogDescription>This will permanently remove this scholarship scheme. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setScDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (scDeleteId) { await deleteScheme(scDeleteId); refresh(); toast.success("Deleted"); } setScDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={scOpen} onOpenChange={setScOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{scEditId ? "Edit Scheme" : "New Scheme"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="schemeName">Name</Label><Input id="schemeName" name="schemeName" value={scName} onChange={(e) => setScName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="schemeProvider">Provider</Label><Input id="schemeProvider" name="schemeProvider" value={scProv} onChange={(e) => setScProv(e.target.value)} /></div></div>
            <div><Label className="text-xs" htmlFor="schemeAmount">Amount (₹)</Label><Input id="schemeAmount" name="schemeAmount" type="number" value={scAmt} onChange={(e) => setScAmt(e.target.value)} /></div>
            <div><Label className="text-xs" htmlFor="schemeCriteria">Eligibility Criteria</Label><Input id="schemeCriteria" name="schemeCriteria" value={scCrit} onChange={(e) => setScCrit(e.target.value)} placeholder="e.g. Grade 10+, 90%+" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setScOpen(false)}>Cancel</Button><Button onClick={async () => { if (scEditId) { await updateScheme(scEditId, { name: scName, provider: scProv, amount: Number(scAmt) || 0, criteria: scCrit }); } else { await createScheme({ name: scName, provider: scProv, amount: Number(scAmt) || 0, criteria: scCrit }); } refresh(); setScOpen(false); toast.success(scEditId ? "Updated" : "Created"); }} disabled={!scName || !scProv || !scAmt}>{scEditId ? "Update" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!apDeleteId} onOpenChange={(o) => !o && setApDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Application</AlertDialogTitle><AlertDialogDescription>This will permanently remove this scholarship application. Continue?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => setApDeleteId(null)}>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => { if (apDeleteId) { await deleteApplication(apDeleteId); refresh(); toast.success("Deleted"); } setApDeleteId(null); }}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>

      <Dialog open={apOpen} onOpenChange={setApOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{apEditId ? "Edit Application" : "Scholarship Application"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="appStudent">Student</Label><Input id="appStudent" name="appStudent" value={apStudent} onChange={(e) => setApStudent(e.target.value)} /></div><div><Label className="text-xs" htmlFor="appScheme">Scheme</Label><Select name="appScheme" value={apScheme} onValueChange={setApScheme}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{schemes.map((s) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label className="text-xs" htmlFor="appAmount">Amount (₹)</Label><Input id="appAmount" name="appAmount" type="number" value={apAmt} onChange={(e) => setApAmt(e.target.value)} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setApOpen(false)}>Cancel</Button><Button onClick={async () => { if (apEditId) { await updateApplication(apEditId, { student: apStudent, scheme: apScheme, amount: Number(apAmt) || 0 }); } else { await createApplication({ student: apStudent, scheme: apScheme, amount: Number(apAmt) || 0, status: "pending", applied: new Date().toISOString() }); } refresh(); setApOpen(false); toast.success(apEditId ? "Updated" : "Applied"); }} disabled={!apStudent || !apScheme || !apAmt}>{apEditId ? "Update" : "Apply"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
