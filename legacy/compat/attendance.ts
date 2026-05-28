import { supabase } from "../../src/integrations/supabase/client";
import { tableExists } from "../../src/lib/supabase-health";

export type LegacyAttendanceFilter = {
  classId?: string;
  date?: string;
  period?: string;
  studentId?: string;
  fromDate?: string;
  toDate?: string;
};

export type LegacyAttendanceRecord = {
  studentId: string;
  date: string;
  status: string;
  period: string;
  markedBy?: string;
};

export async function listAttendanceLegacyCompatible(
  filter: LegacyAttendanceFilter,
): Promise<LegacyAttendanceRecord[]> {
  if (!(await tableExists("attendance"))) return [];

  let q = supabase.from("attendance").select("*");
  if (filter.studentId) q = q.eq("student_id", filter.studentId);
  if (filter.date) q = q.eq("date", filter.date);
  if (filter.period) q = q.eq("period", filter.period);
  if (filter.fromDate) q = q.gte("date", filter.fromDate);
  if (filter.toDate) q = q.lte("date", filter.toDate);
  q = q.order("date", { ascending: false }).limit(1000);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => ({
    studentId: String(r.student_id ?? ""),
    date: String(r.date ?? ""),
    status: String(r.status ?? "absent"),
    period: String(r.period ?? "0"),
    markedBy: r.marked_by ? String(r.marked_by) : undefined,
  }));
}
