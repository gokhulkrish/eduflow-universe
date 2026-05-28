import { supabase } from "../../src/integrations/supabase/client";
import type { StudentRegisterRow } from "../../src/lib/student-records";

export interface LegacyStudentQuery {
  class?: string;
  section?: string;
  batch?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LegacyStudentResponse {
  rows: StudentRegisterRow[];
  total: number;
}

export async function queryLegacyStudentRegister(filters: LegacyStudentQuery): Promise<LegacyStudentResponse> {
  let query = supabase
    .from("students")
    .select("*, enrollments!inner(*)", { count: "exact" });

  if (filters.class) {
    query = query.eq("enrollments.grade_label", filters.class);
  }

  if (filters.section) {
    query = query.eq("enrollments.section_label", filters.section);
  }

  if (filters.status) {
    query = query.eq("enrollments.status", filters.status as any);
  } else {
    query = query.eq("enrollments.status", "active");
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},admission_no.ilike.${term}`);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  if (filters.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit ?? 50) - 1);
  }

  const { data, error, count } = await query.order("first_name", { ascending: true });

  if (error) {
    console.error("[studentReadAdapter] query failed:", error);
    return { rows: [], total: 0 };
  }

  const rows: StudentRegisterRow[] = (data ?? []).map((row: any) => ({
    id: row.id,
    student_id: row.id,
    display_name: [row.first_name, row.last_name].filter(Boolean).join(" "),
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? null,
    admission_no: row.admission_no ?? "",
    regno: row.admission_no ?? "",
    grade: row.enrollments?.[0]?.grade_label ?? null,
    section: row.enrollments?.[0]?.section_label ?? null,
    roll_number: row.enrollments?.[0]?.roll_number ?? null,
    attendance_percent: 0,
    fee_status: "pending",
    status: row.enrollments?.[0]?.status ?? "active",
    updated_at: row.updated_at ?? "",
    email: row.email ?? null,
    dob: row.dob ?? null,
    gender: row.gender ?? null,
    blood_group: row.blood_group ?? null,
    phone: row.phone ?? null,
    house: row.enrollments?.[0]?.house ?? null,
    guardian_name: null,
    guardian_phone: null,
    community: row.community ?? null,
    district: null,
  }));

  return { rows, total: count ?? rows.length };
}

export async function getLegacyStudentById(studentId: string): Promise<StudentRegisterRow | null> {
  const { data } = await supabase
    .from("students")
    .select("*, enrollments(*)")
    .eq("id", studentId)
    .single();

  if (!data) return null;

  const enrollment = (data as any).enrollments?.[0];
  return {
    id: data.id,
    student_id: data.id,
    display_name: [data.first_name, data.last_name].filter(Boolean).join(" "),
    first_name: data.first_name ?? "",
    last_name: data.last_name ?? null,
    admission_no: data.admission_no ?? "",
    regno: data.admission_no ?? "",
    grade: enrollment?.grade_label ?? null,
    section: enrollment?.section_label ?? null,
    roll_number: enrollment?.roll_number ?? null,
    attendance_percent: 0,
    fee_status: "pending",
    status: enrollment?.status ?? "active",
    updated_at: data.updated_at ?? "",
    email: data.email ?? null,
    dob: data.dob ?? null,
    gender: data.gender ?? null,
    blood_group: data.blood_group ?? null,
    phone: data.phone ?? null,
    house: enrollment?.house ?? null,
    guardian_name: null,
    guardian_phone: null,
    community: data.community ?? null,
    district: null,
  };
}
