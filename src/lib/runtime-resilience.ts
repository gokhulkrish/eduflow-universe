import { getRuntimeDiagnostics, recordRuntimeDiagnostic, recordRuntimeError, recordRuntimeRecovery, subscribeRuntimeDiagnostics } from "./runtime-diagnostics";

export type RuntimeResilienceStatus = "healthy" | "watch" | "blocked";

export interface RuntimeResilienceSnapshot {
  generatedAt: string;
  status: RuntimeResilienceStatus;
  summary: {
    errors: number;
    recoveries: number;
    telemetry: number;
    audits: number;
    retries: number;
    unrecoverableErrors: number;
  };
  recentSources: string[];
}

export interface RuntimeRetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  backoffFactor?: number;
}

const AUDIT_PREFIX = "audit:";
const RETRY_PREFIX = "retry:";
const TELEMETRY_PREFIX = "telemetry:";

const wait = (ms: number) => new Promise<void>((resolve) => globalThis.setTimeout(resolve, ms));
const formatDetail = (error: unknown) => {
  if (error instanceof Error) return error.stack ?? error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unserializable error";
  }
};

export function recordRuntimeTelemetry(source: string, message: string, detail = "") {
  return recordRuntimeDiagnostic({
    kind: "telemetry",
    source: `${TELEMETRY_PREFIX}${source}`,
    message,
    detail,
    recoverable: true,
  });
}

export function recordRuntimeAudit(source: string, action: string, detail = "") {
  return recordRuntimeDiagnostic({
    kind: "telemetry",
    source: `${AUDIT_PREFIX}${source}`,
    message: action,
    detail,
    recoverable: true,
  });
}

function getRetryDelay(baseDelayMs: number, backoffFactor: number, attempt: number) {
  const delay = baseDelayMs * Math.pow(backoffFactor, Math.max(0, attempt - 1));
  return Math.max(0, Math.round(delay));
}

export async function withRuntimeRetry<T>(
  source: string,
  operation: () => Promise<T>,
  options: RuntimeRetryOptions = {},
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 2);
  const baseDelayMs = Math.max(0, options.baseDelayMs ?? 150);
  const backoffFactor = Math.max(1, options.backoffFactor ?? 2);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await operation();
      if (attempt > 1) {
        recordRuntimeRecovery(source, "Recovered after retry", `Succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      recordRuntimeDiagnostic({
        kind: "telemetry",
        source: `${RETRY_PREFIX}${source}`,
        message: `Attempt ${attempt} failed`,
        detail: formatDetail(error),
        recoverable: attempt < maxAttempts,
      });

      if (attempt >= maxAttempts) {
        recordRuntimeError(error, source, false);
        throw error;
      }

      recordRuntimeAudit(source, "Retry scheduled", `Next attempt ${attempt + 1}`);
      await wait(getRetryDelay(baseDelayMs, backoffFactor, attempt));
    }
  }

  throw lastError;
}

export function buildRuntimeResilienceSnapshot(): RuntimeResilienceSnapshot {
  const diagnostics = getRuntimeDiagnostics();
  const errors = diagnostics.entries.filter((entry) => entry.kind === "error");
  const recoveries = diagnostics.entries.filter((entry) => entry.kind === "recovery");
  const telemetry = diagnostics.entries.filter((entry) => entry.kind === "telemetry");
  const audits = telemetry.filter((entry) => entry.source.startsWith(AUDIT_PREFIX));
  const retries = telemetry.filter((entry) => entry.source.startsWith(RETRY_PREFIX));
  const unrecoverableErrors = errors.filter((entry) => !entry.recoverable);

  const status: RuntimeResilienceStatus = unrecoverableErrors.length > 0
    ? "blocked"
    : errors.length > 0 || retries.length > 0 || recoveries.length > 0
      ? "watch"
      : "healthy";

  return {
    generatedAt: new Date().toISOString(),
    status,
    summary: {
      errors: errors.length,
      recoveries: recoveries.length,
      telemetry: telemetry.length,
      audits: audits.length,
      retries: retries.length,
      unrecoverableErrors: unrecoverableErrors.length,
    },
    recentSources: diagnostics.entries.slice(0, 5).map((entry) => `${entry.kind}:${entry.source}`),
  };
}

export function subscribeRuntimeResilience(listener: () => void) {
  return subscribeRuntimeDiagnostics(listener);
}
