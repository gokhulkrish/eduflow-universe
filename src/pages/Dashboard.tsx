import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/PageHeader";
import { moduleConfigs } from "@/pages/module-configs";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  LayoutDashboard, Users, GraduationCap, DollarSign, TrendingUp, ArrowUpRight,
  ArrowDownRight, Activity, Sparkles, CheckCircle2, Clock, AlertCircle, Radio,
  UserPlus, ClipboardCheck, FilePlus, ScrollText, BarChart3, Briefcase, Upload,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { loadAccessibleModuleKeys } from "@/lib/module-access";
import { APP_ACCESS_RULES } from "@/lib/global-access-registry";
import { canOpenCommandCenter } from "@/lib/command-center-access";
import { subscribeAppSync } from "@/lib/app-sync";
import { getLandingForRole } from "@/stores/landingProfiles";
import { MONITORING_REFRESH_SYNC_KEY, canUseMonitoringApi, resolveMonitoringContext } from "@/lib/monitoring-refresh";
import { useRealtime } from "@/lib/use-realtime";
import {
  fetchDashboardKpis,
  fetchEnrollmentTrend,
  fetchAttendanceWeek,
  fetchDepartmentDist,
  fetchModuleHealth,
  fetchProgramPerformance,
  quickActions,
  type DashboardKpis,
  type EnrollmentMonth,
  type AttendanceDay,
  type DeptDist,
  type ModuleHealth,
  type ProgramPerformance,
} from "@/lib/dashboard-data";
import { activities, dashboardHero } from "@/lib/mock-data";
import type { DashboardMetric } from "../../core/monitoring/snapshot";

const COLORS = ["hsl(245 80% 60%)", "hsl(270 90% 70%)", "hsl(200 95% 60%)", "hsl(152 70% 50%)"];
const MONITORING_SNAPSHOT_ENDPOINT = "/api/monitoring/snapshot";
const MONITORING_HEALTH_ENDPOINT = "/api/monitoring/health";

type LandingProfile = {
  title: string;
  subtitle: string;
  icon: ReactNode;
  features: string[];
  path: string;
  ctaLabel: string;
};

const fallbackLandingProfiles: Record<string, Omit<LandingProfile, "path">> = {
  students: {
    title: "Student Registry",
    subtitle: "Search, inspect, and manage the currently available student workspace.",
    icon: <Users className="h-6 w-6" />,
    features: [
      "Live student register",
      "Cohort filtering and profile lookup",
      "Admission and status visibility",
      "Quick access to student information",
      "Reusable search and audit flow",
      "Role-scoped record visibility",
    ],
    ctaLabel: "Open Student Area",
  },
  taskManagement: {
    title: "Task Management",
    subtitle: "Track work items, progress, and ownership from the first accessible area.",
    icon: <CheckCircle2 className="h-6 w-6" />,
    features: [
      "Create and update tasks",
      "Priority and status tracking",
      "Assignee and due-date control",
      "Immediate local sync",
      "Compact task board flow",
      "Role-safe workspace actions",
    ],
    ctaLabel: "Open Task Area",
  },
  collegeInfo: {
    title: "Institute Identity",
    subtitle: "Branding, profile, and configuration now act as the home surface.",
    icon: <Sparkles className="h-6 w-6" />,
    features: [
      "Institute profile and branding",
      "Localization and contact details",
      "Configuration and reference data",
      "Controlled settings visibility",
      "Fast access to identity setup",
      "Scoped administrative controls",
    ],
    ctaLabel: "Open Institute Identity",
  },
};

const resolveLandingProfile = (path: string, key: string | null): LandingProfile | null => {
  if (!key) return null;
  const config = moduleConfigs[key];
  if (config) {
    return {
      title: config.title,
      subtitle: config.subtitle,
      icon: config.icon,
      features: config.features,
      path,
      ctaLabel: `Open ${config.title}`,
    };
  }
  const fallback = fallbackLandingProfiles[key];
  if (fallback) return { ...fallback, path };
  return {
    title: "Workspace",
    subtitle: "Your next available area is ready to open from here.",
    icon: <LayoutDashboard className="h-6 w-6" />,
    features: [
      "Role-based access only",
      "No restricted dashboard widgets",
      "Immediate entry into the first permitted area",
      "Consistent module-level control",
    ],
    path,
    ctaLabel: "Open available area",
  };
};

function StatCard({ icon: Icon, label, value, delta, positive = true, suffix = "" }: any) {
  return (
    <Card className="glass hover-lift group relative overflow-hidden p-5">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-primary opacity-10 blur-3xl transition-all group-hover:opacity-25" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-bold tracking-tight">
            {value}
            {suffix && <span className="ml-0.5 text-lg text-muted-foreground">{suffix}</span>}
          </p>
          {delta !== undefined && (
            <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {delta}
            </div>
          )}
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

function formatRelativeMonitoringTime(value?: string) {
  if (!value) return "No recent student activity";
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "No recent student activity";
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes <= 1) return "Updated just now";
  if (diffMinutes < 60) return `Updated ${diffMinutes} min ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours} hr ago`;
  const diffDays = Math.round(diffHours / 24);
  return diffDays < 7 ? `Updated ${diffDays} day${diffDays === 1 ? "" : "s"} ago` : `Updated ${new Date(timestamp).toLocaleDateString()}`;
}

const actionIconMap: Record<string, ReactNode> = {
  UserPlus: <UserPlus className="h-4 w-4" />,
  ClipboardCheck: <ClipboardCheck className="h-4 w-4" />,
  DollarSign: <DollarSign className="h-4 w-4" />,
  FilePlus: <FilePlus className="h-4 w-4" />,
  ScrollText: <ScrollText className="h-4 w-4" />,
  BarChart3: <BarChart3 className="h-4 w-4" />,
  Briefcase: <Briefcase className="h-4 w-4" />,
  Upload: <Upload className="h-4 w-4" />,
};

export default function Dashboard() {
  const { roles, loading: authLoading } = useAuth();
  const [monitoringMetrics, setMonitoringMetrics] = useState<Record<string, DashboardMetric>>({});
  const [monitoringHealth, setMonitoringHealth] = useState<"good" | "warning" | "critical" | null>(null);

  const { data: accessibleKeys, isLoading: accessLoading } = useQuery({
    queryKey: ["accessible-module-keys", "dashboard"],
    queryFn: () => loadAccessibleModuleKeys(),
    staleTime: Infinity,
  });

  const { data: kpis } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: fetchDashboardKpis,
    refetchInterval: 60_000,
  });

  const { data: enrollmentData } = useQuery({
    queryKey: ["dashboard-enrollment"],
    queryFn: fetchEnrollmentTrend,
    refetchInterval: 120_000,
  });

  const { data: attendanceData } = useQuery({
    queryKey: ["dashboard-attendance"],
    queryFn: fetchAttendanceWeek,
    refetchInterval: 60_000,
  });

  const { data: deptDist } = useQuery({
    queryKey: ["dashboard-dept-dist"],
    queryFn: fetchDepartmentDist,
    refetchInterval: 300_000,
  });

  const { data: moduleHealth } = useQuery({
    queryKey: ["dashboard-module-health"],
    queryFn: fetchModuleHealth,
    refetchInterval: 300_000,
  });

  const { data: programPerformance } = useQuery({
    queryKey: ["dashboard-program-performance"],
    queryFn: fetchProgramPerformance,
    refetchInterval: 120_000,
  });

  const qc = useQueryClient();

  useRealtime("students", () => { qc.invalidateQueries({ queryKey: ["dashboard-kpis"] }); });
  useRealtime("attendance", () => { qc.invalidateQueries({ queryKey: ["dashboard-attendance"] }); });
  useRealtime("fee_payments", () => { qc.invalidateQueries({ queryKey: ["dashboard-kpis"] }); });
  useRealtime("staff", () => { qc.invalidateQueries({ queryKey: ["dashboard-kpis"] }); });

  const hasCommandCenter = !accessLoading && !authLoading && canOpenCommandCenter(roles);

  const profileLandingPath = useMemo(() => getLandingForRole(roles), [roles]);
  const fallbackPaths = useMemo(() => [
    "/students", "/attendance", "/reports", "/fees", "/admissions",
    "/tasks", "/notifications", "/settings/institute", "/student-search", "/student-information",
  ], []);

  const landingTarget = useMemo(() => {
    if (!accessibleKeys) return null;
    if (profileLandingPath) {
      const rule = APP_ACCESS_RULES.find((r) => r.path === profileLandingPath && accessibleKeys.has(r.key));
      if (rule?.path) return rule.path;
    }
    return fallbackPaths
      .map((path) => APP_ACCESS_RULES.find((rule) => rule.path === path && accessibleKeys.has(rule.key)))
      .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule))
      .map((rule) => rule.path!)[0] ?? null;
  }, [accessibleKeys, profileLandingPath, fallbackPaths]);

  const landingProfile = useMemo(() => {
    if (!landingTarget) return null;
    const matchedRule = APP_ACCESS_RULES.find((rule) => rule.path === landingTarget) ?? null;
    return resolveLandingProfile(landingTarget, matchedRule?.key ?? null);
  }, [landingTarget]);

  useEffect(() => {
    let alive = true;
    const syncMonitoring = async () => {
      if (!canUseMonitoringApi()) return;
      try {
        const context = await resolveMonitoringContext();
        if (!context) return;
        const params = new URLSearchParams({ tenantId: context.tenantId });
        if (context.academicYearId) params.set("academicYearId", context.academicYearId);
        const [snapshotResponse, healthResponse] = await Promise.all([
          fetch(`${MONITORING_SNAPSHOT_ENDPOINT}?${params.toString()}`),
          fetch(`${MONITORING_HEALTH_ENDPOINT}?tenantId=${encodeURIComponent(context.tenantId)}`),
        ]);
        if (snapshotResponse.ok) {
          const payload = await snapshotResponse.json();
          const snapshotRows = Array.isArray(payload.rows) ? payload.rows : [];
          const nextMetrics = snapshotRows.reduce((acc: Record<string, DashboardMetric>, row: any) => {
            if (row && typeof row === "object" && row.snapshot_key && row.snapshot_value && typeof row.snapshot_value === "object") {
              acc[String(row.snapshot_key)] = row.snapshot_value as DashboardMetric;
            }
            return acc;
          }, {});
          if (alive) setMonitoringMetrics(nextMetrics);
        }
        if (healthResponse.ok) {
          const payload = await healthResponse.json();
          if (alive) setMonitoringHealth(payload?.row?.health_status ?? null);
        }
      } catch {}
    };
    void syncMonitoring();
    const unsubscribe = subscribeAppSync([MONITORING_REFRESH_SYNC_KEY], () => { void syncMonitoring(); });
    return () => { alive = false; unsubscribe(); };
  }, []);

  const healthyCount = moduleHealth?.filter((m) => m.exists).length ?? 0;
  const totalModules = moduleHealth?.length ?? 0;
  const activeModules = moduleHealth?.filter((m) => m.exists) ?? [];

  const monitoringStudentCount = monitoringMetrics["student-count"]?.value ?? dashboardHero.heroStats[0].value;
  const monitoringBatchCount = monitoringMetrics["import-batches"]?.value ?? dashboardHero.heroStats[1].value;
  const monitoringWorkflowCount = monitoringMetrics["workflow-activity"]?.value ?? dashboardHero.heroStats[2].value;
  const monitoringAcademicYear = monitoringMetrics["academic-year-focus"]?.value ?? dashboardHero.academicYear;
  const monitoringSourceCoverage = monitoringMetrics["source-coverage"]?.value ?? dashboardHero.sourceCoverage;
  const monitoringDistrict = monitoringMetrics["district-status"]?.value ?? dashboardHero.district;
  const monitoringLastActivity = monitoringMetrics["last-student-activity"]?.value;
  const monitoringLastActivityLabel = formatRelativeMonitoringTime(typeof monitoringLastActivity === "string" ? monitoringLastActivity : undefined);
  const monitoringHealthLabel =
    monitoringHealth === "critical" ? "Monitoring critical"
      : monitoringHealth === "warning" ? "Monitoring watch"
        : monitoringHealth === "good" ? "All systems operational" : "Monitoring idle";
  const monitoringHealthTone = monitoringHealth === "critical" ? "bg-destructive/15 text-destructive" : monitoringHealth === "warning" ? "bg-warning/15 text-warning" : "bg-success/15 text-success";

  const defaultKpis: DashboardKpis = {
    students: { label: "Total Students", value: "2,847", trend: "up" },
    staff: { label: "Faculty Members", value: "184", trend: "up" },
    revenue: { label: "Revenue (MTD)", value: "$1.28M", trend: "up" },
    attendance: { label: "Avg Attendance", value: "94.6%", suffix: "", trend: "up" },
  };
  const safeKpis = kpis ?? defaultKpis;

  if (accessLoading || authLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Workspace" subtitle="Preparing your role-based landing view" icon={<LayoutDashboard className="h-6 w-6" />} />
        <Card className="glass p-6"><p className="text-sm text-muted-foreground">Loading your available areas…</p></Card>
      </div>
    );
  }

  if (!hasCommandCenter) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={landingProfile?.title ?? "Workspace"}
          subtitle={landingProfile?.subtitle ?? "Your next available area"}
          icon={landingProfile?.icon ?? <LayoutDashboard className="h-6 w-6" />}
          actions={landingProfile ? (<Button asChild className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"><Link to={landingProfile.path}>{landingProfile.ctaLabel}</Link></Button>) : null}
        />
        {landingProfile ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="glass relative overflow-hidden border-0 p-6 shadow-elegant">
              <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-mesh)" }} />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/15 text-primary">Next available area</Badge>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">Role scoped</Badge>
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">{landingProfile.title}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{landingProfile.subtitle}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"><Link to={landingProfile.path}>{landingProfile.ctaLabel}</Link></Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl"><Link to="/permissions">Review permissions</Link></Button>
                </div>
              </div>
            </Card>
            <Card className="glass p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">{landingProfile.icon}</div>
                <div><p className="text-xs uppercase tracking-wider text-muted-foreground">What is available</p><p className="font-display text-lg font-semibold">{landingProfile.title}</p></div>
              </div>
              <div className="mt-5 grid gap-2">
                {landingProfile.features.map((feature) => (
                  <div key={feature} className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-foreground">{feature}</div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="glass p-6"><p className="text-sm text-muted-foreground">No accessible areas are currently assigned to this role.</p></Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Command Center"
        subtitle="Realtime overview of SMS"
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={
          <>
            <Badge variant="secondary" className={`gap-1.5 px-3 py-1.5 ${monitoringHealthTone}`}>
              <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> {monitoringHealthLabel}
            </Badge>
            <Button className="bg-gradient-primary shadow-glow hover:opacity-90"><Sparkles className="mr-2 h-4 w-4" /> AI Insights</Button>
          </>
        }
      />

      {/* Hero panel */}
      <Card className="relative mb-6 overflow-hidden border-0 bg-gradient-aurora p-6 text-primary-foreground shadow-elegant md:p-8">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-mesh)" }} />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur">{dashboardHero.eyebrow}</p>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">{dashboardHero.title}</h2>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/85">{dashboardHero.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary" className="rounded-xl"><Link to="/students">Open Student Register</Link></Button>
              <Button asChild size="sm" variant="ghost" className="rounded-xl bg-white/10 text-primary-foreground hover:bg-white/20"><Link to="/import">Open Import Workspace</Link></Button>
              <Button asChild size="sm" variant="ghost" className="rounded-xl bg-white/10 text-primary-foreground hover:bg-white/20"><Link to="/settings/institute">Institute Identity</Link></Button>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { l: "Academic Year", v: monitoringAcademicYear },
                { l: "Source Coverage", v: typeof monitoringSourceCoverage === "number" ? `${monitoringSourceCoverage}%` : monitoringSourceCoverage },
                { l: "District / Block", v: monitoringDistrict },
                { l: "Last Activity", v: monitoringLastActivityLabel },
              ].map((c) => (
                <div key={c.l} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{c.l}</p>
                  <p className="mt-0.5 text-sm font-semibold">{c.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 self-start">
            {[
              { label: "Registry Volume", value: monitoringStudentCount, meta: "students across engineering programs" },
              { label: "Import Operations", value: monitoringBatchCount, meta: "batches in the last 30 days" },
              { label: "Workflow Activity", value: monitoringWorkflowCount, meta: "active workflow sessions" },
            ].map((s, i) => (
              <div key={s.label} className={`rounded-2xl border px-4 py-3 backdrop-blur ${i === 0 ? "border-white/30 bg-white/20" : "border-white/15 bg-white/10"}`}>
                <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{String(s.value)}</p>
                <p className="text-[11px] text-primary-foreground/75">{s.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Real-time KPI strip */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label={safeKpis.students.label} value={safeKpis.students.value} delta={safeKpis.students.trend === "up" ? "+Live" : undefined} positive={safeKpis.students.trend !== "down"} />
        <StatCard icon={GraduationCap} label={safeKpis.staff.label} value={safeKpis.staff.value} delta={safeKpis.staff.trend === "up" ? "+Active" : undefined} positive={safeKpis.staff.trend !== "down"} />
        <StatCard icon={DollarSign} label={safeKpis.revenue.label} value={safeKpis.revenue.value} delta={safeKpis.revenue.trend === "up" ? "+Collected" : undefined} positive={safeKpis.revenue.trend !== "down"} />
        <StatCard icon={Activity} label={safeKpis.attendance.label} value={typeof safeKpis.attendance.value === "string" ? safeKpis.attendance.value.replace("%", "") : safeKpis.attendance.value} suffix="%" delta={safeKpis.attendance.trend === "up" ? "+1.4%" : undefined} positive={safeKpis.attendance.trend !== "down"} />
      </div>

      {/* Module health bar */}
      <Card className="glass mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-semibold">Module Health</h3>
            <p className="text-xs text-muted-foreground">{healthyCount} of {totalModules} modules connected</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> Active ({healthyCount})</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Missing ({totalModules - healthyCount})</span>
          </div>
        </div>
        <Progress value={totalModules > 0 ? (healthyCount / totalModules) * 100 : 0} className="mb-4 h-2" />
        <div className="flex flex-wrap gap-2">
          {(moduleHealth ?? []).map((m) => (
            <Badge key={m.key} variant="secondary" className={m.exists ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
              <span className={`mr-1 h-1.5 w-1.5 rounded-full ${m.exists ? "bg-success" : "bg-muted-foreground/40"}`} />
              {m.title}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <Card className="glass mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-display text-lg font-semibold">Quick Actions</h3>
            <p className="text-xs text-muted-foreground">Frequent operations at your fingertips</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map((action) => (
            <Button key={action.path} asChild variant="outline" size="sm" className="rounded-xl">
              <Link to={action.path}>
                {actionIconMap[action.icon] ?? <Sparkles className="h-4 w-4" />}
                <span className="ml-1.5">{action.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </Card>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Enrollment & Revenue</h3>
              <p className="text-xs text-muted-foreground">Last 7 months · live from Supabase</p>
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={enrollmentData ?? []}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(245 80% 60%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(245 80% 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(270 90% 70%)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(270 90% 70%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="students" stroke="hsl(245 80% 60%)" strokeWidth={2.5} fill="url(#g1)" />
              <Area type="monotone" dataKey="revenue" stroke="hsl(270 90% 70%)" strokeWidth={2.5} fill="url(#g2)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Department Mix</h3>
          <p className="mb-3 text-xs text-muted-foreground">Student distribution</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={deptDist ?? []} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {(deptDist ?? []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {(deptDist ?? []).map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly Attendance + Avg Performance + Activity Feed */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Weekly Attendance</h3>
          <p className="mb-3 text-xs text-muted-foreground">Realtime · across all grades</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceData ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" stackId="a" fill="hsl(245 80% 60%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="absent" stackId="a" fill="hsl(0 80% 65%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Avg Performance</h3>
          <p className="mb-3 text-xs text-muted-foreground">By program · latest term</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={programPerformance ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
              <YAxis dataKey="program" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
              <Bar dataKey="avg" fill="hsl(270 90% 70%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-5">
          <h3 className="mb-3 font-display text-lg font-semibold">Activity Feed</h3>
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3 animate-slide-in-right" style={{ animationDelay: `${i * 80}ms` }}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-primary text-[10px] text-primary-foreground">
                    {a.user.split(" ").map(s => s[0]).slice(0, 2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-tight">
                    <span className="font-semibold">{a.user.split(" ").slice(-2).join(" ")}</span>{" "}
                    <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
