import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type Scheme = { id: string; name: string; provider: string; amount: number; criteria: string; };
export type Application = { id: string; student: string; scheme: string; amount: number; status: string; applied: string; };
export const SCHEMES_KEY = "eduflow_scholarship_schemes";
export const APPS_KEY = "eduflow_scholarship_apps";

function hs(r: any): Scheme { return { id: r.id, name: r.name ?? "", provider: r.provider ?? "", amount: r.amount ?? 0, criteria: r.criteria ?? "" }; }
function ha(r: any): Application { return { id: r.id, student: r.student ?? "", scheme: r.scheme ?? "", amount: r.amount ?? 0, status: r.status ?? "pending", applied: r.applied ?? "" }; }

function sl(): Scheme[] { try { return JSON.parse(localStorage.getItem(SCHEMES_KEY) ?? "[]"); } catch { return []; } }
function ss(v: Scheme[]) { localStorage.setItem(SCHEMES_KEY, JSON.stringify(v)); }
function apl(): Application[] { try { return JSON.parse(localStorage.getItem(APPS_KEY) ?? "[]"); } catch { return []; } }
function aps(v: Application[]) { localStorage.setItem(APPS_KEY, JSON.stringify(v)); }

export async function getSchemes(): Promise<Scheme[]> {
  if (await tableExists("scholarship_schemes")) { const { data } = await supabase.from("scholarship_schemes").select("*").order("name"); return (data ?? []).map(hs); }
  return sl();
}
export async function createScheme(i: Omit<Scheme, "id">): Promise<Scheme> {
  if (await tableExists("scholarship_schemes")) { const { data } = await supabase.from("scholarship_schemes").insert(i).select().single(); return hs(data); }
  const item: Scheme = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i }; const items = sl(); items.push(item); ss(items); return item;
}
export async function updateScheme(id: string, updates: Partial<Scheme>): Promise<void> {
  if (await tableExists("scholarship_schemes")) { await supabase.from("scholarship_schemes").update(updates).eq("id", id); return; }
  ss(sl().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteScheme(id: string): Promise<void> {
  if (await tableExists("scholarship_schemes")) { await supabase.from("scholarship_schemes").delete().eq("id", id); return; }
  ss(sl().filter((s) => s.id !== id));
}
export async function getApplications(): Promise<Application[]> {
  if (await tableExists("scholarship_applications")) { const { data } = await supabase.from("scholarship_applications").select("*").order("applied", { ascending: false }); return (data ?? []).map(ha); }
  return apl();
}
export async function createApplication(i: Omit<Application, "id">): Promise<Application> {
  if (await tableExists("scholarship_applications")) { const { data } = await supabase.from("scholarship_applications").insert(i).select().single(); return ha(data); }
  const item: Application = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i }; const items = apl(); items.push(item); aps(items); return item;
}
export async function deleteApplication(id: string): Promise<void> {
  if (await tableExists("scholarship_applications")) { await supabase.from("scholarship_applications").delete().eq("id", id); return; }
  aps(apl().filter((x) => x.id !== id));
}
export async function updateApplication(id: string, updates: Partial<Application>): Promise<void> {
  if (await tableExists("scholarship_applications")) { await supabase.from("scholarship_applications").update(updates).eq("id", id); return; }
  aps(apl().map((x) => x.id === id ? { ...x, ...updates } : x));
}
