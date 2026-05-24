import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpCircle,
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
import { buildDuplicationReport } from "@/lib/duplication-report";
import { buildStorageOwnershipReport, clearOwnedRuntimeStorage } from "@/lib/storage-registry";
import { buildLegacyAdapterReport } from "@/lib/legacy-adapter";
import {
  broadcastEnterpriseOrchestration,
  buildEnterpriseOrchestrationSnapshot,
  subscribeEnterpriseOrchestration,
  subscribeEnterpriseOrchestrationEvents,
} from "@/lib/enterprise-orchestration";
import {
  clearRuntimeHardeningSnapshot,
  getRuntimeHardeningSnapshot,
  runRuntimeHardeningSuite,
  subscribeRuntimeHardening,
} from "@/lib/runtime-hardening";
import { buildMigrationCertificationReport } from "@/lib/migration-certification";
import { buildRuntimeResilienceSnapshot, subscribeRuntimeResilience } from "@/lib/runtime-resilience";
import { clearRuntimeDiagnostics } from "@/lib/runtime-diagnostics";
import { buildModuleDedupSnapshot, clearModuleDedupSnapshot, subscribeModuleDedup } from "@/lib/module-deduplication";
import {
  buildStorageNormalizationSnapshot,
  bootstrapStorageNormalizationLayer,
  clearCorruptedStorageEntries,
  subscribeStorageNormalization,
} from "@/lib/storage-normalization";

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
  const [resilience, setResilience] = useState(() => buildRuntimeResilienceSnapshot());
  const [moduleDedup, setModuleDedup] = useState(() => buildModuleDedupSnapshot());
  const [storageNormalization, setStorageNormalization] = useState(() => buildStorageNormalizationSnapshot());
  const [hardening, setHardening] = useState(() => getRuntimeHardeningSnapshot());
  const [orchestrationSignal, setOrchestrationSignal] = useState<{ scope: string; reason: string; signal: string } | null>(null);

  useEffect(() => {
    const unsubscribeRuntime = subscribeMigrationRuntime(() => setRevision((value) => value + 1));
    const unsubscribeOrchestration = subscribeEnterpriseOrchestration(() => setRevision((value) => value + 1));
    const unsubscribeResilience = subscribeRuntimeResilience(() => setResilience(buildRuntimeResilienceSnapshot()));
    const unsubscribeModuleDedup = subscribeModuleDedup(() => setModuleDedup(buildModuleDedupSnapshot()));
    const unsubscribeStorageNormalization = subscribeStorageNormalization(() => setStorageNormalization(buildStorageNormalizationSnapshot()));
    const unsubscribeHardening = subscribeRuntimeHardening(() => setHardening(getRuntimeHardeningSnapshot()));
    const unsubscribeOrchestrationBus = subscribeEnterpriseOrchestrationEvents((event) =>
      setOrchestrationSignal({ scope: event.scope, reason: event.reason, signal: event.signal }),
    );
    return () => {
      unsubscribeRuntime();
      unsubscribeOrchestration();
      unsubscribeResilience();
      unsubscribeModuleDedup();
      unsubscribeStorageNormalization();
      unsubscribeHardening();
      unsubscribeOrchestrationBus();
    };
  }, []);

  const registry = buildMigrationRegistrySnapshot();
  const runtime = getMigrationRuntimeSnapshot();
  const domainGroups = getMigrationModulesByDomain();
  const storageOwnership = buildStorageOwnershipReport();
  const duplicationReport = buildDuplicationReport();
  const legacyBridge = buildLegacyAdapterReport();
  const orchestration = buildEnterpriseOrchestrationSnapshot();
  const certification = buildMigrationCertificationReport();
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

  const handleResetRuntimeStorage = () => {
    clearOwnedRuntimeStorage();
    toast.success("Runtime storage cleared");
    setRevision((value) => value + 1);
  };

  const handleClearDiagnostics = () => {
    clearRuntimeDiagnostics();
    setResilience(buildRuntimeResilienceSnapshot());
    toast.success("Runtime diagnostics cleared");
  };

  const handleClearModuleDedup = () => {
    clearModuleDedupSnapshot();
    setModuleDedup(buildModuleDedupSnapshot());
    toast.success("Dedup registry cleared");
    setRevision((value) => value + 1);
  };

  const handleNormalizeStorage = () => {
    setStorageNormalization(bootstrapStorageNormalizationLayer());
    toast.success("Storage normalization applied");
    setRevision((value) => value + 1);
  };

  const handleClearCorruptedStorage = () => {
    setStorageNormalization(clearCorruptedStorageEntries());
    toast.success("Corrupted storage entries cleared");
    setRevision((value) => value + 1);
  };

  const handleRunHardeningSuite = () => {
    setHardening(runRuntimeHardeningSuite());
    toast.success("Hardening suite completed");
    setRevision((value) => value + 1);
  };

  const handleClearHardeningSuite = () => {
    clearRuntimeHardeningSnapshot();
    setHardening(getRuntimeHardeningSnapshot());
    toast.success("Hardening suite snapshot cleared");
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
            <Button variant="outline" className="rounded-xl border-border/60" onClick={handleResetRuntimeStorage}>
              <Database className="mr-2 h-4 w-4" />
              Clear runtime storage
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

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Storage Ownership</h3>
            <p className="text-xs text-muted-foreground">Normalized runtime namespaces, owned keys, and reset-safe storage groups.</p>
          </div>
          <Badge variant="secondary" className="bg-primary/15 text-primary">
            {storageOwnership.length} namespaces
          </Badge>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {storageOwnership.map((namespace) => (
            <div key={namespace.namespace} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{namespace.label}</p>
                  <p className="text-[11px] text-muted-foreground">{namespace.namespace}</p>
                </div>
                <Badge variant="outline">{namespace.presentKeys.length}/{namespace.keys.length} present</Badge>
              </div>
              <div className="mt-3 space-y-2 text-xs">
                {namespace.keys.map((key) => (
                  <div key={key.key} className="flex items-center justify-between rounded-xl border border-border/50 bg-background/60 px-3 py-2">
                    <span className="truncate pr-2">{key.label}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{key.key}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{namespace.byteSize} bytes tracked</span>
                <span>{namespace.missingKeys.length} missing</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Storage Normalization</h3>
            <p className="text-xs text-muted-foreground">Alias repair and corruption detection for registry, settings, workspace, and migration persistence.</p>
          </div>
          <Badge
            variant="secondary"
            className={storageNormalization.status === "blocked" ? "bg-red-500/15 text-red-600" : storageNormalization.status === "watch" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}
          >
            {storageNormalization.status}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Namespaces", value: storageNormalization.summary.namespaces },
            { label: "Present keys", value: storageNormalization.summary.presentKeys },
            { label: "Missing keys", value: storageNormalization.summary.missingKeys },
            { label: "Corrupted", value: storageNormalization.summary.corruptedKeys },
            { label: "Collisions", value: storageNormalization.summary.collisions },
            { label: "Repairs", value: storageNormalization.summary.repairs },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Issues</p>
            <div className="mt-3 space-y-2">
              {storageNormalization.issues.length ? (
                storageNormalization.issues.slice(0, 6).map((issue) => (
                  <div key={`${issue.kind}:${issue.namespace}:${issue.key}`} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{issue.kind}</span>
                    <span className="mx-2">•</span>
                    <span>{issue.namespace}</span>
                    <span className="mx-2">•</span>
                    <span className="font-mono">{issue.key}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No storage normalization issues detected.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Controls</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleNormalizeStorage}>
                <Database className="mr-2 h-4 w-4" />
                Normalize storage
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleClearCorruptedStorage}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Clear corrupted keys
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Duplication Watch</h3>
            <p className="text-xs text-muted-foreground">Registry collisions, shared capability families, and duplicate storage keys.</p>
          </div>
          <Badge variant="secondary" className="bg-warning/15 text-warning">
            {duplicationReport.summary.totalFindings} findings
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Registry collisions", value: duplicationReport.summary.registryCollisions },
            { label: "Capability clusters", value: duplicationReport.summary.capabilityClusters },
            { label: "Storage duplicates", value: duplicationReport.summary.duplicateStorageKeys },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {duplicationReport.findings.length ? (
            duplicationReport.findings.map((finding) => (
              <div key={finding.title} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{finding.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{finding.detail}</p>
                  </div>
                  <Badge variant="outline">{finding.count}</Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No duplicate surfaces found in the current snapshot.</p>
          )}
        </div>
      </Card>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Module De-Duplication</h3>
            <p className="text-xs text-muted-foreground">Singleton listener installs and duplicate execution prevention across runtime bootstraps.</p>
          </div>
          <Badge variant="secondary" className={moduleDedup.totalPreventedDuplicates > 0 ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}>
            {moduleDedup.totalPreventedDuplicates} prevented
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: "Tracked modules", value: moduleDedup.totalEntries },
            { label: "Executions", value: moduleDedup.totalExecutions },
            { label: "Duplicates prevented", value: moduleDedup.totalPreventedDuplicates },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {([
            ["utility", "Utilities"],
            ["registry", "Registries"],
            ["state", "State"],
            ["renderer", "Renderers"],
            ["handler", "Handlers"],
          ] as const).map(([category, label]) => (
            <div key={category} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{moduleDedup.categories[category]}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={handleClearModuleDedup}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Clear dedup registry
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">Legacy Bridge</h3>
              <p className="text-xs text-muted-foreground">Compatibility aliases for routes, storage, and imported legacy state.</p>
            </div>
            <Badge variant="secondary" className="bg-primary/15 text-primary">
              {legacyBridge.eventAdapters} events
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Route aliases", value: legacyBridge.routeAliases },
              { label: "Storage aliases", value: legacyBridge.storageAliases },
              { label: "State adapters", value: legacyBridge.stateAdapters },
              { label: "Event adapters", value: legacyBridge.eventAdapters },
              { label: "API bridges", value: legacyBridge.apiBridges },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{legacyBridge.seededStorageAliases} seeded storage aliases</span>
            <span>{legacyBridge.mirroredLegacyEvents} mirrored legacy events</span>
          </div>
        </Card>

        <Card className="glass p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold">Enterprise Orchestration</h3>
              <p className="text-xs text-muted-foreground">Shell, registry, diagnostics, and storage coordination in one snapshot.</p>
            </div>
            <Badge variant="secondary" className={orchestration.health === "blocked" ? "bg-red-500/15 text-red-600" : orchestration.health === "watch" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}>
              {orchestration.health}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Modules", value: orchestration.summary.modules },
              { label: "Diagnostics", value: orchestration.summary.diagnostics },
              { label: "Patches ready", value: orchestration.summary.activePatches },
              { label: "Route aliases", value: orchestration.summary.routeAliases },
              { label: "ERP modules", value: orchestration.summary.erpModules },
              { label: "Signals", value: orchestration.summary.signals },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-display text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl border-border/60" onClick={() => {
              const snapshot = broadcastEnterpriseOrchestration("workspace", "Migration center workspace sync");
              setRevision((value) => value + 1);
              setOrchestrationSignal({
                scope: snapshot.summary.lastScope,
                reason: snapshot.summary.lastReason,
                signal: `${snapshot.summary.lastScope}:${snapshot.summary.signals}`,
              });
            }}>
              <Workflow className="mr-2 h-4 w-4" />
              Sync workspace
            </Button>
            <Button variant="outline" className="rounded-xl border-border/60" onClick={() => {
              const snapshot = broadcastEnterpriseOrchestration("registry", "Migration center registry sync");
              setRevision((value) => value + 1);
              setOrchestrationSignal({
                scope: snapshot.summary.lastScope,
                reason: snapshot.summary.lastReason,
                signal: `${snapshot.summary.lastScope}:${snapshot.summary.signals}`,
              });
            }}>
              <Database className="mr-2 h-4 w-4" />
              Sync registry
            </Button>
            <Button variant="outline" className="rounded-xl border-border/60" onClick={() => {
              const snapshot = broadcastEnterpriseOrchestration("diagnostics", "Migration center diagnostics sync");
              setRevision((value) => value + 1);
              setOrchestrationSignal({
                scope: snapshot.summary.lastScope,
                reason: snapshot.summary.lastReason,
                signal: `${snapshot.summary.lastScope}:${snapshot.summary.signals}`,
              });
            }}>
              <ShieldAlert className="mr-2 h-4 w-4" />
              Sync diagnostics
            </Button>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Last signal: {orchestrationSignal ? `${orchestrationSignal.scope} · ${orchestrationSignal.reason}` : `${orchestration.summary.lastScope} · ${orchestration.summary.lastReason}`}
            </span>
            <span>{orchestration.summary.syncTargets} sync targets</span>
          </div>
        </Card>
      </div>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Final Hardening</h3>
            <p className="text-xs text-muted-foreground">Memory, stress, import, accessibility, mobile, and rollback checks.</p>
          </div>
          <Badge variant="secondary" className={hardening.summary.overall === "blocked" ? "bg-red-500/15 text-red-600" : hardening.summary.overall === "watch" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}>
            {hardening.summary.overall}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { label: "Pass", value: hardening.summary.pass },
            { label: "Watch", value: hardening.summary.watch },
            { label: "Blocked", value: hardening.summary.blocked },
            { label: "Info", value: hardening.summary.info },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {hardening.checks.map((check) => (
            <div key={check.key} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{check.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{check.detail}</p>
                </div>
                <Badge variant="outline">{check.status}</Badge>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {[
            { label: "Samples", value: hardening.suite.samples },
            { label: "Avg collection ms", value: hardening.suite.averageCollectionMs.toFixed(1) },
            { label: "Max collection ms", value: hardening.suite.maxCollectionMs.toFixed(1) },
            { label: "Total collection ms", value: hardening.suite.collectionMs.toFixed(1) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Hardening suite</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Last run {hardening.suite.lastRunAt} · {hardening.summary.checks} checks evaluated for memory, runtime, stress, import, registry, mobile, accessibility, and rollback stability.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleRunHardeningSuite}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Run suite
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setHardening(getRuntimeHardeningSnapshot())}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh snapshot
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleClearHardeningSuite}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Clear suite snapshot
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Runtime Resilience</h3>
            <p className="text-xs text-muted-foreground">Recovery, retry, telemetry, and audit signals from the live runtime.</p>
          </div>
          <Badge
            variant="secondary"
            className={resilience.status === "blocked" ? "bg-red-500/15 text-red-600" : resilience.status === "watch" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}
          >
            {resilience.status}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {[
            { label: "Errors", value: resilience.summary.errors },
            { label: "Recoveries", value: resilience.summary.recoveries },
            { label: "Telemetry", value: resilience.summary.telemetry },
            { label: "Audits", value: resilience.summary.audits },
            { label: "Retries", value: resilience.summary.retries },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent sources</p>
            <div className="mt-3 space-y-2">
              {resilience.recentSources.length ? resilience.recentSources.map((source) => (
                <div key={source} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {source}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No resilience events recorded yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Controls</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" className="rounded-xl" onClick={handleClearDiagnostics}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear diagnostics
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setResilience(buildRuntimeResilienceSnapshot())}>
                <ShieldAlert className="mr-2 h-4 w-4" />
                Refresh snapshot
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-semibold">Migration Certification</h3>
            <p className="text-xs text-muted-foreground">Legacy inventory coverage, hardening status, and orchestration readiness.</p>
          </div>
          <Badge variant="secondary" className={certification.status === "blocked" ? "bg-red-500/15 text-red-600" : certification.status === "conditional" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}>
            {certification.status}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-5">
          {[
            { label: "Legacy coverage", value: `${Math.round(certification.summary.legacyCoverage * 100)}%` },
            { label: "Matched inventory", value: certification.summary.matchedLegacyInventory },
            { label: "Unmatched inventory", value: certification.summary.unmatchedLegacyInventory },
            { label: "Runtime flows", value: `${certification.summary.healthyRuntimeFlows}/${certification.summary.runtimeFlows}` },
            { label: "Rollback ready", value: certification.summary.rollbackReady },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border/60 bg-card/60 p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl border border-border/60 bg-card/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Completion matrix</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {certification.status === "certified"
                  ? "Certification is complete and the runtime is ready for release."
                  : certification.status === "conditional"
                    ? "Most runtime layers are aligned, but a few non-critical gaps remain."
                    : "Certification is blocked by runtime ownership, orchestration, or flow parity gaps."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className={certification.summary.blockers > 0 ? "bg-red-500/15 text-red-600" : "bg-emerald-500/15 text-emerald-700"}>
                {certification.summary.blockers} blockers
              </Badge>
              <Badge variant="secondary" className={certification.summary.orphanedSystems > 0 ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}>
                {certification.summary.orphanedSystems} orphaned systems
              </Badge>
              <Badge variant="secondary" className={certification.summary.duplicateRuntimeOwnership > 0 ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700"}>
                {certification.summary.duplicateRuntimeOwnership} ownership conflicts
              </Badge>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {[
              { label: "Legacy coverage", value: `${Math.round(certification.summary.legacyCoverage * 100)}%` },
              { label: "Flow parity", value: `${Math.round(certification.flowParity.coverage * 100)}%` },
              { label: "Orchestration parity", value: `${certification.orchestrationParity.healthy}/${certification.orchestrationParity.channels}` },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-display text-xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Flow parity</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {[
                { label: "Healthy", value: certification.flowParity.healthy },
                { label: "Watch", value: certification.flowParity.watch },
                { label: "Blocked", value: certification.flowParity.blocked },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="mt-1 font-display text-xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
              {Math.round(certification.flowParity.coverage * 100)}% runtime flow coverage · {certification.flowParity.status}
            </div>
            <div className="mt-3 space-y-2">
              {certification.flowParity.flows.map((flow) => (
                <div key={flow.key} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{flow.label}</p>
                    <Badge variant="outline">{flow.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{flow.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Orchestration parity</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { label: "Channels", value: certification.orchestrationParity.channels },
                { label: "Signals", value: certification.orchestrationParity.signals },
                { label: "Healthy", value: certification.orchestrationParity.healthy },
                { label: "Watch", value: certification.orchestrationParity.watch },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="mt-1 font-display text-xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
              {certification.orchestrationParity.syncTargets} sync targets tracked · {certification.orchestrationParity.status}
            </div>
            <div className="mt-3 space-y-2">
              {certification.evidence.slice(0, 3).map((item) => (
                <div key={item} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Blockers</p>
            <div className="mt-3 space-y-2">
              {certification.blockers.length ? certification.blockers.map((blocker) => (
                <div key={blocker} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {blocker}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No certification blockers remain.</p>
              )}
            </div>
            <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Duplicate runtime ownership</p>
            <div className="mt-3 space-y-2">
              {certification.duplicateRuntimeOwnership.length ? certification.duplicateRuntimeOwnership.map((item) => (
                <div key={item} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {item}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No duplicate runtime ownership remains.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Orphaned systems</p>
            <div className="mt-3 space-y-2">
              {certification.orphanedSystems.length ? certification.orphanedSystems.map((item) => (
                <div key={item} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {item}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No orphaned systems remain.</p>
              )}
            </div>
            <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">Evidence</p>
            <div className="mt-3 space-y-2">
              {certification.evidence.map((item) => (
                <div key={item} className="rounded-xl border border-border/50 bg-background/60 px-3 py-2 text-xs text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
