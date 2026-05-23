import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle2,
  Database,
  Layers3,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Workflow,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { MIGRATION_PATCH_FLAGS, setMigrationFlag, toggleMigrationFlag } from "@/lib/featureFlags";
import { buildMigrationRegistrySnapshot, getMigrationModulesByDomain } from "@/lib/migration-registry";
import { clearRollback, resetRollbackRegistry, triggerRollback } from "@/lib/rollbackRegistry";
import { getMigrationRuntimeSnapshot, subscribeMigrationRuntime } from "@/lib/migrationRuntime";

function statusClasses(kind: "compatible" | "bridge-required" | "deferred") {
  if (kind === "compatible") return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (kind === "bridge-required") return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  return "bg-slate-500/15 text-slate-700 dark:text-slate-300";
}

function sourceLabel(source: string) {
  if (source === "environment") return "env";
  if (source === "storage") return "saved";
  return "default";
}

export default function Migration() {
  const [, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribeRuntime = subscribeMigrationRuntime(() => setRevision((value) => value + 1));
    return () => {
      unsubscribeRuntime();
    };
  }, []);

  const registry = buildMigrationRegistrySnapshot();
  const runtime = getMigrationRuntimeSnapshot();
  const domainGroups = getMigrationModulesByDomain();
  const topGaps = registry.gapAnalysis.slice(0, 6);
  const topClusters = registry.capabilityClusters.slice(0, 6);

  const handleToggle = (key: string, label: string) => {
    toggleMigrationFlag(key);
    toast.success(`${label} updated`);
    setRevision((value) => value + 1);
  };

  const handleRollback = (key: string, label: string) => {
    const current = runtime.patches.find((patch) => patch.key === key);
    if (current?.rollbackActive) {
      clearRollback(key);
      toast.success(`${label} rollback cleared`);
    } else {
      triggerRollback(key, `Rollback armed from Migration Center for ${label}`);
      toast.warning(`${label} rollback armed`);
    }
    setRevision((value) => value + 1);
  };

  const handleResetAll = () => {
    resetRollbackRegistry();
    for (const flag of MIGRATION_PATCH_FLAGS) {
      setMigrationFlag(flag.key, flag.defaultEnabled);
    }
    toast.success("Migration controls reset");
    setRevision((value) => value + 1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Migration & Compatibility Center"
        subtitle="Foundation audit, feature gates, rollback controls, and incremental compatibility tracking"
        icon={<ArrowUpCircle className="h-6 w-6" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="rounded-xl border-border/60" onClick={handleResetAll}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset controls
            </Button>
            <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90" onClick={() => setRevision((value) => value + 1)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh registry
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Layers3, label: "Indexed modules", value: registry.summary.totalModules, sub: `${registry.summary.liveModules} compatible` },
          { icon: Workflow, label: "Bridge-required", value: registry.summary.bridgeModules, sub: `${registry.summary.deferredModules} deferred` },
          { icon: ShieldAlert, label: "Active rollbacks", value: runtime.summary.rollbackActive, sub: `${runtime.summary.active} active patches` },
          { icon: Database, label: "Capability clusters", value: registry.summary.capabilityClusters, sub: `${registry.summary.domains} domains` },
        ].map((stat) => (
          <Card key={stat.label} className="glass hover-lift p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <Card className="glass p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">Patch Gates</h3>
              <p className="text-xs text-muted-foreground">Default-off for migrated surfaces, with instant rollback protection.</p>
            </div>
            <Badge variant="secondary" className="bg-primary/15 text-primary">
              {runtime.summary.active}/{runtime.summary.total} ready
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            {runtime.patches.map((patch) => (
              <div key={patch.key} className="rounded-2xl border border-border/60 bg-card/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{patch.label}</p>
                      <Badge className={statusClasses(patch.ready ? "compatible" : patch.rollbackActive ? "deferred" : patch.enabled ? "bridge-required" : "deferred")}>
                        {patch.ready ? "ready" : patch.rollbackActive ? "rollback" : patch.enabled ? "armed" : "disabled"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {sourceLabel(patch.source)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{patch.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={patch.enabled}
                      disabled={patch.source === "environment"}
                      onCheckedChange={() => handleToggle(patch.key, patch.label)}
                    />
                    <Button variant="outline" size="sm" className="rounded-lg" onClick={() => handleRollback(patch.key, patch.label)}>
                      <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                      {patch.rollbackActive ? "Clear" : "Rollback"}
                    </Button>
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={patch.ready ? 100 : patch.enabled ? 60 : 25} className="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass p-5">
          <h3 className="font-display text-lg font-semibold">Registry Health</h3>
          <p className="mb-4 text-xs text-muted-foreground">Compatibility map, ownership view, and surface clusters.</p>

          <div className="space-y-3">
            {[
              { label: "Compatible", value: registry.summary.liveModules },
              { label: "Bridge required", value: registry.summary.bridgeModules },
              { label: "Deferred", value: registry.summary.deferredModules },
              { label: "Legacy-pack", value: registry.summary.legacyPackModules },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/60 bg-card/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="font-display text-xl font-semibold">{item.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning-foreground">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <p>
                Keep the first two patches on by default, then gate later migrations individually so rollback can stay instant and isolated.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass p-5">
          <h3 className="font-display text-lg font-semibold">Gap Analysis</h3>
          <p className="mb-4 text-xs text-muted-foreground">Outstanding bridge work detected by the foundation registry.</p>
          <div className="space-y-3">
            {topGaps.length ? (
              topGaps.map((gap) => (
                <div key={gap.id} className="rounded-xl border border-border/60 bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{gap.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{gap.detail}</p>
                    </div>
                    <Badge variant="secondary" className={statusClasses(gap.kind === "bridge" ? "bridge-required" : "deferred")}>
                      {gap.severity}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No gaps detected in the current snapshot.</p>
            )}
          </div>
        </Card>

        <Card className="glass p-5">
          <h3 className="font-display text-lg font-semibold">Capability Clusters</h3>
          <p className="mb-4 text-xs text-muted-foreground">Shared shells and runtime families worth tracking during migration.</p>
          <div className="space-y-3">
            {topClusters.length ? (
              topClusters.map((cluster) => (
                <div key={cluster.id} className="rounded-xl border border-border/60 bg-card/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{cluster.scope}: {cluster.key}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{cluster.detail}</p>
                    </div>
                    <Badge variant="outline">{cluster.modules.length} modules</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No shared capability clusters detected yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Ownership Map</h3>
            <p className="text-xs text-muted-foreground">How each module is currently owned across the new system and compatibility bridge.</p>
          </div>
          <Badge variant="secondary" className="bg-primary/15 text-primary">
            {domainGroups.length} domains
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {domainGroups.map((group) => (
            <div key={group.domainLabel} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{group.domainLabel}</p>
                  <p className="text-[11px] text-muted-foreground">{group.total} module(s)</p>
                </div>
                <Badge variant="outline">{group.modules.filter((module) => module.ownership === "new-system").length} live</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {group.modules.slice(0, 8).map((module) => (
                  <Badge key={module.key} variant="secondary" className={statusClasses(module.compatibility)}>
                    {module.key}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Compatibility Matrix</h3>
            <p className="text-xs text-muted-foreground">A compact view of the current module surface and migration state.</p>
          </div>
          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            {registry.summary.totalModules} indexed
          </Badge>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border/60">
          <div className="grid grid-cols-[1.2fr_.7fr_.8fr_.8fr] border-b border-border/60 bg-muted/40 px-4 py-3 text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Module</span>
            <span>Status</span>
            <span>Ownership</span>
            <span>Source</span>
          </div>
          <div className="divide-y divide-border/60">
            {registry.modules.slice(0, 12).map((module) => (
              <div key={module.key} className="grid grid-cols-[1.2fr_.7fr_.8fr_.8fr] items-center px-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{module.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{module.domainLabel}</p>
                </div>
                <Badge className={statusClasses(module.compatibility)}>{module.compatibility}</Badge>
                <span className="text-xs text-muted-foreground">{module.ownership}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{module.sourceLine ?? "n/a"}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
