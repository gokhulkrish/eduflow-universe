import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type AutomationRule = { id: string; name: string; description: string; trigger: string; triggerParams: Record<string, string>; action: string; actionParams: Record<string, string>; active: boolean; runCount: number; lastRun?: string; created_at: string; };
export const AUT_KEY = "eduflow_comms_automation";
function h(r: any): AutomationRule { return { id: r.id, name: r.name ?? "", description: r.description ?? "", trigger: r.trigger_event ?? "", triggerParams: r.trigger_params ?? {}, action: r.action_action ?? "", actionParams: r.action_params ?? {}, active: r.active ?? true, runCount: r.run_count ?? 0, lastRun: r.last_run ?? undefined, created_at: r.created_at ?? "" }; }
function toDb(i: Omit<AutomationRule, "id" | "created_at" | "runCount" | "lastRun">) { return { name: i.name, description: i.description, trigger_event: i.trigger, trigger_params: i.triggerParams, action_action: i.action, action_params: i.actionParams, active: i.active }; }
function lf(): AutomationRule[] { try { return JSON.parse(localStorage.getItem(AUT_KEY) ?? "[]"); } catch { return []; } }
function sf(v: AutomationRule[]) { localStorage.setItem(AUT_KEY, JSON.stringify(v)); }
export async function getAutomations(): Promise<AutomationRule[]> {
  if (await tableExists("comms_automation")) { const { data } = await supabase.from("comms_automation").select("*").order("name"); return (data ?? []).map(h); }
  return lf();
}
export async function createAutomation(i: Omit<AutomationRule, "id" | "created_at" | "runCount" | "lastRun">): Promise<AutomationRule> {
  if (await tableExists("comms_automation")) { const { data } = await supabase.from("comms_automation").insert({ ...toDb(i), run_count: 0 }).select().single(); return h(data); }
  const item: AutomationRule = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, runCount: 0, created_at: new Date().toISOString() }; const items = lf(); items.unshift(item); sf(items); return item;
}
export async function updateAutomation(id: string, updates: Partial<AutomationRule>): Promise<void> {
  if (await tableExists("comms_automation")) { const db: any = {}; if (updates.name !== undefined) db.name = updates.name; if (updates.description !== undefined) db.description = updates.description; if (updates.trigger !== undefined) db.trigger_event = updates.trigger; if (updates.triggerParams !== undefined) db.trigger_params = updates.triggerParams; if (updates.action !== undefined) db.action_action = updates.action; if (updates.actionParams !== undefined) db.action_params = updates.actionParams; if (updates.active !== undefined) db.active = updates.active; if (updates.runCount !== undefined) db.run_count = updates.runCount; if (updates.lastRun !== undefined) db.last_run = updates.lastRun; await supabase.from("comms_automation").update(db).eq("id", id); return; }
  sf(lf().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteAutomation(id: string): Promise<void> {
  if (await tableExists("comms_automation")) { await supabase.from("comms_automation").delete().eq("id", id); return; }
  sf(lf().filter((c) => c.id !== id));
}
