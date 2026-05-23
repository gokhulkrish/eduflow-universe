import { describe, it, expect, beforeEach } from "vitest";
import { registerModule, getModule, getAllModules, getAllModuleDescriptors, loadInitialModules } from "./module-registry";
import { getImportSchemaDriftReport } from "./drift";
import { buildGenericPreview } from "./preview";
import type { ImportModule, ImportModuleFieldGroup } from "./types";

const mockFieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Identity",
    fields: [
      { key: "fullName", label: "Full Name", aliases: ["name", "full_name"], required: true },
      { key: "email", label: "Email", aliases: ["email", "e-mail"] },
    ],
  },
  {
    title: "Details",
    fields: [
      { key: "age", label: "Age", aliases: ["age"] },
      { key: "status", label: "Status", aliases: ["status"] },
    ],
  },
];

const mockModule: ImportModule = {
  id: "test-module",
  name: "Test Module",
  description: "A module for testing",
  icon: "Users",
  fieldGroups: mockFieldGroups,
  matchStrategies: [
    { id: "name_only", label: "Name Only", fields: ["fullName"] },
  ],
  adapter: {
    loadExistingRecords: async () => [],
    commitRows: async () => ({ inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] }),
    rollbackRows: async () => ({ success: true, restored: 0 }),
  },
};

describe("module-registry", () => {
  beforeEach(() => {
    // Clear all modules by registering a cleanup
    for (const mod of getAllModules()) {
      // We can't unregister, but we can overwrite
    }
  });

  it("registerModule and getModule", () => {
    registerModule(mockModule);
    const retrieved = getModule("test-module");
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe("test-module");
    expect(retrieved!.name).toBe("Test Module");
  });

  it("getModule returns undefined for missing module", () => {
    expect(getModule("nonexistent")).toBeUndefined();
  });

  it("getAllModules returns all registered modules", () => {
    registerModule(mockModule);
    const all = getAllModules();
    expect(all.length).toBeGreaterThanOrEqual(1);
    expect(all.some((m) => m.id === "test-module")).toBe(true);
  });

  it("getAllModuleDescriptors returns only metadata", () => {
    registerModule(mockModule);
    const descriptors = getAllModuleDescriptors();
    const found = descriptors.find((d) => d.id === "test-module");
    expect(found).toBeDefined();
    expect(found!.name).toBe("Test Module");
    expect(found!.description).toBe("A module for testing");
    expect(found!.icon).toBe("Users");
    // Should not include adapter or fieldGroups
    expect((found as any).adapter).toBeUndefined();
  });

  it("loadInitialModules registers all built-in modules", async () => {
    await loadInitialModules();
    const modules = getAllModules();
    expect(modules.length).toBeGreaterThanOrEqual(7);
    expect(modules.find((m) => m.id === "students")).toBeDefined();
    expect(modules.find((m) => m.id === "fees")).toBeDefined();
    expect(modules.find((m) => m.id === "attendance")).toBeDefined();
    expect(modules.find((m) => m.id === "exam-marks")).toBeDefined();
    expect(modules.find((m) => m.id === "transport")).toBeDefined();
    expect(modules.find((m) => m.id === "hostel")).toBeDefined();
    expect(modules.find((m) => m.id === "library")).toBeDefined();
    expect(modules.find((m) => m.id === "hr")).toBeDefined();
    expect(modules.find((m) => m.id === "admissions")).toBeDefined();
    expect(modules.find((m) => m.id === "assignments")).toBeDefined();
  });
});

describe("drift detection", () => {
  beforeEach(() => {
    registerModule(mockModule);
  });

  it("reports no drift when all headers match field aliases", () => {
    const report = getImportSchemaDriftReport("test-module", ["Full Name", "email", "Age", "status"]);
    expect(report.hasDrift).toBe(false);
    expect(report.unrecognized).toHaveLength(0);
    expect(report.missingRequired).toHaveLength(0);
  });

  it("reports unrecognized headers not in any field alias", () => {
    const report = getImportSchemaDriftReport("test-module", ["Full Name", "unknown_column", "extra_field"]);
    expect(report.hasDrift).toBe(true);
    expect(report.unrecognized.length).toBeGreaterThanOrEqual(1);
    expect(report.unrecognized.some((u) => u.header === "unknown_column")).toBe(true);
  });

  it("reports missing required fields", () => {
    const report = getImportSchemaDriftReport("test-module", ["Age"]);
    expect(report.hasDrift).toBe(true);
    expect(report.missingRequired.length).toBeGreaterThanOrEqual(1);
    expect(report.missingRequired.some((m) => m.suggestedField === "fullName")).toBe(true);
  });

  it("reports drift for unknown module", () => {
    const report = getImportSchemaDriftReport("nonexistent", ["any"]);
    expect(report.hasDrift).toBe(true);
    expect(report.unrecognized).toHaveLength(0);
    expect(report.missingRequired).toHaveLength(0);
    expect(report.summary).toContain("not found");
  });
});

describe("generic preview builder", () => {
  const parsed = {
    fileName: "test.csv",
    sourceType: "csv" as const,
    sheetName: "Sheet1",
    headers: ["full_name", "email", "age"],
    rows: [
      { full_name: "Alice", email: "alice@test.com", age: "25" },
      { full_name: "Bob", email: "", age: "30" },
    ],
  };

  const mapping = {
    full_name: "fullName",
    email: "email",
    age: "age",
  };

  it("builds a preview with correct row count", () => {
    const preview = buildGenericPreview(parsed, mapping, mockFieldGroups, []);
    expect(preview.rows).toHaveLength(2);
    expect(preview.summary.total).toBe(2);
  });

  it("maps fields from source to target", () => {
    const preview = buildGenericPreview(parsed, mapping, mockFieldGroups, []);
    expect(preview.rows[0].mapped.fullName).toBe("Alice");
    expect(preview.rows[0].mapped.email).toBe("alice@test.com");
    expect(preview.rows[1].mapped.fullName).toBe("Bob");
  });

  it("generates display name from first non-empty field", () => {
    const preview = buildGenericPreview(parsed, mapping, mockFieldGroups, []);
    expect(preview.rows[0].displayName).toBe("Alice");
  });

  it("flags missing required fields as validation issues", () => {
    const parsedMissing = {
      ...parsed,
      headers: ["email", "age"],
      rows: [{ email: "", age: "25" }],
    };
    const mappingMissing = { email: "email", age: "age" };
    const preview = buildGenericPreview(parsedMissing, mappingMissing, mockFieldGroups, []);
    expect(preview.rows[0].validationIssues.length).toBeGreaterThan(0);
    expect(preview.rows[0].validationIssues.some((i) => i.toLowerCase().includes("full name"))).toBe(true);
  });

  it("marks rows with validation as review action", () => {
    const preview = buildGenericPreview(parsed, mapping, mockFieldGroups, []);
    expect(preview.rows[0].action).toBe("insert");
    expect(preview.rows[1].action).toBe("insert");
  });

  it("sets no match info for generic preview", () => {
    const preview = buildGenericPreview(parsed, mapping, mockFieldGroups, []);
    expect(preview.rows[0].matchScore).toBe(0);
    expect(preview.rows[0].existing).toBeNull();
    expect(preview.rows[0].duplicateStatus).toBe("none");
  });

  it("includes custom field values in preview", () => {
    const customFields = [{ id: "cf1", label: "House", key: "house_code" }];
    const mappingWithCustom = { house: "custom:cf1", full_name: "fullName" };
    const parsedWithCustom = {
      ...parsed,
      headers: ["house", "full_name"],
      rows: [{ house: "Blue", full_name: "Alice" }],
    };
    const preview = buildGenericPreview(parsedWithCustom, mappingWithCustom, mockFieldGroups, customFields);
    expect(preview.rows[0].customValues.cf1).toBe("Blue");
  });

  it("falls back to Row N when no mapped values exist", () => {
    const emptyParsed = {
      ...parsed,
      headers: ["x"],
      rows: [{ x: "y" }],
    };
    const emptyMapping: Record<string, string> = {};
    const preview = buildGenericPreview(emptyParsed, emptyMapping, mockFieldGroups, []);
    expect(preview.rows[0].displayName).toBe("Row 2");
  });
});
