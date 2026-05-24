import { describe, it, expect } from "vitest";
import {
  legacyFieldValidators,
  legacyNormalizers,
  legacyAllowedValues,
  validateImportRow,
  legacyImportRules,
} from "./importValidation";

describe("legacyFieldValidators", () => {
  it("validates admissionNo", () => {
    expect(legacyFieldValidators.admissionNo("S123")).toBeNull();
    expect(legacyFieldValidators.admissionNo("")).toBe("Admission number is required");
    expect(legacyFieldValidators.admissionNo("  ")).toBe("Admission number is required");
    expect(legacyFieldValidators.admissionNo("ABC_123")).toBe("Admission number allows only letters, numbers, hyphens and slashes");
  });

  it("validates fullName", () => {
    expect(legacyFieldValidators.fullName("John")).toBeNull();
    expect(legacyFieldValidators.fullName("J")).toBe("Name must be at least 2 characters");
    expect(legacyFieldValidators.fullName("")).toBe("Full name is required");
  });

  it("validates dob", () => {
    expect(legacyFieldValidators.dob("2010-05-15")).toBeNull();
    expect(legacyFieldValidators.dob("")).toBe("Date of birth is required");
    expect(legacyFieldValidators.dob("not-a-date")).toBe("Invalid date format (expected YYYY-MM-DD)");
    expect(legacyFieldValidators.dob("1800-01-01")).toBe("Date of birth seems too far in the past");
  });

  it("validates gender", () => {
    expect(legacyFieldValidators.gender("Male")).toBeNull();
    expect(legacyFieldValidators.gender("")).toBe("Gender is required");
    expect(legacyFieldValidators.gender("Unknown")).toBe("Gender must be Male, Female, or Other");
  });

  it("validates email", () => {
    expect(legacyFieldValidators.email("test@example.com")).toBeNull();
    expect(legacyFieldValidators.email("")).toBeNull();
    expect(legacyFieldValidators.email("invalid")).toBe("Invalid email format");
  });

  it("validates phone", () => {
    expect(legacyFieldValidators.phone("+911234567890")).toBeNull();
    expect(legacyFieldValidators.phone("1234567890")).toBeNull();
    expect(legacyFieldValidators.phone("")).toBeNull();
    expect(legacyFieldValidators.phone("abc")).toBe("Phone must be 7-15 digits, optionally starting with +");
  });

  it("validates bloodGroup", () => {
    expect(legacyFieldValidators.bloodGroup("A+")).toBeNull();
    expect(legacyFieldValidators.bloodGroup("")).toBeNull();
    expect(legacyFieldValidators.bloodGroup("X-")).toBe("Blood group must be like A+, B-, AB+, O+");
  });

  it("validates roll", () => {
    expect(legacyFieldValidators.roll("123")).toBeNull();
    expect(legacyFieldValidators.roll("")).toBeNull();
    expect(legacyFieldValidators.roll("123456")).toBe("Roll number must be 1-5 digits");
  });

  it("validates grade", () => {
    expect(legacyFieldValidators.grade("Class 10")).toBeNull();
    expect(legacyFieldValidators.grade("")).toBe("Grade/Class is required");
  });
});

describe("legacyNormalizers", () => {
  it("normalizes fullName", () => {
    expect(legacyNormalizers.fullName(' "John Doe" ')).toBe('John Doe');
    expect(legacyNormalizers.fullName("  John   Doe  ")).toBe("John Doe");
  });

  it("normalizes gender", () => {
    expect(legacyNormalizers.gender("m")).toBe("Male");
    expect(legacyNormalizers.gender("F")).toBe("Female");
    expect(legacyNormalizers.gender("male")).toBe("Male");
  });

  it("normalizes admissionNo", () => {
    expect(legacyNormalizers.admissionNo(" s123 ")).toBe("S123");
  });

  it("normalizes phone", () => {
    expect(legacyNormalizers.phone("+91-123-456-7890")).toBe("+911234567890");
  });
});

describe("legacyAllowedValues", () => {
  it("has correct gender values", () => {
    expect(legacyAllowedValues.gender).toEqual(["Male", "Female", "Other"]);
  });

  it("has correct blood group values", () => {
    expect(legacyAllowedValues.bloodGroup).toContain("A+");
    expect(legacyAllowedValues.bloodGroup).toContain("O-");
  });
});

describe("validateImportRow", () => {
  it("returns errors for invalid fields", () => {
    const row = { __rowNumber: "1", fullName: "J", admissionNo: "" };
    const fieldMap = { fullName: "fullName", admissionNo: "admissionNo" };
    const errors = validateImportRow(row, fieldMap);
    expect(errors).toHaveLength(2);
    expect(errors[0].severity).toBe("error");
    expect(errors[0].field).toBe("fullName");
  });

  it("returns empty for valid row", () => {
    const row = { __rowNumber: "1", fullName: "John Doe", admissionNo: "S123" };
    const fieldMap = { fullName: "fullName", admissionNo: "admissionNo" };
    const errors = validateImportRow(row, fieldMap);
    expect(errors).toHaveLength(0);
  });
});

describe("legacyImportRules", () => {
  it("has reasonable defaults", () => {
    expect(legacyImportRules.maxFileSize).toBe(10 * 1024 * 1024);
    expect(legacyImportRules.allowedFileTypes).toContain("csv");
    expect(legacyImportRules.maxRowsPerBatch).toBe(5000);
  });
});
