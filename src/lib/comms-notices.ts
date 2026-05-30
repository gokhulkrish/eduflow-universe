import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type CommsNotice = { id: string; title: string; body: string; priority: string; pinned: boolean; audience: string; schedule?: string; status: string; attachments: { name: string; url: string }[]; created_at: string; };
export const NT_KEY = "eduflow_comms_notices";
function h(r: any): CommsNotice { return { id: r.id, title: r.title ?? "", body: r.body ?? "", priority: r.priority ?? "normal", pinned: r.pinned ?? false, audience: r.audience ?? "", schedule: r.schedule || undefined, status: r.status ?? "published", attachments: r.attachments ?? [], created_at: r.created_at ?? "" }; }
function toDb(i: Omit<CommsNotice, "id" | "created_at">) { return { title: i.title, body: i.body, priority: i.priority, pinned: i.pinned, audience: i.audience, schedule: i.schedule || null, status: i.status, attachments: i.attachments }; }
function lf(): CommsNotice[] { try { return JSON.parse(localStorage.getItem(NT_KEY) ?? "[]"); } catch { return []; } }
function sf(v: CommsNotice[]) { localStorage.setItem(NT_KEY, JSON.stringify(v)); }
export async function getNotices(): Promise<CommsNotice[]> {
  if (await tableExists("comms_notices")) { const { data } = await supabase.from("comms_notices").select("*").order("created_at", { ascending: false }); return (data ?? []).map(h); }
  return lf();
}
export async function createNotice(i: Omit<CommsNotice, "id" | "created_at">): Promise<CommsNotice> {
  if (await tableExists("comms_notices")) { const { data } = await supabase.from("comms_notices").insert(toDb(i)).select().single(); return h(data); }
  const item: CommsNotice = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = lf(); items.unshift(item); sf(items); return item;
}
export async function updateNotice(id: string, updates: Partial<CommsNotice>): Promise<void> {
  if (await tableExists("comms_notices")) { const db: any = {}; if (updates.title !== undefined) db.title = updates.title; if (updates.body !== undefined) db.body = updates.body; if (updates.priority !== undefined) db.priority = updates.priority; if (updates.pinned !== undefined) db.pinned = updates.pinned; if (updates.audience !== undefined) db.audience = updates.audience; if (updates.schedule !== undefined) db.schedule = updates.schedule; if (updates.status !== undefined) db.status = updates.status; if (updates.attachments !== undefined) db.attachments = updates.attachments; await supabase.from("comms_notices").update(db).eq("id", id); return; }
  sf(lf().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteNotice(id: string): Promise<void> {
  if (await tableExists("comms_notices")) { await supabase.from("comms_notices").delete().eq("id", id); return; }
  sf(lf().filter((n) => n.id !== id));
}
