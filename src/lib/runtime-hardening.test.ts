import { afterEach, describe, expect, it } from "vitest";

import { buildRuntimeHardeningReport, clearRuntimeHardeningSnapshot, runRuntimeHardeningSuite } from "./runtime-hardening";

describe("runtime hardening", () => {
  afterEach(() => {
    window.localStorage.clear();
    clearRuntimeHardeningSnapshot();
  });

  it("builds a hardening report with expected checks", () => {
    const report = buildRuntimeHardeningReport();
    expect(report.checks.length).toBeGreaterThan(0);
    expect(report.summary.checks).toBe(report.checks.length);
    expect(report.suite.samples).toBeGreaterThan(0);
  });

  it("runs and stores a hardening suite snapshot", () => {
    const report = runRuntimeHardeningSuite();
    expect(report.suite.averageCollectionMs).toBeGreaterThanOrEqual(0);
    expect(window.localStorage.getItem("sms.runtime.hardening.v1")).toContain("suite");
  });
});
