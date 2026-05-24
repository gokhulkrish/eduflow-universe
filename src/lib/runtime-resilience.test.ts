import { afterEach, describe, expect, it } from "vitest";
import {
  buildRuntimeResilienceSnapshot,
  recordRuntimeAudit,
  recordRuntimeTelemetry,
  withRuntimeRetry,
} from "./runtime-resilience";
import { clearRuntimeDiagnostics, getRuntimeDiagnostics } from "./runtime-diagnostics";

describe("runtime resilience", () => {
  afterEach(() => {
    window.localStorage.clear();
    clearRuntimeDiagnostics();
  });

  it("records telemetry and audit signals", () => {
    recordRuntimeTelemetry("test", "Loaded", "ok");
    recordRuntimeAudit("test", "checkpoint", "audit trail");
    const snapshot = buildRuntimeResilienceSnapshot();

    expect(snapshot.summary.telemetry).toBe(2);
    expect(snapshot.summary.audits).toBe(1);
    expect(snapshot.status).toBe("healthy");
    expect(snapshot.recentSources[0]).toContain("telemetry:audit:test");
  });

  it("retries transient failures and records recovery", async () => {
    let attempts = 0;
    const result = await withRuntimeRetry(
      "test-operation",
      async () => {
        attempts += 1;
        if (attempts < 2) throw new Error("transient");
        return "ok";
      },
      { maxAttempts: 2, baseDelayMs: 0 },
    );

    expect(result).toBe("ok");
    expect(attempts).toBe(2);

    const snapshot = getRuntimeDiagnostics();
    expect(snapshot.entries.some((entry) => entry.kind === "recovery")).toBe(true);
    expect(snapshot.entries.some((entry) => entry.source === "retry:test-operation")).toBe(true);
  });
});
