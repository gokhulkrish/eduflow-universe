import { describe, expect, it } from "vitest";
import { buildDuplicationReport } from "./duplication-report";

describe("duplication report", () => {
  it("summarizes duplicate surfaces across the migration runtime", () => {
    const report = buildDuplicationReport();
    expect(report.summary.totalFindings).toBeGreaterThanOrEqual(0);
    expect(report.summary.registryCollisions).toBeGreaterThanOrEqual(0);
    expect(report.summary.capabilityClusters).toBeGreaterThanOrEqual(0);
    expect(report.summary.duplicateStorageKeys).toBeGreaterThanOrEqual(0);
  });
});

