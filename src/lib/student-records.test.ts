import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, rpcMock, tableExistsMock, getUserMock, emitAppSyncMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  rpcMock: vi.fn(),
  tableExistsMock: vi.fn(),
  getUserMock: vi.fn(),
  emitAppSyncMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
    rpc: rpcMock,
    auth: {
      getUser: getUserMock,
    },
  },
}));

vi.mock("@/lib/supabase-health", () => ({
  tableExists: tableExistsMock,
  tablesExist: vi.fn(async () => true),
}));

vi.mock("@/lib/app-sync", () => ({
  emitAppSync: emitAppSyncMock,
}));

const makeOrderResult = (result: unknown) => ({
  order: vi.fn(() => Promise.resolve(result)),
});

const makeSelectResult = (result: unknown) => Promise.resolve(result);

describe("student records register loading", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tableExistsMock.mockImplementation(async () => true);
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("prefers the student_register view", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "student_register") {
        return {
          select: vi.fn(() =>
            makeOrderResult({
              data: [
                {
                  student_id: "stu-1",
                  display_name: "Asha Kumar",
                  first_name: "Asha",
                  last_name: "Kumar",
                  admission_no: "ADM-1",
                  grade: "Grade 8",
                  section: "B",
                  roll_number: 12,
                  attendance_percent: 92,
                  fee_status: "paid",
                  status: "active",
                  updated_at: "2026-05-24T18:30:00Z",
                  email: "asha@example.com",
                  house: "North",
                  guardian_name: "Ravi Kumar",
                  guardian_phone: "9999999999",
                  community: "BC",
                  district: "Madurai",
                },
              ],
              error: null,
            }),
          ),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const { fetchStudentRegister } = await import("./student-records");
    await expect(fetchStudentRegister()).resolves.toEqual([
      {
        id: "stu-1",
        student_id: "stu-1",
        display_name: "Asha Kumar",
        first_name: "Asha",
        last_name: "Kumar",
        admission_no: "ADM-1",
        regno: "ADM-1",
        grade: "Grade 8",
        section: "B",
        roll_number: 12,
        attendance_percent: 92,
        fee_status: "paid",
        status: "active",
        updated_at: "2026-05-24T18:30:00Z",
        email: "asha@example.com",
        dob: null,
        gender: null,
        blood_group: null,
        phone: null,
        house: "North",
        guardian_name: "Ravi Kumar",
        guardian_phone: "9999999999",
        community: "BC",
        district: "Madurai",
        academic_year: null,
        stream: null,
      },
    ]);
  });

  it("falls back to students when the view is not compatible", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "student_register") {
        return {
          select: vi.fn(() =>
            makeOrderResult({
              data: null,
              error: {
                code: "42703",
                message: "column enrollments.section_id does not exist",
              },
            }),
          ),
        };
      }

      if (table === "students") {
        return {
          select: vi.fn(() =>
            makeOrderResult({
              data: [
                {
                  id: "stu-2",
                  admission_no: "ADM-2",
                  first_name: "Riya",
                  last_name: "Sharma",
                  grade: null,
                  section: null,
                  roll_number: null,
                  status: "active",
                  updated_at: "2026-05-24T19:00:00Z",
                  email: "riya@example.com",
                  meta: {
                    academic: {
                      grade: "Grade 10",
                      section: "C",
                      roll: "7",
                      house: "South",
                    },
                    family: {
                      guardianName: "Suresh Sharma",
                      guardianPhone: "8888888888",
                    },
                  },
                  attendance_percent: 0,
                  fee_status: null,
                  dob: null,
                  gender: null,
                  blood_group: null,
                  phone: null,
                  community: null,
                  district: null,
                },
              ],
              error: null,
            }),
          ),
        };
      }

      if (table === "attendance") {
        return {
          select: vi.fn(() =>
            makeSelectResult({
              data: [
                { student_id: "stu-2", status: "present", date: "2026-05-24", created_at: "2026-05-24T19:00:00Z" },
                { student_id: "stu-2", status: "absent", date: "2026-05-23", created_at: "2026-05-23T19:00:00Z" },
              ],
              error: null,
            }),
          ),
        };
      }

      if (table === "fee_invoices") {
        return {
          select: vi.fn(() =>
            makeSelectResult({
              data: [
                { student_id: "stu-2", status: "overdue", amount: 1000, amount_paid: 0, created_at: "2026-05-24T18:00:00Z" },
              ],
              error: null,
            }),
          ),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const { fetchStudentRegister } = await import("./student-records");
    await expect(fetchStudentRegister()).resolves.toEqual([
      {
        id: "stu-2",
        student_id: "stu-2",
        display_name: "Riya Sharma",
        first_name: "Riya",
        last_name: "Sharma",
        admission_no: "ADM-2",
        regno: "ADM-2",
        grade: "Grade 10",
        section: "C",
        roll_number: 7,
        attendance_percent: 50,
        fee_status: "overdue",
        status: "active",
        updated_at: "2026-05-24T19:00:00Z",
        email: "riya@example.com",
        dob: null,
        gender: null,
        blood_group: null,
        phone: null,
        house: "South",
        guardian_name: "Suresh Sharma",
        guardian_phone: "8888888888",
        community: null,
        district: null,
        academic_year: null,
        stream: null,
      },
    ]);
  });
});

describe("student records bulk delete", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tableExistsMock.mockImplementation(async (table: string) => table === "students" || table === "audit_log");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpcMock.mockImplementation(async (_fn: string, { student_id }: { student_id: string }) => {
      if (student_id === "stu-2") {
        return {
          error: {
            code: "42501",
            message: "Only administrators can permanently delete student records.",
          },
        };
      }

      return { error: null };
    });
  });

  it("continues deleting remaining rows when one deletion fails", async () => {
    const progressStatuses: string[] = [];
    fromMock.mockImplementation((table: string) => {
      if (table === "audit_log") {
        return {
          insert: vi.fn(async () => ({ error: null })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const { deleteStudentRecords } = await import("./student-records");
    await expect(deleteStudentRecords(["stu-1", "stu-2", "stu-3"], {
      onProgress: (progress) => progressStatuses.push(progress.status),
      progressLabel: "Deleting permanently",
    })).resolves.toEqual({
      deletedIds: ["stu-1", "stu-3"],
      failures: [
        {
          id: "stu-2",
          error: expect.stringContaining("Only administrators can permanently delete student records."),
        },
      ],
    });
    expect(emitAppSyncMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledTimes(3);
    expect(progressStatuses[0]).toBe("Deleting permanently 0 of 3 student record(s)");
    expect(progressStatuses).toContain("Deleting permanently 2 of 3 student record(s) | 1 failed");
    expect(progressStatuses.at(-1)).toBe("Deleting permanently 3 of 3 student record(s) | 1 failed");
  });
});

describe("student records bulk deactivate", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tableExistsMock.mockImplementation(async (table: string) => table === "students" || table === "enrollments" || table === "audit_log");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("marks selected students transferred and keeps going on partial failures", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "students") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(async (_field: string, value: string) => {
              if (value === "stu-2") {
                return {
                  error: {
                    code: "23503",
                    message: "update on table students violates foreign key constraint",
                  },
                };
              }

              return { error: null };
            }),
          })),
        };
      }

      if (table === "enrollments") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === "audit_log") {
        return {
          insert: vi.fn(async () => ({ error: null })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const { deactivateStudentRecords } = await import("./student-records");
    await expect(deactivateStudentRecords(["stu-1", "stu-2", "stu-3"])).resolves.toEqual({
      deactivatedIds: ["stu-1", "stu-3"],
      failures: [
        {
          id: "stu-2",
          error: expect.stringContaining("update on table students violates foreign key constraint"),
        },
      ],
    });
    expect(emitAppSyncMock).toHaveBeenCalledTimes(1);
  });
});

describe("student records bulk status update", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tableExistsMock.mockImplementation(async (table: string) => table === "students" || table === "enrollments" || table === "audit_log");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("updates student and enrollment status for matching ids", async () => {
    const progressStatuses: string[] = [];
    fromMock.mockImplementation((table: string) => {
      if (table === "students") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === "enrollments") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === "audit_log") {
        return {
          insert: vi.fn(async () => ({ error: null })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const { updateStudentStatuses } = await import("./student-records");
    await expect(updateStudentStatuses(["stu-1", "stu-2"], "graduated", "bulk status update", {
      onProgress: (progress) => progressStatuses.push(progress.status),
      progressLabel: "Setting status to graduated",
    })).resolves.toEqual({
      updatedIds: ["stu-1", "stu-2"],
      failures: [],
    });
    expect(emitAppSyncMock).toHaveBeenCalledTimes(1);
    expect(progressStatuses[0]).toBe("Setting status to graduated 0 of 2 student record(s)");
    expect(progressStatuses.at(-1)).toBe("Setting status to graduated 2 of 2 student record(s)");
  });
});

describe("student records bulk field update", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    tableExistsMock.mockImplementation(async (table: string) => table === "students" || table === "audit_log");
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("updates non-status student fields across the selection", async () => {
    fromMock.mockImplementation((table: string) => {
      if (table === "students") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === "audit_log") {
        return {
          insert: vi.fn(async () => ({ error: null })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    });

    const { bulkUpdateStudentRecords } = await import("./student-records");
    await expect(bulkUpdateStudentRecords(["stu-1", "stu-2"], { first_graduate: true }, "scholarship-flag")).resolves.toEqual({
      updatedIds: ["stu-1", "stu-2"],
      failures: [],
    });
    expect(emitAppSyncMock).toHaveBeenCalledTimes(1);
  });
});
