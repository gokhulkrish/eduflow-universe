import { beforeEach, describe, expect, it } from "vitest";

import { buildMigrationCertificationReport, parseLegacyInventory } from "./migration-certification";

describe("migration certification", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("parses the legacy inventory module table", () => {
    const entries = parseLegacyInventory();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0]?.key).toBeTruthy();
  });

  it("builds a certification report with a status and coverage", () => {
    const report = buildMigrationCertificationReport();
    expect(["certified", "conditional", "blocked"]).toContain(report.status);
    expect(report.summary.legacyInventory).toBeGreaterThan(0);
    expect(report.flowParity.total).toBeGreaterThan(0);
    expect(report.orchestrationParity.channels).toBeGreaterThan(0);
    expect(report.rollbackReadiness.totalPatches).toBeGreaterThan(0);
    expect(Array.isArray(report.orphanedSystems)).toBe(true);
  });
});
