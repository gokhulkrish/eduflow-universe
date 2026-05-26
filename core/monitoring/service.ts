import { supabase } from "../../src/integrations/supabase/client";
import { fetchStudentRegister } from "../../src/lib/student-records";
import { tableExists } from "../../src/lib/supabase-health";

export interface MonitoringOverviewRow {
  student_id: string;
  admission_no: string;
  display_name: string;
  grade_label: string | null;
  section_label: string | null;
  enrollment_status: string;
  attendance_percent: number | null;
  exam_percent: number | null;
  subjective_score: number | null;
}

export interface MonitoringFilter {
  grade?: string;
  section?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim();
}

function latestNumericByStudent(
  rows: Array<{ student_id: string; value: number | null; timestamp: string }>,
): Map<string, number | null> {
  const latest = new Map<string, { value: number | null; timestamp: number }>();
  for (const row of rows) {
    const ts = new Date(row.timestamp).getTime();
    if (!Number.isFinite(ts)) continue;
    const current = latest.get(row.student_id);
    if (!current || ts >= current.timestamp) {
      latest.set(row.student_id, { value: row.value, timestamp: ts });
    }
  }
  return new Map([...latest.entries()].map(([studentId, entry]) => [studentId, entry.value]));
}

async function loadExamPercentByStudent(): Promise<Map<string, number | null>> {
  if (!(await tableExists("exam_marks")) || !(await tableExists("exam_schedules"))) return new Map();

  const [{ data: marks, error: marksError }, { data: schedules, error: schedulesError }] = await Promise.all([
    supabase.from("exam_marks").select("student_id,exam_id,marks_obtained,status").eq("status", "approved"),
    supabase.from("exam_schedules").select("id,max_marks,date"),
  ]);

  if (marksError) throw marksError;
  if (schedulesError) throw schedulesError;

  const scheduleMap = new Map(
    (schedules ?? []).map((schedule: any) => [
      String(schedule.id),
      {
        maxMarks: Number(schedule.max_marks ?? 0),
        timestamp: new Date(String(schedule.date ?? schedule.created_at ?? "")).getTime(),
      },
    ]),
  );

  const byStudent = new Map<string, { value: number | null; timestamp: number }>();
  for (const mark of marks ?? []) {
    const schedule = scheduleMap.get(String((mark as any).exam_id ?? ""));
    if (!schedule || !Number.isFinite(schedule.timestamp)) continue;
    const maxMarks = schedule.maxMarks;
    const marksObtained = Number((mark as any).marks_obtained ?? 0);
    const value = maxMarks > 0 ? Math.round((marksObtained / maxMarks) * 1000) / 10 : null;
    const studentId = String((mark as any).student_id ?? "");
    if (!studentId) continue;

    const current = byStudent.get(studentId);
    if (!current || schedule.timestamp >= current.timestamp) {
      byStudent.set(studentId, { value, timestamp: schedule.timestamp });
    }
  }

  return new Map([...byStudent.entries()].map(([studentId, entry]) => [studentId, entry.value]));
}

async function loadSubjectiveScoreByStudent(): Promise<Map<string, number | null>> {
  if (!(await tableExists("audit_log"))) return new Map();

  const { data, error } = await supabase
    .from("audit_log")
    .select("entity_id,metadata,created_at")
    .eq("entity", "scoring")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []).map((row: any) => ({
    student_id: String(row.entity_id ?? ""),
    value:
      typeof row.metadata?.compositeIndex === "number"
        ? row.metadata.compositeIndex
        : typeof row.metadata?.compositeIndex === "string"
          ? Number(row.metadata.compositeIndex)
          : null,
    timestamp: String(row.created_at ?? ""),
  }));

  return latestNumericByStudent(rows);
}

export async function getMonitoringOverview(filters?: MonitoringFilter): Promise<{
  rows: MonitoringOverviewRow[];
  total: number;
}> {
  const students = await fetchStudentRegister();
  const examPercentByStudent = await loadExamPercentByStudent().catch(() => new Map<string, number | null>());
  const subjectiveScoreByStudent = await loadSubjectiveScoreByStudent().catch(() => new Map<string, number | null>());

  const rows: MonitoringOverviewRow[] = students.map((student) => ({
    student_id: student.student_id,
    admission_no: student.admission_no,
    display_name: student.display_name,
    grade_label: student.grade,
    section_label: student.section,
    enrollment_status: student.status,
    attendance_percent: Number.isFinite(student.attendance_percent) ? student.attendance_percent : null,
    exam_percent: examPercentByStudent.get(student.student_id) ?? null,
    subjective_score: subjectiveScoreByStudent.get(student.student_id) ?? null,
  }));

  const filtered = rows.filter((row) => {
    if (filters?.grade && row.grade_label !== filters.grade) return false;
    if (filters?.section && row.section_label !== filters.section) return false;
    if (filters?.status && row.enrollment_status !== filters.status) return false;
    if (filters?.search) {
      const term = normalizeText(filters.search).toLowerCase();
      const haystack = `${row.display_name} ${row.admission_no}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const sorted = filtered.sort((a, b) => {
    const nameCompare = a.display_name.localeCompare(b.display_name);
    if (nameCompare !== 0) return nameCompare;
    return a.admission_no.localeCompare(b.admission_no);
  });

  const limit = Math.min(100, Math.max(1, filters?.limit ?? 50));
  const offset = Math.max(0, filters?.offset ?? 0);

  return {
    rows: sorted.slice(offset, offset + limit),
    total: sorted.length,
  };
}

export async function subscribeMonitoringOverview(
  callback: (payload: { new: MonitoringOverviewRow }) => void,
  filter?: { grade?: string },
) {
  const channel = supabase
    .channel("monitoring-overview-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "monitoring_overview" },
      (payload) => {
        const row = payload.new as MonitoringOverviewRow;
        if (filter?.grade && row.grade_label !== filter.grade) return;
        callback({ new: row });
      },
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
