import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type SanctionedSeat = { id: string; course: string; grade: string; total: number; filled: number; };
export const SANCTIONED_SEATS_KEY = "eduflow_sanctioned_seats";

function hydrate(r: any): SanctionedSeat {
  return { id: r.id, course: r.course ?? "", grade: r.grade ?? "", total: r.total ?? 0, filled: r.filled ?? 0 };
}
function lf(): SanctionedSeat[] { try { return JSON.parse(localStorage.getItem(SANCTIONED_SEATS_KEY) ?? "[]"); } catch { return []; } }
function sf(v: SanctionedSeat[]) { localStorage.setItem(SANCTIONED_SEATS_KEY, JSON.stringify(v)); }

export async function getSanctionedSeats(): Promise<SanctionedSeat[]> {
  if (await tableExists("sanctioned_seats")) { const { data } = await supabase.from("sanctioned_seats").select("*").order("course"); return (data ?? []).map(hydrate); }
  return lf();
}

export async function createSanctionedSeat(input: Omit<SanctionedSeat, "id">): Promise<SanctionedSeat> {
  if (await tableExists("sanctioned_seats")) { const { data } = await supabase.from("sanctioned_seats").insert(input).select().single(); return hydrate(data); }
  const item: SanctionedSeat = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  const items = lf(); items.push(item); sf(items); return item;
}

export async function updateSanctionedSeat(id: string, updates: Partial<SanctionedSeat>): Promise<void> {
  if (await tableExists("sanctioned_seats")) { await supabase.from("sanctioned_seats").update(updates).eq("id", id); return; }
  const items = lf(); const idx = items.findIndex((s) => s.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteSanctionedSeat(id: string): Promise<void> {
  if (await tableExists("sanctioned_seats")) { await supabase.from("sanctioned_seats").delete().eq("id", id); return; }
  sf(lf().filter((s) => s.id !== id));
}
