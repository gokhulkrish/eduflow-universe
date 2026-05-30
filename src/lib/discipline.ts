import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Incident = { id: string; student: string; type: string; description: string; date: string; severity: string; action: string; status: string; };
export const disciplineKey = "eduflow_discipline";

function hydrate(r: any): Incident {
  return { id: r.id, student: r.student ?? "", type: r.type ?? "", description: r.description ?? "", date: r.date ?? new Date().toISOString(), severity: r.severity ?? "minor", action: r.action ?? "", status: r.status ?? "open" };
}
function lf(): Incident[] { try { return JSON.parse(localStorage.getItem(disciplineKey) ?? "[]"); } catch { return []; } }
function sf(v: Incident[]) { localStorage.setItem(disciplineKey, JSON.stringify(v)); }

export async function getIncidents(): Promise<Incident[]> {
  if (await tableExists("discipline_incidents")) { const { data } = await supabase.from("discipline_incidents").select("*").order("created_at", { ascending: false }); return (data ?? []).map(hydrate); }
  return lf();
}

export async function createIncident(input: Omit<Incident, "id">): Promise<Incident> {
  if (await tableExists("discipline_incidents")) { const { data } = await supabase.from("discipline_incidents").insert(input).select().single(); return hydrate(data); }
  const item: Incident = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  const items = lf(); items.push(item); sf(items); return item;
}

export async function updateIncident(id: string, updates: Partial<Incident>): Promise<void> {
  if (await tableExists("discipline_incidents")) { await supabase.from("discipline_incidents").update(updates).eq("id", id); return; }
  const items = lf(); const idx = items.findIndex((i) => i.id === id);
  if (idx !== -1) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteIncident(id: string): Promise<void> {
  if (await tableExists("discipline_incidents")) { await supabase.from("discipline_incidents").delete().eq("id", id); return; }
  sf(lf().filter((i) => i.id !== id));
}
