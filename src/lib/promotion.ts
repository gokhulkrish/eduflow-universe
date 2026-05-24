import "@/lib/runtime-storage";
import { emitAppSync } from "@/lib/app-sync";

export type PromotionRule = { id: string; name: string; from_grade: string; to_grade: string; from_section: string; to_section: string; min_attendance: number; min_gpa: number; auto_promote: boolean; reset_roll: boolean; status: string; created_at: string; };
export type PromotionRun = { id: string; rule_id: string; name: string; promoted: number; failed: number; total: number; run_at: string; status: string; };
export type StudentEligibility = { id: string; name: string; attendance: number; gpa: number; eligible: boolean; };

export const promotionRulesKey = "eduflow_promo_rules";
export const promotionRunsKey = "eduflow_promo_runs";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getRules(): PromotionRule[] { return ls(promotionRulesKey, []); }
export function createRule(r: Omit<PromotionRule, "id" | "created_at">): PromotionRule {
  const items = getRules(); const n = { ...r, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  items.unshift(n); ss(promotionRulesKey, items); return n;
}
export function updateRule(id: string, p: Partial<PromotionRule>) { const items = getRules(); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(promotionRulesKey, items); } }
export function deleteRule(id: string) { ss(promotionRulesKey, getRules().filter((x) => x.id !== id)); }

export function getPromotionRuns(): PromotionRun[] { return ls(promotionRunsKey, []); }
export function runPromotion(rule: PromotionRule, totalStudents: number): PromotionRun {
  const items = getPromotionRuns();
  const eligible = getEligibleStudents(rule);
  const promoted = eligible.length;
  const failed = totalStudents - promoted;
  const n: PromotionRun = { id: crypto.randomUUID(), rule_id: rule.id, name: rule.name, promoted, failed, total: totalStudents, run_at: new Date().toISOString(), status: "completed" };
  items.unshift(n); ss(promotionRunsKey, items); return n;
}

export function getEligibleStudents(rule: PromotionRule): StudentEligibility[] {
  const dummy: StudentEligibility[] = [];
  const names = ["Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Eve Brown", "Frank Miller", "Grace Lee", "Henry Clark"];
  for (let i = 0; i < 8; i++) {
    const att = 60 + Math.floor(Math.random() * 40); const gpa = Math.round((1.5 + Math.random() * 3.5) * 10) / 10;
    dummy.push({ id: `stu_${i}`, name: names[i], attendance: att, gpa, eligible: att >= rule.min_attendance && gpa >= rule.min_gpa });
  }
  return dummy;
}

export function generateRollNumbers(count: number, prefix: string): string[] {
  const rolls: string[] = [];
  for (let i = 1; i <= count; i++) rolls.push(`${prefix}${String(i).padStart(3, "0")}`);
  return rolls;
}

export function reallocateSections(students: string[], sections: string[]): Record<string, string[]> {
  const result: Record<string, string[]> = {}; sections.forEach((s) => result[s] = []);
  students.forEach((s, i) => { const sec = sections[i % sections.length]; result[sec].push(s); });
  return result;
}

export const PROGRAMS = ["B.A. Sem 1", "B.A. Sem 2", "B.Com Sem 1", "B.Com Sem 2", "B.Sc Sem 1", "B.Sc Sem 2", "BBA Sem 1", "BBA Sem 2"];
export const GRADES = PROGRAMS;
export const SECTIONS = ["A", "B", "C", "D"];
export function nextProgram(g: string): string {
  const idx = PROGRAMS.indexOf(g); return idx >= 0 && idx < PROGRAMS.length - 1 ? PROGRAMS[idx + 1] : g;
}
export const nextGrade = nextProgram;
