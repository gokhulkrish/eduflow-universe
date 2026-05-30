import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Notice = {
  id: string;
  title: string;
  body: string;
  priority: string;
  pinned: boolean;
  created_at: string;
};

export const NOTICES_KEY = "eduflow_notices";

function hydrate(row: any): Notice {
  return { id: row.id, title: row.title ?? "", body: row.body ?? "", priority: row.priority ?? "normal", pinned: row.pinned ?? false, created_at: row.created_at ?? new Date().toISOString() };
}

function loadFallback(): Notice[] {
  try { return JSON.parse(localStorage.getItem(NOTICES_KEY) ?? "[]"); } catch { return []; }
}

function saveFallback(items: Notice[]) {
  localStorage.setItem(NOTICES_KEY, JSON.stringify(items));
}

export async function getNotices(): Promise<Notice[]> {
  if (await tableExists("notices")) {
    const { data } = await supabase.from("notices").select("*").order("created_at", { ascending: false });
    return (data ?? []).map(hydrate);
  }
  return loadFallback();
}

export async function createNotice(input: Omit<Notice, "id" | "created_at">): Promise<Notice> {
  const notice = { ...input, created_at: new Date().toISOString() };
  if (await tableExists("notices")) {
    const { data } = await supabase.from("notices").insert(notice).select().single();
    return hydrate(data);
  }
  const item: Notice = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...notice };
  const items = loadFallback();
  items.unshift(item);
  saveFallback(items);
  return item;
}

export async function updateNotice(id: string, updates: Partial<Notice>): Promise<void> {
  if (await tableExists("notices")) {
    await supabase.from("notices").update(updates).eq("id", id);
    return;
  }
  const items = loadFallback();
  const idx = items.findIndex((n) => n.id === id);
  if (idx !== -1) { items[idx] = { ...items[idx], ...updates }; saveFallback(items); }
}

export async function deleteNotice(id: string): Promise<void> {
  if (await tableExists("notices")) {
    await supabase.from("notices").delete().eq("id", id);
    return;
  }
  saveFallback(loadFallback().filter((n) => n.id !== id));
}
