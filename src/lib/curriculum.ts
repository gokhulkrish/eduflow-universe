import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Curriculum = { id: string; curriculum_name: string; course_code: string; semester: string; outcome_map_status: string; syllabus_coverage: number; attainment_band: string; };
export const CURR_KEY = "eduflow_curriculum";

function hydrate(r: any): Curriculum {
  return { id: r.id, curriculum_name: r.curriculum_name ?? "", course_code: r.course_code ?? "", semester: r.semester ?? "", outcome_map_status: r.outcome_map_status ?? "Draft", syllabus_coverage: r.syllabus_coverage ?? 0, attainment_band: r.attainment_band ?? "" };
}
function lf(): Curriculum[] { try { return JSON.parse(localStorage.getItem(CURR_KEY) ?? "[]"); } catch { return []; } }
function sf(v: Curriculum[]) { localStorage.setItem(CURR_KEY, JSON.stringify(v)); }

export async function getCurricula(): Promise<Curriculum[]> {
  if (await tableExists("curriculum_outcomes")) { const { data } = await supabase.from("curriculum_outcomes").select("*").order("curriculum_name"); return (data ?? []).map(hydrate); }
  return lf();
}

export async function createCurriculum(input: Omit<Curriculum, "id">): Promise<Curriculum> {
  if (await tableExists("curriculum_outcomes")) { const { data } = await supabase.from("curriculum_outcomes").insert(input).select().single(); return hydrate(data); }
  const item: Curriculum = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  const items = lf(); items.push(item); sf(items); return item;
}

export async function updateCurriculum(id: string, updates: Partial<Curriculum>): Promise<void> {
  if (await tableExists("curriculum_outcomes")) { await supabase.from("curriculum_outcomes").update(updates).eq("id", id); return; }
  const items = lf(); const idx = items.findIndex((c) => c.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteCurriculum(id: string): Promise<void> {
  if (await tableExists("curriculum_outcomes")) { await supabase.from("curriculum_outcomes").delete().eq("id", id); return; }
  sf(lf().filter((c) => c.id !== id));
}
