import { useState } from "react";
import { Briefcase, Users, CalendarClock, DollarSign, Star, UserPlus, Loader2, CheckCircle, XCircle, Plus, Ban } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Separator } from "@/components/ui/separator";
import {
  getStaff, getLeaveTypes, getLeaveBalances, getLeaveRequests, createLeaveRequest, updateLeaveStatus,
  getPayrollRuns, createPayrollRun, updatePayrollStatus,
  getAppraisals, getJobOpenings, getCandidates,
} from "@/lib/hr";

const statusBadge: Record<string, string> = {
  pending: "bg-muted text-foreground border-border/40",
  approved: "bg-success/15 text-success border-success/30",
  rejected: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground",
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
};

export default function HR() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("overview");

  const { data: staff } = useQuery({ queryKey: ["hr-staff"], queryFn: getStaff });
  const { data: leaveRequests } = useQuery({ queryKey: ["hr-leave-requests"], queryFn: () => getLeaveRequests() });
  const { data: leaveTypes } = useQuery({ queryKey: ["hr-leave-types"], queryFn: getLeaveTypes });
  const { data: balances } = useQuery({ queryKey: ["hr-balances"], queryFn: () => getLeaveBalances() });
  const { data: payrollRuns } = useQuery({ queryKey: ["hr-payroll"], queryFn: getPayrollRuns });
  const { data: appraisals } = useQuery({ queryKey: ["hr-appraisals"], queryFn: getAppraisals });
  const { data: jobs } = useQuery({ queryKey: ["hr-jobs"], queryFn: getJobOpenings });
  const { data: candidates } = useQuery({ queryKey: ["hr-candidates"], queryFn: () => getCandidates() });

  const pendingLeaves = (leaveRequests ?? []).filter((r) => r.status === "pending");
  const openJobs = (jobs ?? []).filter((j) => j.status === "open");
  const totalStaff = staff?.length ?? 0;

  // ── Leave Dialog ──
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveStaffId, setLeaveStaffId] = useState("");
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const leaveMut = useMutation({
    mutationFn: () => {
      const s = new Date(leaveStart), e = new Date(leaveEnd);
      const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      return createLeaveRequest({ staff_id: leaveStaffId, leave_type_id: leaveTypeId, start_date: leaveStart, end_date: leaveEnd, days, reason: leaveReason });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-leave-requests"] }); setLeaveOpen(false); toast.success("Leave request created"); },
    onError: (e) => toast.error(e.message),
  });

  const approveLeaveMut = useMutation({
    mutationFn: (id: string) => updateLeaveStatus(id, "approved"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-leave-requests"] }); toast.success("Leave approved"); },
    onError: (e) => toast.error(e.message),
  });

  const rejectLeaveMut = useMutation({
    mutationFn: (id: string) => updateLeaveStatus(id, "rejected"),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-leave-requests"] }); toast.success("Leave rejected"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Payroll Dialog ──
  const [payOpen, setPayOpen] = useState(false);
  const [payName, setPayName] = useState("");
  const [payStart, setPayStart] = useState("");
  const [payEnd, setPayEnd] = useState("");
  const [payDate, setPayDate] = useState("");

  const payMut = useMutation({
    mutationFn: () => createPayrollRun({ name: payName, period_start: payStart, period_end: payEnd, payment_date: payDate || undefined, employee_count: totalStaff }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-payroll"] }); setPayOpen(false); toast.success("Payroll run created"); },
    onError: (e) => toast.error(e.message),
  });

  const pag1 = usePagination({ data: staff ?? [], pageSize: 10 });
  const pag2 = usePagination({ data: leaveRequests ?? [], pageSize: 10 });
  const pag3 = usePagination({ data: payrollRuns ?? [], pageSize: 10 });
  const pag4 = usePagination({ data: appraisals ?? [], pageSize: 10 });
  const pag5 = usePagination({ data: candidates ?? [], pageSize: 10 });

  return (
    <div>
      <PageHeader title="HR & Payroll" subtitle="Employee lifecycle, leave, payroll & recruitment" icon={<Briefcase className="h-6 w-6" />} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Total Staff</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{totalStaff}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Pending Leaves</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-warning">{pendingLeaves.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Open Positions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{openJobs.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-xs text-muted-foreground">Payroll Runs</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{payrollRuns?.length ?? 0}</p></CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="leave">Leave {pendingLeaves.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{pendingLeaves.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="appraisals">Appraisals</TabsTrigger>
          <TabsTrigger value="recruitment">Recruitment</TabsTrigger>
        </TabsList>

        {/* ══════ OVERVIEW ══════ */}
        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle className="text-sm">Employee Directory</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pag1} />
              <Table>
                <TableHeader className="">
                  <TableRow>
                    <TableHead className="text-xs">Employee</TableHead>
                    <TableHead className="text-xs">Department</TableHead>
                    <TableHead className="text-xs">Designation</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Phone</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pag1.pageData.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell><span className="text-sm font-medium">{s.first_name} {s.last_name ?? ""}</span><br /><span className="text-[10px] text-muted-foreground">{s.employee_no}</span></TableCell>
                      <TableCell className="text-xs">{s.department ?? "—"}</TableCell>
                      <TableCell className="text-xs">{s.designation ?? "—"}</TableCell>
                      <TableCell className="text-xs">{s.email ?? "—"}</TableCell>
                      <TableCell className="text-xs">{s.phone ?? "—"}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${s.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{s.status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ LEAVE ══════ */}
        <TabsContent value="leave" className="space-y-6">
          <div className="flex justify-end">
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setLeaveStaffId(""); setLeaveTypeId(""); setLeaveStart(""); setLeaveEnd(""); setLeaveReason(""); setLeaveOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Request
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(leaveTypes ?? []).map((lt) => {
              const used = (balances ?? []).filter((b) => b.leave_type_id === lt.id).reduce((s, b) => s + b.used_days, 0);
              return (
                <Card key={lt.id} className="border-border/40">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">{lt.name}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{lt.days_per_year}d</p>
                    <p className="text-xs text-muted-foreground">{used} used</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Leave Requests</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pag2} />
              <Table>
              <TableHeader className="">
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
                {(leaveRequests ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No leave requests</TableCell></TableRow>}
                  {pag2.pageData.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{r.staff_name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.leave_name ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right text-sm">{r.days}</TableCell>
                      <TableCell><Badge className={`border text-[10px] ${statusBadge[r.status] ?? ""}`}>{r.status}</Badge></TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="flex gap-1">
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => approveLeaveMut.mutate(r.id)} disabled={approveLeaveMut.isPending}><CheckCircle className="h-3 w-3 mr-1" /> Approve</Button>
                            <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => rejectLeaveMut.mutate(r.id)} disabled={rejectLeaveMut.isPending}><XCircle className="h-3 w-3 mr-1" /> Reject</Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ PAYROLL ══════ */}
        <TabsContent value="payroll">
          <div className="flex justify-end mb-4">
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setPayName(""); setPayStart(""); setPayEnd(""); setPayDate(""); setPayOpen(true); }}>
              <Plus className="h-4 w-4 mr-1" /> New Payroll Run
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <TablePagination {...pag3} />
              <Table>
              <TableHeader className="">
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Period</TableHead>
                  <TableHead className="text-xs text-right">Employees</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs">Payment Date</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(payrollRuns ?? []).length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">No payroll runs</TableCell></TableRow>}
                  {pag3.pageData.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm font-medium">{r.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(r.period_start).toLocaleDateString()} - {new Date(r.period_end).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right text-sm">{r.employee_count}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">₹{r.total_amount.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{r.payment_date ? new Date(r.payment_date).toLocaleDateString() : "—"}</TableCell>
                      <TableCell><Badge className={`border text-[10px] ${statusBadge[r.status] ?? ""}`}>{r.status}</Badge></TableCell>
                      <TableCell>
                        {r.status === "draft" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" onClick={() => updatePayrollStatus(r.id, "processing").then(() => { qc.invalidateQueries({ queryKey: ["hr-payroll"] }); toast.success("Payroll processing"); })}>
                            <Loader2 className="h-3 w-3 mr-1" /> Process
                          </Button>
                        )}
                        {r.status === "processing" && (
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => updatePayrollStatus(r.id, "completed").then(() => { qc.invalidateQueries({ queryKey: ["hr-payroll"] }); toast.success("Payroll completed"); })}>
                            <CheckCircle className="h-3 w-3 mr-1" /> Complete
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ APPRAISALS ══════ */}
        <TabsContent value="appraisals">
          <Card>
            <CardHeader><CardTitle className="text-sm">Performance Reviews</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pag4} />
              <Table>
                <TableHeader className="">
                  <TableRow>
                    <TableHead className="text-xs">Staff</TableHead>
                    <TableHead className="text-xs">Period</TableHead>
                    <TableHead className="text-xs">Reviewer</TableHead>
                    <TableHead className="text-xs text-right">Rating</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(appraisals ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No appraisals yet</TableCell></TableRow>}
                  {pag4.pageData.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm font-medium">{a.staff_name ?? "—"}</TableCell>
                      <TableCell className="text-xs">{a.review_period}</TableCell>
                      <TableCell className="text-xs">{a.reviewer_name ?? "—"}</TableCell>
                      <TableCell className="text-right text-sm">{a.overall_rating ?? "—"}</TableCell>
                      <TableCell><Badge className={`border text-[10px] ${statusBadge[a.status] ?? ""}`}>{a.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.completed_at ? new Date(a.completed_at).toLocaleDateString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ RECRUITMENT ══════ */}
        <TabsContent value="recruitment" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Open Positions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(jobs ?? []).filter((j) => j.status === "open").map((j) => (
                  <Card key={j.id} className="border-border/40">
                    <CardHeader className="pb-2"><CardTitle className="text-sm">{j.title}</CardTitle></CardHeader>
                    <CardContent className="space-y-1 text-xs">
                      <p className="text-muted-foreground">{j.department ?? "—"} · {j.type}</p>
                      {j.location && <p className="text-muted-foreground">{j.location}</p>}
                      <div className="flex gap-2 mt-2">
                        <Badge className="text-[10px] bg-success/15 text-success">Open</Badge>
                        <span className="text-muted-foreground">{(candidates ?? []).filter((c) => c.job_opening_id === j.id).length} applicants</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(jobs ?? []).filter((j) => j.status === "open").length === 0 && <p className="text-sm text-muted-foreground col-span-full py-4">No open positions</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Candidates Pipeline</CardTitle></CardHeader>
            <CardContent>
              <TablePagination {...pag5} />
              <Table>
              <TableHeader className="">
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Position</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Applied</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                  {(candidates ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No candidates</TableCell></TableRow>}
                  {pag5.pageData.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-sm font-medium">{c.name}</TableCell>
                      <TableCell className="text-xs">{c.job_title ?? "—"}</TableCell>
                      <TableCell className="text-xs">{c.email ?? "—"}</TableCell>
                      <TableCell><Badge className={`border text-[10px] ${statusBadge[c.status] ?? ""}`}>{c.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(c.applied_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════ LEAVE DIALOG ══════ */}
      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>New Leave Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Staff</Label>
              <Select value={leaveStaffId} onValueChange={setLeaveStaffId}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>{(staff ?? []).map((s: any) => <SelectItem key={s.id} value={s.id}>{s.first_name} {s.last_name ?? ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{(leaveTypes ?? []).map((t) => <SelectItem key={t.id} value={t.id}>{t.name} ({t.days_per_year}d)</SelectItem>)}</SelectContent>
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
            <Button onClick={() => leaveMut.mutate()} disabled={!leaveStaffId || !leaveTypeId || !leaveStart || !leaveEnd || leaveMut.isPending}>
              {leaveMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ PAYROLL DIALOG ══════ */}
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
            <Button onClick={() => payMut.mutate()} disabled={!payName || !payStart || !payEnd || payMut.isPending}>
              {payMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
