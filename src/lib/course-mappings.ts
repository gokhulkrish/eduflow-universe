import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type CourseMapping = { id: string; course: string; grade: string; section: string; };
export const COURSE_MAPPINGS_KEY = "eduflow_course_mappings";

function hydrate(r: any): CourseMapping {
  return { id: r.id, course: r.course ?? "", grade: r.grade ?? "", section: r.section ?? "" };
}
function lf(): CourseMapping[] { try { return JSON.parse(localStorage.getItem(COURSE_MAPPINGS_KEY) ?? "[]"); } catch { return []; } }
function sf(v: CourseMapping[]) { localStorage.setItem(COURSE_MAPPINGS_KEY, JSON.stringify(v)); }

export async function getCourseMappings(): Promise<CourseMapping[]> {
  if (await tableExists("course_mappings")) { const { data } = await supabase.from("course_mappings").select("*").order("course"); return (data ?? []).map(hydrate); }
  return lf();
}

export async function createCourseMapping(input: Omit<CourseMapping, "id">): Promise<CourseMapping> {
  if (await tableExists("course_mappings")) { const { data } = await supabase.from("course_mappings").insert(input).select().single(); return hydrate(data); }
  const item: CourseMapping = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  const items = lf(); items.push(item); sf(items); return item;
}

export async function updateCourseMapping(id: string, updates: Partial<CourseMapping>): Promise<void> {
  if (await tableExists("course_mappings")) { await supabase.from("course_mappings").update(updates).eq("id", id); return; }
  const items = lf(); const idx = items.findIndex((m) => m.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteCourseMapping(id: string): Promise<void> {
  if (await tableExists("course_mappings")) { await supabase.from("course_mappings").delete().eq("id", id); return; }
  sf(lf().filter((m) => m.id !== id));
}
