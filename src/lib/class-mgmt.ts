import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type AcademicCohort = { id: string; grade: string; section: string; teacher_id: string; room: string; capacity: number; };

export const classesMgmtKey = "eduflow_classes_mgmt";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export async function getClasses(): Promise<AcademicCohort[]> {
  const local = ls<AcademicCohort[]>(classesMgmtKey, []);
  try {
    if (!(await tableExists("classes"))) return local;
    const { data } = await supabase.from("classes").select("*").order("grade");
    if (data && data.length > 0) {
      const mapped: AcademicCohort[] = data.map((r: any) => ({
        id: r.id,
        grade: r.grade,
        section: r.section,
        teacher_id: r.class_teacher ?? "",
        room: "",
        capacity: r.capacity ?? 40,
      }));
      ss(classesMgmtKey, mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createClass(c: Omit<AcademicCohort, "id">): Promise<AcademicCohort> {
  const n: AcademicCohort = { ...c, id: generateId() };
  try {
    if (await tableExists("classes")) {
      const { data } = await supabase.from("classes").insert({
        grade: c.grade,
        section: c.section,
        capacity: c.capacity,
        class_teacher: c.teacher_id || null,
        stream: null,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<AcademicCohort[]>(classesMgmtKey, []);
  items.push(n);
  ss(classesMgmtKey, items);
  return n;
}

export async function updateClass(id: string, p: Partial<AcademicCohort>) {
  try {
    if (await tableExists("classes")) {
      const upd: any = {};
      if (p.grade !== undefined) upd.grade = p.grade;
      if (p.section !== undefined) upd.section = p.section;
      if (p.capacity !== undefined) upd.capacity = p.capacity;
      if (p.teacher_id !== undefined) upd.class_teacher = p.teacher_id;
      await supabase.from("classes").update(upd).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<AcademicCohort[]>(classesMgmtKey, []);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ss(classesMgmtKey, items); }
}

export async function deleteClass(id: string) {
  try {
    if (await tableExists("classes")) {
      await supabase.from("classes").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(classesMgmtKey, ls<AcademicCohort[]>(classesMgmtKey, []).filter((x) => x.id !== id));
}

export const PROGRAMS = ["B.A. Sem 1","B.A. Sem 2","B.Com Sem 1","B.Com Sem 2","B.Sc Sem 1","B.Sc Sem 2","BBA Sem 1","BBA Sem 2"];
export const GRADES = PROGRAMS;
export const SECTIONS = ["A","B","C","D"];
