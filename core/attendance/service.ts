import { supabase } from "../../src/integrations/supabase/client";
import { tableExists } from "../../src/lib/supabase-health";
import { refreshMonitoringSnapshot } from "../monitoring/snapshot";

export type AttendanceStatus = "present" | "absent" | "late" | "half_day" | "od" | "excused" | "holiday" | "leave" | "unknown";

export async function markAttendance(
  studentId: string,
  date: string,
  status: AttendanceStatus,
  period?: number,
  markedBy?: string,
) {
  if (!(await tableExists("attendance"))) {
    throw new Error("Attendance table not available. Run attendance migration first.");
  }

  const { data: existing } = await supabase
    .from("attendance")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("date", date)
    .eq("period", String(period ?? 0))
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("attendance")
      .update({ status, marked_by: markedBy ?? null, updated_at: new Date().toISOString() } as any)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("attendance")
      .insert({
        student_id: studentId,
        date,
        period: String(period ?? 0),
        status,
        marked_by: markedBy ?? null,
      } as any);
    if (error) throw error;
  }

  const tenantId = await resolveStudentTenantId(studentId);
  if (tenantId) {
    void refreshMonitoringSnapshot({ tenantId }).catch(() => {});
  }
}

export async function bulkUploadAttendance(
  records: { studentId: string; date: string; status: AttendanceStatus; period?: number }[],
  markedBy?: string,
) {
  if (!(await tableExists("attendance"))) {
    throw new Error("Attendance table not available.");
  }

  const { error } = await supabase.from("attendance").upsert(
    records.map((r) => ({
      student_id: r.studentId,
      date: r.date,
      period: String(r.period ?? 0),
      status: r.status,
      marked_by: markedBy ?? null,
    })) as any,
    { onConflict: "student_id,date,period" },
  );

  if (error) throw error;

  const tenantId = await resolveBulkTenantId(records);
  if (tenantId) {
    void refreshMonitoringSnapshot({ tenantId }).catch(() => {});
  }
}

export async function overrideAttendance(
  attendanceId: string,
  newStatus: AttendanceStatus,
  reason: string,
  overriddenBy?: string,
) {
  const { data: before } = await supabase
    .from("attendance")
    .select("*")
    .eq("id", attendanceId)
    .single();

  if (!before) throw new Error("Attendance record not found");

  const { error } = await supabase
    .from("attendance")
    .update({ status: newStatus, marked_by: overriddenBy ?? null } as any)
    .eq("id", attendanceId);

  if (error) throw error;

  await supabase.from("audit_log").insert({
    actor: overriddenBy ?? null,
    action: "attendance.overridden",
    entity: "attendance",
    entity_id: attendanceId,
    metadata: {
      before: before.status,
      after: newStatus,
      reason,
    },
  } as any);

  const tenantId = await resolveStudentTenantId(String(before.student_id ?? ""));
  if (tenantId) {
    void refreshMonitoringSnapshot({ tenantId }).catch(() => {});
  }
}

export async function getAttendanceByDate(date: string, grade?: string, section?: string) {
  let query = supabase
    .from("attendance")
    .select("*, students!inner(*)");

  if (grade) {
    query = query.eq("students.enrollments.grade_label", grade);
  }
  if (section) {
    query = query.eq("students.enrollments.section_label", section);
  }

  const { data, error } = await query.eq("date", date);
  if (error) throw error;
  return data ?? [];
}

async function resolveStudentTenantId(studentId: string): Promise<string | null> {
  if (!studentId || !(await tableExists("students"))) return null;
  const { data, error } = await supabase.from("students").select("institution_id").eq("id", studentId).maybeSingle();
  if (error || !data?.institution_id) return null;
  return data.institution_id;
}

async function resolveBulkTenantId(records: { studentId: string }[]): Promise<string | null> {
  for (const record of records) {
    const tenantId = await resolveStudentTenantId(record.studentId);
    if (tenantId) return tenantId;
  }
  return null;
}
