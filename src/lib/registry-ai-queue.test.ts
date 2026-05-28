import { describe, it, expect } from "vitest";
import {
  createDefaultAiState,
  normalizeRegistryToken,
  tokenizeRegistryValue,
  computeRegistryMatchScore,
  getRegistryCanonicalSuggestions,
  rebuildRegistryAiReviewQueue,
  approveRegistryAiMapping,
  rejectRegistryAiMapping,
  getRegistryAiStatusLabel,
  type RegistryAiState,
} from "@/lib/registry-ai-queue";
import type { RegistryFieldConfig } from "@/lib/registry-groups";

function makeField(overrides: Partial<RegistryFieldConfig>): RegistryFieldConfig {
  return {
    scope: "student",
    key: "testField",
    label: "Test Field",
    source: "system",
    type: "text",
    groupKey: "other",
    order: 1,
    aliases: [],
    status: "active",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("normalizeRegistryToken", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeRegistryToken("Student Name!")).toBe("student name");
  });

  it("collapses whitespace", () => {
    expect(normalizeRegistryToken("  hello   world  ")).toBe("hello world");
  });

  it("handles empty string", () => {
    expect(normalizeRegistryToken("")).toBe("");
  });
});

describe("tokenizeRegistryValue", () => {
  it("splits into tokens", () => {
    expect(tokenizeRegistryValue("Student Name")).toEqual(["student", "name"]);
  });
});

describe("computeRegistryMatchScore", () => {
  const state = createDefaultAiState();
  const field = makeField({ key: "studentName", label: "Student Name", aliases: ["full name"] });

  it("exact key match scores 100", () => {
    const result = computeRegistryMatchScore("studentName", field, state);
    expect(result.score).toBe(100);
  });

  it("exact label match scores 95", () => {
    const result = computeRegistryMatchScore("Student Name", field, state);
    expect(result.score).toBe(95);
  });

  it("exact alias match scores 85", () => {
    const result = computeRegistryMatchScore("full name", field, state);
    expect(result.score).toBe(85);
  });

  it("previously approved mapping scores 100", () => {
    const s: RegistryAiState = { ...state, approvedMappings: { "myheader": "studentName" } };
    const result = computeRegistryMatchScore("my_header", field, s);
    expect(result.score).toBe(100);
  });

  it("previously rejected mapping scores -80", () => {
    const s: RegistryAiState = { ...state, rejectedMappings: { "myheader": ["studentName"] } };
    const result = computeRegistryMatchScore("my_header", field, s);
    expect(result.score).toBe(-80);
  });

  it("high token overlap scores > 75", () => {
    const result = computeRegistryMatchScore("Student Name", field, state);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });
});

describe("getRegistryCanonicalSuggestions", () => {
  it("returns top 5 sorted suggestions", () => {
    const fields = [
      makeField({ key: "studentName", label: "Student Name" }),
      makeField({ key: "fatherName", label: "Father Name" }),
      makeField({ key: "email", label: "Email" }),
    ];
    const state = createDefaultAiState();
    const results = getRegistryCanonicalSuggestions("Student Name", fields, state);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].field.key).toBe("studentName");
  });

  it("returns empty when below minimum score", () => {
    const fields = [makeField({ key: "zzz", label: "Unrelated Field" })];
    const state = { ...createDefaultAiState(), minimumScore: 100 };
    const results = getRegistryCanonicalSuggestions("Student Name", fields, state);
    expect(results).toHaveLength(0);
  });
});

describe("rebuildRegistryAiReviewQueue", () => {
  it("produces queue items from detected headers", () => {
    const fields = [
      makeField({ key: "studentName", label: "Student Name" }),
      makeField({ key: "email", label: "Email" }),
    ];
    const state = createDefaultAiState();
    const next = rebuildRegistryAiReviewQueue(["Student Name", "email", "unknown_field"], fields, state);
    expect(next.reviewQueue.length).toBe(1);
    expect(next.reviewQueue[0].type).toBe("unmapped");
    expect(next.diagnostics.unmapped).toBe(1);
  });
});

describe("approveRegistryAiMapping", () => {
  it("adds to approvedMappings and learnedAliases", () => {
    const state = createDefaultAiState();
    const next = approveRegistryAiMapping("student_name", "studentName", state);
    expect(next.approvedMappings["studentname"]).toBe("studentName");
    expect(next.learnedAliases["studentname"]).toContain("studentName");
  });

  it("clears from rejectedMappings if present", () => {
    const state: RegistryAiState = { ...createDefaultAiState(), rejectedMappings: { "studentname": ["studentName"] } };
    const next = approveRegistryAiMapping("student_name", "studentName", state);
    expect(next.rejectedMappings["studentname"]).toBeUndefined();
  });
});

describe("rejectRegistryAiMapping", () => {
  it("adds to rejectedMappings", () => {
    const state = createDefaultAiState();
    const next = rejectRegistryAiMapping("student_name", "oldField", state);
    expect(next.rejectedMappings["studentname"]).toContain("oldField");
  });

  it("does not duplicate", () => {
    const state: RegistryAiState = { ...createDefaultAiState(), rejectedMappings: { "student_name": ["oldField"] } };
    const next = rejectRegistryAiMapping("student_name", "oldField", state);
    expect(next.rejectedMappings["student_name"]).toHaveLength(1);
  });
});

describe("getRegistryAiStatusLabel", () => {
  it("shows disabled when not enabled", () => {
    const state = createDefaultAiState();
    expect(getRegistryAiStatusLabel({ ...state, enabled: false }).text).toBe("Disabled");
  });

  it("shows pending count when queue exists", () => {
    const state: RegistryAiState = { ...createDefaultAiState(), reviewQueue: [{ id: "test-1", type: "unmapped", detectedHeader: "x", confidence: 0, suggestions: [] }] };
    expect(getRegistryAiStatusLabel(state).text).toBe("1 pending");
  });
});
