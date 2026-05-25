import { supabase } from "@/integrations/supabase/client";
import { fetchStudentRegister } from "@/lib/student-records";
import { tableExists, tablesExist } from "@/lib/supabase-health";

export type ChatThread = { id: string; title: string; type: string; meta: any; created_at: string; };
export type ChatMessage = { id: string; thread_id: string; sender_id: string; message: string; attachments: any; created_at: string; sender_name?: string; };

export async function getThreads(): Promise<(ChatThread & { last_message?: string; unread?: number })[]> {
  if (!(await tablesExist(["chat_threads", "thread_participants", "chat_messages"]))) return [];
  const { data: auth } = await supabase.auth.getUser();
  const { data: threads } = await supabase.from("chat_threads").select("*").order("created_at", { ascending: false });
  const rows = (threads ?? []) as ChatThread[];

  const threadIds = rows.map((t) => t.id);
  if (threadIds.length === 0) return rows.map((t) => ({ ...t, unread: 0 }));

  const { data: participants } = await supabase.from("thread_participants").select("thread_id,last_read_at").eq("user_id", auth.user?.id ?? "").in("thread_id", threadIds);
  const readMap = new Map((participants ?? []).map((p: any) => [p.thread_id, p.last_read_at]));

  const { data: msgs } = await supabase.from("chat_messages").select("thread_id,message,created_at").in("thread_id", threadIds).order("created_at", { ascending: false });
  const lastMsgMap = new Map<string, { message: string; created_at: string }>();
  const msgCountMap = new Map<string, number>();
  for (const m of (msgs ?? []) as any[]) {
    if (!lastMsgMap.has(m.thread_id)) lastMsgMap.set(m.thread_id, m);
    const readAt = readMap.get(m.thread_id);
    if (!readAt || new Date(m.created_at) > new Date(readAt)) msgCountMap.set(m.thread_id, (msgCountMap.get(m.thread_id) ?? 0) + 1);
  }

  return rows.map((t) => ({ ...t, last_message: lastMsgMap.get(t.id)?.message, unread: msgCountMap.get(t.id) ?? 0 }));
}

export async function getMessages(threadId: string): Promise<ChatMessage[]> {
  if (!(await tableExists("chat_messages"))) return [];
  const { data } = await supabase.from("chat_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
  const rows = (data ?? []) as ChatMessage[];

  const staff = await tableExists("staff")
    ? await supabase.from("staff").select("user_id,full_name")
    : { data: [] };
  const staffMap = new Map((staff.data ?? []).map((s: any) => [s.user_id, String(s.full_name ?? "").trim()]));
  const students = await fetchStudentRegister();
  const stuMap = new Map(students.map((s) => [s.student_id, s.display_name]));

  return rows.map((m) => ({ ...m, sender_name: staffMap.get(m.sender_id) ?? stuMap.get(m.sender_id) ?? "Unknown" }));
}

export async function sendMessage(threadId: string, message: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");
  if (!(await tablesExist(["chat_messages", "thread_participants"]))) {
    throw new Error("Chat tables are not available");
  }
  const { error } = await supabase.from("chat_messages").insert({ thread_id: threadId, sender_id: auth.user.id, message, attachments: [] });
  if (error) throw error;
  await supabase.from("thread_participants").update({ last_read_at: new Date().toISOString() }).eq("thread_id", threadId).eq("user_id", auth.user.id);
}

export async function markThreadRead(threadId: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  if (!(await tableExists("thread_participants"))) return;
  await supabase.from("thread_participants").update({ last_read_at: new Date().toISOString() }).eq("thread_id", threadId).eq("user_id", auth.user.id);
}

export async function createThread(title: string, type: string, participantIds: string[]): Promise<ChatThread> {
  if (!(await tablesExist(["chat_threads", "thread_participants"]))) throw new Error("Chat tables not available");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Not authenticated");

  const { data: thread, error } = await supabase.from("chat_threads").insert({ title, type, meta: {} }).select("*").single();
  if (error) throw error;

  const participants = [...new Set([auth.user.id, ...participantIds])].map((uid) => ({ thread_id: thread.id, user_id: uid }));
  const { error: pErr } = await supabase.from("thread_participants").insert(participants);
  if (pErr) throw pErr;

  return thread as unknown as ChatThread;
}

export async function getStaffUserIds(): Promise<string[]> {
  if (!(await tableExists("staff"))) return [];
  const { data } = await supabase.from("staff").select("user_id");
  return (data ?? []).map((s: any) => s.user_id).filter(Boolean);
}
