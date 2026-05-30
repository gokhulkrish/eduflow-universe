import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type WallPost = { id: string; classId: string; className: string; title: string; body: string; author: string; priority: string; pinned: boolean; attachments: { name: string; url: string }[]; broadcastToComms: boolean; created_at: string; };
export const CW_KEY = "eduflow_comms_classwall";
function h(r: any): WallPost { return { id: r.id, classId: r.class_id ?? "", className: r.class_name ?? "", title: r.title ?? "", body: r.body ?? "", author: r.author ?? "", priority: r.priority ?? "normal", pinned: r.pinned ?? false, attachments: r.attachments ?? [], broadcastToComms: r.broadcast_to_comms ?? false, created_at: r.created_at ?? "" }; }
function toDb(i: Omit<WallPost, "id" | "created_at">) { return { class_id: i.classId, class_name: i.className, title: i.title, body: i.body, author: i.author, priority: i.priority, pinned: i.pinned, attachments: i.attachments, broadcast_to_comms: i.broadcastToComms }; }
function lf(): WallPost[] { try { return JSON.parse(localStorage.getItem(CW_KEY) ?? "[]"); } catch { return []; } }
function sf(v: WallPost[]) { localStorage.setItem(CW_KEY, JSON.stringify(v)); }
export async function getClassWallPosts(): Promise<WallPost[]> {
  if (await tableExists("comms_class_wall")) { const { data } = await supabase.from("comms_class_wall").select("*").order("created_at", { ascending: false }); return (data ?? []).map(h); }
  return lf();
}
export async function createClassWallPost(i: Omit<WallPost, "id" | "created_at">): Promise<WallPost> {
  if (await tableExists("comms_class_wall")) { const { data } = await supabase.from("comms_class_wall").insert(toDb(i)).select().single(); return h(data); }
  const item: WallPost = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = lf(); items.unshift(item); sf(items); return item;
}
export async function updateClassWallPost(id: string, updates: Partial<WallPost>): Promise<void> {
  if (await tableExists("comms_class_wall")) { const db: any = {}; if (updates.classId !== undefined) db.class_id = updates.classId; if (updates.className !== undefined) db.class_name = updates.className; if (updates.title !== undefined) db.title = updates.title; if (updates.body !== undefined) db.body = updates.body; if (updates.author !== undefined) db.author = updates.author; if (updates.priority !== undefined) db.priority = updates.priority; if (updates.pinned !== undefined) db.pinned = updates.pinned; if (updates.attachments !== undefined) db.attachments = updates.attachments; if (updates.broadcastToComms !== undefined) db.broadcast_to_comms = updates.broadcastToComms; await supabase.from("comms_class_wall").update(db).eq("id", id); return; }
  sf(lf().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteClassWallPost(id: string): Promise<void> {
  if (await tableExists("comms_class_wall")) { await supabase.from("comms_class_wall").delete().eq("id", id); return; }
  sf(lf().filter((p) => p.id !== id));
}
