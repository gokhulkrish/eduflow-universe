import { describe, it, expect } from "vitest";
import { createStudentSchema } from "./service";

describe("createStudentSchema", () => {
  it("validates a correct input", () => {
    const input = {
      firstName: "John",
      lastName: "Doe",
      admissionNo: "S123",
      dob: "2010-05-15",
      gender: "Male",
      grade: "Class 10",
      section: "A",
    };
    const result = createStudentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const input = { firstName: "J" };
    const result = createStudentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects invalid admission number", () => {
    const input = {
      firstName: "John",
      admissionNo: "ABC_123",
      dob: "2010-05-15",
      gender: "Male",
      grade: "Class 10",
    };
    const result = createStudentSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("accepts optional fields", () => {
    const input = {
      firstName: "John",
      admissionNo: "S123",
      dob: "2010-05-15",
      gender: "Male",
      grade: "Class 10",
      email: "john@example.com",
      phone: "+911234567890",
      bloodGroup: "A+",
      nationality: "Indian",
    };
    const result = createStudentSchema.safeParse(input);
    expect(result.success).toBe(true);
  });
});
