import { describe, it, expect } from "vitest";
import type { LegacyStudentQuery } from "./studentReadAdapter";

describe("LegacyStudentQuery", () => {
  it("accepts all filter combinations", () => {
    const query: LegacyStudentQuery = {
      class: "Class 10",
      section: "A",
      status: "active",
      search: "John",
      limit: 50,
      offset: 0,
    };
    expect(query.class).toBe("Class 10");
    expect(query.section).toBe("A");
    expect(query.limit).toBe(50);
  });

  it("works with partial filters", () => {
    const query: LegacyStudentQuery = { search: "test" };
    expect(query.search).toBe("test");
  });

  it("works with empty filters", () => {
    const query: LegacyStudentQuery = {};
    expect(Object.keys(query)).toHaveLength(0);
  });
});
