import { describe, it, expect, beforeEach } from "vitest";
import {
  CANONICAL_STUDENT_FIELDS_SEED,
  ensureCanonicalStudentFields,
  loadCanonicalStudentFieldsFromStorage,
  getCanonicalFieldByKey,
  getCanonicalFieldsByGroup,
  getCanonicalGroupLabels,
  getCanonicalRegistryCatalog,
  getCanonicalRegistryCatalogFromSeed,
  canonicalFieldToRegistryConfig,
  getHeaderRegistryStudioDetectedEntries,
  exportDetectedHeadersToCsv,
} from "@/lib/canonical-student-fields";
import { rebuildRegistryAiReviewQueue, loadRegistryAiState, saveRegistryAiState, approveRegistryAiMapping, createDefaultAiState } from "@/lib/registry-ai-queue";

beforeEach(() => {
  try { localStorage.clear(); } catch {}
});

describe("CANONICAL_STUDENT_FIELDS_SEED", () => {
  it("has 118 fields", () => {
    expect(CANONICAL_STUDENT_FIELDS_SEED).toHaveLength(118);
  });

  it("all fields have required properties", () => {
    for (const f of CANONICAL_STUDENT_FIELDS_SEED) {
      expect(f.id).toBeTruthy();
      expect(f.module).toBe("student");
      expect(f.key).toBeTruthy();
      expect(f.label).toBeTruthy();
      expect(f.group).toBeTruthy();
      expect(["text", "number", "date", "textarea", "select"]).toContain(f.type);
      expect(f.status).toBe("active");
      expect(f.source).toBe("base");
      expect(typeof f.order).toBe("number");
      expect(Array.isArray(f.aliases)).toBe(true);
    }
  });

  it("all keys are unique", () => {
    const keys = CANONICAL_STUDENT_FIELDS_SEED.map((f) => f.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("all ids match their keys", () => {
    for (const f of CANONICAL_STUDENT_FIELDS_SEED) {
      expect(f.id).toBe(f.key);
    }
  });

  it("orders are unique within each group", () => {
    const groups = new Map<string, number[]>();
    for (const f of CANONICAL_STUDENT_FIELDS_SEED) {
      const list = groups.get(f.group) ?? [];
      list.push(f.order);
      groups.set(f.group, list);
    }
    for (const [group, orders] of groups) {
      expect(new Set(orders).size, `${group} has duplicate orders`).toBe(orders.length);
    }
  });

  it("has 14 populated groups (Scholarship Information reserved for future)", () => {
    const actual = [...new Set(CANONICAL_STUDENT_FIELDS_SEED.map((f) => f.group))].sort();
    expect(actual).toEqual([
      "Academic Information",
      "Banking Information",
      "Basic Information",
      "Contact Information",
      "Course Information",
      "Documents & Identity",
      "Family Information",
      "General Information",
      "Head of the Institute",
      "Hostel Information",
      "Institute Information",
      "Nodal Officer",
      "Other Information",
      "Personal Information",
    ]);
  });


});

describe("ensureCanonicalStudentFields", () => {
  it("seeds localStorage on first call", () => {
    expect(loadCanonicalStudentFieldsFromStorage()).toBeNull();
    const result = ensureCanonicalStudentFields();
    expect(result).toHaveLength(118);
    expect(loadCanonicalStudentFieldsFromStorage()).toHaveLength(118);
  });

  it("returns existing data on subsequent calls", () => {
    const first = ensureCanonicalStudentFields();
    const second = ensureCanonicalStudentFields();
    expect(first).toEqual(second);
  });
});

describe("getCanonicalFieldByKey", () => {
  it("finds field by key", () => {
    expect(getCanonicalFieldByKey("studentname")?.label).toBe("Student Name");
  });

  it("returns undefined for missing key", () => {
    expect(getCanonicalFieldByKey("nonexistent")).toBeUndefined();
  });
});

describe("getCanonicalFieldsByGroup", () => {
  it("returns fields for a group sorted by order", () => {
    const fields = getCanonicalFieldsByGroup("Basic Information");
    expect(fields.length).toBeGreaterThan(0);
    for (let i = 1; i < fields.length; i++) {
      expect(fields[i].order).toBeGreaterThan(fields[i - 1].order);
    }
  });

  it("returns empty for unused group", () => {
    expect(getCanonicalFieldsByGroup("Scholarship Information")).toHaveLength(0);
  });
});

describe("getCanonicalGroupLabels", () => {
  it("returns all groups that have fields", () => {
    const labels = getCanonicalGroupLabels();
    expect(labels).toContain("Basic Information");
    expect(labels).toContain("Nodal Officer");
    expect(labels).not.toContain("Scholarship Information");
  });
});

describe("canonicalFieldToRegistryConfig", () => {
  it("converts a canonical field to RegistryFieldConfig", () => {
    const result = canonicalFieldToRegistryConfig(CANONICAL_STUDENT_FIELDS_SEED[0]);
    expect(result.scope).toBe("student");
    expect(result.key).toBe("studentname");
    expect(result.source).toBe("system");
    expect(result.type).toBe("text");
    expect(result.groupKey).toBe("basicInfo");
  });

  it("maps select to enum", () => {
    const field = CANONICAL_STUDENT_FIELDS_SEED.find((f) => f.type === "select")!;
    const result = canonicalFieldToRegistryConfig(field);
    expect(result.type).toBe("enum");
  });

  it("maps textarea to text", () => {
    const field = CANONICAL_STUDENT_FIELDS_SEED.find((f) => f.type === "textarea")!;
    const result = canonicalFieldToRegistryConfig(field);
    expect(result.type).toBe("text");
  });

  it("preserves options on select fields", () => {
    const field = CANONICAL_STUDENT_FIELDS_SEED.find((f) => f.type === "select")!;
    const result = canonicalFieldToRegistryConfig(field);
    expect(result.options).toEqual(field.options);
  });
});

describe("getCanonicalRegistryCatalog / getCanonicalRegistryCatalogFromSeed", () => {
  it("returns converted fields from seed", () => {
    const catalog = getCanonicalRegistryCatalogFromSeed();
    expect(catalog).toHaveLength(118);
    expect(catalog[0].groupKey).toBe("basicInfo");
  });

  it("returns seeded fields from storage", () => {
    const catalog = getCanonicalRegistryCatalog();
    expect(catalog).toHaveLength(118);
    expect(catalog[0].groupKey).toBe("basicInfo");
  });

  it("bridged catalog is reusable for AI queue", () => {
    const catalog = getCanonicalRegistryCatalogFromSeed();
    for (const f of catalog) {
      expect(f).toHaveProperty("key");
      expect(f).toHaveProperty("label");
      expect(f).toHaveProperty("aliases");
      expect(f).toHaveProperty("groupKey");
    }
  });
});

// ── Integration: Pipeline End-to-End ────────────────────────────────

describe("detected headers export", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch {}
  });

  it("returns empty array when no fetched headers exist", () => {
    const entries = getHeaderRegistryStudioDetectedEntries("student");
    expect(entries).toEqual([]);
  });

  it("returns entries from localStorage fetched headers", () => {
    localStorage.setItem(
      "sms.header-registry.fetched-headers.v1",
      JSON.stringify([
        { name: "Student Name", label: "Student Name", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 1 },
        { name: "Roll Number", label: "Roll Number", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 2 },
      ])
    );
    const entries = getHeaderRegistryStudioDetectedEntries("student");
    expect(entries).toHaveLength(2);
    expect(entries[0].label).toBe("Student Name");
    expect(entries[0].key).toBe("student_name");
    expect(entries[1].label).toBe("Roll Number");
    expect(entries[1].key).toBe("roll_number");
  });

  it("enriches entries with meta when available", () => {
    localStorage.setItem(
      "sms.header-registry.fetched-headers.v1",
      JSON.stringify([{ name: "DOB", label: "Date of Birth", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 1 }])
    );
    localStorage.setItem(
      "sms.header-registry.fetched-meta.v1",
      JSON.stringify({ DOB: { label: "Date of Birth", type: "date" } })
    );
    const entries = getHeaderRegistryStudioDetectedEntries("student");
    expect(entries[0].type).toBe("date");
  });

  it("exportDetectedHeadersToCsv produces well-formed CSV", () => {
    localStorage.setItem(
      "sms.header-registry.fetched-headers.v1",
      JSON.stringify([
        { name: "Student Name", label: "Student Name", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 1 },
        { name: "email", label: "email", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 1 },
      ])
    );
    const csv = exportDetectedHeadersToCsv("student");
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("label,key,group,type,status");
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("student_name");
    expect(lines[2]).toContain("email");
  });
});

describe("full pipeline integration", () => {
  beforeEach(() => {
    try { localStorage.clear(); } catch {}
  });

  it("bootstrap → canonical fields → AI queue works end-to-end", () => {
    // Step 1: Bootstrap seeds canonical fields
    const seeded = ensureCanonicalStudentFields();
    expect(seeded.length).toBe(118);
    expect(loadCanonicalStudentFieldsFromStorage()).toHaveLength(118);

    // Step 2: Simulate detected headers from import
    localStorage.setItem(
      "sms.header-registry.fetched-headers.v1",
      JSON.stringify([
        { name: "Student Name", label: "Student Name", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 1 },
        { name: "Email Address", label: "Email Address", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 1 },
        { name: "Unknown Field XYZ", label: "Unknown Field XYZ", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 1 },
      ])
    );

    // Step 3: Export detected headers as CSV
    const csv = exportDetectedHeadersToCsv("student");
    expect(csv).toContain("Student Name");
    expect(csv).toContain("Email Address");
    expect(csv).toContain("Unknown Field XYZ");

    // Step 4: Canonical catalog is compatible with AI queue
    const catalog = getCanonicalRegistryCatalog();
    const detectedNames = ["Student Name", "Email Address", "Unknown Field XYZ"];
    const state = createDefaultAiState();
    const nextState = rebuildRegistryAiReviewQueue(detectedNames, catalog, state);

    // Step 5: AI queue produces correct classifications
    expect(nextState.reviewQueue.length).toBeGreaterThanOrEqual(1);
    const studentNameItem = nextState.reviewQueue.find(i => i.detectedHeader === "Student Name");
    expect(studentNameItem).toBeDefined();
    expect(studentNameItem!.confidence).toBeGreaterThan(50);

    // Step 6: Approve a mapping
    if (studentNameItem && studentNameItem.suggestions.length > 0) {
      const bestKey = studentNameItem.suggestions[0].field.key;
      const approved = approveRegistryAiMapping("Student Name", bestKey, nextState);
      expect(approved.approvedMappings).toHaveProperty("student name");
      expect(approved.approvedMappings["student name"]).toBe(bestKey);
    }
  });

  it("CSV output matches generator input format", () => {
    localStorage.setItem(
      "sms.header-registry.fetched-headers.v1",
      JSON.stringify([
        { name: "Student Name", label: "Student Name", firstSeen: "2024-01-01", lastSeen: "2024-01-01", matchCount: 1 },
      ])
    );
    const csv = exportDetectedHeadersToCsv("student");
    const lines = csv.trim().split("\n");
    expect(lines[0]).toBe("label,key,group,type,status");
    const cols = lines[1].split(",");
    expect(cols).toHaveLength(5);
    expect(cols[0]).toBe("Student Name");
    expect(cols[1]).toBe("student_name");
  });
});
