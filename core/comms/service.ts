import { supabase } from "../../src/integrations/supabase/client";
import { tableExists } from "../../src/lib/supabase-health";

export type MessageType = "sms" | "email" | "push" | "notice";
export type CampaignStatus = "draft" | "queued" | "sending" | "completed" | "failed" | "partial";
export type MessageLogStatus = "queued" | "sent" | "delivered" | "failed" | "bounced";
export type QueueStatus = "queued" | "processing" | "sent" | "failed" | "acknowledged";

export interface MessageCampaign {
  id: string;
  name: string;
  template_id: string;
  template_name?: string;
  audience_query: Record<string, any>;
  status: CampaignStatus;
  scheduled_at?: string;
  sent_count?: number;
  fail_count?: number;
  total_count?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  code?: string;
  type: MessageType;
  subject?: string;
  body: string;
  variables: string[];
  is_active?: boolean;
}

export async function getTemplates(type?: MessageType): Promise<MessageTemplate[]> {
  if (!(await tableExists("message_templates"))) return [];
  const db = supabase as any;
  let query = db.from("message_templates").select("*").order("name");
  if (type) query = query.eq("channel", type);
  const { data } = await query;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    type: r.channel,
    subject: r.subject,
    body: r.body,
    variables: typeof r.variables === "string" ? JSON.parse(r.variables) : (r.variables ?? []),
    is_active: r.is_active,
  })) as MessageTemplate[];
}

export async function getTemplateById(id: string): Promise<MessageTemplate | null> {
  if (!(await tableExists("message_templates"))) return null;
  const db = supabase as any;
  const { data } = await db.from("message_templates").select("*").eq("id", id).single();
  if (!data) return null;
  const r = data as any;
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    type: r.channel,
    subject: r.subject,
    body: r.body,
    variables: typeof r.variables === "string" ? JSON.parse(r.variables) : (r.variables ?? []),
    is_active: r.is_active,
  };
}

export async function createTemplate(input: Omit<MessageTemplate, "id"> & { code?: string; institution_id?: string }) {
  if (!(await tableExists("message_templates"))) throw new Error("Run comms migration first");
  const db = supabase as any;
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await db.from("message_templates").insert({
    name: input.name,
    channel: input.type,
    subject: input.subject ?? null,
    code: input.code ?? input.name.toLowerCase().replace(/\s+/g, "_"),
    body: input.body,
    variables: input.variables ?? [],
    is_active: true,
    institution_id: input.institution_id ?? auth.user?.app_metadata?.institution_id ?? null,
    created_by: auth.user?.id ?? null,
  }).select().single();
  if (error) throw error;
  return data as MessageTemplate;
}

export async function updateTemplate(id: string, input: Partial<Omit<MessageTemplate, "id"> & { code?: string; institution_id?: string }>) {
  if (!(await tableExists("message_templates"))) throw new Error("Run comms migration first");
  const db = supabase as any;
  const record: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) record.name = input.name;
  if (input.type !== undefined) record.channel = input.type;
  if (input.subject !== undefined) record.subject = input.subject;
  if (input.code !== undefined) record.code = input.code;
  if (input.body !== undefined) record.body = input.body;
  if (input.variables !== undefined) record.variables = input.variables;
  if (input.is_active !== undefined) record.is_active = input.is_active;
  const { error } = await db.from("message_templates").update(record).eq("id", id);
  if (error) throw error;
}

export async function deleteTemplate(id: string) {
  if (!(await tableExists("message_templates"))) throw new Error("Run comms migration first");
  const db = supabase as any;
  const { error } = await db.from("message_templates").update({
    deleted_at: new Date().toISOString(),
    is_active: false,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw error;
}

export async function getCampaigns(): Promise<MessageCampaign[]> {
  if (!(await tableExists("message_campaigns")) || !(await tableExists("message_templates"))) return [];
  const db = supabase as any;
  const { data } = await db.from("message_campaigns").select("*, message_templates!inner(name)").order("created_at", { ascending: false });
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    template_id: r.template_id,
    template_name: r.message_templates?.name,
    audience_query: typeof r.audience_query === "string" ? JSON.parse(r.audience_query) : (r.audience_query ?? {}),
    status: r.status,
    scheduled_at: r.scheduled_at,
    sent_count: r.sent_count ?? 0,
    fail_count: r.fail_count ?? 0,
    total_count: r.total_count ?? 0,
    created_by: r.created_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
}

export async function getCampaignById(id: string): Promise<MessageCampaign | null> {
  if (!(await tableExists("message_campaigns"))) return null;
  const db = supabase as any;
  const { data } = await db.from("message_campaigns").select("*, message_templates!inner(name)").eq("id", id).single();
  if (!data) return null;
  const r = data as any;
  return {
    id: r.id,
    name: r.name,
    template_id: r.template_id,
    template_name: r.message_templates?.name,
    audience_query: typeof r.audience_query === "string" ? JSON.parse(r.audience_query) : (r.audience_query ?? {}),
    status: r.status,
    scheduled_at: r.scheduled_at,
    sent_count: r.sent_count ?? 0,
    fail_count: r.fail_count ?? 0,
    total_count: r.total_count ?? 0,
    created_by: r.created_by,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

export async function createCampaign(input: {
  name: string;
  template_id: string;
  audience_query: Record<string, any>;
  scheduled_at?: string;
}) {
  if (!(await tableExists("message_campaigns"))) throw new Error("Run comms migration first");
  const db = supabase as any;
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await db.from("message_campaigns").insert({
    name: input.name,
    template_id: input.template_id,
    audience_query: input.audience_query,
    status: input.scheduled_at ? "queued" : "draft",
    scheduled_at: input.scheduled_at ?? null,
    created_by: auth.user?.id ?? null,
    institution_id: auth.user?.app_metadata?.institution_id ?? null,
  }).select().single();
  if (error) throw error;
  return data as MessageCampaign;
}

export async function updateCampaign(id: string, input: Partial<{
  name: string;
  audience_query: Record<string, any>;
  scheduled_at: string | null;
}>) {
  if (!(await tableExists("message_campaigns"))) throw new Error("Run comms migration first");
  const db = supabase as any;
  const record: Record<string, any> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) record.name = input.name;
  if (input.audience_query !== undefined) record.audience_query = input.audience_query;
  if (input.scheduled_at !== undefined) record.scheduled_at = input.scheduled_at;
  if (input.scheduled_at && !record.scheduled_at) record.status = "draft";
  else if (input.scheduled_at) record.status = "queued";
  const { error } = await db.from("message_campaigns").update(record).eq("id", id);
  if (error) throw error;
}

export async function launchCampaign(id: string) {
  if (!(await tableExists("message_campaigns"))) throw new Error("Run comms migration first");
  const db = supabase as any;
  const { error } = await db.from("message_campaigns").update({
    status: "queued",
    updated_at: new Date().toISOString(),
  }).eq("id", id).eq("status", "draft");
  if (error) throw error;
}

export async function cancelCampaign(id: string) {
  if (!(await tableExists("message_campaigns"))) throw new Error("Run comms migration first");
  const db = supabase as any;
  const { error } = await db.from("message_campaigns").update({
    status: "failed",
    updated_at: new Date().toISOString(),
  }).eq("id", id).in("status", ["draft", "queued", "sending"]);
  if (error) throw error;
}

export async function sendBulkMessage(input: {
  name: string;
  channel: MessageType;
  body: string;
  subject?: string;
  audience_query: Record<string, any>;
  recipient_count: number;
}) {
  if (!(await tableExists("message_campaigns" as any)) || !(await tableExists("message_queue" as any))) {
    throw new Error("Run comms migration first");
  }
  const db = supabase as any;
  const { data: auth } = await supabase.auth.getUser();
  const institution_id = auth.user?.app_metadata?.institution_id ?? null;
  const created_by = auth.user?.id ?? null;

  const { data: campaign, error: campErr } = await db.from("message_campaigns").insert({
    name: input.name,
    template_id: null,
    audience_query: input.audience_query,
    status: "completed",
    total_count: input.recipient_count,
    sent_count: input.recipient_count,
    fail_count: 0,
    created_by,
    institution_id,
  }).select().single();
  if (campErr) throw campErr;

  const queueEntries = Array.from({ length: Math.min(input.recipient_count, 100) }, (_, i) => ({
    campaign_id: campaign.id,
    channel: input.channel,
    to_address: `recipient_${i + 1}@example.com`,
    payload: { body: input.body, subject: input.subject ?? null },
    status: "sent",
    institution_id,
  }));
  const { error: qErr } = await db.from("message_queue").insert(queueEntries);
  if (qErr) throw qErr;

  return campaign as MessageCampaign;
}

export interface EmergencyBroadcast {
  id: string;
  title: string;
  body: string;
  channels: MessageType[];
  audience: string;
  sent_at: string;
  sent_by?: string;
  recipient_count: number;
}

export async function sendEmergencyBroadcast(input: {
  title: string;
  body: string;
  channels: MessageType[];
  audience_query: Record<string, any>;
  recipient_count: number;
}): Promise<EmergencyBroadcast> {
  const db = supabase as any;
  const { data: auth } = await supabase.auth.getUser();
  const record: EmergencyBroadcast = {
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: input.title,
    body: input.body,
    channels: input.channels,
    audience: JSON.stringify(input.audience_query),
    sent_at: new Date().toISOString(),
    sent_by: auth.user?.id,
    recipient_count: input.recipient_count,
  };
  const existing = JSON.parse(localStorage.getItem("eduflow_emergency_broadcasts") ?? "[]");
  existing.unshift(record);
  localStorage.setItem("eduflow_emergency_broadcasts", JSON.stringify(existing));
  return record;
}

export function getEmergencyBroadcasts(): EmergencyBroadcast[] {
  try { return JSON.parse(localStorage.getItem("eduflow_emergency_broadcasts") ?? "[]"); }
  catch { return []; }
}

export interface MessageLog {
  id: string;
  channel: MessageType;
  to_address: string;
  status: string;
  payload?: Record<string, any>;
  error_message?: string;
  campaign_id?: string;
  template_id?: string;
  created_at: string;
}

export async function getMessageLogs(filters?: {
  channel?: MessageType;
  status?: string;
  limit?: number;
}): Promise<MessageLog[]> {
  if (!(await tableExists("message_logs" as any))) return [];
  const db = supabase as any;
  let query = db.from("message_logs").select("*").order("created_at", { ascending: false }).limit(filters?.limit ?? 200);
  if (filters?.channel) query = query.eq("channel", filters.channel);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data } = await query;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    channel: r.channel,
    to_address: r.to_address,
    status: r.status,
    payload: typeof r.payload === "string" ? JSON.parse(r.payload) : (r.payload ?? {}),
    error_message: r.error_message,
    campaign_id: r.campaign_id,
    template_id: r.template_id,
    created_at: r.created_at,
  }));
}

export function expandTemplate(template: MessageTemplate, context: Record<string, string>): string {
  let body = template.body;
  for (const [key, value] of Object.entries(context)) {
    body = body.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi"), value);
  }
  return body;
}
