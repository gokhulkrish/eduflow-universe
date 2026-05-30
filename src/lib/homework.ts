import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type HomeworkItem = { id: string; title: string; description: string; subject: string; className: string; dueDate: string; status: "pending" | "submitted" | "overdue"; createdAt: string; };

const STORAGE_KEY = "sms.homework.v1";

function ls<T>(d: T): T { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(d)); } catch { return d; } }
function ss(v: any) { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); emitAppSync(STORAGE_KEY); }

export async function getHomework(): Promise<HomeworkItem[]> {
  const local = ls<HomeworkItem[]>([]);
  try {
    if (!(await tableExists("homework_assignments"))) return local;
    const { data } = await supabase.from("homework_assignments").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped: HomeworkItem[] = data.map((r: any) => ({
        id: r.id, title: r.title, description: r.description ?? "",
        subject: r.subject, className: r.class_name,
        dueDate: r.due_date ?? "", status: r.status ?? "pending",
        createdAt: r.created_at,
      }));
      ss(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createHomework(h: Omit<HomeworkItem, "id" | "createdAt">): Promise<HomeworkItem> {
  const n: HomeworkItem = { ...h, id: generateId(), createdAt: new Date().toISOString() };
  try {
    if (await tableExists("homework_assignments")) {
      const { data } = await supabase.from("homework_assignments").insert({
        title: h.title, description: h.description, subject: h.subject,
        class_name: h.className, due_date: h.dueDate || null, status: h.status,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<HomeworkItem[]>([]);
  items.unshift(n); ss(items); return n;
}

export async function updateHomework(id: string, p: Partial<HomeworkItem>) {
  try {
    if (await tableExists("homework_assignments")) {
      const upd: any = {};
      if (p.title !== undefined) upd.title = p.title;
      if (p.description !== undefined) upd.description = p.description;
      if (p.subject !== undefined) upd.subject = p.subject;
      if (p.className !== undefined) upd.class_name = p.className;
      if (p.dueDate !== undefined) upd.due_date = p.dueDate;
      if (p.status !== undefined) upd.status = p.status;
      await supabase.from("homework_assignments").update(upd).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<HomeworkItem[]>([]);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ss(items); }
}

export async function deleteHomework(id: string) {
  try {
    if (await tableExists("homework_assignments")) {
      await supabase.from("homework_assignments").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(ls<HomeworkItem[]>([]).filter((x) => x.id !== id));
}

export const CLASSES = ["Class 1-A", "Class 1-B", "Class 2-A", "Class 2-B", "Class 3-A", "Class 4-A", "Class 5-A", "Class 6-A", "Class 7-A", "Class 8-A", "Class 9-A", "Class 10-A", "Class 11-A", "Class 11-B", "Class 12-A", "Class 12-B"];
export const SUBJECTS = ["Mathematics", "English", "Hindi", "Science", "Social Studies", "Physics", "Chemistry", "Biology", "History", "Geography", "Computer Science", "Physical Education"];
