import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, Database, GitCompare, Import, Loader2, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { loadDuplicateIssues } from "@/lib/duplicate-issues-store";
import { fetchStudentRegister } from "@/lib/student-records";
import { loadImportBatchHistory } from "@/lib/student-import";
import type { StudentRegisterRow } from "@/lib/student-records";
import type { ImportBatchHistoryEntry, DuplicateIssue } from "@/lib/student-import";

const PAGE_SIZE = 10;

function computeCompleteness(students: StudentRegisterRow[]): { score: number; missingFields: Record<string, number> } {
  if (!students.length) return { score: 100, missingFields: {} };
  const fields: { test: (s: StudentRegisterRow) => boolean; key: string; label: string }[] = [
    { test: (s) => !!s.email, key: "email", label: "Email" },
    { test: (s) => !!s.phone, key: "phone", label: "Phone" },
    { test: (s) => !!s.dob, key: "dob", label: "Date of Birth" },
    { test: (s) => !!s.gender, key: "gender", label: "Gender" },
    { test: (s) => !!s.guardian_name, key: "guardian_name", label: "Guardian Name" },
    { test: (s) => !!s.guardian_phone, key: "guardian_phone", label: "Guardian Phone" },
    { test: (s) => !!s.blood_group, key: "blood_group", label: "Blood Group" },
    { test: (s) => !!s.house, key: "house", label: "House" },
  ];
  const missingFields: Record<string, number> = {};
  let totalMissing = 0;
  for (const field of fields) {
    const missing = students.filter((s) => !field.test(s)).length;
    missingFields[field.key] = missing;
    totalMissing += missing;
  }
  const totalChecks = students.length * fields.length;
  const score = Math.round((1 - totalMissing / totalChecks) * 100);
  return { score, missingFields };
}

function computeDuplicateRate(duplicates: DuplicateIssue[], totalStudents: number): { rate: number; pending: number } {
  if (!totalStudents) return { rate: 0, pending: 0 };
  const pending = duplicates.filter((d) => d.resolution === "pending").length;
  const rate = Math.round((pending / totalStudents) * 10000) / 100;
  return { rate, pending };
}

function computeImportSuccessRate(batches: ImportBatchHistoryEntry[]): { rate: number; totalBatches: number } {
  if (!batches.length) return { rate: 100, totalBatches: 0 };
  const total = batches.reduce((s, b) => s + b.total, 0);
  const failed = batches.reduce((s, b) => s + b.failed + b.skipped, 0);
  const rate = total > 0 ? Math.round((1 - failed / total) * 100) : 100;
  return { rate, totalBatches: batches.length };
}

function computeHealthScore(completeness: number, duplicateRate: number, importRate: number): number {
  const completenessWeight = 0.45;
  const duplicateWeight = 0.3;
  const importWeight = 0.25;
  const dupScore = Math.max(0, 100 - duplicateRate * 10);
  return Math.round(completeness * completenessWeight + dupScore * duplicateWeight + importRate * importWeight);
}

function healthColor(score: number): string {
  if (score >= 90) return "text-green-500";
  if (score >= 70) return "text-amber-500";
  return "text-rose-500";
}

function healthBg(score: number): string {
  if (score >= 90) return "bg-green-50 border-green-200";
  if (score >= 70) return "bg-amber-50 border-amber-200";
  return "bg-rose-50 border-rose-200";
}

function trendDirection(value: number, previous: number): "up" | "down" | "same" {
  if (value > previous) return "up";
  if (value < previous) return "down";
  return "same";
}

export default function DataQualityDashboard() {
  const [students, setStudents] = useState<StudentRegisterRow[]>([]);
  const [batches, setBatches] = useState<ImportBatchHistoryEntry[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [studentData, batchData] = await Promise.all([
          fetchStudentRegister(),
          loadImportBatchHistory(20),
        ]);
        if (cancelled) return;
        setStudents(studentData);
        setBatches(batchData);
        setDuplicates(loadDuplicateIssues());
      } catch {
        if (!cancelled) {
          setDuplicates(loadDuplicateIssues());
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const completeness = useMemo(() => computeCompleteness(students), [students]);
  const dupRate = useMemo(() => computeDuplicateRate(duplicates, students.length), [duplicates, students.length]);
  const importRate = useMemo(() => computeImportSuccessRate(batches), [batches]);
  const healthScore = useMemo(
    () => computeHealthScore(completeness.score, dupRate.rate, importRate.rate),
    [completeness.score, dupRate.rate, importRate.rate],
  );

  const batchesSorted = useMemo(
    () => [...batches].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [batches],
  );

  const trendScore = useMemo(() => {
    if (batchesSorted.length < 2) return "same" as const;
    const half = Math.floor(batchesSorted.length / 2);
    const first = batchesSorted.slice(0, half);
    const second = batchesSorted.slice(half);
    const avgFirst = first.reduce((s, b) => s + b.inserted, 0) / Math.max(1, first.length);
    const avgSecond = second.reduce((s, b) => s + b.inserted, 0) / Math.max(1, second.length);
    return trendDirection(avgSecond, avgFirst);
  }, [batchesSorted]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="border-b border-border/40 bg-background/80 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Activity className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Data Quality Dashboard</h1>
              <p className="text-xs text-muted-foreground">
                {students.length.toLocaleString()} students · {batches.length} import batches · {duplicates.length} duplicate issues
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs",
              trendScore === "up" && "border-green-300 bg-green-50 text-green-700",
              trendScore === "down" && "border-rose-300 bg-rose-50 text-rose-700",
              trendScore === "same" && "border-border/60 text-muted-foreground",
            )}
          >
            <TrendingUp className={cn("h-3.5 w-3.5", trendScore === "down" && "rotate-180")} />
            {trendScore === "up" ? "Improving" : trendScore === "down" ? "Declining" : "Stable"}
          </Badge>
        </div>
      </div>

      <div className="space-y-6 p-6">
        {/* Health Score */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <Card className={cn("col-span-1 lg:col-span-1 flex flex-col items-center justify-center border-2 p-8 lg:min-h-[200px]", healthBg(healthScore))}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Overall Health</p>
            <p className={cn("mt-1 text-5xl font-bold tabular-nums", healthColor(healthScore))}>{healthScore}</p>
            <p className="mt-1 text-xs text-muted-foreground">out of 100</p>
            <div className="mt-3 flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => {
                const segment = (i + 1) * 20;
                return (
                  <div
                    key={i}
                    className={cn(
                      "h-2 w-8 rounded-full transition-colors",
                      healthScore >= segment - 10
                        ? segment <= 40
                          ? "bg-rose-400"
                          : segment <= 60
                            ? "bg-amber-400"
                            : "bg-green-400"
                        : "bg-muted/40",
                    )}
                  />
                );
              })}
            </div>
          </Card>

          <MetricCard
            icon={<Database className="h-4 w-4" />}
            label="Completeness"
            value={`${completeness.score}%`}
            color={completeness.score >= 90 ? "text-green-600" : completeness.score >= 70 ? "text-amber-600" : "text-rose-600"}
            bgColor={completeness.score >= 90 ? "bg-green-100" : completeness.score >= 70 ? "bg-amber-100" : "bg-rose-100"}
            detail={`${students.length} students`}
          />
          <MetricCard
            icon={<GitCompare className="h-4 w-4" />}
            label="Duplicate Rate"
            value={`${dupRate.rate}%`}
            color={dupRate.rate <= 1 ? "text-green-600" : dupRate.rate <= 5 ? "text-amber-600" : "text-rose-600"}
            bgColor={dupRate.rate <= 1 ? "bg-green-100" : dupRate.rate <= 5 ? "bg-amber-100" : "bg-rose-100"}
            detail={`${dupRate.pending} pending`}
          />
          <MetricCard
            icon={<Import className="h-4 w-4" />}
            label="Import Success"
            value={`${importRate.rate}%`}
            color={importRate.rate >= 95 ? "text-green-600" : importRate.rate >= 80 ? "text-amber-600" : "text-rose-600"}
            bgColor={importRate.rate >= 95 ? "bg-green-100" : importRate.rate >= 80 ? "bg-amber-100" : "bg-rose-100"}
            detail={`${importRate.totalBatches} batches`}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Trend Chart */}
          <Card className="col-span-1 lg:col-span-2 border border-border/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              Import Quality Trend (last {batchesSorted.length} batches)
            </p>
            {batchesSorted.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                No import history yet.
              </div>
            ) : (
              <div className="space-y-2">
                {batchesSorted.slice(-PAGE_SIZE).map((batch, i) => {
                  const successRate = batch.total > 0
                    ? Math.round(((batch.total - batch.failed - batch.skipped) / batch.total) * 100)
                    : 100;
                  const barColor = successRate >= 95 ? "bg-green-400" : successRate >= 80 ? "bg-amber-400" : "bg-rose-400";
                  return (
                    <div key={batch.id} className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-16 shrink-0 truncate text-[10px] text-muted-foreground tabular-nums">
                          {batch.createdAt ? new Date(batch.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : `#${i + 1}`}
                        </span>
                        <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-muted/50">
                          <div
                            className={cn("h-full rounded-full transition-all", barColor)}
                            style={{ width: `${successRate}%` }}
                          />
                        </div>
                      </div>
                      <span className="w-10 text-right text-[10px] font-medium tabular-nums text-muted-foreground">
                        {batch.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Completeness breakdown */}
          <Card className="border border-border/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Field Completeness
            </p>
            {Object.keys(completeness.missingFields).length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                No student data loaded.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(completeness.missingFields).map(([key, missing]) => {
                  const pct = students.length > 0 ? Math.round(((students.length - missing) / students.length) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 text-xs">
                      <span className="w-24 shrink-0 text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/50">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            pct >= 95 ? "bg-green-400" : pct >= 80 ? "bg-amber-400" : "bg-rose-400",
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-medium tabular-nums text-muted-foreground">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Issues Summary */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="border border-border/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Duplicate Issues ({duplicates.length})
            </p>
            {duplicates.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No duplicate issues.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {duplicates.slice(0, 10).map((dup) => (
                  <div key={dup.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-xs">
                    <span className="truncate">{dup.newRowLabel}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[9px] px-1.5 py-0",
                        dup.resolution === "pending" && "border-amber-200 text-amber-700",
                        dup.resolution === "resolved" && "border-green-200 text-green-700",
                        dup.resolution === "ignored" && "border-border/60 text-muted-foreground",
                      )}
                    >
                      {dup.resolution}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="border border-border/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Recent Imports
            </p>
            {batchesSorted.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No import history.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {batchesSorted.slice(-8).reverse().map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-xs">
                    <span className="truncate">{batch.batchName}</span>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      +{batch.inserted} / ~{batch.updated}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
  bgColor,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  detail: string;
}) {
  return (
    <Card className="flex items-center gap-4 border border-border/40 p-5">
      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", bgColor, color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("text-xl font-bold tabular-nums", color)}>{value}</p>
        <p className="text-[10px] text-muted-foreground">{detail}</p>
      </div>
    </Card>
  );
}
