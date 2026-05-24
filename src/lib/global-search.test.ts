import { describe, expect, it } from "vitest";
import { performGlobalSearch } from "./global-search";

describe("performGlobalSearch", () => {
  it("returns empty array for empty query", () => {
    expect(performGlobalSearch("")).toEqual([]);
    expect(performGlobalSearch("   ")).toEqual([]);
  });

  it("finds modules by title match", () => {
    const results = performGlobalSearch("Fees");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.title.includes("Fees") || r.title.includes("Payments"))).toBe(true);
  });

  it("finds modules by partial match", () => {
    const results = performGlobalSearch("attend");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.title.toLowerCase().includes("attend"))).toBe(true);
  });

  it("returns results ordered by score descending", () => {
    const results = performGlobalSearch("student");
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it("limits results to 12 items", () => {
    const results = performGlobalSearch("a");
    expect(results.length).toBeLessThanOrEqual(12);
  });

  it("returns search results with url", () => {
    const results = performGlobalSearch("import");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r).toHaveProperty("title");
      expect(r).toHaveProperty("section");
      expect(r).toHaveProperty("score");
    });
  });
});
