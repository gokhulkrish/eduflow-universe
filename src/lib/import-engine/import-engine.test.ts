import { describe, it, expect, vi } from "vitest";
import {
  makeBatchId,
  normalizeText,
  nowIso,
  normalizeImportDefaultType,
  normalizeLoose,
  normalizeKey,
  normalizeDate,
  splitFullName,
  similarity,
  maybeTrim,
  escapeHtml,
} from "./core";

import { detectCSVDelimiter, parseCSV, extractImportHeadersFromRows } from "./parser";

import { createImportBatch } from "./batch";

import { resolveImportMappingEngineMatch, buildDefaultImportMapping } from "./mapping";

import { validateRow, validateEmail, validatePhone, validateName } from "./validation";

import { buildIdentityKey, getExistingMatch, inferImportType } from "./keying";

import {
  createImportPipelineState,
  IMPORT_PIPELINE_STEPS,
  IMPORT_STEP_DEPENDENCY_MAP,
  setImportStepDirtyState,
  markStepDirty,
  clearStepDirty,
  isStepDirty,
  lockImportStep,
  unlockImportStep,
  isImportStepLocked,
  invalidateDownstreamSteps,
  invalidateImportDownstream,
  invalidateDualKeyWorkflow,
  checkStepPrerequisite,
  refreshCanonicalPipelineState,
  resetImportPipelineState,
  appendImportAuditTrace,
  takeImportPipelineSnapshot,
  computeImportMappingHash,
  computeImportKeyingHash,
  computeImportDuplicateHash,
  computeImportValidationHash,
  computeImportPreviewHash,
  getStepIndex,
  getStepName,
  canNavigateToStep,
} from "./pipeline";

describe("core helpers", () => {
  it("makeBatchId generates unique IDs", () => {
    const a = makeBatchId();
    const b = makeBatchId();
    expect(a).toMatch(/^batch_\d+_/);
    expect(a).not.toBe(b);
  });

  it("normalizeText trims and limits length", () => {
    expect(normalizeText("  hello  ")).toBe("hello");
    expect(normalizeText(null)).toBe("");
    expect(normalizeText(undefined)).toBe("");
    expect(normalizeText("x".repeat(600)).length).toBe(500);
  });

  it("nowIso returns ISO string", () => {
    const iso = nowIso();
    expect(() => new Date(iso)).not.toThrow();
  });

  it("normalizeImportDefaultType validates types", () => {
    expect(normalizeImportDefaultType("newentry")).toBe("newentry");
    expect(normalizeImportDefaultType("UPDATE")).toBe("update");
    expect(normalizeImportDefaultType("invalid")).toBe("newentry");
  });

  it("normalizeLoose handles accented characters", () => {
    expect(normalizeLoose("Café")).toBe("cafe");
    expect(normalizeLoose("  Hello  World  ")).toBe("hello world");
  });

  it("normalizeKey removes spaces", () => {
    expect(normalizeKey("Hello World")).toBe("helloworld");
    expect(normalizeKey("ABC-123")).toBe("abc123");
  });

  it("normalizeDate handles ISO, slash, and ambiguous formats", () => {
    expect(normalizeDate("2024-03-15")).toBe("2024-03-15");
    expect(normalizeDate("15/03/2024")).toBe("2024-03-15");
    expect(normalizeDate("03/15/2024")).toMatch(/2024-0[13]-(15|03)/);
    expect(normalizeDate("")).toBe("");
    expect(normalizeDate(null)).toBe("");
  });

  it("splitFullName correctly splits", () => {
    expect(splitFullName("John")).toEqual({ firstName: "john", lastName: "" });
    expect(splitFullName("John Michael Doe")).toEqual({ firstName: "john", lastName: "michael doe" });
    expect(splitFullName("")).toEqual({ firstName: "", lastName: "" });
  });

  it("similarity returns correct values", () => {
    expect(similarity("", "")).toBe(1);
    expect(similarity("abc", "abc")).toBe(1);
    expect(similarity("abc", "xyz")).toBe(0);
    expect(similarity("kitten", "sitting")).toBeGreaterThan(0.3);
    expect(similarity("", "abc")).toBe(0);
  });

  it("maybeTrim handles null/undefined", () => {
    expect(maybeTrim("  hello  ")).toBe("hello");
    expect(maybeTrim(null)).toBe("");
    expect(maybeTrim(undefined)).toBe("");
  });

  it("escapeHtml escapes special characters", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(escapeHtml("safe text")).toBe("safe text");
  });
});

describe("parser", () => {
  it("detectCSVDelimiter detects comma", () => {
    const csv = "a,b,c\n1,2,3";
    expect(detectCSVDelimiter(csv)).toBe(",");
  });

  it("detectCSVDelimiter detects semicolon", () => {
    const csv = "a;b;c\n1;2;3";
    expect(detectCSVDelimiter(csv)).toBe(";");
  });

  it("detectCSVDelimiter detects tab", () => {
    const csv = "a\tb\tc\n1\t2\t3";
    expect(detectCSVDelimiter(csv)).toBe("\t");
  });

  it("parseCSV handles standard CSV", () => {
    const csv = "Name,Email,Phone\nJohn,john@example.com,555-1234\nJane,jane@example.com,555-5678";
    const rows = parseCSV(csv) as Record<string, string>[];
    expect(rows).toHaveLength(2);
    expect(rows[0].Name).toBe("John");
    expect(rows[0].Email).toBe("john@example.com");
    expect(rows[1].Name).toBe("Jane");
  });

  it("parseCSV handles quoted fields with commas", () => {
    const csv = 'Name,Address\nJohn,"123 Main St, Apt 4"';
    const rows = parseCSV(csv) as Record<string, string>[];
    expect(rows).toHaveLength(1);
    expect(rows[0].Address).toBe("123 Main St, Apt 4");
  });

  it("parseCSV handles quoted fields with double quotes", () => {
    const csv = 'Name,Note\nJohn,"He said ""hello"""';
    const rows = parseCSV(csv) as Record<string, string>[];
    expect(rows[0].Note).toBe('He said "hello"');
  });

  it("parseCSV handles empty rows", () => {
    const csv = "A,B\n1,2\n\n3,4\n";
    const rows = parseCSV(csv) as Record<string, string>[];
    expect(rows).toHaveLength(2);
  });

  it("parseCSV returns empty array for empty text", () => {
    expect(parseCSV("")).toEqual([]);
  });

  it("extractImportHeadersFromRows gets keys", () => {
    const rows = [{ Name: "John", Email: "john@test.com" }];
    expect(extractImportHeadersFromRows(rows)).toEqual(["Name", "Email"]);
  });

  it("extractImportHeadersFromRows returns empty for empty input", () => {
    expect(extractImportHeadersFromRows([])).toEqual([]);
    expect(extractImportHeadersFromRows(null as unknown as Record<string, string>[])).toEqual([]);
  });
});

describe("batch", () => {
  it("createImportBatch creates a valid batch", () => {
    const rows = [{ Name: "John", Email: "john@test.com" }];
    const batch = createImportBatch({
      batchName: "Test Batch",
      sourceRows: rows,
      importHeaders: ["Name", "Email"],
      defaultImportType: "newentry",
    });

    expect(batch.batchId).toMatch(/^batch_/);
    expect(batch.batchName).toBe("Test Batch");
    expect(batch.status).toBe("draft");
    expect(batch.rowCount).toBe(1);
    expect(batch.sourceRows).toEqual(rows);
    expect(batch.importHeaders).toEqual(["Name", "Email"]);
    expect(batch.mappingLines).toHaveLength(2);
    expect(batch.createdAt).toBeTruthy();
  });

  it("createImportBatch handles missing headers", () => {
    const rows = [{ Name: "John" }];
    const batch = createImportBatch({ sourceRows: rows });
    expect(batch.importHeaders).toEqual(["Name"]);
  });

  it("createImportBatch has default values", () => {
    const batch = createImportBatch({});
    expect(batch.status).toBe("draft");
    expect(batch.rowCount).toBe(0);
    expect(batch.defaultImportType).toBe("newentry");
    expect(batch.matchStrategy).toBe("reg_umis_emis");
  });
});

describe("mapping", () => {
  it("resolveImportMappingEngineMatch maps known fields", () => {
    const result = resolveImportMappingEngineMatch("First Name");
    expect(result.targetField).toBe("firstName");
    expect(result.isRequired).toBe(true);

    const email = resolveImportMappingEngineMatch("Email Address");
    expect(email.targetField).toBe("email");
    expect(email.isRequired).toBe(false);

    const unknown = resolveImportMappingEngineMatch("Random Column");
    expect(unknown.targetField).toBeNull();
    expect(unknown.isRequired).toBe(false);
  });

  it("resolveImportMappingEngineMatch handles aliases", () => {
    expect(resolveImportMappingEngineMatch("fname").targetField).toBe("firstName");
    expect(resolveImportMappingEngineMatch("lname").targetField).toBe("lastName");
    expect(resolveImportMappingEngineMatch("dob").targetField).toBe("dateOfBirth");
    expect(resolveImportMappingEngineMatch("mobile").targetField).toBe("phone");
  });

  it("buildDefaultImportMapping creates mapping for all headers", () => {
    const headers = ["First Name", "Email", "Custom Field"];
    const mapping = buildDefaultImportMapping(headers, "newentry");
    expect(mapping).toHaveLength(3);
    expect(mapping[0].targetField).toBe("firstName");
    expect(mapping[1].targetField).toBe("email");
    expect(mapping[2].targetField).toBeNull();
  });

  it("buildDefaultImportMapping returns empty for empty headers", () => {
    expect(buildDefaultImportMapping([], "newentry")).toEqual([]);
  });
});

describe("validation", () => {
  it("validateEmail checks format", () => {
    expect(validateEmail("test@example.com")).toBe(true);
    expect(validateEmail("invalid")).toBe(false);
    expect(validateEmail("")).toBe(false);
    expect(validateEmail(null)).toBe(false);
  });

  it("validatePhone checks format", () => {
    expect(validatePhone("+15551234567")).toBe(true);
    expect(validatePhone("12345")).toBe(false);
    expect(validatePhone("")).toBe(false);
  });

  it("validateName checks length", () => {
    expect(validateName("John")).toBe(true);
    expect(validateName("J")).toBe(false);
    expect(validateName("")).toBe(false);
  });

  it("validateRow checks required fields", () => {
    const errors = validateRow({ firstName: "", lastName: "", email: "" });
    expect(errors.length).toBeGreaterThanOrEqual(5);
    expect(errors.some((e) => e.includes("Registration Number"))).toBe(true);
  });

  it("validateRow validates email format", () => {
    const errors = validateRow({ firstName: "John", lastName: "Doe", email: "invalid", registrationNumber: "ADM-001", studentName: "John Doe", dob: "2010-05-15", gender: "Male", class: "10" });
    expect(errors.some((e) => e.includes("invalid format"))).toBe(true);
  });

  it("validateRow returns empty for valid row", () => {
    const errors = validateRow({
      firstName: "John",
      lastName: "Doe",
      email: "john@test.com",
      registrationNumber: "ADM-001",
      studentName: "John Doe",
      dob: "2010-05-15",
      gender: "Male",
      class: "10",
    });
    expect(errors).toEqual([]);
  });

  it("validateRow handles null/undefined", () => {
    expect(validateRow(null)).toHaveLength(1);
    expect(validateRow(undefined)).toHaveLength(1);
  });
});

describe("keying", () => {
  it("buildIdentityKey generates keys for reg_umis_emis", () => {
    const key = buildIdentityKey(
      { admissionNo: "ABC123", firstName: "John", lastName: "Doe" },
      "reg_umis_emis",
    );
    expect(key).toContain("reg:abc123");
  });

  it("buildIdentityKey falls back to name", () => {
    const key = buildIdentityKey(
      { firstName: "John", lastName: "Doe", dob: "2000-01-15" },
      "registration_only",
    );
    expect(key).toContain("name:");
    expect(key).toContain("dob:");
  });

  it("buildIdentityKey uses umis/emis fallback", () => {
    const key = buildIdentityKey(
      { umisId: "UMIS001" },
      "umis_only",
    );
    expect(key).toContain("umis:umis001");
  });

  it("getExistingMatch finds matches by admission number", () => {
    const existing = [
      {
        student_id: "s1",
        enrollment_id: null,
        admission_no: "ABC123",
        first_name: "John",
        last_name: "Doe",
        display_name: "John Doe",
        dob: "2000-01-15",
        gender: null,
        email: null,
        phone: null,
        umis_id: null,
        emis_id: null,
        grade: null,
        section: null,
        roll_number: null,
        stream: null,
        status: "active",
      },
    ];

    const match = getExistingMatch(
      { admissionNo: "ABC123" },
      existing,
      "reg_umis_emis",
      0.5,
    );
    expect(match).not.toBeNull();
    expect(match!.score).toBe(100);
    expect(match!.reason).toContain("Admission");
  });

  it("getExistingMatch returns null when no match", () => {
    const existing = [
      {
        student_id: "s1",
        enrollment_id: null,
        admission_no: "XYZ789",
        first_name: "Jane",
        last_name: "Smith",
        display_name: "Jane Smith",
        dob: "1999-05-20",
        gender: null,
        email: null,
        phone: null,
        umis_id: null,
        emis_id: null,
        grade: null,
        section: null,
        roll_number: null,
        stream: null,
        status: "active",
      },
    ];

    const match = getExistingMatch(
      { admissionNo: "ABC123" },
      existing,
      "reg_umis_emis",
      0.9,
    );
    expect(match).toBeNull();
  });

  it("inferImportType returns insert for new records", () => {
    expect(inferImportType({}, "newentry", null)).toBe("insert");
  });

  it("inferImportType returns update for existing with update mode", () => {
    const existing = {
      student_id: "s1",
      enrollment_id: null,
      admission_no: "ABC",
      first_name: "John",
      last_name: null,
      display_name: "John",
      dob: null,
      gender: null,
      email: null,
      phone: null,
      umis_id: null,
      emis_id: null,
      grade: null,
      section: null,
      roll_number: null,
      stream: null,
      status: "active",
    };
    expect(inferImportType({}, "update", existing)).toBe("update");
  });

  it("inferImportType returns skip for existing with newentry mode", () => {
    const existing = {
      student_id: "s1",
      enrollment_id: null,
      admission_no: "ABC",
      first_name: "John",
      last_name: null,
      display_name: "John",
      dob: null,
      gender: null,
      email: null,
      phone: null,
      umis_id: null,
      emis_id: null,
      grade: null,
      section: null,
      roll_number: null,
      stream: null,
      status: "active",
    };
    expect(inferImportType({}, "newentry", existing)).toBe("skip");
  });
});

describe("supabase-adapter", () => {
  it("toSupabasePreviewRow converts engine row correctly", async () => {
    const { toSupabasePreviewRow } = await import("./supabase-adapter");

    const engineRow: import("./types").ImportPreviewRow = {
      sourceRowIndex: 0,
      rowKey: "0",
      sourceRow: { Name: "John" },
      mapped: { firstName: "John", lastName: "" },
      customValues: {},
      displayName: "John",
      admissionNo: "A001",
      identityKey: "reg:a001",
      duplicateGroupSize: 1,
      duplicateStatus: "none",
      validationIssues: [],
      existing: null,
      matchScore: 0,
      matchReason: "No match",
      defaultAction: "insert",
      action: "insert",
      diffSummary: ["New record"],
    };

    const converted = toSupabasePreviewRow(engineRow, []);
    expect(converted.sourceRowIndex).toBe(0);
    expect(converted.rowKey).toBe("0");
    expect(converted.displayName).toBe("John");
    expect(converted.existing).toBeNull();
    expect(converted.action).toBe("insert");
  });

  it("toSupabasePreviewRow matches existing record by student_id", async () => {
    const { toSupabasePreviewRow } = await import("./supabase-adapter");

    const existingRecords = [
      {
        student_id: "s1",
        enrollment_id: "e1",
        admission_no: "A001",
        first_name: "John",
        last_name: "Doe",
        display_name: "John Doe",
        dob: "2000-01-01",
        gender: "Male",
        email: "john@test.com",
        phone: "555-0100",
        umis_id: null,
        emis_id: null,
        grade: "10",
        section: "A",
        roll_number: 1,
        stream: null,
        status: "active",
      },
    ];

    const engineRow: import("./types").ImportPreviewRow = {
      sourceRowIndex: 0,
      rowKey: "0",
      sourceRow: { Name: "John" },
      mapped: { firstName: "John" },
      customValues: {},
      displayName: "John",
      admissionNo: "A001",
      identityKey: "reg:a001",
      duplicateGroupSize: 1,
      duplicateStatus: "exact",
      validationIssues: [],
      existing: existingRecords[0] as unknown as Record<string, unknown>,
      matchScore: 100,
      matchReason: "Admission matched",
      defaultAction: "update",
      action: "update",
      diffSummary: ["Name change"],
    };

    const converted = toSupabasePreviewRow(engineRow, existingRecords as any);
    expect(converted.existing).not.toBeNull();
    expect(converted.existing!.student_id).toBe("s1");
    expect(converted.existing!.admission_no).toBe("A001");
  });

  it("toEngineCommitResult converts Supabase result", async () => {
    const { toEngineCommitResult } = await import("./supabase-adapter");

    const supabaseResult = {
      inserted: 10,
      updated: 5,
      skipped: 2,
      failed: 1,
      errors: [{ rowNumber: 3, message: "Duplicate entry" }],
    };

    const engineResult = toEngineCommitResult(supabaseResult);
    expect(engineResult.inserted).toBe(10);
    expect(engineResult.updated).toBe(5);
    expect(engineResult.skipped).toBe(2);
    expect(engineResult.failed).toBe(1);
    expect(engineResult.errors).toHaveLength(1);
    expect(engineResult.errors[0].message).toBe("Duplicate entry");
  });

  it("supabase connectors provide correct signatures", async () => {
    const adapter = await import("./supabase-adapter");
    expect(typeof adapter.createSupabaseCommitFn).toBe("function");
    expect(typeof adapter.createSupabaseRollbackFn).toBe("function");
    expect(typeof adapter.loadExistingRecords).toBe("function");
    expect(typeof adapter.loadEngineBatchHistory).toBe("function");
  });
});

describe("pipeline", () => {
  it("creates pipeline state with defaults", () => {
    const p = createImportPipelineState();
    expect(p.sessionId).toBeTruthy();
    expect(p.currentStep).toBe("analyze");
    expect(p.hash.analyze).toBe("");
    expect(p.hash.mapping).toBe("");
    expect(p.dirtySteps).toEqual({});
    expect(p.lockedSteps).toEqual({});
    expect(p.audit.trace).toEqual([]);
    expect(p.audit.snapshots).toEqual([]);
  });

  it("IMPORT_PIPELINE_STEPS has correct order", () => {
    expect(IMPORT_PIPELINE_STEPS).toEqual(["analyze", "create", "map", "keying", "duplicates", "validate", "preview", "transfer", "finalize"]);
  });

  it("IMPORT_STEP_DEPENDENCY_MAP defines downstream dependencies", () => {
    expect(IMPORT_STEP_DEPENDENCY_MAP.analyze).toContain("finalize");
    expect(IMPORT_STEP_DEPENDENCY_MAP.create).toContain("transfer");
    expect(IMPORT_STEP_DEPENDENCY_MAP.map).toContain("keying");
    expect(IMPORT_STEP_DEPENDENCY_MAP.validate).toEqual(["preview", "transfer", "finalize"]);
    expect(IMPORT_STEP_DEPENDENCY_MAP.transfer).toEqual(["finalize"]);
    expect(IMPORT_STEP_DEPENDENCY_MAP.finalize).toEqual([]);
  });

  it("setImportStepDirtyState marks step dirty", () => {
    const p = createImportPipelineState();
    setImportStepDirtyState(p, "validate", true, "test-reason");
    expect(p.dirtySteps.validate).toBe(true);
    expect(p.audit.trace.length).toBe(1);
    expect(p.audit.trace[0].message).toBe("test-reason");
  });

  it("clearStepDirty clears dirty flag", () => {
    const p = createImportPipelineState();
    p.dirtySteps.validate = true;
    clearStepDirty(p, "validate");
    expect(isStepDirty(p, "validate")).toBe(false);
  });

  it("markStepDirty sets dirty and appends audit", () => {
    const p = createImportPipelineState();
    markStepDirty(p, "preview", "config changed");
    expect(p.dirtySteps.preview).toBe(true);
    expect(p.audit.trace.length).toBe(1);
  });

  it("isStepDirty returns correct value", () => {
    const p = createImportPipelineState();
    expect(isStepDirty(p, "map")).toBe(false);
    p.dirtySteps.map = true;
    expect(isStepDirty(p, "map")).toBe(true);
  });

  it("lockImportStep / unlockImportStep / isImportStepLocked", () => {
    const p = createImportPipelineState();
    expect(isImportStepLocked(p, "transfer")).toBe(false);
    lockImportStep(p, "transfer");
    expect(isImportStepLocked(p, "transfer")).toBe(true);
    unlockImportStep(p, "transfer");
    expect(isImportStepLocked(p, "transfer")).toBe(false);
  });

  it("appendImportAuditTrace appends and caps at 100", () => {
    const p = createImportPipelineState();
    for (let i = 0; i < 150; i++) {
      appendImportAuditTrace(p, "step", `entry-${i}`);
    }
    expect(p.audit.trace.length).toBe(100);
    expect(p.audit.trace[0].message).toBe("entry-50");
  });

  it("takeImportPipelineSnapshot stores snapshot", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test", sourceRows: [{ name: "test" }] });
    p.hash.mapping = "abc123";
    const snap = takeImportPipelineSnapshot(p, "pre-commit", batch);
    expect(snap.stage).toBe("pre-commit");
    expect(snap.mappingHash).toBe("abc123");
    expect(snap.batchId).toBe(batch.batchId);
    expect(p.audit.snapshots.length).toBe(1);
  });

  it("takeImportPipelineSnapshot caps at 20", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    for (let i = 0; i < 25; i++) {
      takeImportPipelineSnapshot(p, `snap-${i}`, batch);
    }
    expect(p.audit.snapshots.length).toBe(20);
  });

  it("invalidateDownstreamSteps marks downstream dirty", () => {
    const p = createImportPipelineState();
    invalidateDownstreamSteps(p, "map");
    expect(p.dirtySteps.keying).toBe(true);
    expect(p.dirtySteps.duplicates).toBe(true);
    expect(p.dirtySteps.validate).toBe(true);
    expect(p.dirtySteps.preview).toBe(true);
    expect(p.dirtySteps.transfer).toBe(true);
    expect(p.dirtySteps.create).toBeUndefined();
  });

  it("invalidateImportDownstream resets downstream step state", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    batch.validCount = 10;
    batch.errorCount = 5;
    batch.previewRows = [{ sourceRowIndex: 0, rowKey: "r1", sourceRow: {}, mapped: {}, customValues: {}, displayName: "T", admissionNo: "", identityKey: "", duplicateGroupSize: 0, duplicateStatus: "none", validationIssues: [], existing: null, matchScore: 0, matchReason: "", defaultAction: "insert", action: "insert", diffSummary: [] }];
    batch.previewCount = 1;

    invalidateImportDownstream(p, "validate", batch);
    expect(p.dirtySteps.preview).toBe(true);
    expect(p.dirtySteps.transfer).toBe(true);
    expect(batch.previewRows.length).toBe(0);
    expect(batch.previewCount).toBe(0);
  });

  it("invalidateDualKeyWorkflow marks correct steps", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });

    invalidateDualKeyWorkflow(p, "import-key", batch);
    expect(p.dirtySteps.validate).toBe(true);
    expect(p.dirtySteps.preview).toBe(true);
    expect(p.dirtySteps.transfer).toBe(true);
    expect(p.dirtySteps.duplicates).toBe(true);

    invalidateDualKeyWorkflow(p, "duplicate-config", batch);
    expect(p.dirtySteps.duplicates).toBe(true);
  });

  it("checkStepPrerequisite passes for create step", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    const result = checkStepPrerequisite(p, "create", batch);
    expect(result.pass).toBe(true);
  });

  it("checkStepPrerequisite fails for map without headers", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    const result = checkStepPrerequisite(p, "map", batch);
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("headers");
  });

  it("checkStepPrerequisite fails for keying without mapping lines", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test", importHeaders: ["name"], sourceRows: [{ name: "A" }] });
    batch.mappingLines = [];
    const result = checkStepPrerequisite(p, "keying", batch);
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("mapping");
  });

  it("checkStepPrerequisite passes for keying with mapping lines", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test", importHeaders: ["name"], sourceRows: [{ name: "A" }] });
    batch.mappingLines = [{ importField: "name", targetField: "firstName", transferMode: "newentry", isRequired: false }];
    p.hash.keying = computeImportKeyingHash(batch);
    const result = checkStepPrerequisite(p, "keying", batch);
    expect(result.pass).toBe(true);
  });

  it("checkStepPrerequisite detects stale keying for duplicates", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test", importHeaders: ["name"], sourceRows: [{ name: "A" }] });
    p.hash.keying = "stale-hash";
    const result = checkStepPrerequisite(p, "duplicates", batch);
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("Keying config changed");
  });

  it("checkStepPrerequisite detects dirty duplicates for validate", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    p.dirtySteps.duplicates = true;
    const result = checkStepPrerequisite(p, "validate", batch);
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("stale");
  });

  it("checkStepPrerequisite detects errors for preview", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    batch.errorCount = 3;
    const result = checkStepPrerequisite(p, "preview", batch);
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("errors");
  });

  it("checkStepPrerequisite detects stale preview for transfer", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    p.hash.preview = "stale";
    const result = checkStepPrerequisite(p, "transfer", batch);
    expect(result.pass).toBe(false);
    expect(result.reason).toContain("stale");
  });

  it("refreshCanonicalPipelineState recomputes all hashes", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test", importHeaders: ["name"], sourceRows: [{ name: "A" }] });
    refreshCanonicalPipelineState(p, batch);
    expect(p.hash.mapping).toBeTruthy();
    expect(p.hash.keying).toBeTruthy();
    expect(p.hash.duplicate).toBeTruthy();
    expect(p.hash.validation).toBeTruthy();
    expect(p.hash.preview).toBeTruthy();
    expect(p.audit.trace.length).toBe(1);
    expect(p.audit.trace[0].message).toBe("state-refreshed");
  });

  it("resetImportPipelineState clears everything", () => {
    const p = createImportPipelineState();
    p.dirtySteps.validate = true;
    p.lockedSteps.transfer = true;
    p.hash.mapping = "abc";
    appendImportAuditTrace(p, "step", "test");
    resetImportPipelineState(p);
    expect(p.dirtySteps).toEqual({});
    expect(p.lockedSteps).toEqual({});
    expect(p.hash.mapping).toBe("");
    expect(p.audit.trace).toEqual([]);
    expect(p.sessionId).toBeTruthy();
    expect(p.currentStep).toBe("analyze");
  });

  it("getStepIndex maps names to indices", () => {
    expect(getStepIndex("analyze")).toBe(0);
    expect(getStepIndex("create")).toBe(1);
    expect(getStepIndex("transfer")).toBe(7);
    expect(getStepIndex("finalize")).toBe(8);
    expect(getStepIndex("validate")).toBe(5);
  });

  it("getStepName maps indices to names", () => {
    expect(getStepName(0)).toBe("analyze");
    expect(getStepName(1)).toBe("create");
    expect(getStepName(7)).toBe("transfer");
    expect(getStepName(8)).toBe("finalize");
    expect(getStepName(99)).toBe("create");
  });

  it("canNavigateToStep rejects locked steps", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    p.currentStep = "analyze";
    lockImportStep(p, "map");
    const result = canNavigateToStep(p, "map", batch);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("locked");
  });

  it("canNavigateToStep rejects skipping ahead too far", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test" });
    p.currentStep = "analyze";
    const result = canNavigateToStep(p, "validate", batch);
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("intermediate");
  });

  it("canNavigateToStep allows adjacent forward step", () => {
    const p = createImportPipelineState();
    const batch = createImportBatch({ batchName: "test", importHeaders: ["name"], sourceRows: [{ name: "A" }] });
    p.currentStep = "analyze";
    const result = canNavigateToStep(p, "create", batch);
    expect(result.allowed).toBe(true);
  });

  it("computeImportMappingHash is deterministic", () => {
    const batch = createImportBatch({ batchName: "test" });
    batch.mappingLines = [
      { importField: "name", targetField: "firstName", transferMode: "newentry" as const, isRequired: false },
    ];
    const h1 = computeImportMappingHash(batch);
    const h2 = computeImportMappingHash(batch);
    expect(h1).toBe(h2);
  });

  it("computeImportKeyingHash is deterministic", () => {
    const batch = createImportBatch({ batchName: "test" });
    const h1 = computeImportKeyingHash(batch);
    const h2 = computeImportKeyingHash(batch);
    expect(h1).toBe(h2);
  });
});
