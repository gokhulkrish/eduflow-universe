import { describe, expect, it } from "vitest";

import {
  buildCutoverSnapshot,
  buildParitySummary,
  evaluateCutoverReadiness,
  parseParityStatus,
} from "./migration-controls";

describe("migration controls", () => {
  it("normalizes parity statuses safely", () => {
    expect(parseParityStatus("verified")).toBe("verified");
    expect(parseParityStatus("  RETIRED  ")).toBe("retired");
    expect(parseParityStatus("unknown")).toBeNull();
  });

  it("summarizes parity coverage and blockers", () => {
    const summary = buildParitySummary([
      {
        featureKey: "a",
        legacyModule: "legacy-a",
        newModule: "new-a",
        status: "verified",
        evidence: "test log",
        lastCheckedAt: "2026-05-24T00:00:00.000Z",
      },
      {
        featureKey: "b",
        legacyModule: "legacy-b",
        newModule: "new-b",
        status: "matched",
        lastCheckedAt: "2026-05-24T01:00:00.000Z",
      },
    ]);

    expect(summary.totalFeatures).toBe(2);
    expect(summary.completedFeatures).toBe(1);
    expect(summary.blockerCount).toBe(1);
    expect(summary.readyForCutover).toBe(false);
    expect(summary.blockers).toContain("b: matched");
  });

  it("requires freeze, fallback, dual-run, and full parity before promotion", () => {
    const summary = buildParitySummary([
      {
        featureKey: "a",
        legacyModule: "legacy-a",
        newModule: "new-a",
        status: "verified",
        evidence: "test log",
        lastCheckedAt: "2026-05-24T00:00:00.000Z",
      },
    ]);

    const readiness = evaluateCutoverReadiness(summary, {
      dualRunEnabled: true,
      newSystemPrimary: true,
      legacyFallbackEnabled: true,
      migrationFrozen: true,
    });

    expect(readiness.allowed).toBe(true);

    const blocked = evaluateCutoverReadiness(summary, {
      dualRunEnabled: false,
      newSystemPrimary: true,
      legacyFallbackEnabled: false,
      migrationFrozen: false,
    });

    expect(blocked.allowed).toBe(false);
    expect(blocked.reasons.length).toBeGreaterThan(0);
  });

  it("builds a cutover snapshot from persisted controls", () => {
    const summary = buildParitySummary([
      {
        featureKey: "a",
        legacyModule: "legacy-a",
        newModule: "new-a",
        status: "verified",
        evidence: "operator sign-off",
        lastCheckedAt: "2026-05-24T00:00:00.000Z",
      },
    ]);

    const snapshot = buildCutoverSnapshot("tenant-1", summary, {
      tenantId: "tenant-1",
      dualRunEnabled: true,
      newSystemPrimary: true,
      legacyFallbackEnabled: true,
      migrationFrozen: true,
      updatedAt: "2026-05-24T02:00:00.000Z",
      updatedBy: null,
    });

    expect(snapshot.state.tenantId).toBe("tenant-1");
    expect(snapshot.canPromote).toBe(true);
    expect(snapshot.checklist.some((item) => item.key === "primary")).toBe(true);
  });
});
