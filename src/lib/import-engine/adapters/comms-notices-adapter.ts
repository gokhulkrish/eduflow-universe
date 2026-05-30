import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Notice Details",
    fields: [
      { key: "title", label: "Title", aliases: ["title", "notice title", "subject", "heading"], required: true },
      { key: "body", label: "Body", aliases: ["body", "content", "message", "text"] },
    ],
  },
  {
    title: "Configuration",
    fields: [
      { key: "priority", label: "Priority", aliases: ["priority", "level", "importance", "urgency"] },
      { key: "pinned", label: "Pinned", aliases: ["pinned", "pin", "is pinned", "sticky"] },
      { key: "audience", label: "Audience", aliases: ["audience", "target", "recipients", "visible to"] },
      { key: "schedule", label: "Schedule", aliases: ["schedule", "scheduled date", "publish on", "send at"] },
      { key: "status", label: "Status", aliases: ["status", "state", "published", "visibility"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "title_only", label: "Title Only", fields: ["title"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("comms_notices") as any).select("id, title, body, priority, pinned, audience, schedule, status").order("created_at", { ascending: false });
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;
  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const title = row.mapped.title || row.sourceRow.title || "";
      if (!title) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Title is required" }); return; }
      const record: Record<string, unknown> = {};
      record.title = title; record.body = row.mapped.body ?? row.sourceRow.body ?? null;
      record.priority = row.mapped.priority ?? row.sourceRow.priority ?? "normal";
      record.pinned = row.mapped.pinned === "true" || row.mapped.pinned === true || false;
      record.audience = row.mapped.audience ?? row.sourceRow.audience ?? null;
      record.schedule = row.mapped.schedule ?? row.sourceRow.schedule ?? null;
      record.status = row.mapped.status ?? row.sourceRow.status ?? "published";
      const { data: existing } = await supabase.from("comms_notices").select("id").eq("title", title).maybeSingle();
      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("comms_notices") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Title not found: "+title }); return; }
        const { error } = await (supabase.from("comms_notices") as any).update(record).eq("id", targetId);
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }
  for (let i = 0; i < rows.length; i += CONCURRENCY) { if (signal?.aborted) break; await Promise.all(rows.slice(i, i + CONCURRENCY).map(processRow)); }
  emitAppSync("sms.comms_notices.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") { const { error } = await supabase.from("comms_notices").delete().eq("id", entry.studentKey); if (error) throw error; restored++; }
      else if (entry.changeType === "updated") { const { error } = await (supabase.from("comms_notices") as any).update(entry.previousState).eq("id", entry.studentKey); if (error) throw error; restored++; }
    } catch { success = false; }
  }
  return { success, restored };
}

export const commsNoticesModule: ImportModule = {
  id: "comms-notices", name: "Comms Notices",
  description: "Import communication notices with priority, audience, and scheduling",
  icon: "ClipboardList", fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};