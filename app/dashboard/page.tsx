'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarClock,
  ChevronRight,
  LayoutDashboard,
  Plus,
  RefreshCw,
  School2,
  Sparkles,
  Users2,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';

import { ModuleCardShell } from '../../components/modules/shared';
import { designSystem, joinClasses } from '../../styles/design-system';
import { primaryModuleDomains, primaryModules, type ModuleDefinition } from '../../lib/module-registry';
import { subscribeToModuleCounts, type ModuleCountSnapshot } from '../../lib/realtime';
import { buildErpWorkspaceUrl, resolveErpModuleRoute } from '@/lib/erp-workspace';
import { useErpWorkspace } from '@/stores/erpWorkspace';
import { useIsMobile } from '@/hooks/use-mobile';

type SnapshotMap = Record<string, ModuleCountSnapshot>;
type TrendMap = Record<string, number[]>;

const IST_TIME_ZONE = 'Asia/Kolkata';
const SCHOOL_NAME = 'Eduflow Universe';

function nowInIstLabel(date: Date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIME_ZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}

function buildSnapshotMap(modules: ModuleDefinition[]) {
  return modules.reduce<SnapshotMap>((acc, module) => {
    acc[module.key] = {
      moduleKey: module.key,
      count: 0,
      updatedAt: new Date().toISOString(),
    };
    return acc;
  }, {});
}

function buildTrendSeed(module: ModuleDefinition, index: number) {
  const base = Math.max(1, module.submodules.length + module.fields.length + index);
  return Array.from({ length: 7 }, (_, day) => Math.max(1, (base + day * (index % 3 + 1)) % 18 + 1));
}

function buildTrendMap(modules: ModuleDefinition[]) {
  return modules.reduce<TrendMap>((acc, module, index) => {
    acc[module.key] = buildTrendSeed(module, index);
    return acc;
  }, {});
}

function StatCard({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'accent';
}) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
        : tone === 'accent'
          ? 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200'
          : 'border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200';

  return (
    <div className={joinClasses('rounded-[18px] border p-4 shadow-sm', toneClass)}>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.1em] opacity-70">{label}</div>
          <div className="text-2xl font-semibold text-slate-950 dark:text-slate-50">{value}</div>
        </div>
        <div className="rounded-full border border-current/15 p-2">{icon}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [clock, setClock] = useState(() => nowInIstLabel(new Date()));
  const [snapshots, setSnapshots] = useState<SnapshotMap>(() => buildSnapshotMap(primaryModules));
  const [trendMap, setTrendMap] = useState<TrendMap>(() => buildTrendMap(primaryModules));
  const [activeModule, setActiveModule] = useState<string>(primaryModules[0]?.key || 'home');
  const router = useRouter();
  const erpState = useErpWorkspace((state) => state.state);
  const hydrateErpWorkspace = useErpWorkspace((state) => state.hydrate);
  const switchErpModule = useErpWorkspace((state) => state.switchModule);
  const isMobile = useIsMobile();

  useEffect(() => {
    const tick = window.setInterval(() => setClock(nowInIstLabel(new Date())), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    void hydrateErpWorkspace();
  }, [hydrateErpWorkspace]);

  useEffect(() => {
    if (erpState.activeModule) {
      setActiveModule(erpState.activeModule);
    }
  }, [erpState.activeModule]);

  useEffect(() => {
    const subscriptions = primaryModules.map(module =>
      subscribeToModuleCounts({
        module,
        onCount: snapshot => {
          setSnapshots(prev => ({ ...prev, [module.key]: snapshot }));
          setTrendMap(prev => {
            const current = prev[module.key] ?? buildTrendSeed(module, primaryModules.indexOf(module));
            const nextSeries = [...current, snapshot.count].slice(-7);
            return { ...prev, [module.key]: nextSeries };
          });
        },
        onError: error => {
          toast.error(error instanceof Error ? error.message : `Realtime issue on ${module.label}`);
        },
      }),
    );

    return () => {
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  }, []);

  const metrics = useMemo(() => {
    const live = primaryModules.filter(module => (snapshots[module.key]?.count ?? 0) > 0).length;
    const needsWiring = primaryModules.filter(module => module.status === 'needs-wiring').length;
    const comingSoon = primaryModules.filter(module => module.status === 'coming-soon').length;
    return { live, needsWiring, comingSoon };
  }, [snapshots]);

  const recentModules = useMemo(
    () =>
      [...primaryModules]
        .map(module => ({ module, updatedAt: snapshots[module.key]?.updatedAt ?? new Date().toISOString() }))
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 6),
    [snapshots],
  );

  function focusModule(module: ModuleDefinition) {
    setActiveModule(module.key);
    const target = document.getElementById(`module-${module.key}`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function launchModule(module: ModuleDefinition) {
    const workspaceKey =
      erpState.activeModule === module.key
        ? erpState.activeWorkspaceKey
        : module.workspaceKey || module.submodules[0] || 'overview';
    const tabKey = erpState.activeModule === module.key ? erpState.activeTab : undefined;
    const url = await switchErpModule(module.key, workspaceKey, tabKey, 'dashboard-launch');
    const target = buildErpWorkspaceUrl(module.key, workspaceKey) ?? resolveErpModuleRoute(module.key);
    setActiveModule(module.key);
    const destination = url ?? target;
    if (destination) {
      router.push(destination);
      toast.message(`Opening ${module.label}`, {
        description: `${workspaceKey} workspace restored from the ERP state cache.`,
      });
    } else {
      toast.message(`Stored ${module.label}`, {
        description: 'This module does not yet have a route target, so the shell state was updated in place.',
      });
    }
  }

  function notify(action: string, module: ModuleDefinition) {
    toast.message(`${action} ${module.label}`, {
      description: `Keeping ${module.label} in the live dashboard loop.`,
    });
  }

  return (
    <main
      data-mobile-shell={isMobile ? 'on' : 'off'}
      className={joinClasses(designSystem.classNames.shell.page, 'mobile-collision-surface min-h-[100dvh] bg-slate-50 text-slate-950 dark:bg-slate-975 dark:text-slate-50')}
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1800px] flex-col gap-5 px-4 py-4 lg:px-6">
        <header className={joinClasses(designSystem.classNames.shell.panelStrong, 'flex flex-col gap-4 p-4 lg:p-5')}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-800 dark:bg-slate-950">
                  <School2 className="h-3.5 w-3.5" />
                  {SCHOOL_NAME}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-800 dark:bg-slate-950">
                  <CalendarClock className="h-3.5 w-3.5" />
                  IST {clock}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 md:text-3xl">
                  Global monitor dashboard
                </h1>
                <p className="max-w-4xl text-sm text-slate-600 dark:text-slate-300">
                  Every module is visible here with a live count, a trend slice, and the quick actions teams expect when they are moving fast.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => toast.success('Dashboard refresh requested')}
                className={designSystem.classNames.button.secondary}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button type="button" onClick={() => toast.message('Alerts reviewed')} className={designSystem.classNames.button.secondary}>
                <Bell className="h-4 w-4" />
                Notifications
              </button>
              <button type="button" onClick={() => toast.success('New module draft started')} className={designSystem.classNames.button.primary}>
                <Plus className="h-4 w-4" />
                Add module
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                ED
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Modules" value={String(primaryModules.length)} icon={<LayoutDashboard className="h-4 w-4" />} tone="accent" />
            <StatCard label="Live modules" value={String(metrics.live)} icon={<Sparkles className="h-4 w-4" />} tone="success" />
            <StatCard label="Needs wiring" value={String(metrics.needsWiring)} icon={<WifiOff className="h-4 w-4" />} tone="warning" />
            <StatCard label="Coming soon" value={String(metrics.comingSoon)} icon={<AlertTriangle className="h-4 w-4" />} />
          </div>
        </header>

        <div className="grid flex-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className={joinClasses(designSystem.classNames.shell.panelStrong, 'sticky top-4 flex h-fit flex-col gap-4 p-4')}>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Navigation</div>
              <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">Module domains</h2>
            </div>

            <div className="space-y-3">
              {primaryModuleDomains.map(domain => (
                <button
                  key={domain.label}
                  type="button"
                  onClick={() => {
                    const first = domain.modules[0];
                    if (first) focusModule(first);
                  }}
                  className={joinClasses(
                    'flex w-full items-center justify-between rounded-[16px] border px-3 py-3 text-left transition',
                    activeModule && domain.modules.some(module => module.key === activeModule)
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-900 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-100'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200 dark:hover:border-slate-700',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{domain.label}</span>
                    <span className="block text-xs text-slate-500 dark:text-slate-400">{domain.modules.length} modules</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
                </button>
              ))}
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                <Activity className="h-4 w-4 text-indigo-500" />
                Realtime summary
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Snapshots seen</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{Object.keys(snapshots).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active module</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{activeModule}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Transport</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">Supabase channel</span>
                </div>
              </div>
            </div>
          </aside>

          <section className="min-w-0 space-y-5">
            {primaryModuleDomains.map(domain => (
              <section key={domain.label} className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{domain.label}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{domain.modules.length} modules staged in this workspace lane</p>
                  </div>
                  <span className={designSystem.classNames.badge.live}>{domain.modules.length} ready</span>
                </div>

                <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
                  {domain.modules.map((module, index) => {
                    const snapshot = snapshots[module.key];
                    const trend = trendMap[module.key] ?? buildTrendSeed(module, index);
                    return (
                      <div key={module.key} id={`module-${module.key}`} className="scroll-mt-6">
                        <ModuleCardShell
                          definition={module}
                          count={snapshot?.count ?? 0}
                          trend={trend}
                          onAdd={current => notify('Add', current)}
                          onOpen={current => void launchModule(current)}
                          onAlert={current => notify('Alert for', current)}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </section>

          <aside className={joinClasses(designSystem.classNames.shell.panelStrong, 'sticky top-4 flex h-fit flex-col gap-4 p-4')}>
            <div>
              <div className="text-xs uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">Right panel</div>
              <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">Live context</h2>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                <Users2 className="h-4 w-4 text-indigo-500" />
                Latest updates
              </div>
              <div className="mt-3 space-y-2">
                {recentModules.map(({ module, updatedAt }) => (
                  <button
                    key={module.key}
                    type="button"
                    onClick={() => focusModule(module)}
                    className="flex w-full items-center justify-between rounded-[14px] border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-50">{module.label}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {new Date(updatedAt).toLocaleTimeString('en-IN', {
                          timeZone: IST_TIME_ZONE,
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                <School2 className="h-4 w-4 text-indigo-500" />
                School status
              </div>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Current school</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{SCHOOL_NAME}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Timezone</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">{IST_TIME_ZONE}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Theme source</span>
                  <span className="font-medium text-slate-900 dark:text-slate-50">design-system.ts</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => toast.success('Module drawer opened')} className={designSystem.classNames.button.primary}>
                <Plus className="h-4 w-4" />
                Add
              </button>
              <button type="button" onClick={() => toast.message('Health check reviewed')} className={designSystem.classNames.button.secondary}>
                <Sparkles className="h-4 w-4" />
                Check
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
