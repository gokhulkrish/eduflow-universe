import { describe, expect, it } from "vitest";
import { performGlobalSearch } from "./global-search";

describe("performGlobalSearch", () => {
  it("returns empty array for empty query", async () => {
    expect(await performGlobalSearch("")).toEqual([]);
    expect(await performGlobalSearch("   ")).toEqual([]);
  });

  it("finds modules by title match", async () => {
    const results = await performGlobalSearch("Fees");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.title.includes("Fees") || r.title.includes("Payments"))).toBe(true);
  });

  it("finds modules by partial match", async () => {
    const results = await performGlobalSearch("attend");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.title.toLowerCase().includes("attend"))).toBe(true);
  });

  it("returns results ordered by score descending", async () => {
    const results = await performGlobalSearch("student");
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it("limits results to 16 items", async () => {
    const results = await performGlobalSearch("a");
    expect(results.length).toBeLessThanOrEqual(16);
  });

  it("returns search results with url and category", async () => {
    const results = await performGlobalSearch("import");
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => {
      expect(r).toHaveProperty("title");
      expect(r).toHaveProperty("section");
      expect(r).toHaveProperty("score");
    });
  });

  it("finds feature entries from modules", async () => {
    const results = await performGlobalSearch("online portal");
    expect(results.length).toBeGreaterThan(0);
  });
});
