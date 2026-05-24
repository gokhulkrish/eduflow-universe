import { useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { Link } from "react-router-dom";
import {
  enrollmentTrend, attendanceWeek, performanceByProgram,
  departmentDist, activities, pipelines,
  dashboardHero, erpKpis, erpRealtimeFabric,
} from "@/lib/mock-data";
import { useAuth } from "@/hooks/useAuth";
import { loadAccessibleModuleKeys } from "@/lib/module-access";
import { APP_ACCESS_RULES } from "@/lib/global-access-registry";
import { canOpenCommandCenter } from "@/lib/command-center-access";

const COLORS = ["hsl(245 80% 60%)", "hsl(270 90% 70%)", "hsl(200 95% 60%)", "hsl(152 70% 50%)"];

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
  if (fallback) {
    return { ...fallback, path };
  }

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
          <div className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta} vs last month
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { roles, loading: authLoading } = useAuth();
  const { data: accessibleKeys, isLoading } = useQuery({
    queryKey: ["accessible-module-keys", "dashboard"],
    queryFn: () => loadAccessibleModuleKeys(),
    staleTime: Infinity,
  });

  const hasCommandCenter = !isLoading && !authLoading && canOpenCommandCenter(roles);
  const preferredLandingPaths = useMemo(() => [
    "/students",
    "/attendance",
    "/reports",
    "/fees",
    "/admissions",
    "/tasks",
    "/notifications",
    "/settings/institute",
    "/student-search",
    "/student-information",
  ], []);

  const landingTarget = useMemo(() => {
    if (!accessibleKeys) return null;

    return preferredLandingPaths
      .map((path) => APP_ACCESS_RULES.find((rule) => rule.path === path && accessibleKeys.has(rule.key)))
      .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule))
      .map((rule) => rule.path!)[0] ?? null;
  }, [accessibleKeys, preferredLandingPaths]);

  const landingProfile = useMemo(() => {
    if (!landingTarget) return null;
    const matchedRule = APP_ACCESS_RULES.find((rule) => rule.path === landingTarget) ?? null;
    return resolveLandingProfile(landingTarget, matchedRule?.key ?? null);
  }, [landingTarget]);

  if (isLoading || authLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Workspace"
          subtitle="Preparing your role-based landing view"
          icon={<LayoutDashboard className="h-6 w-6" />}
        />
        <Card className="glass p-6">
          <p className="text-sm text-muted-foreground">Loading your available areas…</p>
        </Card>
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
          actions={
            landingProfile ? (
              <Button asChild className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
                <Link to={landingProfile.path}>{landingProfile.ctaLabel}</Link>
              </Button>
            ) : null
          }
        />

        {landingProfile ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card className="glass relative overflow-hidden border-0 p-6 shadow-elegant">
              <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-mesh)" }} />
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/15 text-primary">
                    Next available area
                  </Badge>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    Role scoped
                  </Badge>
                </div>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight">{landingProfile.title}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{landingProfile.subtitle}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild size="sm" className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
                    <Link to={landingProfile.path}>{landingProfile.ctaLabel}</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="rounded-xl">
                    <Link to="/permissions">Review permissions</Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="glass p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                  {landingProfile.icon}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">What is available</p>
                  <p className="font-display text-lg font-semibold">{landingProfile.title}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-2">
                {landingProfile.features.map((feature) => (
                  <div key={feature} className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2 text-sm text-foreground">
                    {feature}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card className="glass p-6">
            <p className="text-sm text-muted-foreground">
              No accessible areas are currently assigned to this role. If that seems unexpected, ask an admin to review the permission matrix.
            </p>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Command Center"
        subtitle="Realtime overview of SMS · Academic Year 2025-26"
        icon={<LayoutDashboard className="h-6 w-6" />}
        actions={
          <>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" /> All systems operational
            </Badge>
            <Button className="bg-gradient-primary shadow-glow hover:opacity-90">
              <Sparkles className="mr-2 h-4 w-4" /> AI Insights
            </Button>
          </>
        }
      />

      {/* Hero panel (merged: legacy home + dashboard) */}
      <Card className="relative mb-6 overflow-hidden border-0 bg-gradient-aurora p-6 text-primary-foreground shadow-elegant md:p-8">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-mesh)" }} />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur">{dashboardHero.eyebrow}</p>
            <h2 className="font-display text-3xl font-bold leading-tight md:text-4xl">{dashboardHero.title}</h2>
            <p className="mt-2 max-w-xl text-sm text-primary-foreground/85">{dashboardHero.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary" className="rounded-xl">
                <Link to="/students">Open Student Register</Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="rounded-xl bg-white/10 text-primary-foreground hover:bg-white/20">
                <Link to="/import">Open Import Workspace</Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="rounded-xl bg-white/10 text-primary-foreground hover:bg-white/20">
                <Link to="/settings/institute">Institute Identity</Link>
              </Button>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { l: "Academic Year", v: dashboardHero.academicYear },
                { l: "Source Coverage", v: dashboardHero.sourceCoverage },
                { l: "District / Block", v: dashboardHero.district },
                { l: "Last Activity", v: dashboardHero.lastUpdated },
              ].map((c) => (
                <div key={c.l} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{c.l}</p>
                  <p className="mt-0.5 text-sm font-semibold">{c.v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-3 self-start">
            {dashboardHero.heroStats.map((s, i) => (
              <div
                key={s.label}
                className={`rounded-2xl border px-4 py-3 backdrop-blur ${i === 0 ? "border-white/30 bg-white/20" : "border-white/15 bg-white/10"}`}
              >
                <p className="text-[10px] uppercase tracking-wider text-primary-foreground/70">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
                <p className="text-[11px] text-primary-foreground/75">{s.meta}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* KPI strip */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value="2,847" delta="+4.2%" />
        <StatCard icon={GraduationCap} label="Faculty Members" value="184" delta="+2.1%" />
        <StatCard icon={DollarSign} label="Revenue (MTD)" value="$1.28M" delta="+8.6%" />
        <StatCard icon={Activity} label="Avg Attendance" value="94.6" suffix="%" delta="+1.4%" />
      </div>

      {/* ERP KPIs (from erpOverviewSection) */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {erpKpis.map((k) => (
          <Card key={k.label} className="glass hover-lift p-4">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{k.label}</p>
              <span className="text-lg" aria-hidden>{k.icon}</span>
            </div>
            <p className="mt-2 font-display text-2xl font-bold">{k.value}</p>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Enrollment & Revenue</h3>
              <p className="text-xs text-muted-foreground">Last 7 months · synced live</p>
            </div>
            <TrendingUp className="h-4 w-4 text-success" />
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={enrollmentTrend}>
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
              <Pie data={departmentDist} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={4}>
                {departmentDist.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {departmentDist.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="ml-auto font-semibold">{d.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Realtime Operations Fabric (merged from erp-realtime-command-panel) */}
      <Card className="glass mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">Global College ERP</p>
            <h3 className="font-display text-lg font-semibold">Realtime Operations Fabric</h3>
            <p className="text-xs text-muted-foreground">Live cross-module health for academic, finance, success, ops, governance, compliance & platform.</p>
          </div>
          <Badge variant="secondary" className="gap-1.5 bg-success/15 text-success">
            <Radio className="h-3 w-3 animate-pulse" /> Live · {new Date().toLocaleTimeString()}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {erpRealtimeFabric.map((d) => (
            <div key={d.domain} className="rounded-xl border border-border/60 bg-card/60 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold">{d.domain}</p>
                <Badge variant="secondary" className={d.state === "healthy" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}>
                  {d.state}
                </Badge>
              </div>
              <Progress value={d.health} className="h-1.5" />
              <p className="mt-2 text-[11px] text-muted-foreground">{d.signal} · {d.health}%</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Weekly Attendance</h3>
          <p className="mb-3 text-xs text-muted-foreground">Realtime · across all grades</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceWeek}>
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
            <BarChart data={performanceByProgram} layout="vertical">
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

      {/* Pipelines */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold">Automation Pipelines</h2>
            <p className="text-sm text-muted-foreground">Live workflow orchestration across modules</p>
          </div>
          <Button asChild variant="outline" className="rounded-xl"><Link to="/automation">View all</Link></Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {pipelines.map((p) => (
            <Card key={p.name} className="glass hover-lift p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display font-semibold">{p.name}</h3>
                <Badge
                  variant="secondary"
                  className={`gap-1 ${p.status === "running" ? "bg-primary/15 text-primary" : p.status === "healthy" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}
                >
                  {p.status === "running" && <Clock className="h-3 w-3" />}
                  {p.status === "healthy" && <CheckCircle2 className="h-3 w-3" />}
                  {p.status === "scheduled" && <AlertCircle className="h-3 w-3" />}
                  {p.status}
                </Badge>
              </div>
              <div className="mb-3 flex flex-wrap items-center gap-1">
                {p.steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-1">
                    <span className="rounded-md border border-border/60 bg-secondary/60 px-2 py-0.5 text-[10px] font-medium">{s}</span>
                    {i < p.steps.length - 1 && <span className="text-muted-foreground">→</span>}
                  </div>
                ))}
              </div>
              <Progress value={p.progress} className="h-1.5" />
              <p className="mt-2 text-[11px] text-muted-foreground">{p.progress}% complete</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
