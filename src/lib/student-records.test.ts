import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, tableExistsMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  tableExistsMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
  },
}));

vi.mock("@/lib/supabase-health", () => ({
  tableExists: tableExistsMock,
  tablesExist: vi.fn(async () => true),
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
      },
    ]);
  });
});
