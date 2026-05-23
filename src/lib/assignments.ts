import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Assignment = {
  id: string; title: string; description: string | null; subject_id: string; class_id: string;
  due_date: string | null; max_marks: number; created_by: string | null; status: string; created_at: string;
};

export type AssignmentJoined = Assignment & { subject_name?: string; subject_code?: string; grade?: string; section?: string; submission_count?: number; graded_count?: number };

export type Submission = {
  id: string; assignment_id: string; student_id: string; content: string | null; file_url: string | null;
  submitted_at: string; status: string; marks: number | null; feedback: string | null; graded_by: string | null; graded_at: string | null;
};

export type SubmissionJoined = Submission & { student_name?: string; admission_no?: string };

export async function getClasses(): Promise<any[]> {
  if (!(await tableExists("classes"))) return [];
  const { data } = await supabase.from("classes").select("*").order("grade"); return data ?? [];
}
export async function getSubjects(): Promise<any[]> {
  if (!(await tableExists("subjects"))) return [];
  const { data } = await supabase.from("subjects").select("*").order("name"); return data ?? [];
}
export async function getStudents() {
  if (!(await tableExists("students"))) return [];
  const { data } = await supabase.from("students").select("id,first_name,last_name,admission_no"); return data ?? [];
}

export async function getAssignments(classId?: string): Promise<AssignmentJoined[]> {
  if (!(await tableExists("assignments"))) return [];
  let q = supabase.from("assignments").select("*").order("created_at", { ascending: false });
  if (classId) q = q.eq("class_id", classId);
  const { data } = await q;
  const rows = (data ?? []) as Assignment[];

  const [subjects, classes, submissions] = await Promise.all([
    getSubjects(),
    getClasses(),
    tableExists("submissions")
      ? supabase.from("submissions").select("assignment_id,status,marks")
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const subjMap = new Map((subjects as any[]).map((s: any) => [s.id, s]));
  const clsMap = new Map((classes as any[]).map((c: any) => [c.id, c]));
  const subCount = new Map<string, number>();
  const gradedCount = new Map<string, number>();
  for (const s of (submissions.data ?? []) as any[]) {
    subCount.set(s.assignment_id, (subCount.get(s.assignment_id) ?? 0) + 1);
    if (s.marks !== null) gradedCount.set(s.assignment_id, (gradedCount.get(s.assignment_id) ?? 0) + 1);
  }

  return rows.map((a) => {
    const subj = subjMap.get(a.subject_id); const cls = clsMap.get(a.class_id);
    return { ...a, subject_name: (subj as any)?.name, subject_code: (subj as any)?.code, grade: (cls as any)?.grade, section: (cls as any)?.section, submission_count: subCount.get(a.id) ?? 0, graded_count: gradedCount.get(a.id) ?? 0 };
  });
}

export async function saveAssignment(a: Omit<Assignment, "id" | "created_at" | "updated_at"> & { id?: string }): Promise<Assignment> {
  if (!(await tableExists("assignments"))) throw new Error("Run assignments migration first");
  if (a.id) {
    const { data, error } = await supabase.from("assignments").update({ title: a.title, description: a.description, due_date: a.due_date, max_marks: a.max_marks, status: a.status }).eq("id", a.id).select("*").single();
    if (error) throw error; return data as unknown as Assignment;
  }
  const { data, error } = await supabase.from("assignments").insert({ title: a.title, description: a.description, subject_id: a.subject_id, class_id: a.class_id, due_date: a.due_date, max_marks: a.max_marks, created_by: a.created_by }).select("*").single();
  if (error) throw error; return data as unknown as Assignment;
}

export async function deleteAssignment(id: string): Promise<void> {
  if (!(await tableExists("assignments"))) return;
  const { error } = await supabase.from("assignments").delete().eq("id", id);
  if (error) throw error;
}

export async function getSubmissions(assignmentId: string): Promise<SubmissionJoined[]> {
  if (!(await tableExists("submissions"))) return [];
  const { data } = await supabase.from("submissions").select("*").eq("assignment_id", assignmentId).order("submitted_at");
  const rows = (data ?? []) as Submission[];
  const students = await getStudents();
  const sMap = new Map((students as any[]).map((s: any) => [s.id, s]));
  return rows.map((s) => {
    const stu = sMap.get(s.student_id) as any;
    return { ...s, student_name: stu ? `${stu.first_name} ${stu.last_name ?? ""}`.trim() : undefined, admission_no: stu?.admission_no };
  });
}

export async function gradeSubmission(id: string, marks: number, feedback: string): Promise<void> {
  if (!(await tableExists("submissions"))) throw new Error("Run assignments migration first");
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from("submissions").update({ marks, feedback, status: "graded", graded_by: auth.user?.id ?? null, graded_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}
