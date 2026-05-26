import { useState } from "react";
import { Activity, Users, GraduationCap, TrendingUp, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useMonitoringOverview } from "@/hooks/useMonitoring";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/TablePagination";
import { DEFAULT_GRADES } from "../../core/academics/promotion";

export default function MonitoringDashboard() {
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

  return (
    <div>
      <PageHeader title="Global Monitoring Dashboard" subtitle="Real-time student performance overview" icon={<Activity className="h-6 w-6" />} />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Students</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Attendance</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.avgAttendance}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Avg Exam Score</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{stats.avgScore}%</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">At Risk</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{stats.atRisk}</p></CardContent></Card>
      </div>

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
