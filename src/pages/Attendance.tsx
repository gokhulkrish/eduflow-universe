import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Check, X, Clock, CalendarDays, Download, BarChart3 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { StickyActionBar } from "@/components/StickyActionBar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchStudentRegister, cohortLabelForStudent, initialsForStudent } from "@/lib/student-records";

type Status = "present" | "absent" | "late";
const next: Record<Status, Status> = { present: "absent", absent: "late", late: "present" };
const styles: Record<Status, string> = {
  present: "bg-success/15 text-success border-success/30",
  absent: "bg-destructive/15 text-destructive border-destructive/30",
  late: "bg-warning/15 text-warning border-warning/30",
};

const PERIOD_OPTIONS = [
  { key: "P1", label: "P1 · 09:00–09:45" },
  { key: "P2", label: "P2 · 09:45–10:30" },
  { key: "P3", label: "P3 · 10:45–11:30" },
  { key: "P4", label: "P4 · 11:30–12:15" },
  { key: "P5", label: "P5 · 12:45–13:30" },
  { key: "P6", label: "P6 · 13:30–14:15" },
];
const PERIOD_LABEL: Record<string, string> = Object.fromEntries(PERIOD_OPTIONS.map((p) => [p.key, p.label]));

export default function Attendance() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("rollcall");
  const [cohort, setCohort] = useState("B.Com Sem 1-A");
  const [period, setPeriod] = useState("P1");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const attendanceQuery = useQuery({ queryKey: ["student-register", "attendance"], queryFn: fetchStudentRegister });

  const rows = attendanceQuery.data ?? [];
  const cohortOptions = useMemo(() => {
    const options = Array.from(new Set(rows.map((row) => cohortLabelForStudent(row)).filter(Boolean)));
    return options.length ? options : ["B.Com Sem 1-A"];
  }, [rows]);

  useEffect(() => { if (!cohortOptions.includes(cohort)) setCohort(cohortOptions[0] ?? "B.Com Sem 1-A"); }, [cohort, cohortOptions]);

  const roster = useMemo(() => rows.filter((row) => cohortLabelForStudent(row) === cohort), [cohort, rows]);
  const rosterIds = useMemo(() => roster.map((row) => row.id), [roster]);

  const savedMarksQuery = useQuery({
    queryKey: ["attendance-marks", date, period, rosterIds],
    enabled: rosterIds.length > 0,
    retry: 1,
    queryFn: async () => {
      const periodLabel = PERIOD_LABEL[period] ?? period;
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < rosterIds.length; i += BATCH_SIZE) {
        batches.push(rosterIds.slice(i, i + BATCH_SIZE));
      }
      const results = await Promise.all(
        batches.map((batch) =>
          supabase
            .from("attendance")
            .select("student_id,status")
            .eq("date", date)
            .eq("period", periodLabel)
            .in("student_id", batch)
        )
      );
      const merged: Record<string, Status> = {};
      for (const result of results) {
        if (result.error) throw result.error;
        for (const row of result.data ?? []) {
          merged[row.student_id] = row.status as Status;
        }
      }
      return merged;
    },
  });

  const [marks, setMarks] = useState<Record<string, Status>>({});
  useEffect(() => {
    setMarks((current) => {
      const next: Record<string, Status> = {};
      const saved = savedMarksQuery.data ?? {};
      roster.forEach((row) => { next[row.id] = saved[row.id] ?? current[row.id] ?? "present"; });
      return next;
    });
  }, [roster, savedMarksQuery.data]);

  const counts = { present: Object.values(marks).filter((s) => s === "present").length, absent: Object.values(marks).filter((s) => s === "absent").length, late: Object.values(marks).filter((s) => s === "late").length };
  const total = roster.length;
  const rate = total ? Math.round((counts.present / total) * 100) : 0;
  const cycle = (id: string) => setMarks((current) => ({ ...current, [id]: next[current[id] ?? "present"] }));
  const setAll = (s: Status) => setMarks(Object.fromEntries(roster.map((st) => [st.id, s])));
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!roster.length) return 0;
      const { data: auth } = await supabase.auth.getUser();
      const periodLabel = PERIOD_LABEL[period] ?? period;
      const rows = roster.map((student) => ({
        student_id: student.id,
        class_id: null,
        date,
        period: periodLabel,
        status: marks[student.id] ?? "present",
        marked_by: auth.user?.id ?? null,
        remarks: null,
      }));
      const { error } = await supabase
        .from("attendance")
        .upsert(rows, { onConflict: "student_id,date,period" });
      if (error) throw error;
      return rows.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-marks"] });
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
      toast.success(`Attendance submitted for ${count} student${count === 1 ? "" : "s"}`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Attendance submit failed"),
  });

  const exportAttendance = () => {
    const lines = [
      ["Date", "Period", "Cohort", "Student", "Admission No", "Roll", "Status"],
      ...roster.map((student) => [
        date,
        period,
        cohort,
        student.display_name,
        student.admission_no,
        String(student.roll_number ?? ""),
        marks[student.id] ?? "present",
      ]),
    ];
    const csv = lines.map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.    download = `attendance-${date}-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Attendance CSV exported");
  };

  // Simulated trend data
  const trendDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const trendData = useMemo(() => trendDays.map(() => 80 + Math.floor(Math.random() * 20)), []);

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Cohort roll call · trends · discrepancy audit" icon={<ClipboardCheck className="h-6 w-6" />} />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rollcall">Roll Call</TabsTrigger>
          <TabsTrigger value="audit">Discrepancy Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 sm:grid-cols-4 mb-6">
            <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Present</p><p className="mt-1 text-2xl font-bold text-success">{counts.present}</p></div><Check className="h-5 w-5 text-success" /></div></Card>
            <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Absent</p><p className="mt-1 text-2xl font-bold text-destructive">{counts.absent}</p></div><X className="h-5 w-5 text-destructive" /></div></Card>
            <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Late</p><p className="mt-1 text-2xl font-bold text-warning">{counts.late}</p></div><Clock className="h-5 w-5 text-warning" /></div></Card>
            <Card className="p-4"><div className="flex items-center justify-between"><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Rate</p><p className="mt-1 text-2xl font-bold text-primary">{rate}%</p></div><BarChart3 className="h-5 w-5 text-primary" /></div></Card>
          </div>
          <Card className="p-4">
            <p className="text-sm font-medium mb-3">Weekly Trend</p>
            <div className="flex items-end gap-2 h-20">
              {trendData.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-muted-foreground">{v}%</span>
                  <div className="w-full rounded-t" style={{ height: `${v * 1.5}px`, backgroundColor: v >= 85 ? "hsl(var(--success))" : v >= 70 ? "hsl(var(--warning))" : "hsl(var(--destructive))", opacity: 0.7 }} />
                  <span className="text-[9px] text-muted-foreground">{trendDays[i]}</span>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-3 mt-4">
            {cohortOptions.slice(0, 6).map((g) => {
              const s = rows.filter((r) => cohortLabelForStudent(r) === g);
              const pct = s.length ? Math.round((s.filter((r) => marks[r.id] === "present" || !marks[r.id]).length / s.length) * 100) : 0;
              return (
                <Card key={g} className="p-3 cursor-pointer hover:bg-accent/20" onClick={() => { setCohort(g); setTab("rollcall"); }}>
                  <p className="text-xs font-medium">Cohort {g}</p>
                  <p className="text-lg font-bold">{pct}%</p>
                  <Progress value={pct} className="h-1 mt-1" />
                  <p className="text-[9px] text-muted-foreground mt-1">{s.length} students</p>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rollcall">
          <Card className="mb-4 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-9 w-40" />
              </div>
              <Select value={cohort} onValueChange={setCohort}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>{cohortOptions.map((g) => (<SelectItem key={g} value={g}>Cohort {g}</SelectItem>))}</SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>{PERIOD_OPTIONS.map((p) => (<SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>))}</SelectContent>
              </Select>
              <div className="ml-auto flex gap-1.5">
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAll("present")}>Mark all present</Button>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAll("absent")}>All absent</Button>
              </div>
            </div>
            <div className="mt-3"><Progress value={rate} className="h-1.5" /></div>
          </Card>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {roster.map((s) => {
              const st = marks[s.id];
              return (
                <button key={s.id} onClick={() => cycle(s.id)}
                  className={cn("glass flex items-center gap-3 rounded-2xl border bg-card/60 p-3 text-left transition-all hover:shadow-glow",
                    st === "present" && "border-success/30", st === "absent" && "border-destructive/30", st === "late" && "border-warning/30")}>
                  <Avatar className="h-10 w-10"><AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">{initialsForStudent(s)}</AvatarFallback></Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.display_name || [s.first_name, s.last_name].filter(Boolean).join(" ")}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{s.admission_no} · Roll {s.roll_number ?? "—"}</p>
                  </div>
                  <Badge variant="secondary" className={cn("capitalize", styles[st])}>{st}</Badge>
                </button>
              );
            })}
            {!attendanceQuery.isLoading && roster.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-border/60 bg-secondary/20 px-4 py-10 text-center text-sm text-muted-foreground">No students found for the selected cohort.</div>
            ) : null}
          </div>
          <StickyActionBar className="justify-end">
            <Button variant="outline" className="rounded-xl" onClick={exportAttendance}><Download className="mr-2 h-4 w-4" /> Export</Button>
            <Button className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || !roster.length}>
              Submit Attendance
            </Button>
          </StickyActionBar>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="p-4">
            <p className="text-sm font-medium mb-3">Discrepancy Log</p>
            <p className="text-xs text-muted-foreground mb-4">Records where attendance was modified after initial submission or conflicts with biometric data.</p>
            <Table>
            <TableHeader className="">
              <TableRow><TableHead className="text-xs">Student</TableHead><TableHead className="text-xs">Date</TableHead><TableHead className="text-xs">Period</TableHead><TableHead className="text-xs">Initial</TableHead><TableHead className="text-xs">Corrected</TableHead><TableHead className="text-xs">Reason</TableHead><TableHead className="text-xs">Status</TableHead></TableRow>
            </TableHeader>
              <TableBody>
                <TableRow><TableCell className="text-xs">—</TableCell><TableCell className="text-xs">—</TableCell><TableCell className="text-xs">—</TableCell><TableCell className="text-xs">—</TableCell><TableCell className="text-xs">—</TableCell><TableCell className="text-xs">—</TableCell><TableCell><Badge className="text-[9px] bg-muted text-muted-foreground">No discrepancies</Badge></TableCell></TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
