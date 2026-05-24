import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(async () => ({ data: [], error: null })),
          })),
        })),
      })),
      insert: vi.fn(async () => ({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
    })),
  },
}));

vi.mock("@/lib/app-sync", () => ({
  emitAppSync: vi.fn(),
}));

vi.mock("@/lib/student-records", () => ({
  studentRegisterSyncKey: "student-register-sync-key",
}));

vi.mock("@/lib/supabase-health", () => ({
  tableExists: vi.fn(async () => false),
  tablesExist: vi.fn(async () => true),
}));

vi.mock("@/lib/header-registry", () => ({
  trackFetchedHeader: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("student import mapping engine", () => {
  it("keeps preferred bindings when multiple headers map to the same target", async () => {
    const { buildAutoMappingReport } = await import("./student-import");

    const report = buildAutoMappingReport(
      ["Email Address", "Primary Email", "First Name"],
      [],
      {
        preferredBindings: {
          "Primary Email": "email",
        },
      },
    );

    expect(report.mapping["Primary Email"]).toBe("email");
    expect(report.mapping["Email Address"]).toBe("ignore");
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].keptHeader).toBe("Primary Email");
    expect(report.conflicts[0].droppedHeaders).toContain("Email Address");
  });

  it("auto-maps distinct fields without duplicate target ownership", async () => {
    const { buildAutoMapping } = await import("./student-import");

    const mapping = buildAutoMapping(["Email Address", "Phone Number", "First Name"], []);
    const occupiedTargets = Object.values(mapping).filter((target) => target !== "ignore");

    expect(occupiedTargets).toContain("email");
    expect(occupiedTargets).toContain("phone");
    expect(new Set(occupiedTargets).size).toBe(occupiedTargets.length);
  });
});
