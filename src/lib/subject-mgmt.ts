import { emitAppSync } from "@/lib/app-sync";

export type Subject = { id: string; name: string; code: string; class_id: string; teacher_id: string; credits: number; };

export const subjectsMgmtKey = "eduflow_subjects_mgmt";
function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getSubjects(): Subject[] { return ls(subjectsMgmtKey, []); }
export function createSubject(s: Omit<Subject, "id">): Subject {
  const items = getSubjects(); const n = { ...s, id: crypto.randomUUID() }; items.push(n); ss(subjectsMgmtKey, items); return n;
}
export function deleteSubject(id: string) { ss(subjectsMgmtKey, getSubjects().filter((x) => x.id !== id)); }
