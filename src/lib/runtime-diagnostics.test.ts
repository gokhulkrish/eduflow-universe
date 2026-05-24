import { afterEach, describe, expect, it } from "vitest";
import {
  clearRuntimeDiagnostics,
  getRuntimeDiagnostics,
  recordRuntimeDiagnostic,
  recordRuntimeError,
  recordRuntimeRecovery,
} from "./runtime-diagnostics";

describe("runtime diagnostics", () => {
  afterEach(() => {
    window.localStorage.clear();
    clearRuntimeDiagnostics();
  });

  it("records and clears diagnostics entries", () => {
    recordRuntimeDiagnostic({ kind: "telemetry", source: "test", message: "hello", detail: "world" });
    recordRuntimeError(new Error("boom"), "test");
    recordRuntimeRecovery("test", "reset");

    const snapshot = getRuntimeDiagnostics();
    expect(snapshot.entries.length).toBe(3);
    expect(snapshot.entries[0].kind).toBe("recovery");
    expect(snapshot.entries[1].kind).toBe("error");

    clearRuntimeDiagnostics();
    expect(getRuntimeDiagnostics().entries).toHaveLength(0);
  });
});

