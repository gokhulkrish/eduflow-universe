import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Json, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import {
  collectCustomHeaderValues,
  loadCustomImportFields,
  loadHeaderRegistryMeta,
} from "@/lib/header-registry";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists, tablesExist } from "@/lib/supabase-health";

export const studentRegisterSyncKey = "sms.student-register.v1";

export type StudentFormValues = Record<string, string>;
export type StudentRegisterRow = {
  id: string;
  student_id: string;
  display_name: string;
  first_name: string;
  last_name: string | null;
  admission_no: string;
  regno: string;
  grade: string | null;
  section: string | null;
  roll_number: number | null;
  attendance_percent: number;
  fee_status: string;
  status: string;
  updated_at: string;
  email: string | null;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  house: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  community: string | null;
  district: string | null;
};

type SupabaseLikeError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

export function formatDataError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const supabaseError = error as SupabaseLikeError;
    return [
      supabaseError.code,
      supabaseError.message,
      supabaseError.details,
      supabaseError.hint ? `Hint: ${supabaseError.hint}` : null,
    ]
      .filter(Boolean)
      .join(" · ");
  }
  return "Unexpected database error";
}

const throwDataError = (error: unknown): never => {
  throw new Error(formatDataError(error));
};

export type SectionDef = {
  title: string;
  description?: string;
  fields: {
    name: string;
    label: string;
    type?: "text" | "date" | "email" | "tel" | "number" | "textarea" | "select";
    options?: string[];
    placeholder?: string;
    col?: 1 | 2 | 3;
    required?: boolean;
  }[];
};

export const studentSections: SectionDef[] = [
  {
    title: "Personal Information",
    description: "Core identity captured for the GCT register.",
    fields: [
      { name: "firstName", label: "First Name", placeholder: "Aarav" },
      { name: "lastName", label: "Last Name", placeholder: "Sharma" },
      { name: "dob", label: "Date of Birth", type: "date" },
      { name: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Other", "Prefer not to say"] },
      { name: "bloodGroup", label: "Blood Group", type: "select", options: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] },
      { name: "nationality", label: "Nationality", placeholder: "Indian" },
    ],
  },
  {
    title: "Academic Details",
    description: "Program, roll number, and section assignment.",
    fields: [
      { name: "admissionNo", label: "Admission No", placeholder: "ADM-2026-0184" },
      { name: "regno", label: "Register Number (REGNO)", placeholder: "ADM-2026-0184", required: true },
      { name: "grade", label: "Program / Semester", type: "select", options: ["B.A. Sem 1", "B.A. Sem 2", "B.Com Sem 1", "B.Com Sem 2", "B.Sc Sem 1", "B.Sc Sem 2", "BBA Sem 1", "BBA Sem 2"] },
      { name: "section", label: "Section", type: "select", options: ["A", "B", "C", "D"] },
      { name: "roll", label: "Roll Number", type: "number" },
      { name: "stream", label: "Department / Stream", type: "select", options: ["Science", "Commerce", "Arts", "Management", "Vocational", "N/A"] },
      { name: "house", label: "Residence / House", type: "select", options: ["North", "South", "East", "West"] },
    ],
  },
  {
    title: "Contact & Address",
    fields: [
      { name: "email", label: "Email", type: "email", placeholder: "student@gct.ac.in" },
      { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98765 43210" },
      { name: "alternatePhone", label: "Alternate Phone", type: "tel" },
      { name: "address", label: "Address", type: "textarea", col: 3, placeholder: "Street, Area, City, State, PIN" },
    ],
  },
  {
    title: "Guardian Information",
    fields: [
      { name: "fatherName", label: "Father's Name" },
      { name: "fatherOccupation", label: "Father's Occupation" },
      { name: "motherName", label: "Mother's Name" },
      { name: "motherOccupation", label: "Mother's Occupation" },
      { name: "guardianPhone", label: "Guardian Phone", type: "tel" },
      { name: "annualIncome", label: "Annual Income", type: "number", placeholder: "₹" },
    ],
  },
  {
    title: "UMIS / EMIS Context",
    description: "Optional — auto-filled when the student is imported from UMIS.",
    fields: [
      { name: "umisId", label: "UMIS ID" },
      { name: "emisId", label: "EMIS ID" },
      { name: "district", label: "District" },
      { name: "block", label: "Block" },
    ],
  },
  {
    title: "Verification & Scholarship",
    description: "Community, first graduate, income verification (Scholarship module-aligned).",
    fields: [
      { name: "community", label: "Community", type: "select", options: ["OC", "BC", "MBC", "SC", "ST", "Other"] },
      { name: "firstGraduate", label: "First Graduate", type: "select", options: ["Yes", "No"] },
      { name: "incomeVerified", label: "Income Verified", type: "select", options: ["Pending", "Agreed", "Appealed"] },
      { name: "scholarshipNotes", label: "Notes", type: "textarea", col: 3 },
    ],
  },
];

const nullableText = z.string().trim().optional().transform((value) => value || null);
const requiredText = z.string().trim().min(1);

const studentPayloadSchema = z.object({
  firstName: requiredText,
  admissionNo: requiredText,
  regno: requiredText,
  lastName: nullableText,
  dob: nullableText,
  gender: nullableText,
  bloodGroup: nullableText,
  nationality: z.string().trim().optional().transform((value) => value || "Indian"),
  email: nullableText,
  phone: nullableText,
  alternatePhone: nullableText,
  address: nullableText,
  umisId: nullableText,
  emisId: nullableText,
  community: nullableText,
  scholarshipNotes: nullableText,
  firstGraduate: z.string().optional(),
  incomeVerified: z.string().optional(),
  grade: nullableText,
  section: nullableText,
  roll: z.string().optional(),
  stream: nullableText,
  house: nullableText,
  fatherName: nullableText,
  fatherOccupation: nullableText,
  motherName: nullableText,
  motherOccupation: nullableText,
  guardianPhone: nullableText,
  annualIncome: z.string().optional(),
  district: nullableText,
  block: nullableText,
});

const clean = (value: string | null | undefined) => {
  const next = String(value ?? "").trim();
  return next || null;
};

const toNumber = (value: string | null | undefined) => {
  const next = clean(value);
  return next ? Number(next) : null;
};

const toIncomeStatus = (value: string | undefined) => {
  const normalized = String(value || "Pending").toLowerCase();
  if (normalized === "agreed") return "agreed" as const;
  if (normalized === "appealed") return "appealed" as const;
  return "pending" as const;
};

const metaFromValues = (values: StudentFormValues): Json => ({
  family: {
    fatherName: clean(values.fatherName),
    fatherOccupation: clean(values.fatherOccupation),
    motherName: clean(values.motherName),
    motherOccupation: clean(values.motherOccupation),
    guardianName: clean(values.fatherName) || clean(values.motherName),
    guardianOccupation: clean(values.fatherOccupation) || clean(values.motherOccupation),
    guardianPhone: clean(values.guardianPhone),
    annualIncome: clean(values.annualIncome),
  },
  academic: {
    grade: clean(values.grade),
    section: clean(values.section),
    roll: clean(values.roll),
    stream: clean(values.stream),
    house: clean(values.house),
  },
  umis: {
    district: clean(values.district),
    block: clean(values.block),
  },
  import: {
    customValues: collectCustomHeaderValues(values),
  },
});

const readMetaString = (meta: Json | null, group: string, key: string) => {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "";
  const section = meta[group];
  if (!section || typeof section !== "object" || Array.isArray(section)) return "";
  const value = section[key];
  return typeof value === "string" ? value : "";
};

const readMetaNumber = (meta: Json | null, group: string, key: string) => {
  const raw = readMetaString(meta, group, key);
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
};

const readCustomFieldValues = (meta: Json | null) => loadHeaderRegistryMeta(meta);

const isSchemaCompatibilityError = (error: unknown) => {
  const message = formatDataError(error).toLowerCase();
  return (
    message.includes("pgrst205") ||
    message.includes("schema cache") ||
    message.includes("42703") ||
    message.includes("does not exist")
  );
};

export const initialsForStudent = (row: Pick<StudentRegisterRow, "display_name" | "first_name" | "last_name">) => {
  const words = [row.first_name, row.last_name].filter(Boolean);
  const source = words.length ? words : String(row.display_name || "S").split(/\s+/);
  return source.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "ST";
};

export const cohortLabelForStudent = (row: Pick<StudentRegisterRow, "grade" | "section">) =>
  [row.grade, row.section].filter(Boolean).join("-") || "Unassigned";
export const gradeLabelForStudent = cohortLabelForStudent;

export async function fetchStudentRegister(): Promise<StudentRegisterRow[]> {
  if (!(await tableExists("students"))) return [];

  const { data: registerRows, error: registerError } = await supabase
    .from("student_register")
    .select("*")
    .order("updated_at", { ascending: false });

  if (!registerError) {
    return (registerRows ?? []).map((row) => normalizeStudentRegisterRowFromView(row as Record<string, unknown>));
  }

  if (!isSchemaCompatibilityError(registerError)) throwDataError(registerError);

  const [studentsResult, attendanceResult, invoicesResult] = await Promise.all([
    supabase.from("students").select("*").order("updated_at", { ascending: false }),
    tableExists("attendance")
      ? supabase.from("attendance").select("student_id,status,date,created_at")
      : Promise.resolve({ data: [], error: null }),
    tableExists("fee_invoices")
      ? supabase.from("fee_invoices").select("student_id,status,amount,amount_paid,created_at")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (studentsResult.error) throwDataError(studentsResult.error);
  if (attendanceResult.error) throwDataError(attendanceResult.error);
  if (invoicesResult.error) throwDataError(invoicesResult.error);

  const attendanceByStudent = new Map<string, { total: number; present: number }>();
  for (const attendance of attendanceResult.data ?? []) {
    const studentId = String(attendance.student_id ?? "");
    if (!studentId) continue;
    const current = attendanceByStudent.get(studentId) ?? { total: 0, present: 0 };
    current.total += 1;
    if (String(attendance.status ?? "").toLowerCase() === "present") current.present += 1;
    attendanceByStudent.set(studentId, current);
  }

  const latestInvoiceByStudent = new Map<string, Record<string, unknown>>();
  for (const invoice of invoicesResult.data ?? []) {
    const studentId = String(invoice.student_id ?? "");
    if (!studentId) continue;
    const current = latestInvoiceByStudent.get(studentId);
    if (!current) {
      latestInvoiceByStudent.set(studentId, invoice as Record<string, unknown>);
      continue;
    }
    const currentTime = new Date(String(current.created_at ?? "")).getTime();
    const nextTime = new Date(String(invoice.created_at ?? "")).getTime();
    if (nextTime >= currentTime) latestInvoiceByStudent.set(studentId, invoice as Record<string, unknown>);
  }

  return (studentsResult.data ?? []).map((student) => {
    const studentRecord = student as Record<string, unknown>;
    const attendance = attendanceByStudent.get(String(studentRecord.id ?? "")) ?? { total: 0, present: 0 };
    const latestInvoice = latestInvoiceByStudent.get(String(studentRecord.id ?? "")) ?? null;
    const feeStatus = String(studentRecord.fee_status ?? latestInvoice?.status ?? "pending");
    const attendancePercent = attendance.total ? Math.round((attendance.present / attendance.total) * 100) : Number(studentRecord.attendance_percent ?? 0) || 0;

    return {
      id: String(studentRecord.id ?? ""),
      student_id: String(studentRecord.id ?? ""),
      display_name: String(studentRecord.display_name ?? [studentRecord.first_name, studentRecord.last_name].filter(Boolean).join(" ")),
      first_name: String(studentRecord.first_name ?? ""),
      last_name: typeof studentRecord.last_name === "string" ? studentRecord.last_name : null,
      admission_no: String(studentRecord.admission_no ?? ""),
      regno: String(studentRecord.regno ?? studentRecord.admission_no ?? ""),
      grade: typeof studentRecord.grade === "string" ? studentRecord.grade : readMetaString(studentRecord.meta as Json | null, "academic", "grade") || null,
      section: typeof studentRecord.section === "string" ? studentRecord.section : readMetaString(studentRecord.meta as Json | null, "academic", "section") || null,
      roll_number: typeof studentRecord.roll_number === "number" ? studentRecord.roll_number : readMetaNumber(studentRecord.meta as Json | null, "academic", "roll"),
      attendance_percent: attendancePercent,
      fee_status: feeStatus,
      status: String(studentRecord.status ?? "active"),
      updated_at: String(studentRecord.updated_at ?? studentRecord.created_at ?? ""),
      email: typeof studentRecord.email === "string" ? studentRecord.email : null,
      dob: typeof studentRecord.dob === "string" ? studentRecord.dob : null,
      gender: typeof studentRecord.gender === "string" ? studentRecord.gender : null,
      blood_group: typeof studentRecord.blood_group === "string" ? studentRecord.blood_group : null,
      phone: typeof studentRecord.phone === "string" ? studentRecord.phone : null,
      house: typeof studentRecord.house === "string" ? studentRecord.house : readMetaString(studentRecord.meta as Json | null, "academic", "house"),
      guardian_name:
        readMetaString(studentRecord.meta as Json | null, "family", "guardianName") ||
        readMetaString(studentRecord.meta as Json | null, "family", "fatherName") ||
        readMetaString(studentRecord.meta as Json | null, "family", "motherName"),
      guardian_phone: readMetaString(studentRecord.meta as Json | null, "family", "guardianPhone"),
      community: typeof studentRecord.community === "string" ? studentRecord.community : null,
      district: typeof studentRecord.district === "string" ? studentRecord.district : null,
    };
  });
}

const normalizeStudentRegisterRowFromView = (row: Record<string, unknown>): StudentRegisterRow => ({
  id: String(row.student_id ?? row.id ?? ""),
  student_id: String(row.student_id ?? row.id ?? ""),
  display_name: String(row.display_name ?? ([row.first_name, row.last_name].filter(Boolean).join(" ") || "")),
  first_name: String(row.first_name ?? ""),
  last_name: typeof row.last_name === "string" ? row.last_name : null,
  admission_no: String(row.admission_no ?? ""),
  regno: String(row.regno ?? row.admission_no ?? ""),
  grade: typeof row.grade === "string" ? row.grade : null,
  section: typeof row.section === "string" ? row.section : null,
  roll_number: typeof row.roll_number === "number" ? row.roll_number : null,
  attendance_percent: typeof row.attendance_percent === "number" ? row.attendance_percent : 0,
  fee_status: String(row.fee_status ?? "pending"),
  status: String(row.status ?? "active"),
  updated_at: String(row.updated_at ?? ""),
  email: typeof row.email === "string" ? row.email : null,
  dob: typeof row.dob === "string" ? row.dob : null,
  gender: typeof row.gender === "string" ? row.gender : null,
  blood_group: typeof row.blood_group === "string" ? row.blood_group : null,
  phone: typeof row.phone === "string" ? row.phone : null,
  house: typeof row.house === "string" ? row.house : null,
  guardian_name: typeof row.guardian_name === "string" ? row.guardian_name : null,
  guardian_phone: typeof row.guardian_phone === "string" ? row.guardian_phone : null,
  community: typeof row.community === "string" ? row.community : null,
  district: typeof row.district === "string" ? row.district : null,
});

const normalizeStudentRegisterRowFromStudent = (row: Record<string, unknown>): StudentRegisterRow => ({
  id: String(row.id ?? ""),
  student_id: String(row.id ?? ""),
  display_name: [row.first_name, row.last_name].filter(Boolean).join(" ") || String(row.first_name ?? ""),
  first_name: String(row.first_name ?? ""),
  last_name: typeof row.last_name === "string" ? row.last_name : null,
  admission_no: String(row.admission_no ?? ""),
  regno: String(row.regno ?? row.admission_no ?? ""),
  grade: typeof row.grade === "string" ? row.grade : readMetaString(row.meta as Json | null, "academic", "grade") || null,
  section: typeof row.section === "string" ? row.section : readMetaString(row.meta as Json | null, "academic", "section") || null,
  roll_number: typeof row.roll_number === "number" ? row.roll_number : readMetaNumber(row.meta as Json | null, "academic", "roll"),
  attendance_percent: typeof row.attendance_percent === "number" ? row.attendance_percent : 0,
  fee_status: String(row.fee_status ?? row.status ?? "pending"),
  status: String(row.status ?? "active"),
  updated_at: String(row.updated_at ?? ""),
  email: null,
  dob: typeof row.dob === "string" ? row.dob : null,
  gender: typeof row.gender === "string" ? row.gender : null,
  blood_group: typeof row.blood_group === "string" ? row.blood_group : null,
  phone: typeof row.phone === "string" ? row.phone : null,
  house: readMetaString(row.meta as Json | null, "academic", "house"),
  guardian_name:
    readMetaString(row.meta as Json | null, "family", "guardianName") ||
    readMetaString(row.meta as Json | null, "family", "fatherName") ||
    readMetaString(row.meta as Json | null, "family", "motherName"),
  guardian_phone: readMetaString(row.meta as Json | null, "family", "guardianPhone"),
  community: null,
  district: null,
});

export async function fetchStudentFormValues(studentId: string): Promise<StudentFormValues> {
  if (!(await tablesExist(["students", "enrollments"]))) {
    throw new Error("Student records are not available yet. Run the core student migrations first.");
  }

  const [{ data: student, error: studentError }, { data: enrollment, error: enrollmentError }] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).single(),
    supabase
      .from("enrollments")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (studentError) throwDataError(studentError);
  if (enrollmentError) throwDataError(enrollmentError);

  const customFields = loadCustomImportFields();
  const customValues = readCustomFieldValues(student.meta);

  return {
    studentId: student.id,
    enrollmentId: enrollment?.id ?? "",
    guardianId: readMetaString(student.meta, "family", "guardianId"),
    admissionNo: student.admission_no ?? "",
    regno: (student as Record<string, unknown>).regno as string ?? student.admission_no ?? "",
    firstName: student.first_name ?? "",
    lastName: student.last_name ?? "",
    dob: student.dob ?? "",
    gender: student.gender ?? "",
    bloodGroup: student.blood_group ?? "",
    nationality: student.nationality ?? "",
    email: student.email ?? "",
    phone: student.phone ?? "",
    alternatePhone: student.alternate_phone ?? "",
    address: student.address ?? "",
    umisId: student.umis_id ?? "",
    emisId: student.emis_id ?? "",
    community: student.community ?? "",
    firstGraduate: student.first_graduate ? "Yes" : "No",
    incomeVerified: student.income_verification_status === "agreed" ? "Agreed" : student.income_verification_status === "appealed" ? "Appealed" : "Pending",
    scholarshipNotes: student.scholarship_notes ?? "",
    grade: enrollment?.grade_label ?? readMetaString(student.meta, "academic", "grade"),
    section: enrollment?.section_label ?? readMetaString(student.meta, "academic", "section"),
    roll: typeof enrollment?.roll_number === "number" ? String(enrollment.roll_number) : readMetaString(student.meta, "academic", "roll"),
    stream: readMetaString(student.meta, "academic", "stream"),
    house: readMetaString(student.meta, "academic", "house"),
    fatherName: readMetaString(student.meta, "family", "fatherName"),
    fatherOccupation: readMetaString(student.meta, "family", "fatherOccupation"),
    motherName: readMetaString(student.meta, "family", "motherName"),
    motherOccupation: readMetaString(student.meta, "family", "motherOccupation"),
    guardianPhone: readMetaString(student.meta, "family", "guardianPhone"),
    annualIncome: readMetaString(student.meta, "family", "annualIncome"),
    district: readMetaString(student.meta, "umis", "district"),
    block: readMetaString(student.meta, "umis", "block"),
    ...Object.fromEntries(
      customFields.map((field) => [`custom:${field.id}`, customValues[field.id] ?? customValues[field.key] ?? ""] as const)
    ),
  };
}

export async function saveStudentRecord(values: StudentFormValues) {
  if (!(await tablesExist(["students", "enrollments"]))) {
    throw new Error("Student records are not available yet. Run the core student migrations first.");
  }

  const parsed = studentPayloadSchema.parse(values);
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const studentId = clean(values.studentId);

  const studentPayload = {
    regno: parsed.regno,
    admission_no: parsed.admissionNo,
    first_name: parsed.firstName,
    last_name: parsed.lastName,
    dob: parsed.dob,
    gender: parsed.gender,
    blood_group: parsed.bloodGroup,
    nationality: parsed.nationality,
    email: parsed.email,
    phone: parsed.phone,
    alternate_phone: parsed.alternatePhone,
    address: parsed.address,
    umis_id: parsed.umisId,
    emis_id: parsed.emisId,
    community: parsed.community,
    first_graduate: parsed.firstGraduate === "Yes",
    income_verification_status: toIncomeStatus(parsed.incomeVerified),
    scholarship_notes: parsed.scholarshipNotes,
    meta: metaFromValues(values),
    updated_by: userId,
    ...(studentId ? {} : { created_by: userId }),
  };

  const { data: savedStudent, error: studentError } = studentId
    ? await supabase.from("students").update(studentPayload as TablesUpdate<"students">).eq("id", studentId).select("*").single()
    : await supabase.from("students").insert(studentPayload as TablesInsert<"students">).select("*").single();

  if (studentError) {
    const se = studentError as { code?: string; status?: number; message?: string; details?: string };
    if (!studentId && (se.code === "23505" || se.status === 409)) {
      const detail = (se.details ?? "").toLowerCase();
      if (detail.includes("regno")) {
        throw new Error(`A student with register number "${String(studentPayload.regno)}" already exists.`);
      }
      throw new Error(`A student with admission number "${studentPayload.admission_no}" already exists.`);
    }
    throwDataError(studentError);
  }

  const enrollmentPayload: TablesInsert<"enrollments"> | TablesUpdate<"enrollments"> = {
    student_id: savedStudent.id,
    academic_year_id: null,
    class_level_id: null,
    section_id: null,
    grade_label: parsed.grade ?? null,
    section_label: parsed.section ?? null,
    stream: parsed.stream ?? null,
    house: parsed.house ?? null,
    roll_number: parsed.roll ? Number(parsed.roll) : null,
    status: "active",
    meta: {
      import: {
        source: "student-form",
      },
    } as Json,
  };

  const enrollmentId = clean(values.enrollmentId);
  const { error: enrollmentError } = enrollmentId
    ? await supabase.from("enrollments").update(enrollmentPayload).eq("id", enrollmentId)
    : await supabase.from("enrollments").insert(enrollmentPayload as TablesInsert<"enrollments">);

  if (enrollmentError) throwDataError(enrollmentError);

  if (await tableExists("audit_log")) {
    await supabase.from("audit_log").insert({
      actor: userId,
      action: studentId ? "student.updated" : "student.created",
      entity: "students",
      entity_id: savedStudent.id,
      metadata: {
        admission_no: savedStudent.admission_no,
        display_name: [savedStudent.first_name, savedStudent.last_name].filter(Boolean).join(" "),
      },
    });
  }

  emitAppSync(studentRegisterSyncKey);
  return savedStudent;
}

export async function deleteStudentRecord(studentId: string) {
  if (!(await tableExists("students"))) {
    throw new Error("Student records are not available yet. Run the core student migrations first.");
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throwDataError(error);
  if (await tableExists("audit_log")) {
    await supabase.from("audit_log").insert({
      actor: userId,
      action: "student.deleted",
      entity: "students",
      entity_id: studentId,
    });
  }

  emitAppSync(studentRegisterSyncKey);
}

export type RecentNotification = {
  id: string;
  title: string;
  desc: string;
  time: string;
  type: "success" | "info" | "warning";
};

const formatRelativeTime = (createdAt: string) => {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes || 1}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d`;
};

const notificationTypeForAction = (action: string): RecentNotification["type"] => {
  const normalized = action.toLowerCase();
  if (normalized.includes("import") || normalized.includes("approve") || normalized.includes("success")) return "success";
  if (normalized.includes("warn") || normalized.includes("review") || normalized.includes("flag")) return "warning";
  return "info";
};

const studentCreatePromises = new Map<string, Promise<string>>();

export async function ensureStudentExists(
  admissionNo: string,
  studentName?: string,
): Promise<string> {
  const key = clean(admissionNo) ?? admissionNo;
  const pending = studentCreatePromises.get(key);
  if (pending) return pending;

  const promise = (async (): Promise<string> => {
    const { data: existing, error: selectError } = await supabase
      .from("students")
      .select("id")
      .eq("admission_no", key)
      .maybeSingle();

    if (selectError) throw new Error(selectError.message);
    if (existing) return existing.id;

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id ?? null;

    const parts = (studentName ?? key).trim().split(/\s+/);
    const firstName = parts[0] || key;
    const lastName = parts.slice(1).join(" ") || null;

    const { data: created, error } = await supabase
      .from("students")
      .insert({
        regno: key,
        admission_no: key,
        first_name: firstName,
        last_name: lastName,
        status: "active",
        created_by: userId,
        updated_by: userId,
      } as never)
      .select("id")
      .single();

    if (error) {
      const se = error as { code?: string; status?: number; message?: string; details?: string };
      if (se.code === "23505" || se.status === 409) {
        const { data: retry, error: retryError } = await supabase
          .from("students")
          .select("id")
          .eq("admission_no", key)
          .maybeSingle();
        if (retryError) throw new Error(retryError.message);
        if (retry) return retry.id;
      }
      throw new Error(se.message ?? "Unknown Supabase error");
    }

    return created.id;
  })();

  studentCreatePromises.set(key, promise);
  try {
    return await promise;
  } finally {
    studentCreatePromises.delete(key);
  }
}

export async function fetchRecentNotifications(limit = 5): Promise<RecentNotification[]> {
  if (!(await tableExists("audit_log"))) return [];

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, created_at, action, entity, entity_id, metadata, actor")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throwDataError(error);

  return (data ?? []).map((entry, index) => {
    const metadata = entry.metadata && typeof entry.metadata === "object" && !Array.isArray(entry.metadata)
      ? (entry.metadata as Record<string, unknown>)
      : {};
    const batchName = typeof metadata.batchName === "string" ? metadata.batchName : null;
    const fileName = typeof metadata.fileName === "string" ? metadata.fileName : null;
    const rowKey = typeof metadata.rowKey === "string" ? metadata.rowKey : null;
    const title = entry.action === "student.import.batch.completed"
      ? "Import batch completed"
      : entry.action === "student.imported"
        ? "Student imported"
        : entry.action.replace(/_/g, " ");
    const desc = [
      batchName,
      fileName,
      entry.entity ? `${entry.entity}` : null,
      rowKey ? `row ${rowKey}` : null,
    ].filter(Boolean).join(" · ") || entry.entity_id || entry.actor || `Audit event ${index + 1}`;

    return {
      id: entry.id,
      title,
      desc,
      time: formatRelativeTime(entry.created_at),
      type: notificationTypeForAction(entry.action),
    } satisfies RecentNotification;
  });
}
