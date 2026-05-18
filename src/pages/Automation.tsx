import { Workflow, Play, Pause, Plus, CheckCircle2, Clock, AlertCircle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/PageHeader";
import { pipelines } from "@/lib/mock-data";

export default function Automation() {
  return (
    <div>
      <PageHeader
        title="Automation Pipelines"
        subtitle="Visual workflow orchestration · ISO-aligned event bus"
        icon={<Workflow className="h-6 w-6" />}
        actions={
          <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
            <Plus className="mr-2 h-4 w-4" /> New Pipeline
          </Button>
        }
      />

      <div className="grid gap-6">
        {pipelines.map((p, idx) => (
          <Card key={p.name} className="glass overflow-hidden p-6 animate-scale-in" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <Workflow className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.steps.length} stages · trigger: event-driven</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`gap-1 ${p.status === "running" ? "bg-primary/15 text-primary" : p.status === "healthy" ? "bg-success/15 text-success" : "bg-warning/15 text-warning"}`}>
                  {p.status === "running" && <Clock className="h-3 w-3" />}
                  {p.status === "healthy" && <CheckCircle2 className="h-3 w-3" />}
                  {p.status === "scheduled" && <AlertCircle className="h-3 w-3" />}
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
                      <div className={`group relative flex min-w-[120px] flex-col items-center rounded-xl border px-3 py-3 transition-all ${active ? "border-primary/40 bg-primary/10 shadow-glow" : "border-border/60 bg-card/60"}`}>
                        <div className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                          {i + 1}
                        </div>
                        <span className="text-xs font-medium">{s}</span>
                      </div>
                      {i < p.steps.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <Progress value={p.progress} className="h-1.5 flex-1" />
              <span className="text-sm font-medium tabular-nums">{p.progress}%</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
