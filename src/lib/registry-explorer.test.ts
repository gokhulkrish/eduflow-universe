import { describe, it, expect, beforeEach } from "vitest";
import { getCanonicalRegistryCatalog } from "@/lib/canonical-student-fields";
import { getHeaderFieldEntries } from "@/lib/registry-groups";
import {
  getFieldRegistryEntries,
  getOrderedRegistryFieldsForScope,
  getRegistryMetricsForActiveScope,
  getExplorerFilteredFields,
  type ExplorerFilterOptions,
} from "@/lib/registry-explorer";

beforeEach(() => {
  try { localStorage.clear(); } catch {}
});

describe("getFieldRegistryEntries", () => {
  it("returns canonical fields merged with stored fields", () => {
    const entries = getFieldRegistryEntries("student");
    expect(entries.length).toBeGreaterThanOrEqual(118);
  });

  it("filters by includeStatuses", () => {
    const entries = getFieldRegistryEntries("student", { includeStatuses: ["active"] });
    for (const e of entries) {
      expect(e.status).toBe("active");
    }
  });
});

describe("getOrderedRegistryFieldsForScope", () => {
  it("returns fields sorted by order", () => {
    const ordered = getOrderedRegistryFieldsForScope("student");
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].order).toBeGreaterThanOrEqual(ordered[i - 1].order);
    }
  });

  it("repairs duplicate order values", () => {
    const entries = getOrderedRegistryFieldsForScope("student", { includeStatuses: ["active", "hidden", "deprecated"] });
    const orders = entries.map(e => e.order);
    const unique = new Set(orders);
    expect(unique.size).toBe(entries.length);
  });
});

describe("getRegistryMetricsForActiveScope", () => {
  it("returns all metric fields with correct types", () => {
    const metrics = getRegistryMetricsForActiveScope();
    expect(metrics).toHaveProperty("total");
    expect(metrics).toHaveProperty("active");
    expect(metrics).toHaveProperty("system");
    expect(metrics).toHaveProperty("custom");
    expect(metrics).toHaveProperty("canonical");
    expect(metrics).toHaveProperty("detected");
    expect(metrics).toHaveProperty("mapped");
    expect(metrics).toHaveProperty("reviewCount");
    expect(metrics.total).toBeGreaterThanOrEqual(118);
    expect(metrics.canonical).toBe(118);
  });
});

describe("getExplorerFilteredFields", () => {
  const fields = getCanonicalRegistryCatalog();

  it("returns all fields when no filters", () => {
    const result = getExplorerFilteredFields(fields, {});
    expect(result.length).toBe(fields.length);
  });

  it("filters by group", () => {
    const result = getExplorerFilteredFields(fields, { groups: ["basicInfo"] });
    for (const f of result) {
      expect(f.groupKey).toBe("basicInfo");
    }
  });

  it("filters by status", () => {
    const result = getExplorerFilteredFields(fields, { statuses: ["active"] });
    for (const f of result) {
      expect(f.status).toBe("active");
    }
  });

  it("filters by source", () => {
    const result = getExplorerFilteredFields(fields, { sources: ["Base"] });
    for (const f of result) {
      expect(f.source === "system").toBeTruthy();
    }
  });

  it("filters by search query on label", () => {
    const result = getExplorerFilteredFields(fields, { search: "Student Name" });
    expect(result.length).toBeGreaterThanOrEqual(1);
    expect(result.some(f => f.label.toLowerCase().includes("student name"))).toBeTruthy();
  });

  it("ignores search query shorter than 2 chars", () => {
    const result = getExplorerFilteredFields(fields, { search: "a" });
    expect(result.length).toBe(fields.length);
  });

  it("combines multiple filters", () => {
    const result = getExplorerFilteredFields(fields, {
      groups: ["basicInfo"],
      statuses: ["active"],
      sources: ["Base"],
    });
    for (const f of result) {
      expect(f.groupKey).toBe("basicInfo");
      expect(f.status).toBe("active");
    }
  });
});
