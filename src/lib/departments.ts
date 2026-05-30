import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Department = {
  id: string;
  department_name: string;
  department_code: string;
  hod_name: string;
  program_level: string;
  sanctioned_intake: number;
  naac_nba_status: string;
};

export const DEPT_KEY = "eduflow_departments";

function hydrate(row: any): Department {
  return { id: row.id, department_name: row.department_name ?? "", department_code: row.department_code ?? "", hod_name: row.hod_name ?? "", program_level: row.program_level ?? "", sanctioned_intake: row.sanctioned_intake ?? 0, naac_nba_status: row.naac_nba_status ?? "" };
}

function loadFallback(): Department[] {
  try { return JSON.parse(localStorage.getItem(DEPT_KEY) ?? "[]"); } catch { return []; }
}

function saveFallback(items: Department[]) {
  localStorage.setItem(DEPT_KEY, JSON.stringify(items));
}

export async function getDepartments(): Promise<Department[]> {
  if (await tableExists("departments")) {
    const { data } = await supabase.from("departments").select("*").order("department_name");
    return (data ?? []).map(hydrate);
  }
  return loadFallback();
}

export async function createDepartment(input: Omit<Department, "id">): Promise<Department> {
  if (await tableExists("departments")) {
    const { data } = await supabase.from("departments").insert(input).select().single();
    return hydrate(data);
  }
  const items = loadFallback();
  const item: Department = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  items.push(item);
  saveFallback(items);
  return item;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
  if (await tableExists("departments")) {
    await supabase.from("departments").update(updates).eq("id", id);
    return;
  }
  const items = loadFallback();
  const idx = items.findIndex((d) => d.id === id);
  if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; saveFallback(items); }
}

export async function deleteDepartment(id: string): Promise<void> {
  if (await tableExists("departments")) {
    await supabase.from("departments").delete().eq("id", id);
    return;
  }
  saveFallback(loadFallback().filter((d) => d.id !== id));
}
