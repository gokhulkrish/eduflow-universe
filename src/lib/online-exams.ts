import { supabase } from "@/integrations/supabase/client";
import { readSupabaseRows } from "@/lib/supabase-query";
import { isModuleEnabled } from "@/lib/module-access";
import { tableExists } from "@/lib/supabase-health";
import { emitAppSync } from "@/lib/app-sync";

export type TestAttempt = { id: string; test_id: string; student_id: string; student_name: string; score: number | null; total: number; percentage: number | null; status: string; submitted_at: string | null; };

export const onlineExamResultsKey = "eduflow_test_results";
export const onlineExamAttemptsKey = "eduflow_test_attempts";
export const onlineExamTestsKey = "eduflow_online_tests";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getLocalTests(): any[] { return ls(onlineExamTestsKey, []); }
export function saveLocalTest(test: any) {
  const tests = getLocalTests();
  if (test.id) { const i = tests.findIndex((t: any) => t.id === test.id); if (i >= 0) { tests[i] = { ...tests[i], ...test }; ss(onlineExamTestsKey, tests); return tests[i]; } }
  const nt = { ...test, id: crypto.randomUUID(), created_at: new Date().toISOString() }; tests.push(nt); ss(onlineExamTestsKey, tests); return nt;
}
export function deleteLocalTest(id: string) { ss(onlineExamTestsKey, getLocalTests().filter((t: any) => t.id !== id)); }

export function getResults(): TestAttempt[] { return ls(onlineExamResultsKey, []); }

export function gradeAttempt(testId: string, studentId: string, answers: { question_id: string; answer: string; correct_answer: string; marks: number }[]): TestAttempt {
  let score = 0; let total = 0;
  answers.forEach((a) => { total += a.marks; if (a.answer?.trim().toLowerCase() === a.correct_answer?.trim().toLowerCase()) score += a.marks; });
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const results = getResults();
  const n: TestAttempt = { id: crypto.randomUUID(), test_id: testId, student_id: studentId, student_name: "Student " + studentId.slice(0, 4), score, total, percentage: pct, status: pct >= 35 ? "passed" : "failed", submitted_at: new Date().toISOString() };
  results.push(n); ss(onlineExamResultsKey, results); return n;
}

export function getResultAnalytics(testId: string) {
  const all = getResults();
  const filtered = testId ? all.filter((r) => r.test_id === testId) : all;
  const total = filtered.length; const passed = filtered.filter((r) => r.status === "passed").length;
  const failed = total - passed;
  const scores = filtered.map((r) => r.percentage || 0);
  const avgPct = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
  const highest = scores.length > 0 ? Math.max(...scores) : 0;
  const lowest = scores.length > 0 ? Math.min(...scores) : 0;
  return { total, passed, failed, passRate: total > 0 ? Math.round((passed / total) * 100) : 0, avgPct, highest, lowest, scores };
}

export async function getQuestionBanks(subjectId?: string): Promise<any[]> {
  if (!(await isModuleEnabled("exams")) || !(await tableExists("question_banks"))) return [];
  let q = supabase.from("question_banks").select("*");
  if (subjectId) q = q.eq("subject_id", subjectId);
  const result = await q.order("created_at", { ascending: false }).limit(200).returns<any>();
  return readSupabaseRows(result, []);
}

export async function getClasses(): Promise<any[]> {
  if (!(await tableExists("classes"))) return [];
  const { data } = await supabase.from("classes").select("*").order("grade"); return data ?? [];
}
export async function getSubjects(): Promise<any[]> {
  if (!(await tableExists("subjects"))) return [];
  const { data } = await supabase.from("subjects").select("*").order("name"); return data ?? [];
}
