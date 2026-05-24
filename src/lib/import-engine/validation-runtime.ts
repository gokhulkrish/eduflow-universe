import "@/lib/runtime-storage";
import { emitAppSync, subscribeAppSync } from "@/lib/app-sync";
import { recordRuntimeDiagnostic, recordRuntimeRecovery } from "@/lib/runtime-diagnostics";
import { appendImportAuditTrace } from "./pipeline";
import { buildImportValidationReport, recordImportValidationAudit } from "./qa";
import type { ImportBatch, ImportPipelineState, ImportPreviewState } from "./types";
import type { ImportValidationReport } from "./qa";

export const IMPORT_VALIDATION_RUNTIME_STORAGE_KEY = "sms.import.validation-runtime.v1";
const IMPORT_VALIDATION_RUNTIME_SYNC_KEYS = [IMPORT_VALIDATION_RUNTIME_STORAGE_KEY];

type StoredValidationRuntimeSnapshot = Partial<ImportValidationRuntimeSnapshot>;

export interface ImportValidationRuntimeSnapshot {
  updatedAt: string;
  cycleSignature: string;
  reportSignature: string;
  status: ImportValidationReport["status"];
  score: number;
  summary: string;
  lastRunAt: string | null;
  lastAuditedAt: string | null;
  lastDiagnosticAt: string | null;
  stability: "stable" | "watch" | "blocked";
  integrityNotes: string[];
}

export interface RunImportValidationOptions {
  force?: boolean;
}

export interface RunImportValidationResult {
  report: ImportValidationReport;
  snapshot: ImportValidationRuntimeSnapshot;
  audited: boolean;
  diagnosed: boolean;
}

const readStoredJson = <T,>(key: string, fallback: T): T => {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeStoredJson = (key: string, value: unknown) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeStoredKey = (key: string) => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
};

const clean = (value: unknown) => String(value ?? "").trim();

const buildIntegrityNotes = (batch: ImportBatch | null, preview: ImportPreviewState | null): string[] => {
  if (!batch || !preview) return [];

  const notes: string[] = [];
  if (batch.rowCount !== preview.summary.total) {
    notes.push(`Batch row count (${batch.rowCount}) does not match preview row count (${preview.summary.total}).`);
  }
  if (batch.previewRows.length && batch.previewRows.length !== preview.rows.length) {
    notes.push(`Batch preview rows (${batch.previewRows.length}) do not match current preview rows (${preview.rows.length}).`);
  }
  if (batch.validCount && batch.validCount !== preview.summary.valid) {
    notes.push(`Valid row count drifted from ${batch.validCount} to ${preview.summary.valid}.`);
  }
  if (batch.errorCount && batch.errorCount !== preview.summary.invalid) {
    notes.push(`Invalid row count drifted from ${batch.errorCount} to ${preview.summary.invalid}.`);
  }
  if (batch.previewCount && batch.previewCount !== preview.summary.total) {
    notes.push(`Preview count (${batch.previewCount}) is stale for the current preview.`);
  }

  return notes;
};

const determineStability = (
  report: ImportValidationReport,
  integrityNotes: string[],
): ImportValidationRuntimeSnapshot["stability"] => {
  if (report.status === "blocked") return "blocked";
  if (report.status === "warning" || integrityNotes.length > 0) return "watch";
  return "stable";
};

const makeCycleSignature = (report: ImportValidationReport, integrityNotes: string[]) =>
  [
    report.signature,
    report.status,
    report.score,
    integrityNotes.join("||"),
  ].join("|");

function normalizeSnapshot(input: StoredValidationRuntimeSnapshot): ImportValidationRuntimeSnapshot {
  const updatedAt = clean(input.updatedAt) || new Date().toISOString();
  return {
    updatedAt,
    cycleSignature: clean(input.cycleSignature),
    reportSignature: clean(input.reportSignature),
    status:
      input.status === "empty" || input.status === "healthy" || input.status === "warning" || input.status === "blocked"
        ? input.status
        : "empty",
    score: Math.max(0, Math.min(100, Number(input.score) || 0)),
    summary: clean(input.summary),
    lastRunAt: clean(input.lastRunAt) || null,
    lastAuditedAt: clean(input.lastAuditedAt) || null,
    lastDiagnosticAt: clean(input.lastDiagnosticAt) || null,
    stability:
      input.stability === "blocked" || input.stability === "watch" || input.stability === "stable"
        ? input.stability
        : "stable",
    integrityNotes: Array.isArray(input.integrityNotes) ? input.integrityNotes.map(clean).filter(Boolean) : [],
  };
}

function persistSnapshot(snapshot: ImportValidationRuntimeSnapshot): ImportValidationRuntimeSnapshot {
  writeStoredJson(IMPORT_VALIDATION_RUNTIME_STORAGE_KEY, snapshot);
  emitAppSync(IMPORT_VALIDATION_RUNTIME_STORAGE_KEY);
  return snapshot;
}

export function getImportValidationRuntimeSnapshot(): ImportValidationRuntimeSnapshot {
  return normalizeSnapshot(readStoredJson<StoredValidationRuntimeSnapshot>(IMPORT_VALIDATION_RUNTIME_STORAGE_KEY, {}));
}

export function subscribeImportValidationRuntime(listener: () => void): () => void {
  return subscribeAppSync(IMPORT_VALIDATION_RUNTIME_SYNC_KEYS, listener);
}

export function clearImportValidationRuntime(): void {
  removeStoredKey(IMPORT_VALIDATION_RUNTIME_STORAGE_KEY);
  emitAppSync(IMPORT_VALIDATION_RUNTIME_STORAGE_KEY);
}

export function getImportValidationIntegrityNotes(
  batch: ImportBatch | null,
  preview: ImportPreviewState | null,
): string[] {
  return buildIntegrityNotes(batch, preview);
}

export function runImportValidationCycle(
  pipeline: ImportPipelineState,
  batch: ImportBatch | null,
  preview: ImportPreviewState | null,
  options: RunImportValidationOptions = {},
): RunImportValidationResult {
  const current = getImportValidationRuntimeSnapshot();
  const report = buildImportValidationReport(batch, preview);
  const integrityNotes = buildIntegrityNotes(batch, preview);
  const cycleSignature = makeCycleSignature(report, integrityNotes);

  if (!options.force && current.cycleSignature === cycleSignature) {
    return {
      report,
      snapshot: current,
      audited: false,
      diagnosed: false,
    };
  }

  const now = new Date().toISOString();
  const snapshot: ImportValidationRuntimeSnapshot = {
    updatedAt: now,
    cycleSignature,
    reportSignature: report.signature,
    status: report.status,
    score: report.score,
    summary: report.summary,
    lastRunAt: now,
    lastAuditedAt: current.reportSignature !== report.signature ? now : current.lastAuditedAt,
    lastDiagnosticAt: current.status !== report.status || integrityNotes.length > 0 ? now : current.lastDiagnosticAt,
    stability: determineStability(report, integrityNotes),
    integrityNotes,
  };

  const shouldAudit = report.status !== "empty" && current.reportSignature !== report.signature;
  if (shouldAudit) {
    recordImportValidationAudit(pipeline, report);
  } else if (report.status === "empty") {
    appendImportAuditTrace(pipeline, "validate", "validation-waiting", {
      batchId: report.batchId,
      batchName: report.batchName,
    });
  }

  const shouldDiagnose = report.status !== "empty" && (current.status !== report.status || integrityNotes.length > 0);
  if (shouldDiagnose) {
    const detailLines = [
      report.summary,
      integrityNotes.length ? `Integrity notes: ${integrityNotes.join(" | ")}` : "",
    ].filter(Boolean);
    if (report.status === "healthy" && current.status !== "healthy") {
      recordRuntimeRecovery("import:validation", "Validation returned to a healthy state", detailLines.join("\n"));
    } else {
      recordRuntimeDiagnostic({
        kind: report.status === "blocked" ? "schema" : "telemetry",
        source: "import:validation",
        message: report.summary,
        detail: detailLines.join("\n"),
        recoverable: report.status !== "blocked",
      });
    }
  }

  persistSnapshot(snapshot);

  return {
    report,
    snapshot,
    audited: shouldAudit,
    diagnosed: shouldDiagnose,
  };
}
