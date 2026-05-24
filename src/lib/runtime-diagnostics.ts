import { emitAppSync, subscribeAppSync } from "./app-sync";
import { runSingletonEffect } from "./module-deduplication";
import { readStoredJson, removeStoredKey, writeStoredJson } from "./state-normalization";

export type RuntimeDiagnosticKind = "error" | "rejection" | "schema" | "recovery" | "telemetry";

export interface RuntimeDiagnosticEntry {
  id: string;
  kind: RuntimeDiagnosticKind;
  source: string;
  message: string;
  detail: string;
  recoverable: boolean;
  ts: number;
}

export interface RuntimeDiagnosticSnapshot {
  updatedAt: string;
  entries: RuntimeDiagnosticEntry[];
}

export const RUNTIME_DIAGNOSTICS_STORAGE_KEY = "sms.runtime.diagnostics.v1";
const RUNTIME_DIAGNOSTICS_SYNC_KEYS = [RUNTIME_DIAGNOSTICS_STORAGE_KEY];

const MAX_ENTRIES = 24;
const isBrowser = () => typeof window !== "undefined";

const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

const normalizeEntry = (entry: Partial<RuntimeDiagnosticEntry> & Pick<RuntimeDiagnosticEntry, "kind" | "source" | "message">): RuntimeDiagnosticEntry => ({
  id: entry.id ?? makeId(),
  kind: entry.kind,
  source: entry.source,
  message: entry.message,
  detail: entry.detail ?? "",
  recoverable: entry.recoverable ?? true,
  ts: entry.ts ?? Date.now(),
});

const readStoredSnapshot = (): Partial<RuntimeDiagnosticSnapshot> => readStoredJson<Partial<RuntimeDiagnosticSnapshot>>(RUNTIME_DIAGNOSTICS_STORAGE_KEY, {});

export function getRuntimeDiagnostics(): RuntimeDiagnosticSnapshot {
  const stored = readStoredSnapshot();
  return {
    updatedAt: typeof stored.updatedAt === "string" ? stored.updatedAt : new Date().toISOString(),
    entries: Array.isArray(stored.entries) ? stored.entries.map((entry) => normalizeEntry(entry as RuntimeDiagnosticEntry)) : [],
  };
}

export function recordRuntimeDiagnostic(entry: Partial<RuntimeDiagnosticEntry> & Pick<RuntimeDiagnosticEntry, "kind" | "source" | "message">): RuntimeDiagnosticSnapshot {
  const current = getRuntimeDiagnostics();
  const next: RuntimeDiagnosticSnapshot = {
    updatedAt: new Date().toISOString(),
    entries: [normalizeEntry(entry), ...current.entries].slice(0, MAX_ENTRIES),
  };
  if (isBrowser()) {
    writeStoredJson(RUNTIME_DIAGNOSTICS_STORAGE_KEY, next);
    emitAppSync(RUNTIME_DIAGNOSTICS_STORAGE_KEY);
  }
  return next;
}

export function recordRuntimeError(error: unknown, source = "runtime", recoverable = true) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Unknown runtime error";
  const detail = error instanceof Error ? error.stack ?? "" : typeof error === "object" ? JSON.stringify(error, null, 2) : "";
  return recordRuntimeDiagnostic({ kind: "error", source, message, detail, recoverable });
}

export function recordRuntimeRejection(reason: unknown, source = "runtime") {
  const message = reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled rejection";
  const detail = reason instanceof Error ? reason.stack ?? "" : typeof reason === "object" ? JSON.stringify(reason, null, 2) : "";
  return recordRuntimeDiagnostic({ kind: "rejection", source, message, detail, recoverable: true });
}

export function recordRuntimeRecovery(source: string, message = "Recovery action executed", detail = "") {
  return recordRuntimeDiagnostic({ kind: "recovery", source, message, detail, recoverable: false });
}

export function clearRuntimeDiagnostics() {
  removeStoredKey(RUNTIME_DIAGNOSTICS_STORAGE_KEY);
  emitAppSync(RUNTIME_DIAGNOSTICS_STORAGE_KEY);
}

export function subscribeRuntimeDiagnostics(listener: () => void) {
  return subscribeAppSync(RUNTIME_DIAGNOSTICS_SYNC_KEYS, listener);
}

export function bootstrapRuntimeDiagnostics() {
  if (!isBrowser()) return getRuntimeDiagnostics();

  runSingletonEffect("bootstrap:runtime-diagnostics", "Runtime diagnostics listeners", "utility", () => {
    const handleError = (event: ErrorEvent) => {
      recordRuntimeError(event.error ?? event.message, "window:error", true);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      recordRuntimeRejection(event.reason, "window:unhandledrejection");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);
  });

  return getRuntimeDiagnostics();
}
