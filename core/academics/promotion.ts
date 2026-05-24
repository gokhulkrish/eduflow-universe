import "../../src/lib/runtime-storage";
import { supabase } from "../../src/integrations/supabase/client";
import { tableExists } from "../../src/lib/supabase-health";
import { writeAuditEntry } from "../audit/service";

export interface PromotionCriteria {
  from_grade: string;
  to_grade: string;
  from_section: string | null;
  to_section: string | null;
  min_attendance: number;
  min_gpa: number;
  auto_promote: boolean;
  reset_roll: boolean;
  status: string;
  academic_year_id: string | null;
}

export interface PromotionRule {
  id?: string;
  name: string;
  grade: string;
  institution_id: string;
  criteria: PromotionCriteria;
  created_at?: string;
  updated_at?: string;
}

export interface PromotionRun {
  id?: string;
  rule_id: string;
  initiated_by: string;
  promoted_count: number;
  total_eligible: number;
  status: string;
  started_at: string;
  completed_at?: string | null;
  created_at?: string;
}

const LOCAL_RULES_KEY = "sms.promotion.rules.v1";
const LOCAL_RUNS_KEY = "sms.promotion.runs.v1";

const isBrowser = typeof window !== "undefined";
const isNextBrowser = isBrowser && Boolean(document.querySelector("script#__NEXT_DATA__"));
const useLocalPromotionStore = isBrowser && !isNextBrowser;

function readLocalJson<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocalJson(key: string, value: unknown) {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local fallback should never block the UI.
  }
}

function getLocalPromotionRules(): PromotionRule[] {
  return readLocalJson<PromotionRule[]>(LOCAL_RULES_KEY, []);
}

function saveLocalPromotionRules(rules: PromotionRule[]) {
  writeLocalJson(LOCAL_RULES_KEY, rules);
}

function getLocalPromotionRuns(): PromotionRun[] {
  return readLocalJson<PromotionRun[]>(LOCAL_RUNS_KEY, []);
}

function saveLocalPromotionRuns(runs: PromotionRun[]) {
  writeLocalJson(LOCAL_RUNS_KEY, runs);
}

function upsertLocalPromotionRule(rule: PromotionRule): PromotionRule {
  const rules = getLocalPromotionRules();
  const now = new Date().toISOString();
  const next: PromotionRule = {
    ...rule,
    id: rule.id ?? crypto.randomUUID(),
    created_at: rule.created_at ?? now,
    updated_at: now,
  };
  const index = rules.findIndex((item) => item.id === next.id);
  if (index >= 0) rules[index] = next;
  else rules.unshift(next);
  saveLocalPromotionRules(rules);
  return next;
}

function removeLocalPromotionRule(id: string) {
  saveLocalPromotionRules(getLocalPromotionRules().filter((rule) => rule.id !== id));
}

function appendLocalPromotionRun(run: PromotionRun): PromotionRun {
  const runs = getLocalPromotionRuns();
  const next: PromotionRun = {
    ...run,
    id: run.id ?? crypto.randomUUID(),
    created_at: run.created_at ?? run.started_at,
  };
  runs.unshift(next);
  saveLocalPromotionRuns(runs);
  return next;
}

export function ruleToCriteria(r: PromotionRule): PromotionCriteria {
  return typeof r.criteria === "object" && r.criteria !== null ? r.criteria : {
    from_grade: "",
    to_grade: "",
    from_section: null,
    to_section: null,
    min_attendance: 0,
    min_gpa: 0,
    auto_promote: false,
    reset_roll: false,
    status: "active",
    academic_year_id: null,
  };
}

export function buildDbPromotionRule(rule: PromotionRule) {
  return {
    name: rule.name,
    grade: rule.criteria.from_grade,
    criteria: rule.criteria as unknown as Record<string, unknown>,
    institution_id: rule.institution_id,
    updated_at: new Date().toISOString(),
  };
}

export interface StudentEligibility {
  student_id: string;
  display_name: string;
  grade: string;
  section: string;
  attendance_percent: number;
  gpa: number;
  eligible: boolean;
  reasons: string[];
}

export async function getPromotionRules(): Promise<PromotionRule[]> {
  if (useLocalPromotionStore) return getLocalPromotionRules();
  if (!(await tableExists("promotion_rules"))) return [];
  const { data, error } = await supabase.from("promotion_rules").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    criteria: typeof r.criteria === "string" ? JSON.parse(r.criteria) : (r.criteria ?? {}),
    institution_id: r.institution_id ?? "",
  })) as PromotionRule[];
}

export async function savePromotionRule(rule: PromotionRule): Promise<PromotionRule> {
  if (useLocalPromotionStore) return upsertLocalPromotionRule(rule);
  if (!(await tableExists("promotion_rules"))) throw new Error("Run promotion migrations first");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const payload: any = {
    name: rule.name,
    grade: rule.criteria.from_grade,
    criteria: rule.criteria as any,
    institution_id: rule.institution_id,
    updated_at: new Date().toISOString(),
  };

  if (rule.id) {
    const { data, error } = await supabase
      .from("promotion_rules")
      .update(payload)
      .eq("id", rule.id)
      .select()
      .single();
    if (error) throw error;
    return { ...data, criteria: (data as any).criteria ?? {} } as PromotionRule;
  }

  const { data, error } = await supabase
    .from("promotion_rules")
    .insert({ ...payload, created_by: userId } as any)
    .select()
    .single();
  if (error) throw error;
  return { ...data, criteria: (data as any).criteria ?? {} } as PromotionRule;
}

export async function deletePromotionRule(id: string): Promise<void> {
  if (useLocalPromotionStore) {
    removeLocalPromotionRule(id);
    return;
  }
  if (!(await tableExists("promotion_rules"))) return;
  await supabase.from("promotion_rules").delete().eq("id", id);
}

export async function getPromotionRuns(): Promise<PromotionRun[]> {
  if (useLocalPromotionStore) return getLocalPromotionRuns();
  if (!(await tableExists("promotion_runs"))) return [];
  const { data, error } = await supabase.from("promotion_runs").select("*").order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as PromotionRun[];
}

export async function checkEligibility(rule: PromotionRule): Promise<StudentEligibility[]> {
  const crit = ruleToCriteria(rule);
  const students = await supabase
    .from("students")
    .select(`
      id, first_name, last_name,
      enrollments!inner(grade_label, section_label, roll_number, status),
      attendance!left(status, date),
      exam_marks!left(marks_obtained, exam_id)
    `)
    .eq("enrollments.grade_label", crit.from_grade)
    .eq("enrollments.status", "active");

  if (students.error) throw students.error;

  const results: StudentEligibility[] = [];
  for (const s of students.data ?? []) {
    const enrollment = (s as any).enrollments?.[0];
    const attendanceRecords = (s as any).attendance ?? [];
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter((a: any) => a.status === "present").length;
    const attendancePct = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    const marks = (s as any).exam_marks ?? [];
    const validMarks = marks.filter((m: any) => m.marks_obtained !== null);
    const gpa = validMarks.length > 0
      ? validMarks.reduce((a: number, m: any) => a + m.marks_obtained, 0) / validMarks.length / 25
      : 0;

    const reasons: string[] = [];
    if (attendancePct < crit.min_attendance) reasons.push(`Attendance ${attendancePct.toFixed(1)}% < ${crit.min_attendance}%`);
    if (gpa < crit.min_gpa) reasons.push(`GPA ${gpa.toFixed(2)} < ${crit.min_gpa}`);
    const eligible = reasons.length === 0;

    results.push({
      student_id: s.id,
      display_name: [s.first_name, s.last_name].filter(Boolean).join(" "),
      grade: enrollment?.grade_label ?? "",
      section: enrollment?.section_label ?? "",
      attendance_percent: Math.round(attendancePct * 10) / 10,
      gpa: Math.round(gpa * 100) / 100,
      eligible,
      reasons,
    });
  }

  return results.sort((a, b) => Number(b.eligible) - Number(a.eligible));
}

export async function executePromotion(rule: PromotionRule, eligible: StudentEligibility[]): Promise<PromotionRun> {
  if (!(await tableExists("enrollments"))) throw new Error("Enrollments table not available");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const crit = ruleToCriteria(rule);

  const toPromote = eligible.filter((s) => s.eligible);
  let promoted = 0;
  let failed = 0;

  for (const student of toPromote) {
    const updateData: any = {
      grade_label: crit.to_grade,
      section_label: crit.to_section ?? student.section,
      updated_at: new Date().toISOString(),
    };
    if (crit.reset_roll) updateData.roll_number = null;

    const { error } = await supabase
      .from("enrollments")
      .update(updateData)
      .eq("student_id", student.student_id)
      .eq("status", "active");

    if (error) {
      failed++;
      console.error("[promotion] failed to promote", student.student_id, error);
    } else {
      promoted++;
    }
  }

  const now = new Date().toISOString();
  const run: Omit<PromotionRun, "id"> = {
    rule_id: rule.id ?? "",
    initiated_by: userId ?? "",
    promoted_count: promoted,
    total_eligible: toPromote.length,
    status: "completed",
    started_at: now,
    completed_at: now,
  };

  if (useLocalPromotionStore) {
    const localRun = appendLocalPromotionRun(run as PromotionRun);
    await writeAuditEntry({
      actorId: userId,
      action: "promotion.executed",
      entity: "promotion_rules",
      entityId: rule.id ?? "",
      metadata: { rule: rule.name, promoted, failed, total: toPromote.length, localFallback: true },
    });
    return localRun;
  }

  if (await tableExists("promotion_runs")) {
    const { data, error } = await supabase.from("promotion_runs").insert(run as any).select().single();
    if (error) throw error;
    await writeAuditEntry({
      actorId: userId,
      action: "promotion.executed",
      entity: "promotion_rules",
      entityId: rule.id ?? "",
      metadata: { rule: rule.name, promoted, failed, total: toPromote.length },
    });
    return (data ?? run) as unknown as PromotionRun;
  }

  return run as unknown as PromotionRun;
}

export function nextGrade(current: string, gradeList: string[]): string {
  const idx = gradeList.indexOf(current);
  return idx >= 0 && idx < gradeList.length - 1 ? gradeList[idx + 1] : current;
}

export const DEFAULT_GRADES = [
  "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12",
];

export const DEFAULT_SECTIONS = ["A", "B", "C", "D"];

export function reallocateSections(students: string[], sections: string[]): Record<string, string[]> {
  const alloc: Record<string, string[]> = {};
  sections.forEach((s) => { alloc[s] = []; });
  students.forEach((s, i) => { alloc[sections[i % sections.length]]?.push(s); });
  return alloc;
}

export function generateRollNumbers(count: number, prefix: string): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(3, "0")}`);
}
