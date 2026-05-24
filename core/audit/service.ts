import { supabase } from "../../src/integrations/supabase/client";
import { tableExists } from "../../src/lib/supabase-health";
import type { Json } from "../../src/integrations/supabase/types";

export interface AuditEntry {
  actorId?: string | null;
  role?: string | null;
  action: string;
  entity: string;
  entityId: string;
  source?: "legacy-adapter" | "native";
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export async function writeAuditEntry(entry: AuditEntry): Promise<void> {
  if (!(await tableExists("audit_log"))) return;

  const { error } = await supabase.from("audit_log").insert({
    actor: entry.actorId ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId,
    metadata: {
      ...entry.metadata,
      role: entry.role ?? null,
      source: entry.source ?? "native",
      before: entry.before ?? null,
      after: entry.after ?? null,
    } as unknown as Json,
  });

  if (error) {
    console.error("[audit] failed to write entry:", error);
  }
}

export async function queryAuditLog(params: {
  entity?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  limit?: number;
  offset?: number;
}) {
  if (!(await tableExists("audit_log"))) return [];

  let query = supabase
    .from("audit_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (params.entity) query = query.eq("entity", params.entity);
  if (params.entityId) query = query.eq("entity_id", params.entityId);
  if (params.action) query = query.eq("action", params.action);
  if (params.actorId) query = query.eq("actor", params.actorId);
  if (params.limit) query = query.limit(params.limit);
  if (params.offset) query = query.range(params.offset, params.offset + (params.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
