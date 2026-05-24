import { afterEach, describe, expect, it } from "vitest";
import {
  buildModuleDedupSnapshot,
  clearModuleDedupSnapshot,
  runSingletonEffect,
} from "./module-deduplication";

describe("module deduplication", () => {
  afterEach(() => {
    window.localStorage.clear();
    clearModuleDedupSnapshot();
  });

  it("prevents duplicate singleton execution and records the prevention", () => {
    let executions = 0;
    const first = runSingletonEffect("bootstrap:test", "Test bootstrap", "utility", () => {
      executions += 1;
      return "ready";
    });
    const second = runSingletonEffect("bootstrap:test", "Test bootstrap", "utility", () => {
      executions += 1;
      return "late";
    });

    const snapshot = buildModuleDedupSnapshot();

    expect(first).toBe("ready");
    expect(second).toBe("ready");
    expect(executions).toBe(1);
    expect(snapshot.totalEntries).toBe(1);
    expect(snapshot.totalExecutions).toBe(1);
    expect(snapshot.totalPreventedDuplicates).toBe(1);
    expect(snapshot.categories.utility).toBe(1);
  });
});
