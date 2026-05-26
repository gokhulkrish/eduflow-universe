import type { ImportBatch, ImportError } from "./types";
import { CANONICAL_FIELDS, getFieldByKey } from '../../engine/registry/canonical';

export function validateEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  const field = getFieldByKey('email');
  const pattern = field?.validationPattern || '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
  return new RegExp(pattern).test(String(value).trim());
}

export function validatePhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const field = getFieldByKey('contactNumber');
  const pattern = field?.validationPattern || '^[\\d\\s\\-+()]{7,}$';
  return new RegExp(pattern).test(String(value).trim());
}

export function validateName(value: string | null | undefined): boolean {
  if (!value) return false;
  const text = String(value).trim();
  return text.length >= 2 && text.length <= 100;
}

function validateFieldByRegistry(
  key: string,
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const field = getFieldByKey(key);
  if (!field) return null;

  // Enum validation
  if (field.dataType === 'enum' && field.enumValues && field.enumValues.length > 0) {
    if (!field.enumValues.map((v) => v.toLowerCase()).includes(value.trim().toLowerCase())) {
      return `${field.label} must be one of: ${field.enumValues.join(', ')}`;
    }
  }

  // Pattern validation
  if (field.validationPattern) {
    try {
      if (!new RegExp(field.validationPattern).test(String(value).trim())) {
        return `${field.label} has an invalid format`;
      }
    } catch { /* skip bad regex */ }
  }

  // Date validation
  if (field.dataType === 'date') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return `${field.label} must be a valid date (YYYY-MM-DD)`;
    }
  }

  // Number validation
  if (field.dataType === 'number') {
    if (Number.isNaN(Number(value))) {
      return `${field.label} must be a number`;
    }
  }

  return null;
}

export function validateRow(
  row: Record<string, string> | null | undefined,
): string[] {
  const errors: string[] = [];

  if (!row || typeof row !== "object") {
    errors.push("Row is not a valid object");
    return errors;
  }

  // Required field validation from registry
  for (const field of CANONICAL_FIELDS) {
    if (!field.required) continue;
    const mappedKey = field.key;
    const value = row[mappedKey];
    if (!value || String(value).trim() === "") {
      errors.push(`${field.label || field.key} is required`);
    }
  }

  // Data type and pattern validation from registry
  for (const field of CANONICAL_FIELDS) {
    const value = row[field.key];
    if (!value) continue;
    const registryError = validateFieldByRegistry(field.key, value);
    if (registryError) {
      errors.push(registryError);
    }
  }

  return errors;
}

export function buildImportError(
  rowNumber: number,
  field: string,
  message: string,
  severity: "error" | "warning" | "blocker" = "error",
): ImportError {
  return { rowNumber, field, message, severity };
}

export function addImportError(
  batch: ImportBatch,
  rowNumber: number,
  field: string,
  message: string,
  severity: "error" | "warning" | "blocker" = "error",
): void {
  if (!batch.rows[rowNumber]) {
    batch.rows[rowNumber] = {
      rowNumber,
      sourceData: {},
      targetData: {},
      decision: "review",
      errors: [],
      warnings: [],
      conflictWith: [],
    };
  }

  const error = buildImportError(rowNumber, field, message, severity);

  if (severity === "blocker") {
    if (!batch.rows[rowNumber].errors.includes(message)) {
      batch.rows[rowNumber].errors.push(message);
    }
  } else if (severity === "warning") {
    if (!batch.rows[rowNumber].warnings.includes(message)) {
      batch.rows[rowNumber].warnings.push(message);
    }
  } else {
    if (!batch.rows[rowNumber].errors.includes(message)) {
      batch.rows[rowNumber].errors.push(message);
    }
  }
}

export function validateBatch(
  batch: ImportBatch,
): { valid: boolean; errorCount: number; warningCount: number } {
  let errorCount = 0;
  const warningCount = 0;

  for (const row of batch.sourceRows) {
    const errors = validateRow(row);
    errorCount += errors.length;
  }

  batch.errorCount = errorCount;
  batch.validCount = batch.rowCount - errorCount;

  return {
    valid: errorCount === 0,
    errorCount,
    warningCount,
  };
}
