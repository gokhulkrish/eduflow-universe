import { useState, useCallback } from "react";
import { BarChart3, Download, FileSpreadsheet, FileText, CalendarPlus, Loader2, Clock, Trash2, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  getOverviewKpis, getGradeDistribution, getSubjectPerformance, getExamPassFail,
  getMonthlyCollection, getDefaulterReport, getAttendanceReport, getConcessionSummary,
  toCsv, downloadFile,
  type KpiCard,
} from "@/lib/reports";
import { fetchStudentRegister } from "@/lib/student-records";
import { isModuleEnabled } from "@/lib/module-access";
import {
  allReportGenerators,
  reportGeneratorsByCategory,
  type ReportGenerator,
  type ReportCategory,
} from "@/lib/report-generators";
import {
  exportToPdf,
  exportToExcel,
  exportToCsvWithColumns,
  exportToJson,
} from "@/lib/report-export";
import {
  getSchedules,
  addSchedule,
  removeSchedule,
  toggleSchedule,
  type ReportSchedule,
} from "@/lib/report-scheduler";

const CATEGORY_LABELS: Record<ReportCategory, string> = {
  overview: "Overview",
  academic: "Academic",
  financial: "Financial",
  attendance: "Attendance",
  students: "Students",
  staff: "Staff",
  library: "Library",
  hostel: "Hostel",
  transport: "Transport",
  admissions: "Admissions",
  inventory: "Inventory",
};

// ── Helper components ───────────────────────────────────────────

function KpiGrid({ cards }: { cards: KpiCard[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((k) => (
        <Card key={k.label} className="border-border/40">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium text-muted-foreground">{k.label}</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{k.value}</p>
            {k.subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{k.subtitle}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color ?? "bg-primary"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function ReportExportButtons({ generator }: { generator: ReportGenerator }) {
  const [loading, setLoading] = useState<"csv" | "xlsx" | "pdf" | "json" | null>(null);
  const [data, setData] = useState<unknown[] | null>(null);
  const [fetched, setFetched] = useState(false);

  const ensureData = useCallback(async () => {
    if (!fetched) {
      const d = await generator.generate();
      setData(d);
      setFetched(true);
      return d;
    }
    return data;
  }, [generator, data, fetched]);

  const handleExport = async (format: "csv" | "xlsx" | "pdf" | "json") => {
    setLoading(format);
    try {
      const d = await ensureData();
      if (!d || d.length === 0) {
        toast.error("No data to export");
        return;
      }
      const filename = generator.id;
      if (format === "csv") exportToCsvWithColumns(d as Record<string, unknown>[], filename, generator.columns);
      else if (format === "xlsx") await exportToExcel(d as Record<string, unknown>[], filename, generator.columns);
      else if (format === "json") exportToJson(d, filename);
      else if (format === "pdf") await exportToPdf("report-pdf-content", `${filename}-report`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" disabled={loading !== null} onClick={() => handleExport("csv")}>
        {loading === "csv" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileSpreadsheet className="h-3 w-3 mr-1" />} CSV
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" disabled={loading !== null} onClick={() => handleExport("xlsx")}>
        {loading === "xlsx" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileSpreadsheet className="h-3 w-3 mr-1" />} XLSX
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" disabled={loading !== null} onClick={() => handleExport("pdf")}>
        {loading === "pdf" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileText className="h-3 w-3 mr-1" />} PDF
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" disabled={loading !== null} onClick={() => handleExport("json")}>
        {loading === "json" ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />} JSON
      </Button>
    </div>
  );
}

function ScheduleDialog({ generator }: { generator: ReportGenerator }) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ReportSchedule["format"]>("csv");
  const [frequency, setFrequency] = useState<ReportSchedule["frequency"]>("weekly");
  const [nextRun, setNextRun] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [recipients, setRecipients] = useState("");

  const handleSubmit = () => {
    addSchedule(generator.id, generator.title, format, frequency, nextRun, recipients);
    toast.success(`"${generator.title}" scheduled for ${frequency} delivery`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg"><CalendarPlus className="h-3 w-3 mr-1" /> Schedule</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-base">Schedule Report</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm font-medium">{generator.title}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as ReportSchedule["format"])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as ReportSchedule["frequency"])}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Next Run Date</Label>
            <Input type="date" value={nextRun} onChange={(e) => setNextRun(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Recipients (comma-separated emails)</Label>
            <Input type="text" placeholder="admin@college.edu, hod@college.edu" value={recipients} onChange={(e) => setRecipients(e.target.value)} className="h-8 text-xs" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit}>Create Schedule</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────────

export default function Reports() {
  const [tab, setTab] = useState("overview");
  const [cohortFilter, setCohortFilter] = useState("");
  const { data: examsEnabled } = useQuery({ queryKey: ["module-enabled", "exams"], queryFn: () => isModuleEnabled("exams"), staleTime: Infinity });

  const { data: students } = useQuery({ queryKey: ["student-register"], queryFn: fetchStudentRegister });
  const { data: kpis } = useQuery({ queryKey: ["rpt-kpis"], queryFn: getOverviewKpis, enabled: examsEnabled === true });
  const { data: cohortDist } = useQuery({ queryKey: ["rpt-grade-dist"], queryFn: getGradeDistribution, enabled: examsEnabled === true });
  const { data: subjPerf } = useQuery({ queryKey: ["rpt-subj-perf"], queryFn: getSubjectPerformance, enabled: examsEnabled === true });
  const { data: passFail } = useQuery({ queryKey: ["rpt-pass-fail"], queryFn: getExamPassFail, enabled: examsEnabled === true });
  const { data: monthlyCol } = useQuery({ queryKey: ["rpt-monthly-col"], queryFn: getMonthlyCollection });
  const { data: defaulters } = useQuery({ queryKey: ["rpt-defaulters", cohortFilter], queryFn: () => getDefaulterReport(cohortFilter || undefined) });
  const { data: attendance } = useQuery({ queryKey: ["rpt-attendance", cohortFilter], queryFn: () => getAttendanceReport(cohortFilter || undefined, undefined) });
  const { data: concessions } = useQuery({ queryKey: ["rpt-concessions"], queryFn: getConcessionSummary });

  const cohorts = [...new Set((students ?? []).map((s) => s.grade).filter(Boolean))].sort();
  const [schedules, setSchedules] = useState<ReportSchedule[]>(() => getSchedules());

  const refreshSchedules = () => setSchedules([...getSchedules()]);

  const exportCsv = (filename: string, rows: Record<string, unknown>[]) => {
    downloadFile(toCsv(rows), `${filename}.csv`, "text/csv");
    toast.success(`${filename}.csv downloaded`);
  };

  const exportJson = (filename: string, data: unknown) => {
    downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, "application/json");
    toast.success(`${filename}.json downloaded`);
  };

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Cross-module insights, summaries & export" icon={<BarChart3 className="h-6 w-6" />} />

      {examsEnabled === false && (
        <Card className="mb-4 border-dashed border-warning/40 bg-warning/5 p-4 text-sm text-muted-foreground">
          Exam-related report metrics are hidden until the Wave 7 exams migration is applied to the connected Supabase project.
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 w-full flex-nowrap overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="academic">Academic</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="generators">Generators</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="export">Exports</TabsTrigger>
        </TabsList>

        {/* ══════ OVERVIEW ══════ */}
        <TabsContent value="overview" className="space-y-6">
          {kpis && <KpiGrid cards={kpis} />}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Cohort-wise Distribution</CardTitle>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => exportCsv("cohort-distribution", cohortDist ?? [])} disabled={!cohortDist}><FileSpreadsheet className="h-3 w-3 mr-1" /> CSV</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={async () => {
                  if (cohortDist) await exportToExcel(cohortDist as any, "cohort-distribution", [{ key: "grade", label: "Cohort" }, { key: "total", label: "Students" }, { key: "present", label: "Present" }, { key: "absent", label: "Absent" }, { key: "paid", label: "Fee Paid" }, { key: "pending", label: "Fee Pending" }, { key: "passed", label: "Passed" }, { key: "failed", label: "Failed" }]);
                }} disabled={!cohortDist}><FileSpreadsheet className="h-3 w-3 mr-1" /> XLSX</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={async () => exportToPdf("report-pdf-content", "cohort-distribution")} disabled={!cohortDist}><FileText className="h-3 w-3 mr-1" /> PDF</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div id="report-pdf-content" className="overflow-x-auto rounded-lg border">
              <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Cohort</TableHead>
                  <TableHead className="text-xs text-right">Students</TableHead>
                  <TableHead className="text-xs text-right">Present</TableHead>
                  <TableHead className="text-xs text-right">Absent</TableHead>
                  <TableHead className="text-xs text-right">Attendance %</TableHead>
                  <TableHead className="text-xs text-right">Fee Paid</TableHead>
                  <TableHead className="text-xs text-right">Fee Pending</TableHead>
                  <TableHead className="text-xs text-right">Exam Passed</TableHead>
                  <TableHead className="text-xs text-right">Exam Failed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(cohortDist ?? []).map((g) => {
                    const attPct = g.total > 0 ? Math.round(((g.present) / (g.present + g.absent || 1)) * 100) : 0;
                    return (
                      <TableRow key={g.grade}>
                        <TableCell className="font-medium text-sm">{g.grade}</TableCell>
                        <TableCell className="text-right text-sm">{g.total}</TableCell>
                        <TableCell className="text-right text-sm text-success">{g.present}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{g.absent}</TableCell>
                        <TableCell className="text-right text-sm">{attPct}%</TableCell>
                        <TableCell className="text-right text-sm text-success">{g.paid}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{g.pending}</TableCell>
                        <TableCell className="text-right text-sm text-success">{g.passed}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{g.failed}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ ACADEMIC ══════ */}
        <TabsContent value="academic" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-sm">Subject Performance</CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => exportCsv("subject-performance", subjPerf ?? [])} disabled={!subjPerf}><FileSpreadsheet className="h-3 w-3 mr-1" /> CSV</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={async () => { if (subjPerf) await exportToExcel(subjPerf as any, "subject-performance"); }} disabled={!subjPerf}><FileSpreadsheet className="h-3 w-3 mr-1" /> XLSX</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={async () => exportToPdf("rpt-subj-pdf", "subject-performance")} disabled={!subjPerf}><FileText className="h-3 w-3 mr-1" /> PDF</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div id="rpt-subj-pdf" className="overflow-x-auto rounded-lg border">
                <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-xs text-right">Avg</TableHead>
                    <TableHead className="text-xs text-right">Pass %</TableHead>
                    <TableHead className="text-xs text-right">Students</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(subjPerf ?? []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No exam data</TableCell></TableRow>}
                    {(subjPerf ?? []).map((s) => (
                      <TableRow key={s.subject}>
                        <TableCell className="text-sm">{s.subject}</TableCell>
                        <TableCell className="text-right text-sm">{s.avg_marks}/{s.max_marks}</TableCell>
                        <TableCell className="text-right">
                          <span className={s.pass_rate >= 75 ? "text-success" : s.pass_rate >= 50 ? "text-warning" : "text-destructive"}>{s.pass_rate}%</span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{s.total_students}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-sm">Pass / Fail by Cohort</CardTitle>
                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => exportCsv("pass-fail", passFail ?? [])} disabled={!passFail}><FileSpreadsheet className="h-3 w-3 mr-1" /> CSV</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={async () => { if (passFail) await exportToExcel(passFail as any, "pass-fail"); }} disabled={!passFail}><FileSpreadsheet className="h-3 w-3 mr-1" /> XLSX</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Cohort</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs text-right">Passed</TableHead>
                    <TableHead className="text-xs text-right">Failed</TableHead>
                    <TableHead className="text-xs text-right">Pass Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(passFail ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No exam data</TableCell></TableRow>}
                    {(passFail ?? []).map((g) => (
                      <TableRow key={g.grade}>
                        <TableCell className="font-medium text-sm">{g.grade}</TableCell>
                        <TableCell className="text-right text-sm">{g.total}</TableCell>
                        <TableCell className="text-right text-sm text-success">{g.passed}</TableCell>
                        <TableCell className="text-right text-sm text-destructive">{g.failed}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className={`text-sm font-medium ${g.pass_rate >= 75 ? "text-success" : g.pass_rate >= 50 ? "text-warning" : "text-destructive"}`}>{g.pass_rate}%</span>
                            <ProgressBar value={g.passed} max={g.total} color={g.pass_rate >= 75 ? "bg-success" : g.pass_rate >= 50 ? "bg-warning" : "bg-destructive"} />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm">Cohort Distribution</CardTitle>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => exportCsv("cohort-distribution-detailed", cohortDist ?? [])} disabled={!cohortDist}><FileSpreadsheet className="h-3 w-3 mr-1" /> CSV</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(cohortDist ?? []).map((g) => {
                  const attPct = g.total > 0 ? Math.round(((g.present) / (g.present + g.absent || 1)) * 100) : 0;
                  const feePct = g.total > 0 ? Math.round((g.paid / g.total) * 100) : 0;
                  const passPct = g.total > 0 ? Math.round((g.passed / g.total) * 100) : 0;
                  return (
                    <Card key={g.grade} className="border-border/40">
                      <CardHeader className="pb-2"><CardTitle className="text-base">{g.grade}</CardTitle></CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <div className="flex justify-between text-xs"><span>Attendance</span><span>{attPct}%</span></div>
                          <ProgressBar value={g.present} max={g.present + g.absent} color={attPct >= 85 ? "bg-success" : attPct >= 70 ? "bg-warning" : "bg-destructive"} />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs"><span>Fee Payment</span><span>{feePct}%</span></div>
                          <ProgressBar value={g.paid} max={g.total} color={feePct >= 80 ? "bg-success" : feePct >= 60 ? "bg-warning" : "bg-destructive"} />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs"><span>Pass Rate</span><span>{passPct}%</span></div>
                          <ProgressBar value={g.passed} max={g.total} color={passPct >= 75 ? "bg-success" : passPct >= 50 ? "bg-warning" : "bg-destructive"} />
                        </div>
                        <Separator />
                        <div className="grid grid-cols-1 gap-2 text-center text-xs sm:grid-cols-3">
                          <div><p className="font-bold">{g.total}</p><p className="text-muted-foreground">Students</p></div>
                          <div><p className="font-bold text-success">{g.paid}</p><p className="text-muted-foreground">Paid</p></div>
                          <div><p className="font-bold text-destructive">{g.pending}</p><p className="text-muted-foreground">Dues</p></div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ FINANCIAL ══════ */}
        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm">Monthly Collection</CardTitle>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => exportCsv("monthly-collection", monthlyCol ?? [])} disabled={!monthlyCol}><FileSpreadsheet className="h-3 w-3 mr-1" /> CSV</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={async () => { if (monthlyCol) await exportToExcel(monthlyCol as any, "monthly-collection"); }} disabled={!monthlyCol}><FileSpreadsheet className="h-3 w-3 mr-1" /> XLSX</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Month</TableHead>
                  <TableHead className="text-xs text-right">Collected</TableHead>
                  <TableHead className="text-xs text-right">Transactions</TableHead>
                  <TableHead className="text-xs text-right">Cash</TableHead>
                  <TableHead className="text-xs text-right">Online</TableHead>
                  <TableHead className="text-xs text-right">Cheque</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(monthlyCol ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No payment data</TableCell></TableRow>}
                  {(monthlyCol ?? []).map((m) => {
                    return (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium text-sm">{m.month}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">₹{m.collected.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">{m.count}</TableCell>
                        <TableCell className="text-right text-sm">{m.cash > 0 ? `₹${m.cash.toLocaleString()}` : "—"}</TableCell>
                        <TableCell className="text-right text-sm text-success">{m.online > 0 ? `₹${m.online.toLocaleString()}` : "—"}</TableCell>
                        <TableCell className="text-right text-sm">{m.cheque > 0 ? `₹${m.cheque.toLocaleString()}` : "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-sm">Defaulters</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select name="cohortFilter" value={cohortFilter} onValueChange={setCohortFilter}>
                    <SelectTrigger className="h-7 w-full text-[10px] sm:w-28"><SelectValue placeholder="All cohorts" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cohorts</SelectItem>
                      {cohorts.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => exportCsv("defaulters", defaulters ?? [])} disabled={!defaulters}><FileSpreadsheet className="h-3 w-3 mr-1" /></Button>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={async () => { if (defaulters) await exportToExcel(defaulters as any, "defaulters"); }} disabled={!defaulters}><FileSpreadsheet className="h-3 w-3 mr-1" /> XLSX</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Student</TableHead>
                    <TableHead className="text-xs">Cohort</TableHead>
                    <TableHead className="text-xs text-right">Outstanding</TableHead>
                    <TableHead className="text-xs text-right">Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(defaulters ?? []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No defaulters</TableCell></TableRow>}
                    {(defaulters ?? []).slice(0, 20).map((d) => (
                      <TableRow key={d.student_name + d.admission_no}>
                        <TableCell><span className="text-sm font-medium">{d.student_name}</span><br /><span className="text-[10px] text-muted-foreground">{d.admission_no}</span></TableCell>
                        <TableCell className="text-xs">{d.grade}</TableCell>
                        <TableCell className="text-right text-sm font-semibold text-destructive">₹{d.outstanding.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">{d.days_overdue}d</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {(defaulters ?? []).length > 20 && <p className="text-xs text-muted-foreground mt-2">Showing top 20 of {defaulters?.length}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-sm">Concessions by Type</CardTitle>
                <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => exportCsv("concessions", concessions ?? [])} disabled={!concessions}><FileSpreadsheet className="h-3 w-3 mr-1" /> CSV</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-lg border">
                <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs text-right">Count</TableHead>
                    <TableHead className="text-xs text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(concessions ?? []).length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-xs text-muted-foreground py-8">No concessions</TableCell></TableRow>}
                    {(concessions ?? []).map((c) => (
                      <TableRow key={c.type}>
                        <TableCell className="text-sm capitalize">{c.type.replace("_", " ")}</TableCell>
                        <TableCell className="text-right text-sm">{c.count}</TableCell>
                        <TableCell className="text-right text-sm font-semibold">₹{c.total_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ══════ ATTENDANCE ══════ */}
        <TabsContent value="attendance" className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Select name="cohortFilter" value={cohortFilter} onValueChange={setCohortFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-32"><SelectValue placeholder="All cohorts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cohorts</SelectItem>
                {cohorts.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => exportCsv("attendance-report", attendance ?? [])} disabled={!attendance}><FileSpreadsheet className="h-3 w-3 mr-1" /> CSV</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={async () => { if (attendance) await exportToExcel(attendance as any, "attendance-report"); }} disabled={!attendance}><FileSpreadsheet className="h-3 w-3 mr-1" /> XLSX</Button>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={async () => exportToPdf("rpt-att-pdf", "attendance-report")} disabled={!attendance}><FileText className="h-3 w-3 mr-1" /> PDF</Button>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm">Cohort-wise Attendance</CardTitle></CardHeader>
            <CardContent>
              <div id="rpt-att-pdf" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(cohortDist ?? []).map((g) => {
                  const total = g.present + g.absent;
                  const pct = total > 0 ? Math.round((g.present / total) * 100) : 0;
                  return (
                    <Card key={g.grade} className="border-border/40">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">{g.grade}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex items-end justify-between mb-2">
                          <span className="text-2xl font-bold">{pct}%</span>
                          <Badge variant={pct >= 85 ? "default" : pct >= 70 ? "secondary" : "destructive"} className="text-[10px]">{pct >= 85 ? "Good" : pct >= 70 ? "Average" : "Low"}</Badge>
                        </div>
                        <ProgressBar value={g.present} max={total} color={pct >= 85 ? "bg-success" : pct >= 70 ? "bg-warning" : "bg-destructive"} />
                        <p className="text-[10px] text-muted-foreground mt-1">{g.present} present / {g.absent} absent</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Low Attendance Students ({cohortFilter || "all cohorts"})</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
              <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Cohort</TableHead>
                  <TableHead className="text-xs text-right">Attendance %</TableHead>
                  <TableHead className="text-xs text-right">Present</TableHead>
                  <TableHead className="text-xs text-right">Total Days</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                  {(attendance ?? []).filter((a) => a.percent < 75).slice(0, 30).map((a) => (
                    <TableRow key={a.student_name + a.admission_no}>
                      <TableCell><span className="text-sm font-medium">{a.student_name}</span><br /><span className="text-[10px] text-muted-foreground">{a.admission_no}</span></TableCell>
                      <TableCell className="text-xs">{a.grade}</TableCell>
                      <TableCell className="text-right"><Badge variant="destructive" className="text-[10px]">{a.percent}%</Badge></TableCell>
                      <TableCell className="text-right text-sm">{a.present}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">{a.total_days}</TableCell>
                    </TableRow>
                  ))}
                  {(attendance ?? []).filter((a) => a.percent < 75).length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">All students have ≥75% attendance</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ GENERATORS ══════ */}
        <TabsContent value="generators" className="space-y-6">
          <p className="text-sm text-muted-foreground">Per-module report generators — generate, preview, and export data from any module.</p>
          {(Object.keys(reportGeneratorsByCategory) as ReportCategory[]).map((cat) => {
            const gens = reportGeneratorsByCategory[cat];
            if (!gens || gens.length === 0) return null;
            return (
              <Card key={cat}>
                <CardHeader><CardTitle className="text-sm">{CATEGORY_LABELS[cat] ?? cat}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gens.map((gen) => (
                      <GeneratorCard key={gen.id} generator={gen} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ══════ SCHEDULE ══════ */}
        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Scheduled Deliveries</CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-lg" onClick={refreshSchedules}><Clock className="h-3 w-3 mr-1" /> Refresh</Button>
            </CardHeader>
            <CardContent>
              {schedules.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <Clock className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  <p>No scheduled deliveries yet.</p>
                  <p className="text-xs">Go to the Generators tab to schedule a report.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Report</TableHead>
                    <TableHead className="text-xs">Format</TableHead>
                    <TableHead className="text-xs">Frequency</TableHead>
                    <TableHead className="text-xs">Next Run</TableHead>
                    <TableHead className="text-xs">Recipients</TableHead>
                    <TableHead className="text-xs">Active</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm font-medium">{s.title}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] uppercase">{s.format}</Badge></TableCell>
                      <TableCell className="text-xs capitalize">{s.frequency}</TableCell>
                      <TableCell className="text-xs">{new Date(s.nextRun).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs max-w-[160px] truncate">{s.recipients || "—"}</TableCell>
                      <TableCell>
                        <Switch checked={s.enabled} onCheckedChange={() => { toggleSchedule(s.id); refreshSchedules(); }} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => { removeSchedule(s.id); refreshSchedules(); toast.success("Schedule removed"); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ EXPORTS ══════ */}
        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Export Report Data</CardTitle></CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ExportCard label="Subject Performance" filename="subject-performance" rows={subjPerf ?? []} />
                <ExportCard label="Cohort Distribution" filename="cohort-distribution" rows={cohortDist ?? []} />
                <ExportCard label="Pass / Fail by Cohort" filename="pass-fail-by-cohort" rows={passFail ?? []} />
                <ExportCard label="Monthly Collection" filename="monthly-collection" rows={monthlyCol ?? []} />
                <ExportCard label="Defaulters" filename="defaulters" rows={defaulters ?? []} />
                <ExportCard label="Attendance Report" filename="attendance-report" rows={attendance ?? []} />
                <ExportCard label="Concessions Summary" filename="concessions-summary" rows={concessions ?? []} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Raw Data Exports</CardTitle></CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <RawExport label="Students" queryKey="student-register" fetchFn={fetchStudentRegister} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────

function GeneratorCard({ generator }: { generator: ReportGenerator }) {
  const [data, setData] = useState<unknown[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showData, setShowData] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generator.generate();
      setData(result);
      setShowData(true);
      if (result.length === 0) toast.info("No data returned");
      else toast.success(`${result.length} rows loaded`);
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium">{generator.title}</CardTitle>
        <p className="text-[10px] text-muted-foreground">{generator.description}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          <Button variant="default" size="sm" className="h-7 text-[10px] rounded-lg" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />}
            Generate
          </Button>
          <ReportExportButtons generator={generator} />
          <ScheduleDialog generator={generator} />
        </div>
        {showData && data && (
          <div className="mt-2 max-h-32 overflow-auto rounded border bg-muted/30 p-2">
            <p className="text-[10px] text-muted-foreground mb-1">{data.length} rows</p>
            {data.length > 0 && (
              <pre className="text-[9px] leading-tight whitespace-pre-wrap break-all">
                {JSON.stringify(data.slice(0, 3), null, 1)}
                {data.length > 3 && "\n..."}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ExportCard({ label, filename, rows }: { label: string; filename: string; rows: Record<string, unknown>[] }) {
  const [loading, setLoading] = useState(false);
  return (
    <Card className="border-border/40">
      <CardHeader className="pb-2"><CardTitle className="text-xs">{label}</CardTitle></CardHeader>
      <CardContent className="flex gap-2">
        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" disabled={rows.length === 0 || loading}
          onClick={() => { setLoading(true); downloadFile(toCsv(rows), `${filename}.csv`, "text/csv"); toast.success(`${filename}.csv downloaded`); setTimeout(() => setLoading(false), 500); }}>
          {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileSpreadsheet className="h-3 w-3 mr-1" />} CSV
        </Button>
        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" disabled={rows.length === 0 || loading}
          onClick={async () => { setLoading(true); await exportToExcel(rows, filename); setTimeout(() => setLoading(false), 500); }}>
          {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileSpreadsheet className="h-3 w-3 mr-1" />} XLSX
        </Button>
        <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px]" disabled={rows.length === 0 || loading}
          onClick={() => { setLoading(true); downloadFile(JSON.stringify(rows, null, 2), `${filename}.json`, "application/json"); toast.success(`${filename}.json downloaded`); setTimeout(() => setLoading(false), 500); }}>
          {loading ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Download className="h-3 w-3 mr-1" />} JSON
        </Button>
      </CardContent>
    </Card>
  );
}

function RawExport({ label, queryKey, fetchFn }: { label: string; queryKey: string; fetchFn: () => Promise<any[]> }) {
  const { data } = useQuery({ queryKey: [queryKey], queryFn: fetchFn });
  return <ExportCard label={label} filename={queryKey} rows={(data ?? []) as Record<string, unknown>[]} />;
}
