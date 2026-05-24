import { describe, it, expect } from "vitest";

describe("Attendance Types", () => {
  it("validates attendance status values", () => {
    const validStatuses = ["present", "absent", "late", "half_day", "od"] as const;
    type AttendanceStatus = typeof validStatuses[number];

    const check = (s: string): s is AttendanceStatus =>
      validStatuses.includes(s as AttendanceStatus);

    expect(check("present")).toBe(true);
    expect(check("absent")).toBe(true);
    expect(check("invalid")).toBe(false);
  });
});
