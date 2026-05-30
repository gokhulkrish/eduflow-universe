import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type HealthCase = { id: string; caseTitle: string; personName: string; caseType: string; followUpDate: string; careStatus: string; };
export const HEALTH_KEY = "eduflow_health";
function h(r: any): HealthCase { return { id: r.id, caseTitle: r.case_title ?? "", personName: r.person_name ?? "", caseType: r.case_type ?? "", followUpDate: r.follow_up_date ?? "", careStatus: r.care_status ?? "Open" }; }
function toDb(i: Omit<HealthCase, "id">) { return { case_title: i.caseTitle, person_name: i.personName, case_type: i.caseType, follow_up_date: i.followUpDate, care_status: i.careStatus }; }
function lf(): HealthCase[] { try { return JSON.parse(localStorage.getItem(HEALTH_KEY) ?? "[]"); } catch { return []; } }
function sf(v: HealthCase[]) { localStorage.setItem(HEALTH_KEY, JSON.stringify(v)); }
export async function getHealthCases(): Promise<HealthCase[]> {
  if (await tableExists("health_cases")) { const { data } = await supabase.from("health_cases").select("*").order("case_title"); return (data ?? []).map(h); }
  return lf();
}
export async function createHealthCase(i: Omit<HealthCase, "id">): Promise<HealthCase> {
  if (await tableExists("health_cases")) { const { data } = await supabase.from("health_cases").insert(toDb(i)).select().single(); return h(data); }
  const item: HealthCase = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i }; const items = lf(); items.push(item); sf(items); return item;
}
export async function updateHealthCase(id: string, updates: Partial<HealthCase>): Promise<void> {
  if (await tableExists("health_cases")) {
    const db: any = {};
    if (updates.caseTitle !== undefined) db.case_title = updates.caseTitle;
    if (updates.personName !== undefined) db.person_name = updates.personName;
    if (updates.caseType !== undefined) db.case_type = updates.caseType;
    if (updates.followUpDate !== undefined) db.follow_up_date = updates.followUpDate;
    if (updates.careStatus !== undefined) db.care_status = updates.careStatus;
    await supabase.from("health_cases").update(db).eq("id", id);
    return;
  }
  const items = lf(); const idx = items.findIndex((c) => c.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteHealthCase(id: string): Promise<void> {
  if (await tableExists("health_cases")) { await supabase.from("health_cases").delete().eq("id", id); return; }
  sf(lf().filter((c) => c.id !== id));
}
