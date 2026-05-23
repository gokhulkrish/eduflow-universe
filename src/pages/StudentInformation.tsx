import { useEffect, useState } from "react";
import { Users, CheckCircle2, AlertCircle, FileText, UserCheck, RefreshCw, Upload, Plus, Trash2 } from "lucide-react";
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
import { PROGRAMS } from "@/lib/promotion";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";

// ---- Tab 1: Uploaded Data Validation ----
type ValidationRow = { id: string; name: string; grade: string; field: string; issue: string; status: string; };
const VK = "eduflow_validation";
function vl(): ValidationRow[] { try { return JSON.parse(localStorage.getItem(VK) ?? "[]"); } catch { return []; } }
function vs(v: ValidationRow[]) { localStorage.setItem(VK, JSON.stringify(v)); emitAppSync(VK); }

// ---- Tab 2: Registered Student Info ----
// Reuses localStorage key "eduflow_registered_students"
type RegStudent = { id: string; name: string; grade: string; section: string; reg_no: string; reg_date: string; status: string; };
const RK = "eduflow_registered_students";
function rl(): RegStudent[] { try { return JSON.parse(localStorage.getItem(RK) ?? "[]"); } catch { return []; } }
function rs(v: RegStudent[]) { localStorage.setItem(RK, JSON.stringify(v)); emitAppSync(RK); }

// ---- Tab 3: Academic Status ----
type AcadStatus = { id: string; name: string; grade: string; overall: string; attendance: string; gpa: string; };
const AK = "eduflow_academic_status";
function al(): AcadStatus[] { try { return JSON.parse(localStorage.getItem(AK) ?? "[]"); } catch { return []; } }
function as(v: AcadStatus[]) { localStorage.setItem(AK, JSON.stringify(v)); emitAppSync(AK); }

// ---- Tab 4: Approval Status ----
type Approval = { id: string; name: string; type: string; status: string; submitted: string; };
const APK = "eduflow_approvals";
function apl(): Approval[] { try { return JSON.parse(localStorage.getItem(APK) ?? "[]"); } catch { return []; } }
function aps(v: Approval[]) { localStorage.setItem(APK, JSON.stringify(v)); emitAppSync(APK); }

// ---- Tab 5: Save as Draft ----
type Draft = { id: string; name: string; grade: string; fields: string; saved: string; };
const DK = "eduflow_draft_students";
function dl(): Draft[] { try { return JSON.parse(localStorage.getItem(DK) ?? "[]"); } catch { return []; } }
function ds(v: Draft[]) { localStorage.setItem(DK, JSON.stringify(v)); emitAppSync(DK); }

// ---- Tab 6: Status Update ----
const SUK = "eduflow_student_status";

export default function StudentInformation() {
  const [tab, setTab] = useState("validation");

  // Validation
  const [vItems, setVItems] = useState(vl); const rv = () => setVItems(vl);
  const [vOpen, setVOpen] = useState(false); const [vName, setVName] = useState(""); const [vCohort, setVCohort] = useState(""); const [vField, setVField] = useState(""); const [vIssue, setVIssue] = useState("");

  // Registered
  const [rItems, setRItems] = useState(rl); const rr = () => setRItems(rl);
  const [rOpen, setROpen] = useState(false); const [rName, setRName] = useState(""); const [rCohort, setRCohort] = useState(""); const [rSec, setRSec] = useState(""); const [rReg, setRReg] = useState("");

  // Academic
  const [aItems, setAItems] = useState(al); const ra = () => setAItems(al);
  const [aOpen, setAOpen] = useState(false); const [aName, setAName] = useState(""); const [aCohort, setACohort] = useState(""); const [aOverall, setAOverall] = useState(""); const [aAtt, setAAtt] = useState(""); const [aGpa, setAGpa] = useState("");

  // Approval
  const [apItems, setApItems] = useState(apl); const rap = () => setApItems(apl);
  const [apOpen, setApOpen] = useState(false); const [apName, setApName] = useState(""); const [apType, setApType] = useState(""); const [apStatus, setApStatus] = useState("pending");

  // Draft
  const [dItems, setDItems] = useState(dl); const rd = () => setDItems(dl);
  const [dOpen, setDOpen] = useState(false); const [dName, setDName] = useState(""); const [dCohort, setDCohort] = useState(""); const [dFields, setDFields] = useState("");

  // Status Update
  const [suQuery, setSuQuery] = useState(""); const [suNewStatus, setSuNewStatus] = useState("");
  const [suItems, setSuItems] = useState(rl);
  const refreshSu = () => setSuItems(rl());

  const stList = ["active", "inactive", "transferred", "graduated", "expelled"];

  useEffect(() => {
    return subscribeAppSync([VK, RK, AK, APK, DK], () => {
      setVItems(vl());
      setRItems(rl());
      setAItems(al());
      setApItems(apl());
      setDItems(dl());
      setSuItems(rl());
    });
  }, []);

  return (
    <div>
      <PageHeader title="Student Information" subtitle="Validation, registration, academics, approvals & more" icon={<Users className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="registered">Registered</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="approval">Approvals</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="status">Status Update</TabsTrigger>
        </TabsList>

        {/* Tab 1: Uploaded Data Validation */}
        <TabsContent value="validation">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setVName(""); setVCohort(""); setVField(""); setVIssue(""); setVOpen(true); }}><Upload className="h-4 w-4 mr-1" /> Add Issue</Button></div>
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Cohort</TableHead><TableHead className="text-xs">Field</TableHead><TableHead className="text-xs">Issue</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {vItems.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="text-xs">{v.name}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{v.grade}</Badge></TableCell>
                  <TableCell className="text-xs">{v.field}</TableCell>
                  <TableCell className="text-xs text-destructive">{v.issue}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${v.status === "resolved" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>{v.status}</Badge></TableCell>
                  <TableCell>{v.status !== "resolved" ? <Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px]" onClick={() => { const d = vl().map((x) => x.id === v.id ? { ...x, status: "resolved" } : x); vs(d); rv(); toast.success("Resolved"); }}><CheckCircle2 className="h-3 w-3 mr-1" />Resolve</Button> : null}</TableCell>
                </TableRow>
              ))}
              {vItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No validation issues</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab 2: Registered Student Info */}
        <TabsContent value="registered">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setRName(""); setRCohort(""); setRSec(""); setRReg(""); setROpen(true); }}><Plus className="h-4 w-4 mr-1" /> Register</Button></div>
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Reg No</TableHead><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Cohort</TableHead><TableHead className="text-xs">Section</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {rItems.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs font-mono">{r.reg_no}</TableCell>
                  <TableCell className="text-xs">{r.name}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{r.grade}</Badge></TableCell>
                  <TableCell className="text-xs">{r.section}</TableCell>
                  <TableCell className="text-xs">{new Date(r.reg_date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${r.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.status}</Badge></TableCell>
                </TableRow>
              ))}
              {rItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No registered students</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab 3: Academic Status */}
        <TabsContent value="academic">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setAName(""); setACohort(""); setAOverall(""); setAAtt(""); setAGpa(""); setAOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Record</Button></div>
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Cohort</TableHead><TableHead className="text-xs">Overall</TableHead><TableHead className="text-xs">Attendance</TableHead><TableHead className="text-xs">GPA</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {aItems.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{a.name}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{a.grade}</Badge></TableCell>
                  <TableCell className="text-xs">{a.overall}</TableCell>
                  <TableCell className="text-xs">{a.attendance}%</TableCell>
                  <TableCell className="text-xs">{a.gpa}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${Number(a.gpa) >= 3 ? "bg-success/15 text-success" : Number(a.gpa) >= 2 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive"}`}>{Number(a.gpa) >= 3 ? "Good" : Number(a.gpa) >= 2 ? "Average" : "Low"}</Badge></TableCell>
                </TableRow>
              ))}
              {aItems.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No academic records</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab 4: Approval Status */}
        <TabsContent value="approval">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setApName(""); setApType(""); setApStatus("pending"); setApOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Request</Button></div>
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Submitted</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {apItems.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs">{a.name}</TableCell>
                  <TableCell className="text-xs">{a.type}</TableCell>
                  <TableCell className="text-xs">{new Date(a.submitted).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className={`text-[9px] ${a.status === "approved" ? "bg-success/15 text-success" : a.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>{a.status}</Badge></TableCell>
                  <TableCell>{a.status === "pending" ? <div className="flex gap-1"><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-success" onClick={() => { const d = apl().map((x) => x.id === a.id ? { ...x, status: "approved" } : x); aps(d); rap(); toast.success("Approved"); }}><CheckCircle2 className="h-3 w-3 mr-1" /></Button><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { const d = apl().map((x) => x.id === a.id ? { ...x, status: "rejected" } : x); aps(d); rap(); toast.success("Rejected"); }}><AlertCircle className="h-3 w-3" /></Button></div> : null}</TableCell>
                </TableRow>
              ))}
              {apItems.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No approval requests</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab 5: Save as Draft */}
        <TabsContent value="draft">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setDName(""); setDCohort(""); setDFields(""); setDOpen(true); }}><FileText className="h-4 w-4 mr-1" /> New Draft</Button></div>
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Drafts</p><p className="text-2xl font-bold">{dItems.length}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Pending Submit</p><p className="text-2xl font-bold">{dItems.filter((d) => !d.fields.includes("submitted")).length}</p></Card>
          </div>
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Cohort</TableHead><TableHead className="text-xs">Fields</TableHead><TableHead className="text-xs">Saved</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {dItems.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs">{d.name}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{d.grade}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{d.fields || "—"}</TableCell>
                  <TableCell className="text-xs">{new Date(d.saved).toLocaleDateString()}</TableCell>
                  <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { const n = dl().filter((x) => x.id !== d.id); ds(n); rd(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
              {dItems.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No drafts</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TabsContent>

        {/* Tab 6: Status Update */}
        <TabsContent value="status">
          <Card>
            <CardHeader><CardTitle className="text-sm">Bulk Status Update</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Search Student</Label><Input value={suQuery} onChange={(e) => setSuQuery(e.target.value)} placeholder="Name or Reg No" /></div>
                <div><Label className="text-xs">New Status</Label><Select value={suNewStatus} onValueChange={setSuNewStatus}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{stList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                <div className="flex items-end"><Button className="rounded-xl" disabled={!suQuery || !suNewStatus} onClick={() => { const all = rl().filter((r) => r.name.toLowerCase().includes(suQuery.toLowerCase()) || r.reg_no.toLowerCase().includes(suQuery.toLowerCase())); if (all.length === 0) { toast.error("No matches"); return; } const updated = rl().map((r) => all.find((m) => m.id === r.id) ? { ...r, status: suNewStatus } : r); rs(updated); refreshSu(); toast.success(`${all.length} updated to ${suNewStatus}`); }}><RefreshCw className="h-4 w-4 mr-1" /> Update</Button></div>
              </div>
              <Table>
                <TableHeader className=""><TableRow><TableHead className="text-xs">Reg No</TableHead><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Cohort</TableHead><TableHead className="text-xs">Current Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {suItems.filter((r) => !suQuery || r.name.toLowerCase().includes(suQuery.toLowerCase()) || r.reg_no.toLowerCase().includes(suQuery.toLowerCase())).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs font-mono">{r.reg_no}</TableCell>
                      <TableCell className="text-xs">{r.name}</TableCell>
                      <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{r.grade}</Badge></TableCell>
                      <TableCell><Badge className={`text-[9px] ${r.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                  {suItems.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No students registered</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={vOpen} onOpenChange={setVOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Validation Issue</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Student</Label><Input value={vName} onChange={(e) => setVName(e.target.value)} /></div><div><Label className="text-xs">Cohort</Label><Select value={vCohort} onValueChange={setVCohort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Field</Label><Input value={vField} onChange={(e) => setVField(e.target.value)} /></div><div><Label className="text-xs">Issue</Label><Input value={vIssue} onChange={(e) => setVIssue(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setVOpen(false)}>Cancel</Button><Button onClick={() => { const n: ValidationRow = { id: crypto.randomUUID(), name: vName, grade: vCohort, field: vField, issue: vIssue, status: "open" }; vs([...vl(), n]); rv(); setVOpen(false); toast.success("Added"); }} disabled={!vName || !vCohort || !vField}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rOpen} onOpenChange={setROpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Register Student</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Name</Label><Input value={rName} onChange={(e) => setRName(e.target.value)} /></div><div><Label className="text-xs">Reg No</Label><Input value={rReg} onChange={(e) => setRReg(e.target.value)} /></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Cohort</Label><Select value={rCohort} onValueChange={setRCohort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs">Section</Label><Select value={rSec} onValueChange={setRSec}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["A", "B", "C", "D"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setROpen(false)}>Cancel</Button><Button onClick={() => { rs([...rl(), { id: crypto.randomUUID(), name: rName, grade: rCohort, section: rSec, reg_no: rReg, reg_date: new Date().toISOString(), status: "active" }]); rr(); setROpen(false); toast.success("Registered"); }} disabled={!rName || !rCohort || !rReg}>Register</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aOpen} onOpenChange={setAOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Academic Status</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Name</Label><Input value={aName} onChange={(e) => setAName(e.target.value)} /></div><div><Label className="text-xs">Cohort</Label><Select value={aCohort} onValueChange={setACohort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-3 gap-3"><div><Label className="text-xs">Overall</Label><Select value={aOverall} onValueChange={setAOverall}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Excellent", "Good", "Average", "Below Avg"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs">Attendance %</Label><Input type="number" value={aAtt} onChange={(e) => setAAtt(e.target.value)} /></div><div><Label className="text-xs">GPA</Label><Input type="number" step="0.1" value={aGpa} onChange={(e) => setAGpa(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAOpen(false)}>Cancel</Button><Button onClick={() => { as([...al(), { id: crypto.randomUUID(), name: aName, grade: aCohort, overall: aOverall, attendance: aAtt, gpa: aGpa }]); ra(); setAOpen(false); toast.success("Added"); }} disabled={!aName || !aCohort}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={apOpen} onOpenChange={setApOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Approval Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Student</Label><Input value={apName} onChange={(e) => setApName(e.target.value)} /></div><div><Label className="text-xs">Type</Label><Select value={apType} onValueChange={setApType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Transfer", "Name Change", "Leave", "Scholarship", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setApOpen(false)}>Cancel</Button><Button onClick={() => { aps([...apl(), { id: crypto.randomUUID(), name: apName, type: apType, status: "pending", submitted: new Date().toISOString() }]); rap(); setApOpen(false); toast.success("Submitted"); }} disabled={!apName || !apType}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dOpen} onOpenChange={setDOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Save as Draft</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Name</Label><Input value={dName} onChange={(e) => setDName(e.target.value)} /></div><div><Label className="text-xs">Cohort</Label><Select value={dCohort} onValueChange={setDCohort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label className="text-xs">Fields (comma separated)</Label><Input value={dFields} onChange={(e) => setDFields(e.target.value)} placeholder="name, dob, address, parent" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDOpen(false)}>Cancel</Button><Button onClick={() => { ds([...dl(), { id: crypto.randomUUID(), name: dName, grade: dCohort, fields: dFields, saved: new Date().toISOString() }]); rd(); setDOpen(false); toast.success("Draft saved"); }} disabled={!dName || !dCohort}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
