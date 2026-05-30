import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type Lesson = {
  id: string;
  title: string;
  subject: string;
  class_id: string;
  topic: string;
  objectives: string;
  materials: string;
  status: string;
  created_at: string;
};

export const lessonsKey = "eduflow_lessons";

function hydrate(row: any): Lesson {
  return { id: row.id, title: row.title ?? "", subject: row.subject ?? "", class_id: row.class_id ?? "", topic: row.topic ?? "", objectives: row.objectives ?? "", materials: row.materials ?? "", status: row.status ?? "draft", created_at: row.created_at ?? new Date().toISOString() };
}

function loadFallback(): Lesson[] {
  try { return JSON.parse(localStorage.getItem(lessonsKey) ?? "[]"); } catch { return []; }
}

function saveFallback(items: Lesson[]) {
  localStorage.setItem(lessonsKey, JSON.stringify(items));
}

export async function getLessons(): Promise<Lesson[]> {
  if (await tableExists("lesson_plans")) {
    const { data } = await supabase.from("lesson_plans").select("*").order("created_at", { ascending: false });
    return (data ?? []).map(hydrate);
  }
  return loadFallback();
}

export async function createLesson(input: Omit<Lesson, "id" | "created_at">): Promise<Lesson> {
  const lesson = { ...input, created_at: new Date().toISOString() };
  if (await tableExists("lesson_plans")) {
    const { data } = await supabase.from("lesson_plans").insert(lesson).select().single();
    return hydrate(data);
  }
  const item: Lesson = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...lesson };
  const items = loadFallback();
  items.push(item);
  saveFallback(items);
  return item;
}

export async function updateLesson(id: string, updates: Partial<Lesson>): Promise<void> {
  if (await tableExists("lesson_plans")) {
    await supabase.from("lesson_plans").update(updates).eq("id", id);
    return;
  }
  const items = loadFallback();
  const idx = items.findIndex((l) => l.id === id);
  if (idx !== -1) { items[idx] = { ...items[idx], ...updates }; saveFallback(items); }
}

export async function deleteLesson(id: string): Promise<void> {
  if (await tableExists("lesson_plans")) {
    await supabase.from("lesson_plans").delete().eq("id", id);
    return;
  }
  saveFallback(loadFallback().filter((l) => l.id !== id));
}
