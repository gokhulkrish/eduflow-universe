import { buildDuplicationReport } from "./duplication-report";
import { getImportEngineRuntimeSnapshot } from "./import-engine/runtime";
import { getMigrationRuntimeSnapshot } from "./migrationRuntime";
import { getMobileShellSnapshot } from "./mobile-shell";
import { getRuntimeDiagnostics } from "./runtime-diagnostics";
import { buildStorageOwnershipReport } from "./storage-registry";
import { getShellRuntimeSnapshot } from "./shell-runtime";
import { emitAppSync, subscribeAppSync } from "./app-sync";
import { readStoredJson, removeStoredKey, writeStoredJson } from "./state-normalization";

export type RuntimeHardeningStatus = "pass" | "watch" | "blocked" | "info";

export interface RuntimeHardeningCheck {
  key: string;
  label: string;
  status: RuntimeHardeningStatus;
  detail: string;
}

export interface RuntimeHardeningSuiteSummary {
  samples: number;
  collectionMs: number;
  averageCollectionMs: number;
  maxCollectionMs: number;
  lastRunAt: string;
}

export interface RuntimeHardeningReport {
  generatedAt: string;
  suite: RuntimeHardeningSuiteSummary;
  summary: {
    checks: number;
    pass: number;
    watch: number;
    blocked: number;
    info: number;
    overall: RuntimeHardeningStatus;
  };
  metrics: {
    heapUsedMb: number | null;
    heapLimitMb: number | null;
    deviceMemoryGb: number | null;
    touchCapable: boolean;
    viewportWidth: number;
    viewportHeight: number;
  };
  checks: RuntimeHardeningCheck[];
}

export const RUNTIME_HARDENING_STORAGE_KEY = "sms.runtime.hardening.v1";
const RUNTIME_HARDENING_SYNC_KEYS = [RUNTIME_HARDENING_STORAGE_KEY];

function readHeapMetrics() {
  if (typeof performance === "undefined") {
    return { used: null as number | null, limit: null as number | null };
  }

  const memory = (performance as Performance & {
    memory?: { usedJSHeapSize?: number; jsHeapSizeLimit?: number };
  }).memory;

  if (!memory) return { used: null as number | null, limit: null as number | null };
  return {
    used: typeof memory.usedJSHeapSize === "number" ? memory.usedJSHeapSize / (1024 * 1024) : null,
    limit: typeof memory.jsHeapSizeLimit === "number" ? memory.jsHeapSizeLimit / (1024 * 1024) : null,
  };
}

function readDeviceMemory() {
  if (typeof navigator === "undefined") return null;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof memory === "number" ? memory : null;
}

function readReducedMotionPreference() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return null;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function determineOverallStatus(checks: RuntimeHardeningCheck[]): RuntimeHardeningStatus {
  if (checks.some((check) => check.status === "blocked")) return "blocked";
  if (checks.some((check) => check.status === "watch")) return "watch";
  return "pass";
}

function nowMs() {
  if (typeof performance !== "undefined" && typeof performance.now === "function") {
    return performance.now();
  }
  return Date.now();
}

function buildRuntimeHardeningChecks() {
  const diagnostics = getRuntimeDiagnostics();
  const duplication = buildDuplicationReport();
  const migration = getMigrationRuntimeSnapshot();
  const importRuntime = getImportEngineRuntimeSnapshot();
  const mobile = getMobileShellSnapshot();
  const shell = getShellRuntimeSnapshot();
  const storage = buildStorageOwnershipReport();
  const heap = readHeapMetrics();
  const deviceMemory = readDeviceMemory();
  const reducedMotion = readReducedMotionPreference();
  const runtimeErrors = diagnostics.entries.filter((entry) => entry.kind === "error");
  const unrecoverableErrors = runtimeErrors.filter((entry) => !entry.recoverable);

  const checks: RuntimeHardeningCheck[] = [
    heap.used == null
      ? {
          key: "memory-profile",
          label: "Memory profiling",
          status: "info",
          detail: "Browser heap metrics are unavailable in this environment.",
        }
      : {
          key: "memory-profile",
          label: "Memory profiling",
          status: heap.limit && heap.used / heap.limit > 0.8 ? "watch" : "pass",
          detail: `Heap use is ${heap.used.toFixed(1)} MB${heap.limit ? ` of ${heap.limit.toFixed(1)} MB` : ""}.`,
        },
    unrecoverableErrors.length > 0
      ? {
          key: "runtime-profile",
          label: "Runtime profiling",
          status: "blocked",
          detail: `${runtimeErrors.length} runtime errors are currently buffered.`,
        }
      : {
          key: "runtime-profile",
          label: "Runtime profiling",
          status: diagnostics.entries.length > 0 ? "watch" : "pass",
          detail: `${diagnostics.entries.length} diagnostic entries are buffered.`,
        },
    duplication.summary.registryCollisions > 0
      ? {
          key: "stress-test",
          label: "Stress testing",
          status: "blocked",
          detail: `${duplication.summary.registryCollisions} registry collision(s) still need attention.`,
        }
      : duplication.summary.duplicateStorageKeys > 0
        ? {
            key: "stress-test",
            label: "Stress testing",
            status: "watch",
            detail: `${duplication.summary.duplicateStorageKeys} duplicate storage key(s) were detected.`,
          }
        : {
            key: "stress-test",
            label: "Stress testing",
            status: "pass",
            detail: "No registry or storage collisions were detected.",
          },
    importRuntime.initError
      ? {
          key: "import-stress",
          label: "Import stress testing",
          status: "blocked",
          detail: importRuntime.initError,
        }
      : {
          key: "import-stress",
          label: "Import stress testing",
          status: importRuntime.cacheSize > 0 ? "watch" : "pass",
          detail: `${importRuntime.cacheSize} parse cache entr${importRuntime.cacheSize === 1 ? "y" : "ies"} tracked.`,
        },
    {
      key: "registry-scaling",
      label: "Registry scaling",
      status: migration.registry.totalModules > 0 && migration.registry.domains > 0 ? "pass" : "blocked",
      detail: `${migration.registry.totalModules} modules across ${migration.registry.domains} domains.`,
    },
    mobile.overflowLocked
      ? {
          key: "mobile-testing",
          label: "Mobile testing",
          status: "watch",
          detail: "A mobile overlay is currently locking background scroll.",
        }
      : {
          key: "mobile-testing",
          label: "Mobile testing",
          status: mobile.isMobile ? "watch" : "pass",
          detail: `${mobile.viewportWidth}x${mobile.viewportHeight} viewport detected.`,
        },
    reducedMotion == null
      ? {
          key: "accessibility-testing",
          label: "Accessibility testing",
          status: "info",
          detail: "Reduced-motion preference could not be inspected in this environment.",
        }
      : {
          key: "accessibility-testing",
          label: "Accessibility testing",
          status: reducedMotion ? "watch" : "pass",
          detail: reducedMotion ? "Reduced-motion mode is enabled for this session." : "Reduced-motion mode is not active.",
        },
    migration.summary.rollbackActive > 0
      ? {
          key: "rollback-testing",
          label: "Rollback testing",
          status: "watch",
          detail: `${migration.summary.rollbackActive} rollback(s) are currently armed.`,
        }
      : {
          key: "rollback-testing",
          label: "Rollback testing",
          status: "pass",
      detail: "No active rollbacks remain in the runtime registry.",
      },
  ];

  return {
    diagnostics,
    duplication,
    migration,
    importRuntime,
    mobile,
    shell,
    storage,
    heap,
    deviceMemory,
    reducedMotion,
    checks,
  };
}

function measureHardeningSuite(samples = 3): RuntimeHardeningSuiteSummary {
  const collectionDurations: number[] = [];
  const sampleCount = Math.max(1, samples);

  for (let index = 0; index < sampleCount; index += 1) {
    const startedAt = nowMs();
    buildRuntimeHardeningChecks();
    collectionDurations.push(Math.max(0, nowMs() - startedAt));
  }

  const collectionMs = collectionDurations.reduce((sum, value) => sum + value, 0);
  return {
    samples: sampleCount,
    collectionMs,
    averageCollectionMs: collectionMs / sampleCount,
    maxCollectionMs: Math.max(...collectionDurations),
    lastRunAt: new Date().toISOString(),
  };
}

function buildRuntimeHardeningSnapshot(): RuntimeHardeningReport {
  const snapshot = buildRuntimeHardeningChecks();
  const suite = measureHardeningSuite();

  const summary = {
    checks: snapshot.checks.length,
    pass: snapshot.checks.filter((check) => check.status === "pass").length,
    watch: snapshot.checks.filter((check) => check.status === "watch").length,
    blocked: snapshot.checks.filter((check) => check.status === "blocked").length,
    info: snapshot.checks.filter((check) => check.status === "info").length,
    overall: determineOverallStatus(snapshot.checks),
  } as const;

  return {
    generatedAt: new Date().toISOString(),
    suite,
    summary,
    metrics: {
      heapUsedMb: snapshot.heap.used,
      heapLimitMb: snapshot.heap.limit,
      deviceMemoryGb: snapshot.deviceMemory,
      touchCapable: snapshot.mobile.touchCapable,
      viewportWidth: snapshot.mobile.viewportWidth,
      viewportHeight: snapshot.mobile.viewportHeight,
    },
    checks: snapshot.checks,
  };
}

function readStoredReport(): Partial<RuntimeHardeningReport> {
  return readStoredJson<Partial<RuntimeHardeningReport>>(RUNTIME_HARDENING_STORAGE_KEY, {});
}

function persistReport(report: RuntimeHardeningReport) {
  if (typeof window === "undefined") return;
  writeStoredJson(RUNTIME_HARDENING_STORAGE_KEY, report);
  emitAppSync(RUNTIME_HARDENING_STORAGE_KEY);
}

export function buildRuntimeHardeningReport(): RuntimeHardeningReport {
  return buildRuntimeHardeningSnapshot();
}

export function getRuntimeHardeningSnapshot(): RuntimeHardeningReport {
  const stored = readStoredReport();
  if (Array.isArray(stored.checks) && stored.summary && stored.metrics && stored.suite) {
    return stored as RuntimeHardeningReport;
  }
  return buildRuntimeHardeningReport();
}

export function runRuntimeHardeningSuite(): RuntimeHardeningReport {
  const report = buildRuntimeHardeningReport();
  persistReport(report);
  return report;
}

export function clearRuntimeHardeningSnapshot(): void {
  removeStoredKey(RUNTIME_HARDENING_STORAGE_KEY);
  emitAppSync(RUNTIME_HARDENING_STORAGE_KEY);
}

export function subscribeRuntimeHardening(listener: () => void) {
  return subscribeAppSync(RUNTIME_HARDENING_SYNC_KEYS, listener);
}
