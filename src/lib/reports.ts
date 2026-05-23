import { supabase } from "@/integrations/supabase/client";
import { fetchStudentRegister } from "@/lib/student-records";
import { readSupabaseRows } from "@/lib/supabase-query";
import { isModuleEnabled } from "@/lib/module-access";
import { tableExists, tablesExist } from "@/lib/supabase-health";

// ── Types ──────────────────────────────────────────────────────

export type KpiCard = { label: string; value: string | number; subtitle?: string; trend?: "up" | "down" | "neutral" };

export type GradeDistrib = { grade: string; total: number; present: number; absent: number; paid: number; pending: number; passed: number; failed: number };

export type SubjectPerformance = { subject: string; code: string; avg_marks: number; max_marks: number; pass_rate: number; total_students: number };

export type MonthlyCollection = { month: string; collected: number; count: number; cash: number; online: number; cheque: number };

export type DefaulterRow = { student_name: string; admission_no: string; grade: string; outstanding: number; due_date: string; days_overdue: number; invoices: number };

export type AttendanceRow = { student_name: string; admission_no: string; grade: string; percent: number; total_days: number; present: number; status: string };

export type ConcessionSummary = { type: string; total_amount: number; count: number };

export type ExamPassFail = { grade: string; total: number; passed: number; failed: number; pass_rate: number };

// ── Overview KPIs ─────────────────────────────────────────────

export async function getOverviewKpis(): Promise<KpiCard[]> {
  const students = await fetchStudentRegister();
  const totalStudents = students.length;

  const staffCount = await tableExists("staff")
    ? (await supabase.from("staff").select("*", { count: "exact", head: true })).count
    : 0;
  const payments = await tableExists("fee_payments")
    ? (await supabase.from("fee_payments").select("amount_paid")).data ?? []
    : [];
  const totalCollected = (payments ?? []).reduce((s, p) => s + Number(p.amount_paid), 0);

  const invoices = await tableExists("fee_invoices")
    ? (await supabase.from("fee_invoices").select("amount,amount_paid")).data ?? []
    : [];
  const totalBilled = (invoices ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const totalPaid = (invoices ?? []).reduce((s, i) => s + Number(i.amount_paid), 0);
  const totalPending = Math.max(0, totalBilled - totalPaid);

  const avgAttendance = students.length > 0
    ? Math.round(students.reduce((s, st) => s + Number(st.attendance_percent), 0) / students.length)
    : 0;

  const examsEnabled = await isModuleEnabled("exams");
  const examResults = examsEnabled && (await tableExists("exam_marks"))
    ? (await supabase.from("exam_marks").select("marks_obtained,status")).data
    : [];
  const totalExams = (examResults ?? []).length;
  const passedExams = (examResults ?? []).filter((m) => m.status === "approved" && Number(m.marks_obtained) > 0).length;
  const passRate = examsEnabled ? (totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0) : 0;

  return [
    { label: "Total Students", value: totalStudents, subtitle: "Across all grades", trend: "neutral" },
    { label: "Total Staff", value: staffCount ?? 0, subtitle: "Active employees" },
    { label: "Avg Attendance", value: `${avgAttendance}%`, subtitle: "Overall this term", trend: avgAttendance >= 85 ? "up" : "down" },
    { label: "Total Collected", value: `₹${totalCollected.toLocaleString()}`, subtitle: "All time", trend: "up" },
    { label: "Pending Dues", value: `₹${totalPending.toLocaleString()}`, subtitle: `${invoices?.length ?? 0} invoices`, trend: totalPending > 0 ? "down" : "neutral" },
    { label: "Exam Pass Rate", value: examsEnabled ? `${passRate}%` : "N/A", subtitle: examsEnabled ? `${passedExams}/${totalExams} passed` : "Exams module not installed", trend: passRate >= 75 ? "up" : "down" },
  ];
}

// ── Grade Distribution ─────────────────────────────────────────

export async function getGradeDistribution(): Promise<GradeDistrib[]> {
  const examsEnabled = await isModuleEnabled("exams");
  if (!examsEnabled || !(await tableExists("exam_marks"))) {
    return [...new Set((await fetchStudentRegister()).map((s) => s.grade).filter(Boolean))].sort().map((grade) => ({
      grade,
      total: 0,
      present: 0,
      absent: 0,
      paid: 0,
      pending: 0,
      passed: 0,
      failed: 0,
    }));
  }
  const students = await fetchStudentRegister();
  const grades = [...new Set(students.map((s) => s.grade).filter(Boolean))].sort();

  const attendance = await tableExists("attendance")
    ? (await supabase.from("attendance").select("student_id,status")).data ?? []
    : [];
  const invoices = await tableExists("fee_invoices")
    ? (await supabase.from("fee_invoices").select("student_id,amount,amount_paid")).data ?? []
    : [];
  const marks = await tableExists("exam_marks")
    ? (await supabase.from("exam_marks").select("student_id,marks_obtained,status")).data ?? []
    : [];

  const attByStudent = new Map<string, { present: number; total: number }>();
  for (const a of attendance ?? []) {
    const entry = attByStudent.get(a.student_id) ?? { present: 0, total: 0 };
    entry.total++;
    if (a.status === "present") entry.present++;
    attByStudent.set(a.student_id, entry);
  }

  const paidByStudent = new Set((invoices ?? []).filter((i) => Number(i.amount_paid) >= Number(i.amount)).map((i) => i.student_id));
  const pendingByStudent = new Set((invoices ?? []).filter((i) => Number(i.amount_paid) < Number(i.amount)).map((i) => i.student_id));

  const passedByStudent = new Set((marks ?? []).filter((m) => m.status === "approved" && Number(m.marks_obtained) > 0).map((m) => m.student_id));
  const failedByStudent = new Set((marks ?? []).filter((m) => m.status === "approved" && Number(m.marks_obtained) <= 0).map((m) => m.student_id));

  return grades.map((grade) => {
    const gStudents = students.filter((s) => s.grade === grade);
    const total = gStudents.length;
    let present = 0, absent = 0;
    for (const s of gStudents) {
      const a = attByStudent.get(s.id);
      if (a) { present += a.present; absent += a.total - a.present; }
    }
    const paid = gStudents.filter((s) => paidByStudent.has(s.id)).length;
    const pending = gStudents.filter((s) => pendingByStudent.has(s.id)).length;
    const passed = gStudents.filter((s) => passedByStudent.has(s.id)).length;
    const failed = gStudents.filter((s) => failedByStudent.has(s.id)).length;
    return { grade, total, present, absent, paid, pending, passed, failed };
  });
}

// ── Subject Performance ────────────────────────────────────────

export async function getSubjectPerformance(): Promise<SubjectPerformance[]> {
  if (!(await isModuleEnabled("exams"))) return [];
  if (!(await tableExists("exam_schedules")) || !(await tableExists("exam_marks")) || !(await tableExists("subjects"))) return [];
  const schedules = readSupabaseRows(
    await supabase.from("exam_schedules").select("id,subject,subject_id"),
    [],
  );
  const { data: marks } = await supabase.from("exam_marks").select("exam_id,marks_obtained,status").eq("status", "approved");
  const { data: subjects } = await supabase.from("subjects").select("id,name,code");

  const subMap = new Map((subjects ?? []).map((s) => [s.id, s]));
  const marksByExam = new Map<string, number[]>();
  for (const m of marks ?? []) {
    const list = marksByExam.get(m.exam_id) ?? [];
    list.push(Number(m.marks_obtained));
    marksByExam.set(m.exam_id, list);
  }

  const perf = new Map<string, { marks: number[]; total: number }>();
  for (const sch of schedules ?? []) {
    const subjectName = sch.subject_id ? (subMap.get(sch.subject_id)?.name ?? sch.subject) : sch.subject;
    const subjCode = sch.subject_id ? (subMap.get(sch.subject_id)?.code ?? "") : "";
    const entry = perf.get(subjectName) ?? { marks: [], total: 0 };
    const examMarks = marksByExam.get(sch.id) ?? [];
    entry.marks.push(...examMarks);
    entry.total = Math.max(entry.total, sch.subject_id ? Number(subMap.get(sch.subject_id)?.name ?? 100) : 100);
    perf.set(subjectName, entry);
  }

  return [...perf.entries()].map(([subject, data]) => ({
    subject,
    code: (subjects ?? []).find((s) => s.name === subject)?.code ?? "",
    avg_marks: data.marks.length > 0 ? Math.round(data.marks.reduce((a, b) => a + b, 0) / data.marks.length * 100) / 100 : 0,
    max_marks: data.total,
    pass_rate: data.marks.length > 0 ? Math.round((data.marks.filter((m) => m > 0).length / data.marks.length) * 100 * 100) / 100 : 0,
    total_students: data.marks.length,
  })).sort((a, b) => b.total_students - a.total_students);
}

// ── Exam Pass/Fail by Grade ────────────────────────────────────

export async function getExamPassFail(): Promise<ExamPassFail[]> {
  if (!(await isModuleEnabled("exams"))) return [];
  if (!(await tableExists("exam_marks"))) return [];
  const students = await fetchStudentRegister();
  const grades = [...new Set(students.map((s) => s.grade).filter(Boolean))].sort();

  const { data: marks } = await supabase.from("exam_marks").select("student_id,marks_obtained,status").eq("status", "approved");

  const passedByStudent = new Set((marks ?? []).filter((m) => Number(m.marks_obtained) > 0).map((m) => m.student_id));
  const failedByStudent = new Set((marks ?? []).filter((m) => Number(m.marks_obtained) <= 0).map((m) => m.student_id));

  return grades.map((grade) => {
    const gStudents = students.filter((s) => s.grade === grade);
    const total = gStudents.length;
    const passed = gStudents.filter((s) => passedByStudent.has(s.id)).length;
    const failed = gStudents.filter((s) => failedByStudent.has(s.id)).length;
    return { grade, total, passed, failed, pass_rate: total > 0 ? Math.round((passed / total) * 100 * 100) / 100 : 0 };
  });
}

// ── Monthly Collection Report ──────────────────────────────────

export async function getMonthlyCollection(): Promise<MonthlyCollection[]> {
  if (!(await tableExists("fee_payments"))) return [];
  const { data: payments } = await supabase.from("fee_payments").select("amount_paid,payment_method,payment_date").order("payment_date", { ascending: true });
  const monthly = new Map<string, { collected: number; count: number; cash: number; online: number; cheque: number }>();

  for (const p of payments ?? []) {
    const key = new Date(p.payment_date).toISOString().slice(0, 7);
    const entry = monthly.get(key) ?? { collected: 0, count: 0, cash: 0, online: 0, cheque: 0 };
    const amt = Number(p.amount_paid);
    if (amt <= 0) continue;
    entry.collected += amt;
    entry.count++;
    if (p.payment_method === "cash") entry.cash += amt;
    else if (p.payment_method === "online" || p.payment_method === "card" || p.payment_method === "upi") entry.online += amt;
    else entry.cheque += amt;
    monthly.set(key, entry);
  }

  return [...monthly.entries()].map(([month, d]) => ({ month, ...d })).sort((a, b) => a.month.localeCompare(b.month));
}

// ── Defaulter Report ───────────────────────────────────────────

export async function getDefaulterReport(gradeFilter?: string): Promise<DefaulterRow[]> {
  if (!(await tablesExist(["fee_invoices", "students"]))) return [];
  const { data: invoices } = await supabase.from("fee_invoices").select("id,student_id,amount,amount_paid,due_date").order("due_date", { ascending: true });
  const students = await fetchStudentRegister();

  const overdue: DefaulterRow[] = [];
  const now = new Date();

  for (const inv of invoices ?? []) {
    const outstanding = Number(inv.amount) - Number(inv.amount_paid);
    if (outstanding <= 0) continue;
    if (!inv.due_date) continue;
    const due = new Date(inv.due_date);
    const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOverdue < 0) continue;

    const stu = students.find((s) => s.id === inv.student_id);
    if (!stu) continue;
    if (gradeFilter && stu.grade !== gradeFilter) continue;

    const existing = overdue.find((d) => d.student_name === stu.display_name);
    if (existing) {
      existing.outstanding += outstanding;
      existing.invoices++;
      if (new Date(inv.due_date) < new Date(existing.due_date)) { existing.due_date = inv.due_date; existing.days_overdue = daysOverdue; }
    } else {
      overdue.push({
        student_name: stu.display_name,
        admission_no: stu.admission_no,
        grade: stu.grade ?? "",
        outstanding: Math.round(outstanding * 100) / 100,
        due_date: inv.due_date,
        days_overdue: daysOverdue,
        invoices: 1,
      });
    }
  }

  return overdue.sort((a, b) => b.outstanding - a.outstanding);
}

// ── Attendance Report ──────────────────────────────────────────

export async function getAttendanceReport(gradeFilter?: string, minPercent?: number): Promise<AttendanceRow[]> {
  const students = await fetchStudentRegister();
  const attendance = await tableExists("attendance")
    ? (await supabase.from("attendance").select("student_id,status")).data ?? []
    : [];

  const attByStudent = new Map<string, { present: number; total: number }>();
  for (const a of attendance ?? []) {
    const e = attByStudent.get(a.student_id) ?? { present: 0, total: 0 };
    e.total++;
    if (a.status === "present") e.present++;
    attByStudent.set(a.student_id, e);
  }

  return students
    .filter((s) => !gradeFilter || s.grade === gradeFilter)
    .map((s) => {
      const a = attByStudent.get(s.id) ?? { present: 0, total: 0 };
      const percent = a.total > 0 ? Math.round((a.present / a.total) * 100 * 100) / 100 : 0;
      return {
        student_name: s.display_name,
        admission_no: s.admission_no,
        grade: s.grade ?? "",
        percent,
        total_days: a.total,
        present: a.present,
        status: s.status,
      };
    })
    .filter((r) => minPercent === undefined || r.percent < minPercent)
    .sort((a, b) => a.percent - b.percent);
}

// ── Concession Summary ─────────────────────────────────────────

export async function getConcessionSummary(): Promise<ConcessionSummary[]> {
  if (!(await tableExists("fee_concessions"))) return [];
  const { data: concessions } = await supabase.from("fee_concessions").select("type,amount");
  const byType = new Map<string, { total_amount: number; count: number }>();
  for (const c of concessions ?? []) {
    const e = byType.get(c.type) ?? { total_amount: 0, count: 0 };
    e.total_amount += Number(c.amount);
    e.count++;
    byType.set(c.type, e);
  }
  return [...byType.entries()].map(([type, d]) => ({ type, ...d })).sort((a, b) => b.total_amount - a.total_amount);
}

// ── Export helpers ─────────────────────────────────────────────

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((r) => headers.map((h) => {
    const v = r[h];
    if (v === null || v === undefined) return "";
    const s = String(v);
    return s.includes(",") || s.includes("\"") || s.includes("\n") ? `"${s.replace(/"/g, "\"\"")}"` : s;
  }).join(","));
  return [headers.join(","), ...lines].join("\n");
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
