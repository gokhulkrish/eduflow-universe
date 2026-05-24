import type { ImportBatch, ImportPipelineState, ImportPreviewState } from "./types";
import { appendImportAuditTrace } from "./pipeline";

export type ImportValidationFindingKind = "blocker" | "warning" | "info";

export interface ImportValidationFinding {
  kind: ImportValidationFindingKind;
  code: string;
  title: string;
  detail: string;
  rowKey?: string;
  rowLabel?: string;
}

export interface ImportValidationReport {
  signature: string;
  batchId: string | null;
  batchName: string;
  status: "empty" | "healthy" | "warning" | "blocked";
  score: number;
  summary: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  reviewRows: number;
  duplicateRows: number;
  exactMatches: number;
  fuzzyMatches: number;
  internalDuplicates: number;
  blockerCount: number;
  warningCount: number;
  infoCount: number;
  findings: ImportValidationFinding[];
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function joinList(values: string[]): string {
  return values.filter(Boolean).join(" · ");
}

export function buildImportValidationReport(
  batch: ImportBatch | null,
  preview: ImportPreviewState | null,
): ImportValidationReport {
  if (!batch || !preview) {
    return {
      signature: "empty",
      batchId: batch?.batchId ?? null,
      batchName: batch?.batchName ?? "No batch",
      status: "empty",
      score: 0,
      summary: "Validation QA is waiting for a parsed file and preview.",
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      reviewRows: 0,
      duplicateRows: 0,
      exactMatches: 0,
      fuzzyMatches: 0,
      internalDuplicates: 0,
      blockerCount: 0,
      warningCount: 0,
      infoCount: 0,
      findings: [],
    };
  }

  const findings: ImportValidationFinding[] = [];

  for (const row of preview.rows) {
    const rowLabel = `${row.displayName || "Row"} (#${row.sourceRowIndex + 2})`;

    if (row.validationIssues.length > 0) {
      findings.push({
        kind: "blocker",
        code: `row:${row.rowKey}:validation`,
        title: "Validation issue",
        detail: joinList(row.validationIssues),
        rowKey: row.rowKey,
        rowLabel,
      });
    }

    if (row.duplicateStatus === "internal-duplicate") {
      findings.push({
        kind: "warning",
        code: `row:${row.rowKey}:duplicate`,
        title: "Internal duplicate",
        detail: "This row shares an identity key with another import row.",
        rowKey: row.rowKey,
        rowLabel,
      });
    }

    if (row.action === "review") {
      findings.push({
        kind: "warning",
        code: `row:${row.rowKey}:review`,
        title: "Review required",
        detail: row.matchReason || "Operator review required before commit.",
        rowKey: row.rowKey,
        rowLabel,
      });
    }
  }

  if (preview.summary.invalid > 0) {
    findings.push({
      kind: "blocker",
      code: "summary:invalid",
      title: "Invalid rows present",
      detail: `${preview.summary.invalid} row(s) still contain validation issues.`,
    });
  }

  if (preview.summary.reviews > 0) {
    findings.push({
      kind: "warning",
      code: "summary:review",
      title: "Review rows present",
      detail: `${preview.summary.reviews} row(s) need manual confirmation.`,
    });
  }

  if (preview.summary.internalDuplicates > 0) {
    findings.push({
      kind: "warning",
      code: "summary:internal-duplicates",
      title: "Internal duplicates detected",
      detail: `${preview.summary.internalDuplicates} row(s) are duplicated inside the import file.`,
    });
  }

  const blockerCount = findings.filter((finding) => finding.kind === "blocker").length;
  const warningCount = findings.filter((finding) => finding.kind === "warning").length;
  const infoCount = findings.filter((finding) => finding.kind === "info").length;
  const totalRows = preview.summary.total;
  const validRows = preview.summary.valid;
  const invalidRows = preview.summary.invalid;
  const reviewRows = preview.summary.reviews;
  const duplicateRows = preview.summary.internalDuplicates;
  const exactMatches = preview.summary.exactMatches;
  const fuzzyMatches = preview.summary.fuzzyMatches;
  const internalDuplicates = preview.summary.internalDuplicates;

  const baseScore = totalRows > 0 ? (validRows / totalRows) * 100 : 0;
  const score = clampScore(baseScore - blockerCount * 10 - warningCount * 4);
  const signatureFindings = findings
    .map((finding) => [finding.kind, finding.code, finding.rowKey ?? ""].join(":"))
    .join(";");

  let status: ImportValidationReport["status"] = "healthy";
  if (totalRows === 0) status = "empty";
  else if (blockerCount > 0) status = "blocked";
  else if (warningCount > 0) status = "warning";

  let summary: string;
  if (status === "empty") {
    summary = "No preview rows available yet.";
  } else if (status === "blocked") {
    summary = `Validation blocked: ${blockerCount} blocker(s), ${warningCount} warning(s).`;
  } else if (status === "warning") {
    summary = `Validation passed with warnings: ${warningCount} warning(s).`;
  } else {
    summary = "Validation passed with no blockers.";
  }

  return {
    signature: [
      batch.batchId,
      batch.batchName,
      totalRows,
      validRows,
      invalidRows,
      reviewRows,
      duplicateRows,
      exactMatches,
      fuzzyMatches,
      internalDuplicates,
      blockerCount,
      warningCount,
      signatureFindings,
    ].join("|"),
    batchId: batch.batchId,
    batchName: batch.batchName,
    status,
    score,
    summary,
    totalRows,
    validRows,
    invalidRows,
    reviewRows,
    duplicateRows,
    exactMatches,
    fuzzyMatches,
    internalDuplicates,
    blockerCount,
    warningCount,
    infoCount,
    findings,
  };
}

export function recordImportValidationAudit(
  pipeline: ImportPipelineState,
  report: ImportValidationReport,
): void {
  appendImportAuditTrace(pipeline, "validate", report.summary, {
    batchId: report.batchId,
    batchName: report.batchName,
    status: report.status,
    score: report.score,
    totalRows: report.totalRows,
    validRows: report.validRows,
    invalidRows: report.invalidRows,
    reviewRows: report.reviewRows,
    blockerCount: report.blockerCount,
    warningCount: report.warningCount,
    findings: report.findings.slice(0, 6).map((finding) => ({
      kind: finding.kind,
      code: finding.code,
      title: finding.title,
      rowLabel: finding.rowLabel ?? null,
    })),
  });
}
