import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type Task = { id: string; title: string; description: string; assignee: string; priority: "low" | "medium" | "high" | "critical"; status: "open" | "in-progress" | "completed"; dueDate: string; category: string; };
export type Notice = { id: string; title: string; content: string; audience: string; date: string; };

const TASKS_KEY = "sms.admin.tasks.v1";
const NOTICES_KEY = "sms.admin.notices.v1";

function lsT<T>(d: T): T { try { return JSON.parse(localStorage.getItem(TASKS_KEY) ?? JSON.stringify(d)); } catch { return d; } }
function ssT(v: any) { localStorage.setItem(TASKS_KEY, JSON.stringify(v)); emitAppSync(TASKS_KEY); }
function lsN<T>(d: T): T { try { return JSON.parse(localStorage.getItem(NOTICES_KEY) ?? JSON.stringify(d)); } catch { return d; } }
function ssN(v: any) { localStorage.setItem(NOTICES_KEY, JSON.stringify(v)); emitAppSync(NOTICES_KEY); }

export const PRIORITIES: Task["priority"][] = ["low", "medium", "high", "critical"];

export async function getTasks(): Promise<Task[]> {
  const local = lsT<Task[]>([]);
  try {
    if (!(await tableExists("admin_tasks"))) return local;
    const { data } = await supabase.from("admin_tasks").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped: Task[] = data.map((r: any) => ({
        id: r.id, title: r.title, description: r.description ?? "",
        assignee: r.assignee ?? "", priority: r.priority ?? "medium",
        status: r.status ?? "open", dueDate: r.due_date ?? "",
        category: r.category ?? "",
      }));
      ssT(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createTask(t: Omit<Task, "id">): Promise<Task> {
  const n: Task = { ...t, id: generateId() };
  try {
    if (await tableExists("admin_tasks")) {
      const { data } = await supabase.from("admin_tasks").insert({
        title: t.title, description: t.description, assignee: t.assignee,
        priority: t.priority, status: t.status, due_date: t.dueDate || null,
        category: t.category,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = lsT<Task[]>([]);
  items.unshift(n); ssT(items); return n;
}

export async function updateTask(id: string, p: Partial<Task>) {
  try {
    if (await tableExists("admin_tasks")) {
      const upd: any = {};
      if (p.title !== undefined) upd.title = p.title;
      if (p.description !== undefined) upd.description = p.description;
      if (p.assignee !== undefined) upd.assignee = p.assignee;
      if (p.priority !== undefined) upd.priority = p.priority;
      if (p.status !== undefined) upd.status = p.status;
      if (p.dueDate !== undefined) upd.due_date = p.dueDate;
      if (p.category !== undefined) upd.category = p.category;
      await supabase.from("admin_tasks").update(upd).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = lsT<Task[]>([]);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ssT(items); }
}

export async function deleteTask(id: string) {
  try {
    if (await tableExists("admin_tasks")) {
      await supabase.from("admin_tasks").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ssT(lsT<Task[]>([]).filter((x) => x.id !== id));
}

export async function getNotices(): Promise<Notice[]> {
  const local = lsN<Notice[]>([]);
  try {
    if (!(await tableExists("admin_notices"))) return local;
    const { data } = await supabase.from("admin_notices").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped: Notice[] = data.map((r: any) => ({
        id: r.id, title: r.title, content: r.content ?? "",
        audience: r.audience ?? "", date: r.notice_date ?? "",
      }));
      ssN(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createNotice(n: Omit<Notice, "id">): Promise<Notice> {
  const newN: Notice = { ...n, id: generateId() };
  try {
    if (await tableExists("admin_notices")) {
      const { data } = await supabase.from("admin_notices").insert({
        title: n.title, content: n.content, audience: n.audience,
        notice_date: n.date || null,
      }).select().single();
      if (data) newN.id = data.id;
    }
  } catch { /* fall through */ }
  const items = lsN<Notice[]>([]);
  items.unshift(newN); ssN(items); return newN;
}

export async function deleteNotice(id: string) {
  try {
    if (await tableExists("admin_notices")) {
      await supabase.from("admin_notices").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ssN(lsN<Notice[]>([]).filter((x) => x.id !== id));
}
