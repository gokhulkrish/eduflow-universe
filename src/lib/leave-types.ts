import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type LeaveType = {
  id: string;
  name: string;
  days: number;
  paid: boolean;
  carry_forward: boolean;
};

export const LEAVE_MASTER_KEY = "eduflow_leave_master";

function hydrate(row: any): LeaveType {
  return { id: row.id, name: row.name ?? "", days: row.days ?? 0, paid: row.paid ?? true, carry_forward: row.carry_forward ?? false };
}

function loadFallback(): LeaveType[] {
  try { return JSON.parse(localStorage.getItem(LEAVE_MASTER_KEY) ?? "[]"); } catch { return []; }
}

function saveFallback(items: LeaveType[]) {
  localStorage.setItem(LEAVE_MASTER_KEY, JSON.stringify(items));
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  if (await tableExists("leave_types")) {
    const { data } = await supabase.from("leave_types").select("*").order("name");
    return (data ?? []).map(hydrate);
  }
  return loadFallback();
}

export async function createLeaveType(input: Omit<LeaveType, "id">): Promise<LeaveType> {
  if (await tableExists("leave_types")) {
    const { data } = await supabase.from("leave_types").insert(input).select().single();
    return hydrate(data);
  }
  const item: LeaveType = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  const items = loadFallback();
  items.push(item);
  saveFallback(items);
  return item;
}

export async function updateLeaveType(id: string, updates: Partial<LeaveType>): Promise<void> {
  if (await tableExists("leave_types")) {
    await supabase.from("leave_types").update(updates).eq("id", id);
    return;
  }
  const items = loadFallback();
  const idx = items.findIndex((l) => l.id === id);
  if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; saveFallback(items); }
}

export async function deleteLeaveType(id: string): Promise<void> {
  if (await tableExists("leave_types")) {
    await supabase.from("leave_types").delete().eq("id", id);
    return;
  }
  saveFallback(loadFallback().filter((l) => l.id !== id));
}
