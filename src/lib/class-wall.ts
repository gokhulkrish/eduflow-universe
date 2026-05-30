import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type WallPost = { id: string; class: string; author: string; content: string; attachment: string; created_at: string; };
export const classWallKey = "eduflow_class_wall";

function hydrate(r: any): WallPost {
  return { id: r.id, class: r.class ?? "", author: r.author ?? "", content: r.content ?? "", attachment: r.attachment ?? "", created_at: r.created_at ?? new Date().toISOString() };
}
function lf(): WallPost[] { try { return JSON.parse(localStorage.getItem(classWallKey) ?? "[]"); } catch { return []; } }
function sf(v: WallPost[]) { localStorage.setItem(classWallKey, JSON.stringify(v)); }

export async function getWallPosts(): Promise<WallPost[]> {
  if (await tableExists("class_wall_posts")) { const { data } = await supabase.from("class_wall_posts").select("*").order("created_at", { ascending: false }); return (data ?? []).map(hydrate); }
  return lf();
}

export async function createWallPost(input: Omit<WallPost, "id" | "created_at">): Promise<WallPost> {
  const post = { ...input, created_at: new Date().toISOString() };
  if (await tableExists("class_wall_posts")) { const { data } = await supabase.from("class_wall_posts").insert(post).select().single(); return hydrate(data); }
  const item: WallPost = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...post };
  const items = lf(); items.push(item); sf(items); return item;
}

export async function updateWallPost(id: string, updates: Partial<WallPost>): Promise<void> {
  if (await tableExists("class_wall_posts")) { await supabase.from("class_wall_posts").update(updates).eq("id", id); return; }
  const items = lf(); const idx = items.findIndex((p) => p.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteWallPost(id: string): Promise<void> {
  if (await tableExists("class_wall_posts")) { await supabase.from("class_wall_posts").delete().eq("id", id); return; }
  sf(lf().filter((p) => p.id !== id));
}
