import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type FeedbackForm = { id: string; title: string; description: string; questions: any[]; audience: string; channel: string; status: string; responseCount: number; created_at: string; };
export const FB_KEY = "eduflow_feedback_forms";
function h(r: any): FeedbackForm { return { id: r.id, title: r.title ?? "", description: r.description ?? "", questions: r.questions ?? [], audience: r.audience ?? "", channel: r.channel ?? "email", status: r.status ?? "draft", responseCount: r.response_count ?? 0, created_at: r.created_at ?? "" }; }
function toDb(i: Omit<FeedbackForm, "id" | "created_at" | "responseCount">) { return { title: i.title, description: i.description, questions: i.questions, audience: i.audience, channel: i.channel, status: i.status }; }
function lf(): FeedbackForm[] { try { return JSON.parse(localStorage.getItem(FB_KEY) ?? "[]"); } catch { return []; } }
function sf(v: FeedbackForm[]) { localStorage.setItem(FB_KEY, JSON.stringify(v)); }
export async function getFeedbacks(): Promise<FeedbackForm[]> {
  if (await tableExists("comms_feedback")) { const { data } = await supabase.from("comms_feedback").select("*").order("created_at", { ascending: false }); return (data ?? []).map(h); }
  return lf();
}
export async function createFeedback(i: Omit<FeedbackForm, "id" | "created_at" | "responseCount">): Promise<FeedbackForm> {
  if (await tableExists("comms_feedback")) { const { data } = await supabase.from("comms_feedback").insert(toDb(i)).select().single(); return h(data); }
  const item: FeedbackForm = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, responseCount: 0, created_at: new Date().toISOString() }; const items = lf(); items.unshift(item); sf(items); return item;
}
export async function updateFeedback(id: string, updates: Partial<FeedbackForm>): Promise<void> {
  if (await tableExists("comms_feedback")) { const db: any = {}; if (updates.title !== undefined) db.title = updates.title; if (updates.description !== undefined) db.description = updates.description; if (updates.questions !== undefined) db.questions = updates.questions; if (updates.audience !== undefined) db.audience = updates.audience; if (updates.channel !== undefined) db.channel = updates.channel; if (updates.status !== undefined) db.status = updates.status; if (updates.responseCount !== undefined) db.response_count = updates.responseCount; await supabase.from("comms_feedback").update(db).eq("id", id); return; }
  sf(lf().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteFeedback(id: string): Promise<void> {
  if (await tableExists("comms_feedback")) { await supabase.from("comms_feedback").delete().eq("id", id); return; }
  sf(lf().filter((f) => f.id !== id));
}
