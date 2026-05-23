import type { ImportBatch, ImportError } from "./types";

export function validateEmail(value: string | null | undefined): boolean {
  if (!value) return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(value).trim());
}

export function validatePhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const regex = /^[\d\s\-+()]{7,}$/;
  return regex.test(String(value).trim());
}

export function validateName(value: string | null | undefined): boolean {
  if (!value) return false;
  const text = String(value).trim();
  return text.length >= 2 && text.length <= 100;
}

export function validateRow(
  row: Record<string, string> | null | undefined,
): string[] {
  const errors: string[] = [];

  if (!row || typeof row !== "object") {
    errors.push("Row is not a valid object");
    return errors;
  }

  const requiredFields = ["firstName", "lastName", "email"];
  requiredFields.forEach((field) => {
    const value = row[field];
    if (!value || String(value).trim() === "") {
      errors.push(`${field} is required`);
    }
  });

  if (row.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(row.email)) {
      errors.push("Invalid email format: " + row.email);
    }
  }

  if (row.phone) {
    const phoneRegex = /^[\d\s\-+()]+$/;
    if (!phoneRegex.test(row.phone)) {
      errors.push("Invalid phone format: " + row.phone);
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
