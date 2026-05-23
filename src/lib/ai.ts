import { supabase } from "@/integrations/supabase/client";
import { fetchStudentRegister } from "@/lib/student-records";
import { isModuleEnabled } from "@/lib/module-access";
import { tableExists } from "@/lib/supabase-health";

export type AiInsight = { id: string; type: string; title: string; description: string; severity: string; };

export async function getStudentRiskInsights(): Promise<AiInsight[]> {
  const students = await fetchStudentRegister();
  const insights: AiInsight[] = [];

  const lowAttendance = students.filter((s) => Number(s.attendance_percent) < 75).slice(0, 5);
  if (lowAttendance.length > 0) insights.push({ id: "att-risk", type: "risk", title: "Low Attendance Alert", description: `${lowAttendance.length} students have attendance below 75%`, severity: "high" });

  if (await tableExists("fee_invoices")) {
    const { data: invoices } = await supabase.from("fee_invoices").select("amount,amount_paid,student_id");
    const pending = new Set((invoices ?? []).filter((i) => Number(i.amount) > Number(i.amount_paid)).map((i) => i.student_id));
    if (pending.size > 0) insights.push({ id: "fee-risk", type: "risk", title: "Fee Defaulters", description: `${pending.size} students have outstanding fees`, severity: "medium" });
  }

  if (await isModuleEnabled("exams")) {
    const { data: marks } = await supabase.from("exam_marks").select("marks_obtained");
    const lowMarks = (marks ?? []).filter((m) => Number(m.marks_obtained) > 0 && Number(m.marks_obtained) < 35).length;
    if (lowMarks > 0) insights.push({ id: "exam-risk", type: "risk", title: "Low Performance", description: `${lowMarks} exam entries scored below 35`, severity: "high" });
  }

  insights.push({ id: "overview", type: "insight", title: "Enrollment Summary", description: `${students.length} students enrolled across ${new Set(students.map((s) => s.grade)).size} grades`, severity: "info" });

  const activeStaff = await tableExists("staff")
    ? await supabase.from("staff").select("id", { count: "exact", head: true }).eq("status", "active")
    : { count: 0 };
  insights.push({ id: "staff-count", type: "insight", title: "Active Staff", description: `${activeStaff.count ?? 0} active staff members`, severity: "info" });

  return insights;
}

export async function getSmartSuggestions(): Promise<{ title: string; description: string; action: string }[]> {
  return [
    { title: "Send Fee Reminders", description: "4 students have overdue invoices", action: "Navigate to Fees" },
    { title: "Review Exam Results", description: "2 exams pending publication", action: "Navigate to Exams" },
    { title: "Update Attendance", description: "Today's attendance not marked for 3 classes", action: "Navigate to Attendance" },
    { title: "Check Pending Leaves", description: "2 leave requests awaiting approval", action: "Navigate to HR" },
  ];
}
