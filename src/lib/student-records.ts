import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type StudentRegisterRow = Tables<"student_register">;
export type StudentFormValues = Record<string, string>;

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
  }[];
};

export const studentSections: SectionDef[] = [
  {
    title: "Personal Information",
    description: "Core identity captured for the SMS register.",
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
    description: "Grade, roll number, section assignment.",
    fields: [
      { name: "admissionNo", label: "Admission No", placeholder: "ADM-2026-0184" },
      { name: "grade", label: "Grade", type: "select", options: ["Pre-KG", "KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"] },
      { name: "section", label: "Section", type: "select", options: ["A", "B", "C", "D"] },
      { name: "roll", label: "Roll Number", type: "number" },
      { name: "stream", label: "Stream", type: "select", options: ["Science", "Commerce", "Arts", "Vocational", "N/A"] },
      { name: "house", label: "House", type: "select", options: ["Red", "Blue", "Green", "Yellow"] },
    ],
  },
  {
    title: "Contact & Address",
    fields: [
      { name: "email", label: "Email", type: "email", placeholder: "student@school.edu" },
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
  },
  umis: {
    district: clean(values.district),
    block: clean(values.block),
  },
});

const readMetaString = (meta: Json | null, group: string, key: string) => {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "";
  const section = meta[group];
  if (!section || typeof section !== "object" || Array.isArray(section)) return "";
  const value = section[key];
  return typeof value === "string" ? value : "";
};

export const initialsForStudent = (row: Pick<StudentRegisterRow, "display_name" | "first_name" | "last_name">) => {
  const words = [row.first_name, row.last_name].filter(Boolean);
  const source = words.length ? words : String(row.display_name || "S").split(/\s+/);
  return source.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "ST";
};

export const gradeLabelForStudent = (row: Pick<StudentRegisterRow, "grade" | "section">) =>
  [row.grade, row.section].filter(Boolean).join("-") || "Unassigned";

export async function fetchStudentRegister() {
  const { data, error } = await supabase
    .from("student_register")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throwDataError(error);
  return data ?? [];
}

export async function fetchStudentFormValues(studentId: string): Promise<StudentFormValues> {
  const [{ data: student, error: studentError }, { data: enrollment, error: enrollmentError }] = await Promise.all([
    supabase.from("students").select("*").eq("id", studentId).single(),
    supabase
      .from("enrollments")
      .select("*")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (studentError) throwDataError(studentError);
  if (enrollmentError) throwDataError(enrollmentError);

  const { data: links, error: linksError } = await supabase
    .from("student_guardians")
    .select("guardian_id,relationship,is_primary")
    .eq("student_id", studentId);
  if (linksError) throwDataError(linksError);

  const guardianIds = (links ?? []).map((link) => link.guardian_id);
  const { data: guardians, error: guardiansError } = guardianIds.length
    ? await supabase.from("guardians").select("*").in("id", guardianIds)
    : { data: [], error: null };
  if (guardiansError) throwDataError(guardiansError);

  const guardianById = new Map((guardians ?? []).map((guardian) => [guardian.id, guardian]));
  const primaryLink = (links ?? []).find((link) => link.is_primary) ?? links?.[0];
  const primaryGuardian = primaryLink ? guardianById.get(primaryLink.guardian_id) : null;
  const fatherLink = (links ?? []).find((link) => link.relationship === "father");
  const motherLink = (links ?? []).find((link) => link.relationship === "mother");
  const father = fatherLink ? guardianById.get(fatherLink.guardian_id) : null;
  const mother = motherLink ? guardianById.get(motherLink.guardian_id) : null;

  return {
    studentId: student.id,
    enrollmentId: enrollment?.id ?? "",
    guardianId: primaryGuardian?.id ?? "",
    admissionNo: student.admission_no,
    firstName: student.first_name,
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
    grade: enrollment?.grade_label ?? "",
    section: enrollment?.section_label ?? "",
    roll: enrollment?.roll_number ? String(enrollment.roll_number) : "",
    stream: enrollment?.stream ?? "",
    house: enrollment?.house ?? "",
    fatherName: father?.full_name ?? readMetaString(student.meta, "family", "fatherName"),
    fatherOccupation: father?.occupation ?? readMetaString(student.meta, "family", "fatherOccupation"),
    motherName: mother?.full_name ?? readMetaString(student.meta, "family", "motherName"),
    motherOccupation: mother?.occupation ?? readMetaString(student.meta, "family", "motherOccupation"),
    guardianPhone: primaryGuardian?.phone ?? "",
    annualIncome: primaryGuardian?.annual_income ? String(primaryGuardian.annual_income) : "",
    district: readMetaString(student.meta, "umis", "district"),
    block: readMetaString(student.meta, "umis", "block"),
  };
}

export async function saveStudentRecord(values: StudentFormValues) {
  const parsed = studentPayloadSchema.parse(values);
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const studentId = clean(values.studentId);

  const studentPayload: TablesInsert<"students"> | TablesUpdate<"students"> = {
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
    ? await supabase.from("students").update(studentPayload).eq("id", studentId).select("*").single()
    : await supabase.from("students").insert(studentPayload as TablesInsert<"students">).select("*").single();

  if (studentError) throwDataError(studentError);

  const enrollmentPayload: TablesInsert<"enrollments"> | TablesUpdate<"enrollments"> = {
    student_id: savedStudent.id,
    academic_year_label: "2025-26",
    grade_label: parsed.grade,
    section_label: parsed.section,
    roll_number: toNumber(parsed.roll),
    stream: parsed.stream,
    house: parsed.house,
    status: "active",
  };

  const enrollmentId = clean(values.enrollmentId);
  const { error: enrollmentError } = enrollmentId
    ? await supabase.from("enrollments").update(enrollmentPayload).eq("id", enrollmentId)
    : await supabase.from("enrollments").insert(enrollmentPayload as TablesInsert<"enrollments">);

  if (enrollmentError) throwDataError(enrollmentError);

  const primaryName = parsed.fatherName || parsed.motherName;
  if (primaryName) {
    const relationship = parsed.fatherName ? "father" : "mother";
    const guardianPayload: TablesInsert<"guardians"> | TablesUpdate<"guardians"> = {
      full_name: primaryName,
      relationship,
      occupation: parsed.fatherName ? parsed.fatherOccupation : parsed.motherOccupation,
      phone: parsed.guardianPhone,
      annual_income: toNumber(parsed.annualIncome),
      is_primary: true,
    };
    const guardianId = clean(values.guardianId);
    const { data: guardian, error: guardianError } = guardianId
      ? await supabase.from("guardians").update(guardianPayload).eq("id", guardianId).select("*").single()
      : await supabase.from("guardians").insert(guardianPayload as TablesInsert<"guardians">).select("*").single();

    if (guardianError) throwDataError(guardianError);

    const linkPayload: TablesInsert<"student_guardians"> = {
      student_id: savedStudent.id,
      guardian_id: guardian.id,
      relationship,
      is_primary: true,
      can_pickup: true,
    };

    const { error: linkError } = await supabase
      .from("student_guardians")
      .upsert(linkPayload, { onConflict: "student_id,guardian_id" });

    if (linkError) throwDataError(linkError);
  }

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

  return savedStudent;
}

export async function deleteStudentRecord(studentId: string) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const { error } = await supabase.from("students").delete().eq("id", studentId);
  if (error) throwDataError(error);
  await supabase.from("audit_log").insert({
    actor: userId,
    action: "student.deleted",
    entity: "students",
    entity_id: studentId,
  });
}
