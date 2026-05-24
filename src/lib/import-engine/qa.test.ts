import { describe, expect, it } from "vitest";
import { createImportPipelineState } from "./pipeline";
import { buildImportValidationReport, recordImportValidationAudit } from "./qa";

describe("import validation QA", () => {
  it("returns an empty report when preview data is missing", () => {
    const report = buildImportValidationReport(null, null);

    expect(report.status).toBe("empty");
    expect(report.score).toBe(0);
    expect(report.findings).toHaveLength(0);
  });

  it("aggregates blockers and warnings into a scored report", () => {
    const batch = {
      batchId: "batch-42",
      batchName: "Demo Batch",
    } as Parameters<typeof buildImportValidationReport>[0];

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
          duplicateStatus: "exact",
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
          duplicateGroupSize: 2,
          duplicateStatus: "internal-duplicate",
          validationIssues: [],
          existing: null,
          matchScore: 72,
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
    } as Parameters<typeof buildImportValidationReport>[1];

    const report = buildImportValidationReport(batch, preview);

    expect(report.status).toBe("blocked");
    expect(report.blockerCount).toBe(2);
    expect(report.warningCount).toBe(4);
    expect(report.score).toBe(14);
    expect(report.findings.map((finding) => finding.code)).toEqual(
      expect.arrayContaining([
        "row:row-1:validation",
        "row:row-2:duplicate",
        "row:row-2:review",
        "summary:invalid",
        "summary:review",
        "summary:internal-duplicates",
      ]),
    );
    expect(report.signature).toContain("Demo Batch");
    expect(report.signature).toContain("summary:invalid");
  });

  it("records a validation audit entry", () => {
    const batch = {
      batchId: "batch-42",
      batchName: "Demo Batch",
    } as Parameters<typeof buildImportValidationReport>[0];

    const preview = {
      rows: [],
      summary: {
        total: 0,
        valid: 0,
        invalid: 0,
        inserts: 0,
        updates: 0,
        skips: 0,
        reviews: 0,
        exactMatches: 0,
        fuzzyMatches: 0,
        internalDuplicates: 0,
      },
    } as Parameters<typeof buildImportValidationReport>[1];

    const report = buildImportValidationReport(batch, preview);
    const pipeline = createImportPipelineState();

    recordImportValidationAudit(pipeline, report);

    expect(pipeline.audit.trace).toHaveLength(1);
    expect(pipeline.audit.trace[0].step).toBe("validate");
    expect(pipeline.audit.trace[0].message).toBe(report.summary);
    expect(pipeline.audit.trace[0].extra).toMatchObject({
      batchId: "batch-42",
      batchName: "Demo Batch",
      status: "empty",
    });
  });
});
