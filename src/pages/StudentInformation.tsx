import "@/lib/runtime-storage";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, CheckCircle2, AlertCircle, FileText, Upload, Plus, Trash2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PROGRAMS } from "@/lib/promotion";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { fetchStudentRegister, studentRegisterSyncKey, formatDataError, updateStudentStatuses, type StudentRegisterRow } from "@/lib/student-records";
import { useStudentCapability } from "@/hooks/useStudentCapability";
import { generateId } from "@/lib/utils";

// ---- Tab 1: Uploaded Data Validation ----
type ValidationRow = { id: string; name: string; grade: string; field: string; issue: string; status: string; };
const VK = "eduflow_validation";
function vl(): ValidationRow[] { try { return JSON.parse(localStorage.getItem(VK) ?? "[]"); } catch { return []; } }
function vs(v: ValidationRow[]) { localStorage.setItem(VK, JSON.stringify(v)); emitAppSync(VK); }
// ---- Tab 2: Academic Status ----
type AcadStatus = { id: string; name: string; grade: string; overall: string; attendance: string; gpa: string; };
const AK = "eduflow_academic_status";
function al(): AcadStatus[] { try { return JSON.parse(localStorage.getItem(AK) ?? "[]"); } catch { return []; } }
function as(v: AcadStatus[]) { localStorage.setItem(AK, JSON.stringify(v)); emitAppSync(AK); }

// ---- Tab 3: Approval Status ----
type Approval = { id: string; name: string; type: string; status: string; submitted: string; };
const APK = "eduflow_approvals";
function apl(): Approval[] { try { return JSON.parse(localStorage.getItem(APK) ?? "[]"); } catch { return []; } }
function aps(v: Approval[]) { localStorage.setItem(APK, JSON.stringify(v)); emitAppSync(APK); }

// ---- Tab 4: Save as Draft ----
type Draft = { id: string; name: string; grade: string; fields: string; saved: string; };
const DK = "eduflow_draft_students";
function dl(): Draft[] { try { return JSON.parse(localStorage.getItem(DK) ?? "[]"); } catch { return []; } }
function ds(v: Draft[]) { localStorage.setItem(DK, JSON.stringify(v)); emitAppSync(DK); }

type RegisteredRow = {
  id: string;
  name: string;
  regNo: string;
  cohort: string;
  status: string;
  admissionNo: string;
};

export default function StudentInformation() {
  const queryClient = useQueryClient();
  const { canEdit } = useStudentCapability();
  const [tab, setTab] = useState("validation");
  const [registerQuery, setRegisterQuery] = useState("");
  const [statusQuery, setStatusQuery] = useState("");
  const [statusValue, setStatusValue] = useState("active");

  // Validation
  const [vItems, setVItems] = useState(vl); const rv = () => setVItems(vl);
  const [vOpen, setVOpen] = useState(false); const [vName, setVName] = useState(""); const [vCohort, setVCohort] = useState(""); const [vField, setVField] = useState(""); const [vIssue, setVIssue] = useState("");

  // Academic
  const [aItems, setAItems] = useState(al); const ra = () => setAItems(al);
  const [aOpen, setAOpen] = useState(false); const [aName, setAName] = useState(""); const [aCohort, setACohort] = useState(""); const [aOverall, setAOverall] = useState(""); const [aAtt, setAAtt] = useState(""); const [aGpa, setAGpa] = useState("");

  // Approval
  const [apItems, setApItems] = useState(apl); const rap = () => setApItems(apl);
  const [apOpen, setApOpen] = useState(false); const [apName, setApName] = useState(""); const [apType, setApType] = useState(""); const [apStatus, setApStatus] = useState("pending");

  // Draft
  const [dItems, setDItems] = useState(dl); const rd = () => setDItems(dl);
  const [dOpen, setDOpen] = useState(false); const [dName, setDName] = useState(""); const [dCohort, setDCohort] = useState(""); const [dFields, setDFields] = useState("");

  const registerRowsQuery = useQuery({
    queryKey: ["student-register"],
    queryFn: fetchStudentRegister,
  });

  useEffect(() => {
    return subscribeAppSync([studentRegisterSyncKey], () => {
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
    });
  }, [queryClient]);

  useEffect(() => {
    return subscribeAppSync([VK, AK, APK, DK], () => {
      setVItems(vl());
      setAItems(al());
      setApItems(apl());
      setDItems(dl());
    });
  }, []);

  const registeredRows = useMemo<RegisteredRow[]>(() => {
    return (registerRowsQuery.data ?? []).map((row: StudentRegisterRow) => ({
      id: row.id,
      name: row.display_name || [row.first_name, row.last_name].filter(Boolean).join(" "),
      regNo: row.regno || row.admission_no,
      cohort: [row.grade, row.section].filter(Boolean).join(" / ") || "—",
      status: row.status,
      admissionNo: row.admission_no,
    }));
  }, [registerRowsQuery.data]);

  const filteredRegisteredRows = useMemo(() => {
    const q = registerQuery.trim().toLowerCase();
    if (!q) return registeredRows;
    return registeredRows.filter((row) =>
      [row.name, row.regNo, row.cohort, row.status, row.admissionNo, row.id].some((value) => value.toLowerCase().includes(q)),
    );
  }, [registerQuery, registeredRows]);

  const filteredStatusRows = useMemo(() => {
    const q = statusQuery.trim().toLowerCase();
    if (!q) return registeredRows;
    return registeredRows.filter((row) =>
      [row.name, row.regNo, row.cohort, row.status, row.admissionNo, row.id].some((value) => value.toLowerCase().includes(q)),
    );
  }, [statusQuery, registeredRows]);

  const bulkStatusMutation = useMutation({
    mutationFn: async () => {
      const ids = filteredStatusRows.map((row) => row.id);
      return updateStudentStatuses(ids, statusValue, "StudentInformation bulk status update");
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
      if (result.updatedIds.length > 0) {
        toast.success(`Updated ${result.updatedIds.length} student record(s) to ${statusValue}`);
      }
      if (result.failures.length > 0) {
        const preview = result.failures.slice(0, 2).map((failure) => `${failure.id}: ${failure.error}`).join(" | ");
        toast.error(
          result.updatedIds.length > 0
            ? `Updated ${result.updatedIds.length} record(s); ${result.failures.length} failed${preview ? ` - ${preview}` : ""}`
            : `Could not update ${result.failures.length} record(s)${preview ? ` - ${preview}` : ""}`,
        );
      }
    },
    onError: (error) => toast.error(formatDataError(error)),
  });

  return (
    <div>
      <PageHeader title="Student Information" subtitle="Validation, register, academics, approvals & drafts" icon={<Users className="h-6 w-6" />} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button asChild className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
          <Link to="/students">Open Latest Register</Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          The old localStorage register has been retired. Use the live register for all student record actions.
        </p>
      </div>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="validation">Validation</TabsTrigger>
          <TabsTrigger value="registered">Registered</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="approval">Approvals</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="status">Status Update</TabsTrigger>
        </TabsList>

        {/* Tab 1: Uploaded Data Validation */}
        <TabsContent value="validation">
          <div className="flex justify-end mb-4"><Button size="sm" className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto" onClick={() => { setVName(""); setVCohort(""); setVField(""); setVIssue(""); setVOpen(true); }}><Upload className="h-4 w-4 mr-1" /> Add Issue</Button></div>
          <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-max">
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
          </div>
        </TabsContent>

        {/* Tab 2: Registered Student Info */}
        <TabsContent value="registered">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs" htmlFor="registered-search">Search register</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="registered-search"
                  value={registerQuery}
                  onChange={(e) => setRegisterQuery(e.target.value)}
                  placeholder="Name, register no, admission no"
                  className="pl-9"
                />
              </div>
            </div>
            <Button asChild className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
              <Link to="/students/new"><Plus className="mr-2 h-4 w-4" /> Register</Link>
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => queryClient.invalidateQueries({ queryKey: ["student-register"] })}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Register No</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Cohort</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegisteredRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-mono">{r.regNo}</TableCell>
                    <TableCell className="text-xs">{r.name}</TableCell>
                    <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{r.cohort}</Badge></TableCell>
                    <TableCell><Badge className={`text-[9px] ${r.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {filteredRegisteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">No registered students</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 3: Academic Status */}
        <TabsContent value="academic">
          <div className="flex justify-end mb-4"><Button size="sm" className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto" onClick={() => { setAName(""); setACohort(""); setAOverall(""); setAAtt(""); setAGpa(""); setAOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Record</Button></div>
          <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-max">
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
          </div>
        </TabsContent>

        {/* Tab 4: Approval Status */}
        <TabsContent value="approval">
          <div className="flex justify-end mb-4"><Button size="sm" className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto" onClick={() => { setApName(""); setApType(""); setApStatus("pending"); setApOpen(true); }}><Plus className="h-4 w-4 mr-1" /> New Request</Button></div>
          <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-max">
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
          </div>
        </TabsContent>

        {/* Tab 5: Bulk Status Update */}
        <TabsContent value="status">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[240px]">
              <Label className="text-xs" htmlFor="status-search">Search students</Label>
              <Input
                id="status-search"
                value={statusQuery}
                onChange={(e) => setStatusQuery(e.target.value)}
                placeholder="Name or register number"
              />
            </div>
            <div className="min-w-[180px]">
              <Label className="text-xs" htmlFor="status-value">New status</Label>
              <Select value={statusValue} onValueChange={setStatusValue}>
                <SelectTrigger id="status-value"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {["active", "inactive", "graduated", "transferred", "withdrawn", "alumni"].map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"
              disabled={!canEdit || filteredStatusRows.length === 0 || bulkStatusMutation.isPending}
              onClick={() => bulkStatusMutation.mutate()}
            >
              {bulkStatusMutation.isPending ? "Updating…" : `Update ${filteredStatusRows.length} record(s)`}
            </Button>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Register No</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Cohort</TableHead>
                  <TableHead className="text-xs">Current Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStatusRows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-mono">{r.regNo}</TableCell>
                    <TableCell className="text-xs">{r.name}</TableCell>
                    <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{r.cohort}</Badge></TableCell>
                    <TableCell><Badge className={`text-[9px] ${r.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{r.status}</Badge></TableCell>
                  </TableRow>
                ))}
                {filteredStatusRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-xs text-muted-foreground">No students matched your search</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 5: Save as Draft */}
        <TabsContent value="draft">
          <div className="flex justify-end mb-4"><Button size="sm" className="w-full rounded-xl bg-gradient-primary shadow-glow sm:w-auto" onClick={() => { setDName(""); setDCohort(""); setDFields(""); setDOpen(true); }}><FileText className="h-4 w-4 mr-1" /> New Draft</Button></div>
          <div className="grid gap-4 sm:grid-cols-2 mb-6">
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Total Drafts</p><p className="text-2xl font-bold">{dItems.length}</p></Card>
            <Card className="p-4"><p className="text-[10px] text-muted-foreground">Pending Submit</p><p className="text-2xl font-bold">{dItems.filter((d) => !d.fields.includes("submitted")).length}</p></Card>
          </div>
          <div className="overflow-x-auto rounded-lg border">
          <Table className="min-w-max">
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <Dialog open={vOpen} onOpenChange={setVOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Validation Issue</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="vName">Student</Label><Input id="vName" name="vName" value={vName} onChange={(e) => setVName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="vCohort">Cohort</Label><Select name="vCohort" value={vCohort} onValueChange={setVCohort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="vField">Field</Label><Input id="vField" name="vField" value={vField} onChange={(e) => setVField(e.target.value)} /></div><div><Label className="text-xs" htmlFor="vIssue">Issue</Label><Input id="vIssue" name="vIssue" value={vIssue} onChange={(e) => setVIssue(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setVOpen(false)}>Cancel</Button><Button onClick={() => { const n: ValidationRow = { id: generateId(), name: vName, grade: vCohort, field: vField, issue: vIssue, status: "open" }; vs([...vl(), n]); rv(); setVOpen(false); toast.success("Added"); }} disabled={!vName || !vCohort || !vField}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={aOpen} onOpenChange={setAOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Academic Status</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="aName">Name</Label><Input id="aName" name="aName" value={aName} onChange={(e) => setAName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="aCohort">Cohort</Label><Select name="aCohort" value={aCohort} onValueChange={setACohort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid grid-cols-3 gap-3"><div><Label className="text-xs" htmlFor="aOverall">Overall</Label><Select name="aOverall" value={aOverall} onValueChange={setAOverall}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Excellent", "Good", "Average", "Below Avg"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div><Label className="text-xs" htmlFor="aAtt">Attendance %</Label><Input id="aAtt" name="aAtt" type="number" value={aAtt} onChange={(e) => setAAtt(e.target.value)} /></div><div><Label className="text-xs" htmlFor="aGpa">GPA</Label><Input id="aGpa" name="aGpa" type="number" step="0.1" value={aGpa} onChange={(e) => setAGpa(e.target.value)} /></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAOpen(false)}>Cancel</Button><Button onClick={() => { as([...al(), { id: generateId(), name: aName, grade: aCohort, overall: aOverall, attendance: aAtt, gpa: aGpa }]); ra(); setAOpen(false); toast.success("Added"); }} disabled={!aName || !aCohort}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={apOpen} onOpenChange={setApOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Approval Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="apName">Student</Label><Input id="apName" name="apName" value={apName} onChange={(e) => setApName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="apType">Type</Label><Select name="apType" value={apType} onValueChange={setApType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Transfer", "Name Change", "Leave", "Scholarship", "Other"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setApOpen(false)}>Cancel</Button><Button onClick={() => { aps([...apl(), { id: generateId(), name: apName, type: apType, status: "pending", submitted: new Date().toISOString() }]); rap(); setApOpen(false); toast.success("Submitted"); }} disabled={!apName || !apType}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dOpen} onOpenChange={setDOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Save as Draft</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs" htmlFor="dName">Name</Label><Input id="dName" name="dName" value={dName} onChange={(e) => setDName(e.target.value)} /></div><div><Label className="text-xs" htmlFor="dCohort">Cohort</Label><Select name="dCohort" value={dCohort} onValueChange={setDCohort}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROGRAMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label className="text-xs" htmlFor="dFields">Fields (comma separated)</Label><Input id="dFields" name="dFields" value={dFields} onChange={(e) => setDFields(e.target.value)} placeholder="name, dob, address, parent" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDOpen(false)}>Cancel</Button><Button onClick={() => { ds([...dl(), { id: generateId(), name: dName, grade: dCohort, fields: dFields, saved: new Date().toISOString() }]); rd(); setDOpen(false); toast.success("Draft saved"); }} disabled={!dName || !dCohort}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
