import { beforeEach, describe, expect, it } from "vitest";
import { createImportPipelineState } from "./pipeline";
import { getRuntimeDiagnostics } from "@/lib/runtime-diagnostics";

beforeEach(() => {
  window.localStorage.clear();
});

describe("import validation runtime", () => {
  it("deduplicates repeated validation cycles and records diagnostics for blocked previews", async () => {
    const runtime = await import("./validation-runtime");

    const pipeline = createImportPipelineState();
    const batch = {
      batchId: "batch-1",
      batchName: "Import Batch",
      rowCount: 2,
      validCount: 1,
      errorCount: 1,
      previewCount: 2,
      previewRows: [],
    } as Parameters<typeof runtime.runImportValidationCycle>[1];

    const preview = {
      rows: [
        {
          sourceRowIndex: 0,
          rowKey: "row-1",
          sourceRow: {},
          mapped: {},
          customValues: {},
          displayName: "Alice",
          admissionNo: "A-1",
          identityKey: "A-1",
          duplicateGroupSize: 1,
          duplicateStatus: "none",
          validationIssues: ["Email is required"],
          existing: null,
          matchScore: 100,
          matchReason: "Exact match",
          defaultAction: "insert",
          action: "insert",
          diffSummary: [],
        },
        {
          sourceRowIndex: 1,
          rowKey: "row-2",
          sourceRow: {},
          mapped: {},
          customValues: {},
          displayName: "Bob",
          admissionNo: "A-2",
          identityKey: "A-2",
          duplicateGroupSize: 1,
          duplicateStatus: "internal-duplicate",
          validationIssues: [],
          existing: null,
          matchScore: 75,
          matchReason: "Manual review required",
          defaultAction: "review",
          action: "review",
          diffSummary: [],
        },
      ],
      summary: {
        total: 2,
        valid: 1,
        invalid: 1,
        inserts: 1,
        updates: 0,
        skips: 0,
        reviews: 1,
        exactMatches: 1,
        fuzzyMatches: 0,
        internalDuplicates: 1,
      },
    } as Parameters<typeof runtime.runImportValidationCycle>[2];

    const first = runtime.runImportValidationCycle(pipeline, batch, preview);
    const diagnosticsAfterFirst = getRuntimeDiagnostics();
    const second = runtime.runImportValidationCycle(pipeline, batch, preview);
    const diagnosticsAfterSecond = getRuntimeDiagnostics();

    expect(first.report.status).toBe("blocked");
    expect(first.snapshot.stability).toBe("blocked");
    expect(first.audited).toBe(true);
    expect(first.diagnosed).toBe(true);
    expect(pipeline.audit.trace.some((entry) => entry.step === "validate")).toBe(true);
    expect(diagnosticsAfterFirst.entries.length).toBeGreaterThan(0);
    expect(second.audited).toBe(false);
    expect(second.diagnosed).toBe(false);
    expect(diagnosticsAfterSecond.entries.length).toBe(diagnosticsAfterFirst.entries.length);
  });

  it("records a recovery diagnostic when validation returns to healthy", async () => {
    const runtime = await import("./validation-runtime");

    const pipeline = createImportPipelineState();
    const blockedBatch = {
      batchId: "batch-2",
      batchName: "Recoverable Batch",
      rowCount: 1,
      validCount: 0,
      errorCount: 1,
      previewCount: 1,
      previewRows: [],
    } as Parameters<typeof runtime.runImportValidationCycle>[1];

    const blockedPreview = {
      rows: [
        {
          sourceRowIndex: 0,
          rowKey: "row-1",
          sourceRow: {},
          mapped: {},
          customValues: {},
          displayName: "Alice",
          admissionNo: "A-1",
          identityKey: "A-1",
          duplicateGroupSize: 1,
          duplicateStatus: "none",
          validationIssues: ["Email is required"],
          existing: null,
          matchScore: 100,
          matchReason: "Exact match",
          defaultAction: "insert",
          action: "insert",
          diffSummary: [],
        },
      ],
      summary: {
        total: 1,
        valid: 0,
        invalid: 1,
        inserts: 1,
        updates: 0,
        skips: 0,
        reviews: 0,
        exactMatches: 0,
        fuzzyMatches: 0,
        internalDuplicates: 0,
      },
    } as Parameters<typeof runtime.runImportValidationCycle>[2];

    const healthyBatch = {
      batchId: "batch-2",
      batchName: "Recoverable Batch",
      rowCount: 1,
      validCount: 1,
      errorCount: 0,
      previewCount: 1,
      previewRows: [],
    } as Parameters<typeof runtime.runImportValidationCycle>[1];

    const healthyPreview = {
      rows: [
        {
          sourceRowIndex: 0,
          rowKey: "row-1",
          sourceRow: {},
          mapped: {},
          customValues: {},
          displayName: "Alice",
          admissionNo: "A-1",
          identityKey: "A-1",
          duplicateGroupSize: 1,
          duplicateStatus: "none",
          validationIssues: [],
          existing: null,
          matchScore: 100,
          matchReason: "Exact match",
          defaultAction: "insert",
          action: "insert",
          diffSummary: [],
        },
      ],
      summary: {
        total: 1,
        valid: 1,
        invalid: 0,
        inserts: 1,
        updates: 0,
        skips: 0,
        reviews: 0,
        exactMatches: 1,
        fuzzyMatches: 0,
        internalDuplicates: 0,
      },
    } as Parameters<typeof runtime.runImportValidationCycle>[2];

    runtime.runImportValidationCycle(pipeline, blockedBatch, blockedPreview);
    const beforeRecovery = getRuntimeDiagnostics().entries.length;
    const recovered = runtime.runImportValidationCycle(pipeline, healthyBatch, healthyPreview);
    const afterRecovery = getRuntimeDiagnostics().entries.length;

    expect(recovered.report.status).toBe("healthy");
    expect(recovered.snapshot.stability).toBe("stable");
    expect(afterRecovery).toBeGreaterThan(beforeRecovery);
  });
});
