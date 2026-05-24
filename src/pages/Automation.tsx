import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Workflow, Play, Pause, Plus, Clock, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { useDbList } from "@/hooks/useDbList";
import { loadImportBatchHistory } from "@/lib/student-import";
import { fetchRecentNotifications, fetchStudentRegister } from "@/lib/student-records";
import { toast } from "sonner";

type AttendanceRow = {
  date: string;
  id: string;
  status: string;
  student_id: string;
};

export default function Automation() {
  const batchesQuery = useQuery({
    queryKey: ["automation", "batches"],
    queryFn: () => loadImportBatchHistory(8),
  });
  const notificationsQuery = useQuery({
    queryKey: ["automation", "notifications"],
    queryFn: () => fetchRecentNotifications(4),
  });
  const registerQuery = useQuery({
    queryKey: ["automation", "register"],
    queryFn: fetchStudentRegister,
  });
  const attendanceQuery = useDbList<AttendanceRow>("attendance", {
    order: { column: "date", ascending: true },
  });

  const pipelines = useMemo(() => {
    const batches = batchesQuery.data ?? [];
    const latestBatch = batches[0] ?? null;
    const totalAttendance = attendanceQuery.data?.length ?? 0;
    const presentMarks = (attendanceQuery.data ?? []).filter((row) => String(row.status ?? "").toLowerCase() === "present").length;
    const attendanceRate = totalAttendance ? Math.round((presentMarks / totalAttendance) * 100) : 0;
    const registerRows = registerQuery.data ?? [];
    const gradeCoverage = registerRows.length ? Math.min(100, Math.max(35, Math.round((new Set(registerRows.map((row) => `${row.grade ?? ""}-${row.section ?? ""}`)).size / registerRows.length) * 100))) : 0;

    return [
      {
        name: "Admission Pipeline",
        steps: ["Application", "Verification", "Fee Assignment", "Timetable", "Parent Notify", "Activate"],
        status: latestBatch ? "running" : "scheduled",
        progress: latestBatch ? Math.min(100, Math.round(((latestBatch.inserted + latestBatch.updated) / Math.max(1, latestBatch.total)) * 100)) : 0,
        detail: latestBatch
          ? `${latestBatch.batchName} · ${latestBatch.inserted} inserted · ${latestBatch.updated} updated · ${latestBatch.failed} failed`
          : "Waiting for the first completed import batch.",
      },
      {
        name: "Attendance Pipeline",
        steps: ["Capture", "Aggregate", "Reports", "Notifications", "Analytics"],
        status: attendanceRate >= 90 ? "healthy" : "running",
        progress: attendanceRate,
        detail: `${totalAttendance} attendance marks tracked in the ledger`,
      },
      {
        name: "Exam → Promotion",
        steps: ["Results", "Validation", "Auto Promotion", "Certificate", "Archive"],
        status: gradeCoverage >= 80 ? "scheduled" : "watch",
        progress: gradeCoverage,
        detail: `${registerRows.length} live students ready for promotion review`,
      },
    ];
  }, [attendanceQuery.data, batchesQuery.data, registerQuery.data]);

  return (
    <div>
      <PageHeader
        title="Automation Pipelines"
        subtitle="Visual workflow orchestration · ISO-aligned event bus"
        icon={<Workflow className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => void batchesQuery.refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90" onClick={() => toast.success("New pipeline draft opened")}>
              <Plus className="mr-2 h-4 w-4" /> New Pipeline
            </Button>
          </>
        }
      />

      <Card className="relative mb-5 overflow-hidden border-0 bg-gradient-aurora p-6 text-primary-foreground shadow-elegant">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-mesh)" }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur">
              Live orchestration
            </p>
            <h2 className="font-display text-3xl font-bold">Automation Pipelines</h2>
            <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85">
              Visual workflow orchestration across admissions, attendance, and exam promotion with live import and register data.
            </p>
          </div>
          <Button className="rounded-xl bg-white/15 text-primary-foreground hover:bg-white/25" onClick={() => toast.success("New pipeline draft opened")}>
            <Plus className="mr-2 h-4 w-4" /> New Pipeline
          </Button>
        </div>
      </Card>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {[
          { label: "Live runs", value: pipelines.length },
          { label: "Recent events", value: notificationsQuery.data?.length ?? 0 },
          { label: "Ready workflows", value: pipelines.filter((pipeline) => pipeline.status === "healthy" || pipeline.status === "running").length },
        ].map((item) => (
          <Card key={item.label} className="glass p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
            <p className="mt-2 font-display text-3xl font-bold">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        {pipelines.length ? pipelines.map((p, idx) => (
          <Card key={p.name} className="glass overflow-hidden p-6 animate-scale-in" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.steps.length} stages · {p.detail}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`gap-1 ${p.status === "running" ? "bg-primary/15 text-primary" : p.status === "healthy" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {p.status === "running" && <Clock className="h-3 w-3" />}
                  {p.status === "scheduled" && <AlertCircle className="h-3 w-3" />}
                  {p.status === "healthy" && <Workflow className="h-3 w-3" />}
                  {p.status}
                </Badge>
                <Button variant="outline" size="sm" className="rounded-lg">
                  {p.status === "running" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            {/* Visual pipeline */}
            <div className="rounded-2xl border border-border/50 bg-gradient-card p-5">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {p.steps.map((s, i) => {
                  const active = (i / p.steps.length) * 100 < p.progress;
                  return (
                    <div key={s} className="flex items-center gap-2 md:gap-3">
                      <div className={`group relative flex min-w-[8rem] flex-1 flex-col items-center rounded-xl border px-3 py-3 transition-all sm:min-w-[120px] sm:flex-none ${active ? "border-primary/40 bg-primary/10 shadow-glow" : "border-border/60 bg-card/60"}`}>
                        <div className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          {i + 1}
                        </div>
                        <span className="text-xs font-medium">{s}</span>
                      </div>
                      {i < p.steps.length - 1 && <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Progress value={p.progress} className="h-1.5 flex-1" />
              <span className="text-sm font-medium tabular-nums">{p.progress}%</span>
            </div>
          </Card>
        )) : (
          <Card className="glass p-6 text-sm text-muted-foreground">
            No completed import runs yet. Run an import to populate live automation pipelines.
          </Card>
        )}
      </div>

      <Card className="glass mt-6 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Recent Import Runs</h3>
            <p className="text-xs text-muted-foreground">Live batch history backing the admissions pipeline</p>
          </div>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => void batchesQuery.refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {(batchesQuery.data ?? []).slice(0, 3).map((batch) => (
            <div key={batch.id} className="rounded-xl border border-border/60 bg-card/60 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold">{batch.batchName}</h4>
                <Badge variant="secondary" className={batch.failed > 0 ? "bg-warning/15 text-warning" : "bg-success/15 text-success"}>
                  {batch.failed > 0 ? "watch" : "healthy"}
                </Badge>
              </div>
              <Progress value={batch.total ? Math.min(100, Math.round(((batch.inserted + batch.updated) / Math.max(1, batch.total)) * 100)) : 0} className="h-1.5" />
              <p className="mt-2 text-[11px] text-muted-foreground">
                {batch.fileName} · {batch.inserted} inserted · {batch.updated} updated · {batch.failed} failed
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
