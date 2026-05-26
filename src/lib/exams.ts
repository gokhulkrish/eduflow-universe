import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { fetchStudentRegister, type StudentRegisterRow } from "@/lib/student-records";
import { readSupabaseRows } from "@/lib/supabase-query";
import { isModuleEnabled } from "@/lib/module-access";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

// ── Pure helpers (no I/O) ──────────────────────────────────────

export function calculateGrade(percentage: number | null): string {
  if (percentage === null) return "—";
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B+";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

export function calculateGPA(grades: string[]): number {
  const gradePoints: Record<string, number> = {
    "A+": 10, "A": 9, "B+": 8, "B": 7, "C": 6, "D": 5, "F": 0,
  };
  const points = grades.map((g) => gradePoints[g] ?? 0);
  return points.length ? points.reduce((a, b) => a + b, 0) / points.length : 0;
}

export function getGradeDistribution(marks: { marks_obtained: number | null; grade: string | null }[], max_marks: number) {
  const dist = new Map<string, number>();
  for (const m of marks) {
    const pct = m.marks_obtained !== null && max_marks > 0
      ? (m.marks_obtained / max_marks) * 100
      : null;
    const grade = calculateGrade(pct);
    dist.set(grade, (dist.get(grade) ?? 0) + 1);
  }
  return [...dist.entries()]
    .map(([grade, count]) => ({ grade, count }))
    .sort((a, b) => {
      const order = ["A+", "A", "B+", "B", "C", "D", "F"];
      return order.indexOf(a.grade) - order.indexOf(b.grade);
    });
}

export function getPassFailStats(marks: { marks_obtained: number | null }[], pass_marks: number) {
  const total = marks.length;
  const passed = marks.filter((m) => m.marks_obtained !== null && m.marks_obtained >= pass_marks).length;
  return { total, passed, failed: total - passed, passRate: total ? Math.round((passed / total) * 100) : 0 };
}

// ── Types ──────────────────────────────────────────────────────

export type ExamStatus = "draft" | "published" | "completed" | "cancelled";
export type ExamType = "midterm" | "final" | "quiz" | "unit_test" | "preboard" | "other";
export type MarkStatus = "pending" | "approved" | "rejected";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionType = "mcq" | "short_answer" | "long_answer" | "true_false" | "fill_blank";
export type TranscriptStatus = "draft" | "issued" | "revoked";

export const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "quiz", label: "Quiz" },
  { value: "unit_test", label: "Unit Test" },
  { value: "midterm", label: "Midterm" },
  { value: "final", label: "Final" },
  { value: "preboard", label: "Pre-Board" },
  { value: "other", label: "Other" },
];

export const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "mcq", label: "MCQ" },
  { value: "short_answer", label: "Short Answer" },
  { value: "long_answer", label: "Long Answer" },
  { value: "true_false", label: "True/False" },
  { value: "fill_blank", label: "Fill in the Blank" },
];

export type ExamSchedule = {
  id: string;
  title: string;
  exam_type: ExamType;
  grade: string;
  section: string;
  subject: string;
  subject_id: string | null;
  max_marks: number;
  pass_marks: number;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  status: ExamStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ExamMark = {
  id: string;
  exam_id: string;
  student_id: string;
  marks_obtained: number | null;
  grade: string | null;
  remarks: string;
  status: MarkStatus;
  entered_by: string | null;
  moderated_by: string | null;
  moderated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type QuestionBank = {
  id: string;
  subject_id: string;
  grade: string;
  topic: string;
  difficulty: Difficulty;
  question_type: QuestionType;
  question_text: string;
  options: Record<string, string> | null;
  correct_answer: string;
  marks: number;
  explanation: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Transcript = {
  id: string;
  student_id: string;
  academic_year: string;
  exam_ids: string[];
  total_marks: number | null;
  obtained_marks: number | null;
  percentage: number | null;
  gpa: number | null;
  status: TranscriptStatus;
  issued_at: string | null;
  pdf_url: string | null;
  qr_token: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ResultPublication = {
  id: string;
  exam_id: string;
  published_by: string | null;
  published_at: string;
  notify_students: boolean;
  notify_parents: boolean;
  meta: Json;
};

export type StudentExamResult = {
  student: StudentRegisterRow;
  marks: ExamMark | null;
  percentage: number | null;
  grade: string | null;
  passed: boolean;
};

// ── Subjects helper ────────────────────────────────────────────

export async function fetchSubjects() {
  if (!(await tableExists("subjects"))) return [];
  const { data, error } = await supabase.from("subjects").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchGradeOptions(): Promise<string[]> {
  const rows = await fetchStudentRegister();
  return [...new Set(rows.map((r) => r.grade).filter((g): g is string => g !== null))].sort();
}

// ── Exam Schedules ─────────────────────────────────────────────

export async function getExamSchedules(): Promise<ExamSchedule[]> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_schedules"))) return [];
  const result = await supabase
    .from("exam_schedules")
    .select("*")
    .order("date", { ascending: false });
  return readSupabaseRows(result, []) as unknown as ExamSchedule[];
}

export async function getExamSchedule(id: string): Promise<ExamSchedule | null> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_schedules"))) return null;
  const result = await supabase
    .from("exam_schedules")
    .select("*")
    .eq("id", id)
    .single();
  return readSupabaseRows(result, null) as unknown as ExamSchedule | null;
}

export async function saveExamSchedule(
  schedule: Omit<ExamSchedule, "id" | "created_at" | "updated_at" | "created_by"> & { id?: string }
): Promise<ExamSchedule> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_schedules"))) throw new Error("Run the exams migration first");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  if (schedule.id) {
    const { data, error } = await supabase
      .from("exam_schedules")
      .update({ ...schedule, updated_at: new Date().toISOString() })
      .eq("id", schedule.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as ExamSchedule;
  }

  const { data, error } = await supabase
    .from("exam_schedules")
    .insert({ ...schedule, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ExamSchedule;
}

export async function deleteExamSchedule(id: string): Promise<void> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_schedules"))) return;
  const { error } = await supabase.from("exam_schedules").delete().eq("id", id);
  if (error) throw error;
}

export async function updateExamStatus(id: string, status: ExamStatus): Promise<void> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_schedules"))) return;
  const { error } = await supabase
    .from("exam_schedules")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ── Exam Marks ─────────────────────────────────────────────────

export async function getMarksForExam(examId: string): Promise<ExamMark[]> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_marks"))) return [];
  const result = await supabase
    .from("exam_marks")
    .select("*")
    .eq("exam_id", examId)
    .order("created_at");
  return readSupabaseRows(result, []) as unknown as ExamMark[];
}

export async function saveExamMark(
  mark: Omit<ExamMark, "id" | "created_at" | "updated_at">
): Promise<ExamMark> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_marks"))) throw new Error("Run the exams migration first");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const { data: existing } = await supabase
    .from("exam_marks")
    .select("id")
    .eq("exam_id", mark.exam_id)
    .eq("student_id", mark.student_id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("exam_marks")
      .update({ ...mark, entered_by: userId, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as ExamMark;
  }

  const { data, error } = await supabase
    .from("exam_marks")
    .insert({ ...mark, entered_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ExamMark;
}

export async function saveExamMarks(
  marks: Omit<ExamMark, "id" | "created_at" | "updated_at">[]
): Promise<ExamMark[]> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_marks"))) throw new Error("Run the exams migration first");
  const results: ExamMark[] = [];
  for (const mark of marks) {
    results.push(await saveExamMark(mark));
  }
  return results;
}

export async function rejectExamMarks(
  examId: string,
  studentIds: string[],
  remarks?: string
): Promise<void> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_marks"))) return;
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const { error } = await supabase
    .from("exam_marks")
    .update({
      status: "rejected",
      moderated_by: userId,
      moderated_at: new Date().toISOString(),
      ...(remarks !== undefined ? { remarks } : {}),
    })
    .eq("exam_id", examId)
    .in("student_id", studentIds);
  if (error) throw error;
}

export async function approveMarks(
  examId: string,
  studentIds: string[]
): Promise<void> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("exam_marks"))) return;
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const { error } = await supabase
    .from("exam_marks")
    .update({
      status: "approved",
      moderated_by: userId,
      moderated_at: new Date().toISOString(),
    })
    .eq("exam_id", examId)
    .in("student_id", studentIds);
  if (error) throw error;
}

// ── Question Bank ──────────────────────────────────────────────

export async function getQuestions(filters?: {
  subject_id?: string;
  grade?: string;
  difficulty?: Difficulty;
  question_type?: QuestionType;
}): Promise<QuestionBank[]> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("question_banks"))) return [];
  let query = supabase.from("question_banks").select("*").order("created_at", { ascending: false });
  if (filters?.subject_id) query = query.eq("subject_id", filters.subject_id);
  if (filters?.grade) query = query.eq("grade", filters.grade);
  if (filters?.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters?.question_type) query = query.eq("question_type", filters.question_type);
  const result = await query;
  return readSupabaseRows(result, []) as unknown as QuestionBank[];
}

export async function saveQuestion(
  question: Omit<QuestionBank, "id" | "created_at" | "updated_at" | "created_by"> & { id?: string }
): Promise<QuestionBank> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("question_banks"))) throw new Error("Run the exams migration first");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  if (question.id) {
    const { data, error } = await supabase
      .from("question_banks")
      .update({ ...question, updated_at: new Date().toISOString() })
      .eq("id", question.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as QuestionBank;
  }

  const { data, error } = await supabase
    .from("question_banks")
    .insert({ ...question, created_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as QuestionBank;
}

export async function deleteQuestion(id: string): Promise<void> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("question_banks"))) return;
  const { error } = await supabase.from("question_banks").delete().eq("id", id);
  if (error) throw error;
}

// ── Result Publications ────────────────────────────────────────

export async function publishResult(
  examId: string,
  opts?: { notify_students?: boolean; notify_parents?: boolean }
): Promise<ResultPublication> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("result_publications"))) throw new Error("Run the exams migration first");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  // Automatically promote exam status so it appears in Results & Grades
  await supabase
    .from("exam_schedules")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", examId);

  const { data: existing } = await supabase
    .from("result_publications")
    .select("id")
    .eq("exam_id", examId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from("result_publications")
      .update({
        published_by: userId,
        published_at: new Date().toISOString(),
        notify_students: opts?.notify_students ?? false,
        notify_parents: opts?.notify_parents ?? false,
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as ResultPublication;
  }

  const { data, error } = await supabase
    .from("result_publications")
    .insert({
      exam_id: examId,
      published_by: userId,
      notify_students: opts?.notify_students ?? false,
      notify_parents: opts?.notify_parents ?? false,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as ResultPublication;
}

export async function getPublicationForExam(examId: string): Promise<ResultPublication | null> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("result_publications"))) return null;
  const { data, error } = await supabase
    .from("result_publications")
    .select("*")
    .eq("exam_id", examId)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as ResultPublication | null;
}

export async function getPublicationsForExams(examIds: string[]): Promise<Map<string, ResultPublication>> {
  if (!examIds.length || !(await isModuleEnabled("exams")) || !(await tableExists("result_publications"))) return new Map();
  const { data, error } = await supabase
    .from("result_publications")
    .select("*")
    .in("exam_id", examIds);
  if (error) throw error;
  const map = new Map<string, ResultPublication>();
  for (const p of (data ?? []) as unknown as ResultPublication[]) {
    map.set(p.exam_id, p);
  }
  return map;
}

// ── Transcripts ────────────────────────────────────────────────

export async function getTranscripts(filters?: {
  student_id?: string;
  academic_year?: string;
}): Promise<Transcript[]> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("transcripts"))) return [];
  let query = supabase.from("transcripts").select("*").order("created_at", { ascending: false });
  if (filters?.student_id) query = query.eq("student_id", filters.student_id);
  if (filters?.academic_year) query = query.eq("academic_year", filters.academic_year);
  const result = await query;
  return readSupabaseRows(result, []) as unknown as Transcript[];
}

export async function issueTranscript(
  studentId: string,
  academicYear: string,
  examIds: string[]
): Promise<Transcript> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("transcripts")) || !(await tableExists("exam_marks"))) {
    throw new Error("Run the exams migration first");
  }
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const { data: marks, error: marksError } = await supabase
    .from("exam_marks")
    .select("exam_id, marks_obtained, status")
    .in("exam_id", examIds)
    .eq("student_id", studentId)
    .eq("status", "approved");
  if (marksError) throw marksError;

  const total = marks?.reduce((sum, m) => sum + (m.marks_obtained ?? 0), 0) ?? 0;
  const schedules = readSupabaseRows(
    await supabase
      .from("exam_schedules")
      .select("id, max_marks")
      .in("id", examIds),
    [],
  );
  const totalPossible = schedules?.reduce((sum, s) => sum + (s.max_marks ?? 0), 0) ?? 0;
  const pct = totalPossible > 0 ? Math.round((total / totalPossible) * 100 * 100) / 100 : null;
  const maxMarksByExam = new Map(schedules.map((s) => [s.id, s.max_marks ?? 0]));
  const grades = marks?.map((m) => {
    const maxM = maxMarksByExam.get(m.exam_id) ?? 0;
    return calculateGrade(m.marks_obtained !== null && maxM > 0 ? (m.marks_obtained / maxM) * 100 : null);
  }) ?? [];

  const { data, error } = await supabase
    .from("transcripts")
    .insert({
      student_id: studentId,
      academic_year: academicYear,
      exam_ids: examIds,
      total_marks: totalPossible,
      obtained_marks: total,
      percentage: pct,
      gpa: grades.length ? Math.round(calculateGPA(grades) * 100) / 100 : null,
      status: "issued",
      issued_at: new Date().toISOString(),
      qr_token: generateId(),
      created_by: userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Transcript;
}
