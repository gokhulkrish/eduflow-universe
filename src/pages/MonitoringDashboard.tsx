import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Activity, Smartphone, IdCard, Landmark } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMonitoringOverview } from "@/hooks/useMonitoring";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { DEFAULT_GRADES } from "../../core/academics/promotion";

export default function MonitoringDashboard() {
  const navigate = useNavigate();
  const [grade, setGrade] = useState("");
  const [section, setSection] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useMonitoringOverview({
    grade: grade || undefined,
    section: section || undefined,
    search: search || undefined,
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const alerts = data?.alerts;

  const stats = {
    total: rows.length,
    avgAttendance: rows.length
      ? Math.round(rows.reduce((s, r) => s + (r.attendance_percent ?? 0), 0) / rows.length)
      : 0,
    avgScore: rows.filter((r) => r.exam_percent !== null).length
      ? Math.round(rows.filter((r) => r.exam_percent !== null).reduce((s, r) => s + (r.exam_percent ?? 0), 0) / rows.filter((r) => r.exam_percent !== null).length)
      : 0,
    atRisk: rows.filter((r) => (r.attendance_percent ?? 100) < 75).length,
  };

  const pag = usePagination({ data: rows, pageSize: 15 });

  const sectionCompletions = useMemo(() => {
    const map = new Map<string, { count: number; attendance: number; exam: number; subjective: number; attendanceCount: number; examCount: number; subjectiveCount: number }>();
    for (const row of rows) {
      const key = `${row.grade_label ?? "?"}-${row.section_label ?? "?"}`;
      if (!map.has(key)) map.set(key, { count: 0, attendance: 0, exam: 0, subjective: 0, attendanceCount: 0, examCount: 0, subjectiveCount: 0 });
      const s = map.get(key)!;
      s.count++;
      if (row.attendance_percent !== null) { s.attendance += row.attendance_percent; s.attendanceCount++; }
      if (row.exam_percent !== null) { s.exam += row.exam_percent; s.examCount++; }
      if (row.subjective_score !== null) { s.subjective += row.subjective_score; s.subjectiveCount++; }
    }
    return Array.from(map.entries()).map(([key, s]) => ({
      section: key,
      total: s.count,
      attendanceCount: s.attendanceCount,
      examCount: s.examCount,
      subjectiveCount: s.subjectiveCount,
      attendanceRate: s.attendanceCount / s.count,
      examRate: s.examCount / s.count,
      subjectiveRate: s.subjectiveCount / s.count,
      avgAttendance: s.attendanceCount ? Math.round(s.attendance / s.attendanceCount) : null,
      avgExam: s.examCount ? Math.round(s.exam / s.examCount) : null,
      avgSubjective: s.subjectiveCount ? Math.round(s.subjective / s.subjectiveCount * 10) / 10 : null,
      completionRate: Math.round(((s.attendanceCount / s.count) + (s.examCount / s.count) + (s.subjectiveCount / s.count)) / 3 * 100),
    }));
  }, [rows]);

  return (
    <div>
      <PageHeader title="Global Monitoring Dashboard" subtitle="Real-time student performance overview" icon={<Activity className="h-6 w-6" />} />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Students</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Attendance</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.avgAttendance}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Exam Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.avgScore}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">At Risk</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{stats.atRisk}</p></CardContent></Card>
      </div>

      {alerts && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <button onClick={() => navigate("/students")} className="group text-left">
            <Card className="border-destructive/30 bg-destructive/5 transition-colors hover:border-destructive/60 hover:bg-destructive/10">
              <CardContent className="flex items-center gap-4 py-4">
                <Smartphone className="h-8 w-8 shrink-0 text-destructive/60" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Mobile Missing</p>
                  <p className="text-xs text-muted-foreground">{alerts.mobileMissing} student{alerts.mobileMissing !== 1 ? "s" : ""} without a phone number</p>
                </div>
                <span className="text-2xl font-bold text-destructive">{alerts.mobileMissing}</span>
              </CardContent>
            </Card>
          </button>
          <button onClick={() => navigate("/students")} className="group text-left">
            <Card className="border-warning/30 bg-warning/5 transition-colors hover:border-warning/60 hover:bg-warning/10">
              <CardContent className="flex items-center gap-4 py-4">
                <IdCard className="h-8 w-8 shrink-0 text-warning/60" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">EMIS Missing</p>
                  <p className="text-xs text-muted-foreground">{alerts.emisMissing} student{alerts.emisMissing !== 1 ? "s" : ""} without an EMIS ID</p>
                </div>
                <span className="text-2xl font-bold text-warning">{alerts.emisMissing}</span>
              </CardContent>
            </Card>
          </button>
          <button onClick={() => navigate("/students")} className="group text-left">
            <Card className="border-muted-foreground/30 bg-muted/5 transition-colors hover:border-muted-foreground/60 hover:bg-muted/10">
              <CardContent className="flex items-center gap-4 py-4">
                <Landmark className="h-8 w-8 shrink-0 text-muted-foreground/60" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Bank/APB Pending</p>
                  <p className="text-xs text-muted-foreground">Students with pending bank verification</p>
                </div>
                <span className="text-2xl font-bold text-muted-foreground">{alerts.bankApbPending}</span>
              </CardContent>
            </Card>
          </button>
        </div>
      )}

      {sectionCompletions.length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Completion Ratios by Section</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Section</TableHead>
                    <TableHead className="text-xs text-center">Students</TableHead>
                    <TableHead className="text-xs text-center">Attendance Data</TableHead>
                    <TableHead className="text-xs text-center">Exam Score Data</TableHead>
                    <TableHead className="text-xs text-center">Subjective Data</TableHead>
                    <TableHead className="text-xs text-center">Overall Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionCompletions.map((sc) => (
                    <TableRow key={sc.section}>
                      <TableCell className="text-xs font-medium">{sc.section}</TableCell>
                      <TableCell className="text-xs text-center">{sc.total}</TableCell>
                      <TableCell className="text-xs text-center">
                        <span className={cn("font-medium", sc.attendanceRate >= 0.9 ? "text-success" : sc.attendanceRate >= 0.5 ? "text-warning" : "text-destructive")}>
                          {Math.round(sc.attendanceRate * 100)}%
                        </span>
                        <span className="text-muted-foreground"> ({sc.attendanceCount}/{sc.total})</span>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <span className={cn("font-medium", sc.examRate >= 0.9 ? "text-success" : sc.examRate >= 0.5 ? "text-warning" : "text-destructive")}>
                          {Math.round(sc.examRate * 100)}%
                        </span>
                        <span className="text-muted-foreground"> ({sc.examCount}/{sc.total})</span>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <span className={cn("font-medium", sc.subjectiveRate >= 0.9 ? "text-success" : sc.subjectiveRate >= 0.5 ? "text-warning" : "text-destructive")}>
                          {Math.round(sc.subjectiveRate * 100)}%
                        </span>
                        <span className="text-muted-foreground"> ({sc.subjectiveCount}/{sc.total})</span>
                      </TableCell>
                      <TableCell className="text-xs text-center">
                        <Badge className={cn("text-[10px]", sc.completionRate >= 80 ? "bg-success/15 text-success" : sc.completionRate >= 50 ? "bg-warning/15 text-warning" : "bg-destructive/15 text-destructive")}>
                          {sc.completionRate}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-sm">Student Overview</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Select name="gradeFilter" value={grade} onValueChange={setGrade}>
                <SelectTrigger className="h-8 w-full sm:w-[140px]"><SelectValue placeholder="All grades" /></SelectTrigger>
                <SelectContent>{DEFAULT_GRADES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
              <input
                id="studentSearch"
                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm sm:w-[200px]"
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Loading...</p>
          ) : (
            <>
              <TablePagination {...pag} />
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <Table className="min-w-max">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Student</TableHead>
                      <TableHead className="text-xs">Class</TableHead>
                      <TableHead className="text-xs">Attendance</TableHead>
                      <TableHead className="text-xs">Exam Score</TableHead>
                      <TableHead className="text-xs">Subjective</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pag.pageData.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No data available</TableCell></TableRow>
                    )}
                    {pag.pageData.map((row: any) => (
                      <TableRow key={row.student_id}>
                        <TableCell>
                          <div className="text-xs font-medium">{row.display_name}</div>
                          <div className="text-[10px] text-muted-foreground">{row.admission_no}</div>
                        </TableCell>
                        <TableCell className="text-xs">{row.grade_label}-{row.section_label}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${(row.attendance_percent ?? 0) >= 75 ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                            {row.attendance_percent !== null ? `${row.attendance_percent}%` : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.exam_percent !== null ? `${row.exam_percent}%` : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {row.subjective_score !== null ? `${row.subjective_score}/10` : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${row.enrollment_status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                            {row.enrollment_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
