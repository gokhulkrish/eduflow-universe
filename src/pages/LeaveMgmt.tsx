import { useEffect, useState } from "react";
import { CalendarClock, Plus, Check, X, Clock, Sun, BarChart3, Trash2 } from "lucide-react";
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
import { subscribeAppSync } from "@/lib/app-sync";
import { leaveRequestsKey, holidaysKey, getLeaveRequests, createLeaveRequest, updateLeaveRequest, getHolidays, addHoliday, deleteHoliday, LEAVE_TYPES, LEAVE_DAYS, DEPARTMENTS, getRemaining, getUsageReport } from "@/lib/leave";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";

export default function LeaveMgmt() {
  const [tab, setTab] = useState("requests");
  const [items, setItems] = useState(() => getLeaveRequests());
  const [holidays, setHolidays] = useState(() => getHolidays());
  const [deptFilter, setDeptFilter] = useState("all");
  const report = getUsageReport(deptFilter === "all" ? undefined : deptFilter);
  const refresh = () => setItems(getLeaveRequests());
  const refreshHolidays = () => setHolidays(getHolidays());
  const [open, setOpen] = useState(false);
  const [emp, setEmp] = useState(""); const [dept, setDept] = useState(""); const [type, setType] = useState(""); const [start, setStart] = useState(""); const [end, setEnd] = useState(""); const [reason, setReason] = useState("");
  const [holOpen, setHolOpen] = useState(false); const [holName, setHolName] = useState(""); const [holDate, setHolDate] = useState(""); const [holType, setHolType] = useState("public");
  const pag1 = usePagination({ data: items, pageSize: 10 });
  const pag2 = usePagination({ data: holidays, pageSize: 10 });

  useEffect(() => subscribeAppSync([leaveRequestsKey, holidaysKey], () => {
    setItems(getLeaveRequests());
    setHolidays(getHolidays());
  }), []);

  const handleCreate = () => {
    createLeaveRequest({ employee: emp, department: dept, type, start_date: start, end_date: end, reason, status: "pending" });
    refresh(); setOpen(false); setEmp(""); setDept(""); setType(""); setStart(""); setEnd(""); setReason(""); toast.success("Leave applied");
  };

  const getDays = (s: string, e: string) => Math.max(1, Math.round((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1);

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Apply, approve, holiday calendar & usage reports" icon={<CalendarClock className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="reports">Usage Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setEmp(""); setDept(""); setType(""); setStart(""); setEnd(""); setReason(""); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Apply Leave</Button></div>
          <TablePagination {...pag1} />
          <Table>
            <TableHeader className="">
              <TableRow><TableHead className="text-xs">Employee</TableHead><TableHead className="text-xs">Dept</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Dates</TableHead><TableHead className="text-xs">Days</TableHead><TableHead className="text-xs">Reason</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No leave requests</TableCell></TableRow>}
              {pag1.pageData.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{l.employee}</TableCell>
                  <TableCell className="text-xs">{l.department}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{l.type}</Badge></TableCell>
                  <TableCell className="text-xs">{new Date(l.start_date).toLocaleDateString()} - {new Date(l.end_date).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs">{getDays(l.start_date, l.end_date)}d</TableCell>
                  <TableCell className="text-xs max-w-[120px] truncate">{l.reason}</TableCell>
                  <TableCell>
                    <Badge className={`text-[9px] ${l.status === "approved" ? "bg-success/15 text-success" : l.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>{l.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {l.status === "pending" && <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="rounded-lg h-6 w-6 text-success p-0" onClick={() => { updateLeaveRequest(l.id, "approved"); refresh(); toast.success("Approved"); }}><Check className="h-3 w-3" /></Button>
                      <Button variant="outline" size="sm" className="rounded-lg h-6 w-6 text-destructive p-0" onClick={() => { updateLeaveRequest(l.id, "rejected"); refresh(); toast.success("Rejected"); }}><X className="h-3 w-3" /></Button>
                    </div>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="calendar">
          <Card>
            <CardHeader><CardTitle className="text-sm">Leave Calendar</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="font-medium text-muted-foreground p-1">{d}</div>)}
                {Array.from({ length: 31 }, (_, i) => {
                  const day = i + 1;
                  const dayLeaves = items.filter((l) => { const s = new Date(l.start_date).getDate(); const e = new Date(l.end_date).getDate(); return day >= s && day <= e && l.status === "approved"; });
                  const dayHolidays = holidays.filter((h) => new Date(h.date).getDate() === day);
                  const hasEvent = dayLeaves.length > 0 || dayHolidays.length > 0;
                  return (
                    <div key={i} className={`p-1 rounded min-h-[36px] ${hasEvent ? "bg-primary/10" : ""}`}>
                      <span className="text-[10px]">{day}</span>
                      {dayLeaves.length > 0 && <div className="text-[7px] text-success truncate">{dayLeaves.length} leave{dayLeaves.length > 1 ? "s" : ""}</div>}
                      {dayHolidays.length > 0 && <div className="text-[7px] text-warning truncate">{dayHolidays[0].name}</div>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays">
          <div className="flex justify-end mb-4"><Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setHolName(""); setHolDate(""); setHolType("public"); setHolOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Add Holiday</Button></div>
            <TablePagination {...pag2} />
          <Table>
            <TableHeader className=""><TableRow><TableHead className="text-xs">Name</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {holidays.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No holidays added</TableCell></TableRow>}
              {pag2.pageData.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="text-xs font-medium">{h.name}</TableCell>
                  <TableCell className="text-xs">{new Date(h.date).toLocaleDateString()}</TableCell>
                  <TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">{h.type}</Badge></TableCell>
                  <TableCell><Button variant="outline" size="sm" className="rounded-lg h-6 text-[9px] text-destructive" onClick={() => { deleteHoliday(h.id); refreshHolidays(); toast.success("Deleted"); }}><Trash2 className="h-3 w-3" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </TabsContent>

        <TabsContent value="reports">
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-sm">Leave Usage</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Label className="text-xs">Filter by Department</Label>
                <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
                  <SelectTrigger className="w-[180px] h-7"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-4 mb-4">
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Total</CardTitle></CardHeader><CardContent><p className="text-xl font-bold">{report.total}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Approved</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-success">{report.approved}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Rejected</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-destructive">{report.rejected}</p></CardContent></Card>
                <Card><CardHeader className="pb-1"><CardTitle className="text-[10px] text-muted-foreground">Pending</CardTitle></CardHeader><CardContent><p className="text-xl font-bold text-warning">{report.pending}</p></CardContent></Card>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">By Leave Type</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(report.byType).map(([t, c]) => (
                    <div key={t} className="flex justify-between text-xs p-2 rounded bg-muted/30">
                      <span>{t}</span>
                      <span className="font-medium">{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Apply Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Employee Name</Label><Input value={emp} onChange={(e) => setEmp(e.target.value)} /></div><div><Label className="text-xs">Department</Label><Select value={dept} onValueChange={setDept}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div></div>
            <div><Label className="text-xs">Leave Type</Label><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t} ({getRemaining(emp || "x", type || t)} left)</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Start</Label><Input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div><div><Label className="text-xs">End</Label><Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></div></div>
            <div><Label className="text-xs">Reason</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={handleCreate} disabled={!emp || !type || !start || !end}>Apply</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={holOpen} onOpenChange={setHolOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs">Holiday Name</Label><Input value={holName} onChange={(e) => setHolName(e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3"><div><Label className="text-xs">Date</Label><Input type="date" value={holDate} onChange={(e) => setHolDate(e.target.value)} /></div><div><Label className="text-xs">Type</Label><Select value={holType} onValueChange={setHolType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="college">College</SelectItem><SelectItem value="religious">Religious</SelectItem></SelectContent></Select></div></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setHolOpen(false)}>Cancel</Button><Button disabled={!holName || !holDate} onClick={() => { addHoliday({ name: holName, date: new Date(holDate).toISOString(), type: holType }); refreshHolidays(); setHolOpen(false); toast.success("Holiday added"); }}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
