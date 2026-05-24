import "@/lib/runtime-storage";
import { emitAppSync } from "@/lib/app-sync";

export type AcademicCohort = { id: string; grade: string; section: string; teacher_id: string; room: string; capacity: number; };

export const classesMgmtKey = "eduflow_classes_mgmt";
function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getClasses(): AcademicCohort[] { return ls(classesMgmtKey, []); }
export function createClass(c: Omit<AcademicCohort, "id">): AcademicCohort {
  const items = getClasses(); const n = { ...c, id: crypto.randomUUID() }; items.push(n); ss(classesMgmtKey, items); return n;
}
export function updateClass(id: string, p: Partial<AcademicCohort>) { const items = getClasses(); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(classesMgmtKey, items); } }
export function deleteClass(id: string) { ss(classesMgmtKey, getClasses().filter((x) => x.id !== id)); }

export const PROGRAMS = ["B.A. Sem 1","B.A. Sem 2","B.Com Sem 1","B.Com Sem 2","B.Sc Sem 1","B.Sc Sem 2","BBA Sem 1","BBA Sem 2"];
export const GRADES = PROGRAMS;
export const SECTIONS = ["A","B","C","D"];
