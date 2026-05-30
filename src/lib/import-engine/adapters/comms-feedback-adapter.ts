import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Survey Details",
    fields: [
      { key: "title", label: "Title", aliases: ["title", "survey title", "form name", "feedback title"], required: true },
      { key: "description", label: "Description", aliases: ["description", "desc", "details", "purpose"] },
    ],
  },
  {
    title: "Configuration",
    fields: [
      { key: "audience", label: "Audience", aliases: ["audience", "target", "recipients", "respondents"] },
      { key: "channel", label: "Channel", aliases: ["channel", "delivery method", "mode", "medium"] },
      { key: "status", label: "Status", aliases: ["status", "state", "published", "visibility"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "title_only", label: "Title Only", fields: ["title"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("comms_feedback") as any).select("id, title, description, audience, channel, status, response_count").order("created_at", { ascending: false });
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id, title: r.title, description: r.description,
    audience: r.audience, channel: r.channel, status: r.status, responseCount: r.response_count,
  }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;
  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const title = row.mapped.title || row.sourceRow.title || "";
      if (!title) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Title is required" }); return; }
      const db: Record<string, unknown> = {};
      db.title = title; db.description = row.mapped.description ?? row.sourceRow.description ?? null;
      db.audience = row.mapped.audience ?? row.sourceRow.audience ?? null;
      db.channel = row.mapped.channel ?? row.sourceRow.channel ?? "email";
      db.status = row.mapped.status ?? row.sourceRow.status ?? "draft";
      const { data: existing } = await supabase.from("comms_feedback").select("id").eq("title", title).maybeSingle();
      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("comms_feedback") as any).insert(db).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Title not found: "+title }); return; }
        const { error } = await (supabase.from("comms_feedback") as any).update(db).eq("id", targetId);
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }
  for (let i = 0; i < rows.length; i += CONCURRENCY) { if (signal?.aborted) break; await Promise.all(rows.slice(i, i + CONCURRENCY).map(processRow)); }
  emitAppSync("sms.comms_feedback.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") { const { error } = await supabase.from("comms_feedback").delete().eq("id", entry.studentKey); if (error) throw error; restored++; }
      else if (entry.changeType === "updated") { const { error } = await (supabase.from("comms_feedback") as any).update(entry.previousState).eq("id", entry.studentKey); if (error) throw error; restored++; }
    } catch { success = false; }
  }
  return { success, restored };
}

export const commsFeedbackModule: ImportModule = {
  id: "comms-feedback", name: "Comms Feedback",
  description: "Import feedback surveys with audience and channel targeting",
  icon: "ClipboardCheck", fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};