import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type Research = { id: string; researchTitle: string; principalInvestigator: string; fundingAgency: string; grantAmount: number; researchStage: string; };
export const RES_KEY = "eduflow_research";
function h(r: any): Research { return { id: r.id, researchTitle: r.research_title ?? "", principalInvestigator: r.principal_investigator ?? "", fundingAgency: r.funding_agency ?? "", grantAmount: r.grant_amount ?? 0, researchStage: r.research_stage ?? "Proposal" }; }
function toDb(i: Omit<Research, "id">) { return { research_title: i.researchTitle, principal_investigator: i.principalInvestigator, funding_agency: i.fundingAgency, grant_amount: i.grantAmount, research_stage: i.researchStage }; }
function lf(): Research[] { try { return JSON.parse(localStorage.getItem(RES_KEY) ?? "[]"); } catch { return []; } }
function sf(v: Research[]) { localStorage.setItem(RES_KEY, JSON.stringify(v)); }
export async function getResearch(): Promise<Research[]> {
  if (await tableExists("research_projects")) { const { data } = await supabase.from("research_projects").select("*").order("research_title"); return (data ?? []).map(h); }
  return lf();
}
export async function createResearch(i: Omit<Research, "id">): Promise<Research> {
  if (await tableExists("research_projects")) { const { data } = await supabase.from("research_projects").insert(toDb(i)).select().single(); return h(data); }
  const item: Research = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i }; const items = lf(); items.push(item); sf(items); return item;
}
export async function updateResearch(id: string, updates: Partial<Research>): Promise<void> {
  if (await tableExists("research_projects")) {
    const db: any = {};
    if (updates.researchTitle !== undefined) db.research_title = updates.researchTitle;
    if (updates.principalInvestigator !== undefined) db.principal_investigator = updates.principalInvestigator;
    if (updates.fundingAgency !== undefined) db.funding_agency = updates.fundingAgency;
    if (updates.grantAmount !== undefined) db.grant_amount = updates.grantAmount;
    if (updates.researchStage !== undefined) db.research_stage = updates.researchStage;
    await supabase.from("research_projects").update(db).eq("id", id);
    return;
  }
  const items = lf(); const idx = items.findIndex((r) => r.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteResearch(id: string): Promise<void> {
  if (await tableExists("research_projects")) { await supabase.from("research_projects").delete().eq("id", id); return; }
  sf(lf().filter((r) => r.id !== id));
}
