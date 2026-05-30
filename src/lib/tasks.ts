import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type Task = { id: string; title: string; description: string; assignee: string; priority: string; status: string; due_date: string; created_at: string; };
export const TASKS_KEY = "eduflow_tasks";
function h(r: any): Task { return { id: r.id, title: r.title ?? "", description: r.description ?? "", assignee: r.assignee ?? "", priority: r.priority ?? "medium", status: r.status ?? "pending", due_date: r.due_date ?? "", created_at: r.created_at ?? "" }; }
function lf(): Task[] { try { return JSON.parse(localStorage.getItem(TASKS_KEY) ?? "[]"); } catch { return []; } }
function sf(v: Task[]) { localStorage.setItem(TASKS_KEY, JSON.stringify(v)); }
export async function getTasks(): Promise<Task[]> {
  if (await tableExists("tasks")) { const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false }); return (data ?? []).map(h); }
  return lf();
}
export async function createTask(i: Omit<Task, "id" | "created_at">): Promise<Task> {
  if (await tableExists("tasks")) { const { data } = await supabase.from("tasks").insert(i).select().single(); return h(data); }
  const item: Task = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = lf(); items.unshift(item); sf(items); return item;
}
export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  if (await tableExists("tasks")) { await supabase.from("tasks").update(updates).eq("id", id); return; }
  sf(lf().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteTask(id: string): Promise<void> {
  if (await tableExists("tasks")) { await supabase.from("tasks").delete().eq("id", id); return; }
  sf(lf().filter((t) => t.id !== id));
}
