import type {
  ParsedImportFile,
  ImportPreviewState,
  ImportPreviewRow,
  ImportModuleFieldGroup,
  ImportResolvedAction,
  ImportMatchStatus,
} from "./types";

function deriveMappedRow(
  sourceRow: Record<string, string>,
  mapping: Record<string, string>,
): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [header, target] of Object.entries(mapping)) {
    if (target && target !== "ignore") {
      const value = sourceRow[header] ?? "";
      if (value) {
        mapped[target] = mapped[target]
          ? `${mapped[target]}, ${value}`
          : value;
      }
    }
  }
  return mapped;
}

function validateRequiredFields(
  mapped: Record<string, string>,
  fieldGroups: ImportModuleFieldGroup[],
): string[] {
  const issues: string[] = [];
  for (const group of fieldGroups) {
    for (const field of group.fields) {
      if (field.required && !mapped[field.key]?.trim()) {
        issues.push(`${field.label} is required`);
      }
    }
  }
  return issues;
}

function findDisplayName(
  mapped: Record<string, string>,
  fieldGroups: ImportModuleFieldGroup[],
  index: number,
): string {
  for (const group of fieldGroups) {
    for (const field of group.fields) {
      const value = mapped[field.key]?.trim();
      if (value && value.length > 1) return value;
    }
  }
  const firstValue = Object.values(mapped).find((v) => v?.trim() && v.length > 1);
  return firstValue || `Row ${index + 2}`;
}

export function buildGenericPreview(
  parsed: ParsedImportFile,
  mapping: Record<string, string>,
  fieldGroups: ImportModuleFieldGroup[],
  customFields: { id: string; label: string; key: string }[],
): ImportPreviewState {
  const rows: ImportPreviewRow[] = parsed.rows.map((sourceRow, index) => {
    const mapped = deriveMappedRow(sourceRow, mapping);
    const customValues: Record<string, string> = {};
    for (const cf of customFields) {
      const customKey = `custom:${cf.id}`;
      const header = Object.entries(mapping).find(([, v]) => v === customKey)?.[0];
      if (header) customValues[cf.id] = sourceRow[header] ?? "";
    }
    const displayName = findDisplayName(mapped, fieldGroups, index);
    const validationIssues = validateRequiredFields(mapped, fieldGroups);

    return {
      sourceRowIndex: index,
      rowKey: String(index),
      sourceRow,
      mapped,
      customValues,
      displayName,
      admissionNo: mapped.admissionNo || "",
      identityKey: displayName,
      duplicateGroupSize: 0,
      duplicateStatus: "none" as ImportMatchStatus,
      validationIssues,
      existing: null,
      matchScore: 0,
      matchReason: "Generic import — no matching applied",
      defaultAction: "insert" as ImportResolvedAction,
      action: validationIssues.length ? "review" as ImportResolvedAction : "insert" as ImportResolvedAction,
      diffSummary: [],
    };
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      acc.valid += row.validationIssues.length ? 0 : 1;
      acc.invalid += row.validationIssues.length ? 1 : 0;
      acc.inserts += row.action === "insert" ? 1 : 0;
      acc.reviews += row.action === "review" ? 1 : 0;
      return acc;
    },
    { total: 0, valid: 0, invalid: 0, inserts: 0, updates: 0, skips: 0, reviews: 0, exactMatches: 0, fuzzyMatches: 0, internalDuplicates: 0 },
  );

  return { rows, summary };
}
