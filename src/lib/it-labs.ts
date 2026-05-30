import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type ItLab = { id: string; name: string; location: string; capacity: number; systems_count: number; incharge: string; status: string; equipment: string; created_at: string; };
export type ItLabBooking = { id: string; lab_id: string; lab_name: string; date: string; start_time: string; end_time: string; faculty_name: string; faculty_id: string; purpose: string; batch: string; status: string; created_at: string; };
export const LABS_KEY = "eduflow_it_labs";
export const BOOKINGS_KEY = "eduflow_it_lab_bookings";

function hl(r: any): ItLab { return { id: r.id, name: r.name ?? "", location: r.location ?? "", capacity: r.capacity ?? 0, systems_count: r.systems_count ?? 0, incharge: r.incharge ?? "", status: r.status ?? "active", equipment: r.equipment ?? "", created_at: r.created_at ?? "" }; }
function hb(r: any): ItLabBooking { return { id: r.id, lab_id: r.lab_id, lab_name: r.lab_name ?? "", date: r.date ?? "", start_time: r.start_time ?? "", end_time: r.end_time ?? "", faculty_name: r.faculty_name ?? "", faculty_id: r.faculty_id ?? "", purpose: r.purpose ?? "", batch: r.batch ?? "", status: r.status ?? "pending", created_at: r.created_at ?? "" }; }

function ll(): ItLab[] { try { return JSON.parse(localStorage.getItem(LABS_KEY) ?? "[]"); } catch { return []; } }
function ls(v: ItLab[]) { localStorage.setItem(LABS_KEY, JSON.stringify(v)); }
function bl(): ItLabBooking[] { try { return JSON.parse(localStorage.getItem(BOOKINGS_KEY) ?? "[]"); } catch { return []; } }
function bs(v: ItLabBooking[]) { localStorage.setItem(BOOKINGS_KEY, JSON.stringify(v)); }

export async function getLabs(): Promise<ItLab[]> {
  if (await tableExists("it_labs")) { const { data } = await supabase.from("it_labs").select("*").order("name"); return (data ?? []).map(hl); }
  return ll();
}
export async function createLab(i: Omit<ItLab, "id" | "created_at">): Promise<ItLab> {
  if (await tableExists("it_labs")) { const { data } = await supabase.from("it_labs").insert(i).select().single(); return hl(data); }
  const item: ItLab = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = ll(); items.push(item); ls(items); return item;
}
export async function updateLab(id: string, updates: Partial<ItLab>): Promise<void> {
  if (await tableExists("it_labs")) { await supabase.from("it_labs").update(updates).eq("id", id); return; }
  ls(ll().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteLab(id: string): Promise<void> {
  if (await tableExists("it_labs")) { await supabase.from("it_labs").delete().eq("id", id); return; }
  ls(ll().filter((l) => l.id !== id));
}
export async function getBookings(): Promise<ItLabBooking[]> {
  if (await tableExists("it_lab_bookings")) { const { data } = await supabase.from("it_lab_bookings").select("*").order("date", { ascending: false }); return (data ?? []).map(hb); }
  return bl();
}
export async function createBooking(i: Omit<ItLabBooking, "id" | "created_at">): Promise<ItLabBooking> {
  if (await tableExists("it_lab_bookings")) { const { data } = await supabase.from("it_lab_bookings").insert(i).select().single(); return hb(data); }
  const item: ItLabBooking = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = bl(); items.push(item); bs(items); return item;
}
export async function updateBooking(id: string, updates: Partial<ItLabBooking>): Promise<void> {
  if (await tableExists("it_lab_bookings")) { await supabase.from("it_lab_bookings").update(updates).eq("id", id); return; }
  bs(bl().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteBookingsByLab(labId: string): Promise<void> {
  if (await tableExists("it_lab_bookings")) { await supabase.from("it_lab_bookings").delete().eq("lab_id", labId); return; }
  bs(bl().filter((b) => b.lab_id !== labId));
}
