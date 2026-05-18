import { ArrowUpCircle, Database, RefreshCw, CheckCircle2, AlertTriangle, HardDrive, Cpu, Cloud } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";

const migrations = [
  { name: "Legacy SIS → NextGen Core", progress: 78, status: "running", records: "412K / 528K" },
  { name: "Accounting Ledger Migration", progress: 100, status: "complete", records: "184K / 184K" },
  { name: "Library Catalog Sync", progress: 42, status: "running", records: "9.4K / 22K" },
  { name: "Transport Routes Import", progress: 0, status: "queued", records: "0 / 86" },
];

const modules = [
  { name: "Core ERP", current: "v4.8.2", latest: "v4.9.0", status: "update" },
  { name: "Examination Engine", current: "v2.1.4", latest: "v2.1.4", status: "ok" },
  { name: "Payment Gateway", current: "v3.0.1", latest: "v3.2.0", status: "update" },
  { name: "Analytics Suite", current: "v1.7.0", latest: "v1.7.0", status: "ok" },
];

export default function Migration() {
  return (
    <div>
      <PageHeader
        title="Migration & Upgrade Center"
        subtitle="Legacy sync · data pipelines · backup restore · compatibility checks"
        icon={<ArrowUpCircle className="h-6 w-6" />}
        actions={
          <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
            <RefreshCw className="mr-2 h-4 w-4" /> Run Full Sync
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: HardDrive, label: "Backup Storage", val: "2.4 TB", sub: "of 5 TB used" },
          { icon: Cpu, label: "Migration Throughput", val: "8.2K rec/s", sub: "avg last hour" },
          { icon: Cloud, label: "Active Snapshots", val: "47", sub: "encrypted · AES-256" },
        ].map((s) => (
          <Card key={s.label} className="glass hover-lift p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <s.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="glass p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Active Data Migrations</h3>
          <p className="mb-4 text-xs text-muted-foreground">Realtime progress · zero-downtime pipelines</p>
          <div className="space-y-4">
            {migrations.map((m) => (
              <div key={m.name} className="rounded-xl border border-border/60 bg-card/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{m.name}</span>
                  </div>
                  <Badge variant="secondary" className={
                    m.status === "complete" ? "bg-success/15 text-success" :
                    m.status === "running" ? "bg-primary/15 text-primary" :
                    "bg-muted text-muted-foreground"
                  }>{m.status}</Badge>
                </div>
                <Progress value={m.progress} className="h-1.5" />
                <p className="mt-2 text-[11px] text-muted-foreground">{m.records} · {m.progress}%</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-5">
          <h3 className="mb-1 font-display text-lg font-semibold">Module Upgrade Manager</h3>
          <p className="mb-4 text-xs text-muted-foreground">Compatibility checker · semver tracking</p>
          <div className="space-y-3">
            {modules.map((m) => (
              <div key={m.name} className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-4">
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{m.current} → {m.latest}</p>
                </div>
                {m.status === "ok" ? (
                  <Badge variant="secondary" className="gap-1 bg-success/15 text-success">
                    <CheckCircle2 className="h-3 w-3" /> Up to date
                  </Badge>
                ) : (
                  <Button size="sm" className="rounded-lg bg-gradient-primary hover:opacity-90">
                    <ArrowUpCircle className="mr-1 h-3.5 w-3.5" /> Upgrade
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p><span className="font-semibold">Compatibility advisory:</span> Core ERP v4.9.0 requires Payment Gateway v3.2.0+. Upgrade in sequence.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
