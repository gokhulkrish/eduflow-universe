import { supabase } from "../../src/integrations/supabase/client";
import { tableExists } from "../../src/lib/supabase-health";

export type MessageType = "sms" | "email" | "push";
export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled" | "failed";
export type MessageLogStatus = "queued" | "sent" | "delivered" | "failed" | "bounced";

export interface MessageTemplate {
  id: string;
  name: string;
  type: MessageType;
  body: string;
  variables: string[];
}

export async function getTemplates(type?: MessageType): Promise<MessageTemplate[]> {
  if (!(await tableExists("message_templates"))) return [];
  let query = supabase.from("message_templates").select("*").order("name");
  if (type) query = query.eq("type", type);
  const { data } = await query;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    body: r.body,
    variables: typeof r.variables === "string" ? JSON.parse(r.variables) : (r.variables ?? []),
  })) as MessageTemplate[];
}

export async function createTemplate(input: Omit<MessageTemplate, "id">) {
  if (!(await tableExists("message_templates"))) throw new Error("Run comms migration first");
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("message_templates").insert({
    name: input.name,
    type: input.type,
    body: input.body,
    variables: input.variables as any,
    created_by: auth.user?.id ?? null,
  } as any).select().single();
  if (error) throw error;
  return data as unknown as MessageTemplate;
}

export function expandTemplate(template: MessageTemplate, context: Record<string, string>): string {
  let body = template.body;
  for (const [key, value] of Object.entries(context)) {
    body = body.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi"), value);
  }
  return body;
}
