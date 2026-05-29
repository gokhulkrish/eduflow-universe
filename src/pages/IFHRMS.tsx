import { useEffect, useState, useCallback } from "react";
import { Briefcase, Users, CalendarClock, DollarSign, Star, UserPlus, Loader2, CheckCircle, XCircle, Plus, Ban, Upload, History, Mail, Pencil, Trash2, Eye, Search } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import UserImportDialog from "@/components/UserImportDialog";
import {
  loadEmployees, loadLeaveTypesData, loadLeaveBalancesData, loadLeaveRequestsData,
  createLeaveRequestAction, approveLeaveAction, rejectLeaveAction,
  loadPayrollRunsData, createPayrollRunAction, processPayrollRun, completePayrollRun,
  loadAppraisalsData, loadJobOpeningsData, loadCandidatesData,
  bulkImportEmployees,
} from "@/lib/ifhrms-service";
import type { IFHRMSEmployee, IFHRMSLeaveRequest, IFHRMSPayrollRun, IFHRMSAppraisal, IFHRMSJobOpening, IFHRMSCandidate } from "@/lib/ifhrms-state";
import type { LeaveType } from "@/lib/hr";

const ADMIN_ROLES: AppRole[] = ["super_admin", "admin"];

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-foreground",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  completed: "bg-success/15 text-success",
  processing: "bg-warning/15 text-warning",
  open: "bg-success/15 text-success",
  closed: "bg-muted text-muted-foreground",
  filled: "bg-primary/15 text-primary",
  applied: "bg-muted text-foreground",
  screened: "bg-info/15 text-info",
  interviewed: "bg-warning/15 text-warning",
  offered: "bg-primary/15 text-primary",
  hired: "bg-success/15 text-success",
  submitted: "bg-warning/15 text-warning",
};

export default function IFHRMS() {
  const { user, roles: appRoles, loading: authLoading } = useAuth();
  const isAdmin = appRoles.some((r) => ADMIN_ROLES.includes(r));
  const canManage = isAdmin;

  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);

  const [employees, setEmployees] = useState<IFHRMSEmployee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<IFHRMSLeaveRequest[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<IFHRMSPayrollRun[]>([]);
  const [appraisals, setAppraisals] = useState<IFHRMSAppraisal[]>([]);
  const [jobs, setJobs] = useState<IFHRMSJobOpening[]>([]);
  const [candidates, setCandidates] = useState<IFHRMSCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<Record<string, unknown>[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [emps, lTypes, lReqs, pays, apps, js, cands] = await Promise.all([
        loadEmployees(), loadLeaveTypesData(), loadLeaveRequestsData(),
        loadPayrollRunsData(), loadAppraisalsData(), loadJobOpeningsData(), loadCandidatesData(),
      ]);
      setEmployees(emps); setLeaveTypes(lTypes); setLeaveRequests(lReqs);
      setPayrollRuns(pays); setAppraisals(apps); setJobs(js); setCandidates(cands);
    } catch (e) {
      toast.error("Failed to load: " + (e instanceof Error ? e.message : String(e)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase.from("audit_log").select("*").eq("entity", "ifhrms").order("created_at", { ascending: false }).limit(200);
      setAuditLogs(data ?? []);
    } catch {} finally { setAuditLoading(false); }
  }, []);

  useEffect(() => { if (tab === "audit") loadAudit(); }, [tab, loadAudit]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortCol(col); setSortDir("asc"); }
  };
  const SortIcon = ({ col }: { col: string }) => (
    <span className="ml-1 text-muted-foreground">{sortCol === col ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}</span>
  );

  const sortData = <T,>(data: T[], keyFn: (item: T) => string): T[] => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const av = keyFn(a).toLowerCase();
      const bv = keyFn(b).toLowerCase();
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  };

  const filterSearch = <T,>(data: T[], keyFn: (item: T) => string): T[] => {
    if (!search) return data;
    const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
    return data.filter((item) => terms.every((t) => keyFn(item).toLowerCase().includes(t)));
  };

  const pendingLeaves = leaveRequests.filter((r) => r.status === "pending");
  const openJobs = jobs.filter((j) => j.status === "open");

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveStaffId, setLeaveStaffId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  const submitLeave = async () => {
    if (!leaveStaffId || !leaveTypeId || !leaveStart || !leaveEnd) return;
    setLeaveSubmitting(true);
    try {
      await createLeaveRequestAction({ staffId: leaveStaffId, leaveTypeId, startDate: leaveStart, endDate: leaveEnd, reason: leaveReason });
      toast.success("Leave request created");
      setLeaveOpen(false);
      await refresh();
    } catch (e: any) { toast.error(e.message); } finally { setLeaveSubmitting(false); }
  };

  const approveLeave = async (id: string) => {
    try { await approveLeaveAction(id); toast.success("Leave approved"); await refresh(); } catch (e: any) { toast.error(e.message); }
  };
  const rejectLeave = async (id: string) => {
    try { await rejectLeaveAction(id); toast.success("Leave rejected"); await refresh(); } catch (e: any) { toast.error(e.message); }
  };

  const [payOpen, setPayOpen] = useState(false);
  const [payName, setPayName] = useState("");
  const [payStart, setPayStart] = useState("");
  const [payEnd, setPayEnd] = useState("");
  const [payDate, setPayDate] = useState("");
  const [paySubmitting, setPaySubmitting] = useState(false);

  const submitPayroll = async () => {
    if (!payName || !payStart || !payEnd) return;
    setPaySubmitting(true);
    try {
      await createPayrollRunAction({ name: payName, periodStart: payStart, periodEnd: payEnd, paymentDate: payDate || undefined, employeeCount: employees.length });
      toast.success("Payroll run created");
      setPayOpen(false);
      await refresh();
    } catch (e: any) { toast.error(e.message); } finally { setPaySubmitting(false); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };
  const toggleSelectAll = (ids: string[]) => {
    setSelected((prev) => prev.size === ids.length ? new Set() : new Set(ids));
  };

  const exportCsv = (data: Record<string, any>[], headers: string[], fieldMap: string[]) => {
    const header = headers.join(",") + "\n";
    const rows = data.map((r) => fieldMap.map((f) => String(r[f] ?? "")).join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "ifhrms-export.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported to CSV");
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewEmployee, setPreviewEmployee] = useState<IFHRMSEmployee | null>(null);

  if (authLoading) {
    return (
      <div>
        <PageHeader title="IFHRMS" subtitle="Integrated Financial & Human Resource Management" icon={<Briefcase className="h-6 w-6" />} />
        <div className="flex items-center justify-center h-64"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="IFHRMS" subtitle="Integrated Financial & Human Resource Management" icon={<Briefcase className="h-6 w-6" />} />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <Ban className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">Authentication required</p>
          </div>
        </div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div>
        <PageHeader title="IFHRMS" subtitle="Integrated Financial & Human Resource Management" icon={<Briefcase className="h-6 w-6" />} />
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 max-w-md text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">Access Restricted</p>
            <p className="text-sm text-muted-foreground">You need an Administrator or Super Admin role to access IFHRMS.</p>
          </div>
        </div>
      </div>
    );
  }

  const empsFiltered = filterSearch(employees, (e) => [e.fullName, e.email, e.department, e.designation].join(" "));
  const empsSorted = sortData(empsFiltered, (e) => {
    if (sortCol === "name") return e.fullName;
    if (sortCol === "department") return e.department;
    if (sortCol === "designation") return e.designation;
    return e.fullName;
  });
  const pagEmps = usePagination({ data: empsSorted, pageSize: 10 });

  const leavesFiltered = filterSearch(leaveRequests, (r) => [r.staffName, r.leaveName, r.status].join(" "));
  const pagLeaves = usePagination({ data: sortData(leavesFiltered, (r) => r.status === sortCol ? r.status : r.createdAt), pageSize: 10 });

  const paysFiltered = filterSearch(payrollRuns, (r) => [r.name, r.status].join(" "));
  const pagPays = usePagination({ data: sortData(paysFiltered, (r) => sortCol === "name" ? r.name : r.createdAt), pageSize: 10 });

  const appsFiltered = filterSearch(appraisals, (a) => [a.staffName, a.reviewPeriod, a.status].join(" "));
  const pagApps = usePagination({ data: sortData(appsFiltered, (a) => sortCol === "staff" ? a.staffName : a.createdAt), pageSize: 10 });

  const candsFiltered = filterSearch(candidates, (c) => [c.name, c.jobTitle, c.status].join(" "));
  const pagCands = usePagination({ data: sortData(candsFiltered, (c) => sortCol === "name" ? c.name : c.appliedAt), pageSize: 10 });

  return (
    <div>
      <PageHeader title="IFHRMS" subtitle="Integrated Financial & Human Resource Management" icon={<Briefcase className="h-6 w-6" />} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Staff</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{employees.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Pending Leaves</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-warning">{pendingLeaves.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Open Positions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{openJobs.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Payroll Runs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{payrollRuns.length}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="overview"><Users className="h-3.5 w-3.5 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="leave" className="relative">
            <CalendarClock className="h-3.5 w-3.5 mr-1" /> Leave
            {pendingLeaves.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{pendingLeaves.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payroll"><DollarSign className="h-3.5 w-3.5 mr-1" /> Payroll</TabsTrigger>
          <TabsTrigger value="appraisals"><Star className="h-3.5 w-3.5 mr-1" /> Appraisals</TabsTrigger>
          <TabsTrigger value="recruitment"><UserPlus className="h-3.5 w-3.5 mr-1" /> Recruitment</TabsTrigger>
          <TabsTrigger value="audit"><History className="h-3.5 w-3.5 mr-1" /> Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
            <Input placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9 rounded-xl" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setImportOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Import
              </Button>
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => exportCsv(employees, ["Name","Email","Department","Designation","Status"], ["fullName","email","department","designation","status"])}>
                Export CSV
              </Button>
            </div>
          </div>
          {selected.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted/50 text-sm">
              <span className="text-muted-foreground">{selected.size} selected</span>
              <Button size="sm" variant="outline" className="rounded-xl ml-auto" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              <TablePagination {...pagEmps} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-8">
                      <input type="checkbox" checked={selected.size === pagEmps.pageData.length && pagEmps.pageData.length > 0} onChange={() => toggleSelectAll(pagEmps.pageData.map((e) => e.id))} className="rounded" />
                    </TableHead>
                    <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("name")}>Employee <SortIcon col="name" /></TableHead>
                    <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("department")}>Department <SortIcon col="department" /></TableHead>
                    <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("designation")}>Designation <SortIcon col="designation" /></TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagEmps.pageData.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="w-8">
                        <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} className="rounded" />
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">{e.fullName}</span>
                        <div className="text-[10px] text-muted-foreground">{e.employeeNo}</div>
                      </TableCell>
                      <TableCell className="text-xs">{e.department || "—"}</TableCell>
                      <TableCell className="text-xs">{e.designation || "—"}</TableCell>
                      <TableCell className="text-xs">{e.email || "—"}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${statusStyles[e.status] ?? ""}`}>{e.status}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setPreviewEmployee(e); setPreviewOpen(true); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagEmps.pageData.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No employees found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-6">
          <div className="flex justify-between items-center">
            <Input placeholder="Search leave requests…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9 rounded-xl" />
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setLeaveStaffId(""); setLeaveTypeId(""); setLeaveStart(""); setLeaveEnd(""); setLeaveReason(""); setLeaveOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Request
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaveTypes.map((lt) => (
              <Card key={lt.id} className="border-border/40">
                <CardHeader className="pb-2"><CardTitle className="text-sm">{lt.name}</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{lt.days_per_year}d</p>
                  <p className="text-xs text-muted-foreground">{lt.carry_forward ? "Carry forward allowed" : "Use it or lose it"}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Leave Requests</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pagLeaves} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Staff</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Dates</TableHead>
                    <TableHead className="text-xs text-right">Days</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagLeaves.pageData.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.staffName || "—"}</TableCell>
                      <TableCell className="text-xs">{r.leaveName || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">{r.days}</TableCell>
                      <TableCell><Badge className={`border text-[10px] ${statusStyles[r.status] ?? ""}`}>{r.status}</Badge></TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => approveLeave(r.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" /> Approve
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => rejectLeave(r.id)}>
                              <XCircle className="h-3 w-3 mr-1" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagLeaves.pageData.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No leave requests</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll">
          <div className="flex justify-between items-center mb-4">
            <Input placeholder="Search payroll runs…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9 rounded-xl" />
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setPayName(""); setPayStart(""); setPayEnd(""); setPayDate(""); setPayOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Payroll Run
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <TablePagination {...pagPays} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("name")}>Name <SortIcon col="name" /></TableHead>
                    <TableHead className="text-xs">Period</TableHead>
                    <TableHead className="text-xs text-right">Employees</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs">Payment Date</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagPays.pageData.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(r.periodStart).toLocaleDateString()} - {new Date(r.periodEnd).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right text-sm">{r.employeeCount}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">₹{r.totalAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><Badge className={`border text-[10px] ${statusStyles[r.status] ?? ""}`}>{r.status}</Badge></TableCell>
                      <TableCell>
                        {r.status === "draft" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => processPayrollRun(r.id).then(() => { refresh(); toast.success("Payroll processing"); })}>
                            <Loader2 className="h-3 w-3 mr-1" /> Process
                          </Button>
                        )}
                        {r.status === "processing" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => completePayrollRun(r.id).then(() => { refresh(); toast.success("Payroll completed"); })}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {pagPays.pageData.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No payroll runs</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appraisals">
          <div className="mb-4">
            <Input placeholder="Search appraisals…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs h-9 rounded-xl" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-sm">Performance Reviews</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pagApps} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("staff")}>Staff <SortIcon col="staff" /></TableHead>
                    <TableHead className="text-xs">Period</TableHead>
                    <TableHead className="text-xs">Reviewer</TableHead>
                    <TableHead className="text-xs text-right">Rating</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagApps.pageData.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">{a.staffName || "—"}</TableCell>
                      <TableCell className="text-xs">{a.reviewPeriod}</TableCell>
                      <TableCell className="text-xs">{a.reviewerName || "—"}</TableCell>
                      <TableCell className="text-right text-sm">{a.overallRating ?? "—"}</TableCell>
                      <TableCell><Badge className={`border text-[10px] ${statusStyles[a.status] ?? ""}`}>{a.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.completedAt ? new Date(a.completedAt).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {pagApps.pageData.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No appraisals yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recruitment" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Open Positions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {openJobs.map((j) => (
                  <Card key={j.id} className="border-border/40">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{j.title}</CardTitle></CardHeader>
                    <CardContent className="space-y-1 text-xs">
                      <p className="text-muted-foreground">{j.department ?? "—"} · {j.type}</p>
                      {j.location && <p className="text-muted-foreground">{j.location}</p>}
                      <div className="flex gap-2 mt-2">
                        <Badge className="text-[10px] bg-success/15 text-success">Open</Badge>
                        <span className="text-muted-foreground">{candidates.filter((c) => c.jobOpeningId === j.id).length} applicants</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {openJobs.length === 0 && <p className="text-sm text-muted-foreground col-span-full py-4">No open positions</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Candidates Pipeline</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pagCands} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs cursor-pointer select-none" onClick={() => toggleSort("name")}>Name <SortIcon col="name" /></TableHead>
                    <TableHead className="text-xs">Position</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Applied</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagCands.pageData.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{c.name}</TableCell>
                      <TableCell className="text-xs">{c.jobTitle || "—"}</TableCell>
                      <TableCell className="text-xs">{c.email || "—"}</TableCell>
                      <TableCell><Badge className={`border text-[10px] ${statusStyles[c.status] ?? ""}`}>{c.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(c.appliedAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {pagCands.pageData.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No candidates</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">Recent IFHRMS activity</p>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={loadAudit}><History className="h-3.5 w-3.5 mr-1" /> Refresh</Button>
          </div>
          {auditLoading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No audit entries found</div>
          ) : (
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Time</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Target</TableHead>
                    <TableHead className="text-xs">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-[10px] whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">
                        <Badge className="text-[9px] bg-muted text-muted-foreground">{(entry.action as string)?.replace(/^ifhrms\./, "") || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">{entry.entity_id ? String(entry.entity_id).substring(0, 8) + "…" : "—"}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground max-w-xs truncate">
                        {entry.metadata ? JSON.stringify(entry.metadata) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Staff</Label>
              <Select value={leaveStaffId} onValueChange={setLeaveStaffId}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.days_per_year}d)</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Start Date</Label><Input type="date" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} /></div>
              <div><Label className="text-xs">End Date</Label><Input type="date" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} /></div>
            </div>
            <div><Label className="text-xs">Reason</Label><Textarea value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveOpen(false)}>Cancel</Button>
            <Button onClick={submitLeave} disabled={!leaveStaffId || !leaveTypeId || !leaveStart || !leaveEnd || leaveSubmitting}>
              {leaveSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Payroll Run</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Name</Label><Input value={payName} onChange={(e) => setPayName(e.target.value)} placeholder="e.g. May 2026" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Period Start</Label><Input type="date" value={payStart} onChange={(e) => setPayStart(e.target.value)} /></div>
              <div><Label className="text-xs">Period End</Label><Input type="date" value={payEnd} onChange={(e) => setPayEnd(e.target.value)} /></div>
            </div>
            <div><Label className="text-xs">Payment Date (optional)</Label><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={submitPayroll} disabled={!payName || !payStart || !payEnd || paySubmitting}>
              {paySubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Employee Details</DialogTitle></DialogHeader>
          {previewEmployee && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{previewEmployee.fullName}</p>
                  <p className="text-[10px] text-muted-foreground">{previewEmployee.employeeNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[["Email", previewEmployee.email], ["Phone", previewEmployee.phone], ["Department", previewEmployee.department], ["Designation", previewEmployee.designation], ["Status", previewEmployee.status]].map(([k, v]) => (
                  <><span className="text-muted-foreground">{k}</span><span className="font-medium">{v || "—"}</span></>
                ))}
              </div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <UserImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={async (rows) => {
          const mapped = rows.map((r) => ({ name: r.name, email: r.email, department: r.role, designation: r.department }));
          return bulkImportEmployees(mapped);
        }}
        availableRoles={[]}
      />
    </div>
  );
}
