import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/PageHeader";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import {
  LayoutDashboard, Users, GraduationCap, DollarSign, TrendingUp, ArrowUpRight,
  ArrowDownRight, Activity, Sparkles, CheckCircle2, Clock, AlertCircle,
} from "lucide-react";
import {
  stats, enrollmentTrend, attendanceWeek, performanceByGrade,
  departmentDist, activities, pipelines,
} from "@/lib/mock-data";

const COLORS = ["hsl(245 80% 60%)", "hsl(270 90% 70%)", "hsl(200 95% 60%)", "hsl(152 70% 50%)"];

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
  return (
    <div>
      <PageHeader
        title="Command Center"
        subtitle="Realtime overview of NextGen EduERP · Academic Year 2025-26"
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

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Total Students" value="2,847" delta="+4.2%" />
        <StatCard icon={GraduationCap} label="Faculty Members" value="184" delta="+2.1%" />
        <StatCard icon={DollarSign} label="Revenue (MTD)" value="$1.28M" delta="+8.6%" />
        <StatCard icon={Activity} label="Avg Attendance" value="94.6" suffix="%" delta="+1.4%" />
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
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
              />
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
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
              />
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

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Weekly Attendance</h3>
          <p className="mb-3 text-xs text-muted-foreground">Realtime · across all grades</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={attendanceWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="present" stackId="a" fill="hsl(245 80% 60%)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="absent" stackId="a" fill="hsl(0 80% 65%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="glass p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Avg Performance</h3>
          <p className="mb-3 text-xs text-muted-foreground">By grade · latest term</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={performanceByGrade} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} />
              <YAxis dataKey="grade" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={70} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "12px",
                }}
              />
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
          <Button variant="outline" className="rounded-xl">View all</Button>
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
