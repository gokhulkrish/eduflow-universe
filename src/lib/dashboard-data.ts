import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
import { fetchStudentRegister } from "@/lib/student-records";
import { getOverviewKpis, type KpiCard } from "@/lib/reports";
import { enrollmentTrend, attendanceWeek, performanceByProgram, departmentDist, activities, erpRealtimeFabric } from "@/lib/mock-data";

export type { KpiCard };

export type DashboardKpis = {
  students: KpiCard;
  staff: KpiCard;
  revenue: KpiCard;
  attendance: KpiCard;
};

export type EnrollmentMonth = { month: string; students: number; revenue: number };
export type AttendanceDay = { day: string; present: number; absent: number };
export type ProgramPerformance = { program: string; avg: number };
export type DeptDist = { name: string; value: number };
export type Activity = { user: string; action: string; time: string };
export type ModuleHealth = { key: string; title: string; exists: boolean; state: "healthy" | "missing" };

const MODULE_TABLE_MAP: [string, string, string][] = [
  ["students", "Students", "students"],
  ["staff", "Staff", "staff"],
  ["attendance", "Attendance", "attendance"],
  ["fees", "Fees", "fee_payments"],
  ["exams", "Exams", "exam_marks"],
  ["admissions", "Admissions", "admissions"],
  ["library", "Library", "library_books"],
  ["hostel", "Hostel", "hostels"],
  ["transport", "Transport", "transport_routes"],
  ["hr", "HR", "staff"],
  ["departments", "Departments", "departments"],
  ["assignments", "Assignments", "assignments"],
  ["certificates", "Certificates", "certificate_templates"],
  ["health", "Health", "health_cases"],
  ["documents", "Documents", "documents"],
  ["lms", "LMS", "lms_courses"],
  ["research", "Research", "research_projects"],
  ["procurement", "Procurement", "procurement_requests"],
  ["it-labs", "IT Labs", "it_labs"],
  ["it-network", "IT Network", "it_network_devices"],
  ["iot-devices", "IoT Devices", "iot_devices"],
  ["scholarship", "Scholarship", "scholarships"],
];

export async function fetchDashboardKpis(): Promise<DashboardKpis> {
  const kpis = await getOverviewKpis();
  const find = (label: string) => kpis.find((k) => k.label === label);
  return {
    students: find("Total Students") ?? { label: "Total Students", value: 2847, trend: "up" },
    staff: find("Total Staff") ?? { label: "Faculty Members", value: 184, trend: "up" },
    revenue: find("Total Collected") ?? { label: "Revenue (MTD)", value: "$1.28M", trend: "up" },
    attendance: find("Avg Attendance") ?? { label: "Avg Attendance", value: "94.6%", trend: "up" },
  };
}

export async function fetchEnrollmentTrend(): Promise<EnrollmentMonth[]> {
  const students = await fetchStudentRegister();
  const total = students.length;
  if (total === 0) return enrollmentTrend;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const countPerMonth = Math.round(total / months.length);
  return months.map((month, i) => ({
    month,
    students: countPerMonth * (i + 1),
    revenue: Math.round(1284500 * ((i + 1) / months.length)),
  }));
}

export async function fetchAttendanceWeek(): Promise<AttendanceDay[]> {
  if (!(await tableExists("attendance"))) return attendanceWeek;
  const now = new Date();
  const days: AttendanceDay[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
    const dayStart = d.toISOString().split("T")[0];
    const { count: present } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .gte("date", `${dayStart}T00:00:00`)
      .lte("date", `${dayStart}T23:59:59`)
      .eq("status", "present");
    const { count: total } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .gte("date", `${dayStart}T00:00:00`)
      .lte("date", `${dayStart}T23:59:59`);
    const p = present ?? 0;
    const t = total ?? 0;
    days.push({ day: dayName, present: t > 0 ? Math.round((p / t) * 100) : 96, absent: t > 0 ? Math.round(((t - p) / t) * 100) : 4 });
  }
  return days;
}

export async function fetchProgramPerformance(): Promise<ProgramPerformance[]> {
  if (!(await tableExists("exam_marks"))) return performanceByProgram;
  const { data: marks } = await supabase
    .from("exam_marks")
    .select("student_id, marks_obtained")
    .eq("status", "approved");
  if (!marks || marks.length === 0) return performanceByProgram;
  const studentIds = [...new Set(marks.map((m) => m.student_id).filter(Boolean))] as string[];
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("student_id, program_id")
    .in("student_id", studentIds);
  const { data: programs } = await (supabase as any)
    .from("programs")
    .select("id, name");
  const studentProgram = new Map((enrollments ?? []).map((e) => [e.student_id, e.program_id]));
  const programNames = new Map((programs ?? []).map((p: any) => [p.id, p.name]));
  const programMarks = new Map<string, number[]>();
  for (const m of marks ?? []) {
    if (!m.student_id || m.marks_obtained == null) continue;
    const programId = studentProgram.get(m.student_id);
    const programName = programNames.get(programId) ?? "Unknown";
    const list = programMarks.get(programName) ?? [];
    list.push(Number(m.marks_obtained));
    programMarks.set(programName, list);
  }
  const result = [...programMarks.entries()]
    .map(([program, vals]) => ({
      program,
      avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }))
    .sort((a, b) => b.avg - a.avg);
  return result.length > 0 ? result : performanceByProgram;
}

export async function fetchDepartmentDist(): Promise<DeptDist[]> {
  if (!(await tableExists("departments"))) return departmentDist;
  const { data } = await supabase.from("departments").select("department_name");
  if (!data || data.length === 0) return departmentDist;
  return data.map((d) => ({ name: d.department_name, value: Math.round(100 / data.length) }));
}

export async function fetchModuleHealth(): Promise<ModuleHealth[]> {
  const results = await Promise.all(
    MODULE_TABLE_MAP.map(async ([key, title, table]) => {
      const exists = await tableExists(table);
      return { key, title, exists, state: exists ? ("healthy" as const) : ("missing" as const) };
    }),
  );
  return results;
}

export const quickActions = [
  { label: "Add Student", path: "/students/add", icon: "UserPlus", roles: ["admin", "super_admin", "hod"] },
  { label: "Record Attendance", path: "/attendance", icon: "ClipboardCheck", roles: ["admin", "super_admin", "faculty", "hod"] },
  { label: "Fee Collection", path: "/fees", icon: "DollarSign", roles: ["admin", "super_admin", "finance"] },
  { label: "New Admission", path: "/admissions", icon: "FilePlus", roles: ["admin", "super_admin"] },
  { label: "Generate Certificates", path: "/certificates", icon: "ScrollText", roles: ["admin", "super_admin", "certificate"] },
  { label: "View Reports", path: "/reports", icon: "BarChart3", roles: ["admin", "super_admin", "hod", "principal"] },
  { label: "HR & Payroll", path: "/hr", icon: "Briefcase", roles: ["admin", "super_admin", "hr"] },
  { label: "Import Data", path: "/import", icon: "Upload", roles: ["admin", "super_admin"] },
];
