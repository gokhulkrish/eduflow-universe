import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Accreditation = { id: string; quality_cycle: string; framework: string; criterion: string; evidence_status: string; owner: string; };
export const ACC_KEY = "eduflow_accreditation";

function hydrate(r: any): Accreditation {
  return { id: r.id, quality_cycle: r.quality_cycle ?? "", framework: r.framework ?? "", criterion: r.criterion ?? "", evidence_status: r.evidence_status ?? "Pending", owner: r.owner ?? "" };
}
function lf(): Accreditation[] { try { return JSON.parse(localStorage.getItem(ACC_KEY) ?? "[]"); } catch { return []; } }
function sf(v: Accreditation[]) { localStorage.setItem(ACC_KEY, JSON.stringify(v)); }

export async function getAccreditations(): Promise<Accreditation[]> {
  if (await tableExists("accreditation_records")) { const { data } = await supabase.from("accreditation_records").select("*").order("quality_cycle"); return (data ?? []).map(hydrate); }
  return lf();
}

export async function createAccreditation(input: Omit<Accreditation, "id">): Promise<Accreditation> {
  if (await tableExists("accreditation_records")) { const { data } = await supabase.from("accreditation_records").insert(input).select().single(); return hydrate(data); }
  const item: Accreditation = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  const items = lf(); items.push(item); sf(items); return item;
}

export async function updateAccreditation(id: string, updates: Partial<Accreditation>): Promise<void> {
  if (await tableExists("accreditation_records")) { await supabase.from("accreditation_records").update(updates).eq("id", id); return; }
  const items = lf(); const idx = items.findIndex((a) => a.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteAccreditation(id: string): Promise<void> {
  if (await tableExists("accreditation_records")) { await supabase.from("accreditation_records").delete().eq("id", id); return; }
  sf(lf().filter((a) => a.id !== id));
}
