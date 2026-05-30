import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: "user-1" } }, error: null })) },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({ limit: vi.fn(async () => ({ data: [], error: null })) })),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
        maybeSingle: vi.fn(async () => ({ data: null, error: null })),
      })),
      insert: vi.fn(async () => ({ data: null, error: null })),
      update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
    })),
  },
}));

vi.mock("@/lib/app-sync", () => ({ emitAppSync: vi.fn() }));
vi.mock("@/lib/supabase-health", () => ({ tableExists: vi.fn(async () => false), tablesExist: vi.fn(async () => true) }));
vi.mock("@/lib/header-registry", () => ({ trackFetchedHeader: vi.fn() }));
vi.mock("@/lib/import-engine", async (importOrig) => {
  const actual = await importOrig();
  return {
    ...(actual as any),
    getModule: () => ({
      id: "students",
      adapter: { loadExistingRecords: async () => [] },
      matchStrategies: [{ id: "reg_umis_emis", label: "Registration / UMIS / EMIS" }],
    }),
    getAllModuleDescriptors: () => [],
    bootstrapImportEngine: async () => {},
    createImportPipelineState: () => ({}),
    refreshCanonicalPipelineState: () => {},
    invalidateImportDownstream: () => {},
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  if (typeof localStorage !== "undefined") localStorage.clear();
});

describe("buildAutoMappingReport — custom fields in dropdown", () => {
  it("maps matching custom fields", async () => {
    const { buildAutoMappingReport } = await import("./student-import");

    const customFields = [
      { id: "cf-1", key: "aadhaar", label: "Aadhaar Number", type: "text" as const, options: [], defaultValue: "", aliases: ["aadhaar number", "uid"], version: 1, notes: "", createdAt: "", updatedAt: "" },
      { id: "cf-2", key: "bpl_id", label: "BPL ID", type: "text" as const, options: [], defaultValue: "", aliases: ["bpl"], version: 1, notes: "", createdAt: "", updatedAt: "" },
    ];

    const report = buildAutoMappingReport(
      ["Aadhaar Number", "Some Unknown Col", "First Name"],
      customFields,
      {},
    );

    expect(report.mapping["Aadhaar Number"]).toBe("custom:cf-1");
    expect(report.mapping["Some Unknown Col"]).toBe("ignore");
    expect(report.mapping["First Name"]).toBe("firstName");
  });

  it("respects preferredBindings over auto-mapping", async () => {
    const { buildAutoMappingReport } = await import("./student-import");

    const customFields = [
      { id: "cf-1", key: "aadhaar", label: "Aadhaar Number", type: "text" as const, options: [], defaultValue: "", aliases: ["aadhaar number"], version: 1, notes: "", createdAt: "", updatedAt: "" },
    ];

    const report = buildAutoMappingReport(
      ["Aadhaar Number"],
      customFields,
      { preferredBindings: { "Aadhaar Number": "ignore" } },
    );

    expect(report.mapping["Aadhaar Number"]).toBe("ignore");
  });
});

describe("buildImportPreview — transfer rules affect defaultAction", () => {
  const makeParsedFile = () => ({
    fileName: "test.csv",
    sourceType: "csv" as const,
    sheetName: "Sheet1",
    headers: ["admissionNo", "regno", "firstName", "lastName", "dob", "grade"],
    rows: [
      { admissionNo: "ADM-001", regno: "ADM-001", firstName: "Alice", lastName: "Smith", dob: "2010-01-01", grade: "5" },
    ],
  });

  const existingRow = {
    id: "existing-1",
    admission_no: "ADM-001",
    display_name: "Alice Smith",
    first_name: "Alice",
    last_name: "Smith",
    dob: "2010-01-01",
    gender: "female",
    grade: "5",
    section: "A",
    status: "active",
    umis_id: "UMIS-001",
    emis_id: "EMIS-001",
    roll_number: 10,
    meta: null,
    created_by: null,
    updated_by: null,
    created_at: "",
    updated_at: "",
  };

  it("inserts when no match found and rule allows new entries", async () => {
    const { buildImportPreview } = await import("./student-import");
    const preview = buildImportPreview(makeParsedFile(), { admissionNo: "admissionNo", regno: "regno", firstName: "firstName", lastName: "lastName", dob: "dob", grade: "grade" }, [], {
      design: "reg_umis_emis" as any,
      threshold: 88,
      rule: "New Entry Only" as any,
    });
    expect(preview.rows[0].defaultAction).toBe("insert");
  });

  it("skips when no match found and rule is Update Existing Only", async () => {
    const { buildImportPreview } = await import("./student-import");
    const preview = buildImportPreview(makeParsedFile(), { admissionNo: "admissionNo", regno: "regno", firstName: "firstName", lastName: "lastName", dob: "dob", grade: "grade" }, [], {
      design: "reg_umis_emis" as any,
      threshold: 88,
      rule: "Update Existing Only" as any,
    });
    expect(preview.rows[0].defaultAction).toBe("skip");
  });

  it("skips when exact match found and rule is New Entry Only", async () => {
    const { buildImportPreview } = await import("./student-import");
    const preview = buildImportPreview(makeParsedFile(), { admissionNo: "admissionNo", regno: "regno", firstName: "firstName", lastName: "lastName", dob: "dob", grade: "grade" }, [existingRow as any], {
      design: "reg_umis_emis" as any,
      threshold: 88,
      rule: "New Entry Only" as any,
    });
    expect(preview.rows[0].defaultAction).toBe("skip");
  });

  it("updates when exact match found and rule is Update Existing Only", async () => {
    const { buildImportPreview } = await import("./student-import");
    const preview = buildImportPreview(makeParsedFile(), { admissionNo: "admissionNo", regno: "regno", firstName: "firstName", lastName: "lastName", dob: "dob", grade: "grade" }, [existingRow as any], {
      design: "reg_umis_emis" as any,
      threshold: 88,
      rule: "Update Existing Only" as any,
    });
    expect(preview.rows[0].defaultAction).toBe("update");
  });

  it("inserts when no match found and rule is Upsert", async () => {
    const { buildImportPreview } = await import("./student-import");
    const preview = buildImportPreview(makeParsedFile(), { admissionNo: "admissionNo", regno: "regno", firstName: "firstName", lastName: "lastName", dob: "dob", grade: "grade" }, [], {
      design: "reg_umis_emis" as any,
      threshold: 88,
      rule: "Upsert" as any,
    });
    expect(preview.rows[0].defaultAction).toBe("insert");
  });
});

describe("ensureStudentExists — 409 recovery", () => {
  it("creates student when none exists", async () => {
    const supabase = (await import("@/integrations/supabase/client")).supabase;
    const mockSingle = vi.fn().mockResolvedValue({ data: { id: "new-id" }, error: null });

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockSingle })),
      })),
    });

    const { ensureStudentExists } = await import("./student-records");
    const id = await ensureStudentExists("ADM-999");
    expect(id).toBe("new-id");
  });

  it("returns existing id on 23505 duplicate and retries", async () => {
    const supabase = (await import("@/integrations/supabase/client")).supabase;
    let callCount = 0;

    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => {
            callCount++;
            return { data: callCount === 1 ? null : { id: "retry-id" }, error: null };
          }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: null, error: { code: "23505", status: 409, message: "duplicate key", details: "" } })),
        })),
      })),
    });

    const { ensureStudentExists } = await import("./student-records");
    const id = await ensureStudentExists("ADM-999");
    expect(id).toBe("retry-id");
    expect(callCount).toBe(2);
  });

  it("deduplicates concurrent calls with same admissionNo", async () => {
    const supabase = (await import("@/integrations/supabase/client")).supabase;

    let selectCount = 0;
    (supabase.from as any).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => {
            selectCount++;
            return { data: null, error: null };
          }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(async () => ({ data: { id: "deduped-id" }, error: null })),
        })),
      })),
    });

    const { ensureStudentExists } = await import("./student-records");
    const [id1, id2] = await Promise.all([
      ensureStudentExists("ADM-999"),
      ensureStudentExists("ADM-999"),
    ]);

    expect(id1).toBe("deduped-id");
    expect(id2).toBe("deduped-id");
    expect(selectCount).toBe(1);
  });
});
