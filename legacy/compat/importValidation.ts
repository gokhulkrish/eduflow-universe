import type { ImportError } from "../../src/lib/import-engine/types";

export const legacyFieldValidators: Record<string, (value: string) => string | null> = {
  admissionNo: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "Admission number is required";
    if (!/^[A-Za-z0-9\-/]+$/.test(trimmed)) return "Admission number allows only letters, numbers, hyphens and slashes";
    return null;
  },
  fullName: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "Full name is required";
    if (trimmed.length < 2) return "Name must be at least 2 characters";
    if (trimmed.length > 120) return "Name must not exceed 120 characters";
    return null;
  },
  firstName: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "First name is required";
    if (trimmed.length < 2) return "First name must be at least 2 characters";
    return null;
  },
  lastName: (v) => {
    if (v && v.trim().length > 80) return "Last name must not exceed 80 characters";
    return null;
  },
  dob: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "Date of birth is required";
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) return "Invalid date format (expected YYYY-MM-DD)";
    if (date > new Date()) return "Date of birth cannot be in the future";
    if (date < new Date("1900-01-01")) return "Date of birth seems too far in the past";
    return null;
  },
  gender: (v) => {
    const normalized = v.trim().toLowerCase();
    if (!normalized) return "Gender is required";
    if (!["male", "female", "other", "m", "f"].includes(normalized)) return "Gender must be Male, Female, or Other";
    return null;
  },
  email: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return null;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Invalid email format";
    return null;
  },
  phone: (v) => {
    const trimmed = v.trim().replace(/\s+/g, "");
    if (!trimmed) return null;
    if (!/^\+?\d{7,15}$/.test(trimmed)) return "Phone must be 7-15 digits, optionally starting with +";
    return null;
  },
  bloodGroup: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return null;
    if (!/^(A|B|AB|O)[+-]$/i.test(trimmed)) return "Blood group must be like A+, B-, AB+, O+";
    return null;
  },
  nationality: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return null;
    if (trimmed.length > 60) return "Nationality must not exceed 60 characters";
    return null;
  },
  grade: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return "Grade/Class is required";
    if (trimmed.length > 20) return "Grade must not exceed 20 characters";
    return null;
  },
  section: (v) => {
    if (v && v.trim().length > 10) return "Section must not exceed 10 characters";
    return null;
  },
  roll: (v) => {
    const trimmed = v.trim();
    if (!trimmed) return null;
    if (!/^\d{1,5}$/.test(trimmed)) return "Roll number must be 1-5 digits";
    return null;
  },
};

export const legacyNormalizers: Record<string, (value: string) => string> = {
  fullName: (v) => v.trim().replace(/\s+/g, " ").replace(/^["'\s]+|["'\s]+$/g, ""),
  firstName: (v) => v.trim().replace(/\s+/g, " "),
  lastName: (v) => v.trim().replace(/\s+/g, " "),
  admissionNo: (v) => v.trim().toUpperCase().replace(/\s+/g, ""),
  gender: (v) => {
    const lower = v.trim().toLowerCase();
    if (lower === "m") return "Male";
    if (lower === "f") return "Female";
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  },
  phone: (v) => v.trim().replace(/[\s\-()]/g, ""),
  email: (v) => v.trim().toLowerCase(),
  grade: (v) => v.trim().toUpperCase(),
};

export const legacyAllowedValues: Record<string, string[]> = {
  gender: ["Male", "Female", "Other"],
  bloodGroup: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  status: ["active", "inactive", "transferred", "left"],
};

export function validateImportRow(row: Record<string, string>, fieldMap: Record<string, string>): ImportError[] {
  const errors: ImportError[] = [];
  for (const [sourceField, targetField] of Object.entries(fieldMap)) {
    const value = row[sourceField] ?? "";
    const validator = legacyFieldValidators[targetField];
    if (validator) {
      const error = validator(value);
      if (error) {
        errors.push({
          rowNumber: Number(row.__rowNumber) || 0,
          field: targetField,
          message: error,
          severity: "error",
        });
      }
    }
  }
  return errors;
}

export const legacyErrorCodes: Record<string, string> = {
  ERR_REQUIRED: "ERR_REQUIRED",
  ERR_FORMAT: "ERR_FORMAT",
  ERR_LENGTH: "ERR_LENGTH",
  ERR_RANGE: "ERR_RANGE",
  ERR_INVALID_VALUE: "ERR_INVALID_VALUE",
};

export const legacyImportRules = {
  maxFileSize: 10 * 1024 * 1024,
  allowedFileTypes: ["csv", "xls", "xlsx"],
  maxRowsPerBatch: 5000,
  maxColumnsPerRow: 100,
  encoding: "utf-8",
};
