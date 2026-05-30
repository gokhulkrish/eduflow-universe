import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Holiday = {
  id: string;
  name: string;
  date: string;
  type: string;
};

export const HOLIDAYS_KEY = "eduflow_holidays_standalone";

function hydrate(row: any): Holiday {
  return { id: row.id, name: row.name ?? "", date: row.date ?? new Date().toISOString(), type: row.type ?? "public" };
}

function loadFallback(): Holiday[] {
  try { return JSON.parse(localStorage.getItem(HOLIDAYS_KEY) ?? "[]"); } catch { return []; }
}

function saveFallback(items: Holiday[]) {
  localStorage.setItem(HOLIDAYS_KEY, JSON.stringify(items));
}

export async function getHolidays(): Promise<Holiday[]> {
  if (await tableExists("holidays")) {
    const { data } = await supabase.from("holidays").select("*").order("date");
    return (data ?? []).map(hydrate);
  }
  return loadFallback();
}

export async function createHoliday(input: Omit<Holiday, "id">): Promise<Holiday> {
  if (await tableExists("holidays")) {
    const { data } = await supabase.from("holidays").insert(input).select().single();
    return hydrate(data);
  }
  const item: Holiday = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  const items = loadFallback();
  items.push(item);
  saveFallback(items);
  return item;
}

export async function updateHoliday(id: string, updates: Partial<Holiday>): Promise<void> {
  if (await tableExists("holidays")) {
    await supabase.from("holidays").update(updates).eq("id", id);
    return;
  }
  const items = loadFallback();
  const idx = items.findIndex((h) => h.id === id);
  if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; saveFallback(items); }
}

export async function deleteHoliday(id: string): Promise<void> {
  if (await tableExists("holidays")) {
    await supabase.from("holidays").delete().eq("id", id);
    return;
  }
  saveFallback(loadFallback().filter((h) => h.id !== id));
}
