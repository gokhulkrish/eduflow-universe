import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Post Details",
    fields: [
      { key: "title", label: "Title", aliases: ["title", "post title", "subject", "heading"], required: true },
      { key: "body", label: "Body", aliases: ["body", "content", "message", "text"] },
      { key: "author", label: "Author", aliases: ["author", "posted by", "creator", "teacher"] },
    ],
  },
  {
    title: "Classification",
    fields: [
      { key: "classId", label: "Class ID", aliases: ["class_id", "class id", "class", "grade"] },
      { key: "className", label: "Class Name", aliases: ["class_name", "class name", "class label"] },
      { key: "priority", label: "Priority", aliases: ["priority", "level", "importance", "urgency"] },
      { key: "pinned", label: "Pinned", aliases: ["pinned", "pin", "is pinned", "sticky"] },
      { key: "broadcastToComms", label: "Broadcast to Comms", aliases: ["broadcast_to_comms", "broadcast", "share to comms"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "title_only", label: "Title Only", fields: ["title"] },
  { id: "author_only", label: "Author Only", fields: ["author"] },
  { id: "title_or_author", label: "Title OR Author", fields: ["title", "author"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("comms_class_wall") as any).select("id, class_id, class_name, title, body, author, priority, pinned, broadcast_to_comms").order("created_at", { ascending: false });
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id, title: r.title, body: r.body, author: r.author,
    classId: r.class_id, className: r.class_name, priority: r.priority,
    pinned: r.pinned, broadcastToComms: r.broadcast_to_comms,
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
      db.title = title; db.body = row.mapped.body ?? row.sourceRow.body ?? null;
      db.author = row.mapped.author ?? row.sourceRow.author ?? null;
      db.class_id = row.mapped.classId ?? row.sourceRow.classId ?? null;
      db.class_name = row.mapped.className ?? row.sourceRow.className ?? null;
      db.priority = row.mapped.priority ?? row.sourceRow.priority ?? "normal";
      db.pinned = row.mapped.pinned === "true" || row.mapped.pinned === true || false;
      db.broadcast_to_comms = row.mapped.broadcastToComms === "true" || row.mapped.broadcastToComms === true || false;
      const { data: existing } = await supabase.from("comms_class_wall").select("id").eq("title", title).maybeSingle();
      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("comms_class_wall") as any).insert(db).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Title not found: "+title }); return; }
        const { error } = await (supabase.from("comms_class_wall") as any).update(db).eq("id", targetId);
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }
  for (let i = 0; i < rows.length; i += CONCURRENCY) { if (signal?.aborted) break; await Promise.all(rows.slice(i, i + CONCURRENCY).map(processRow)); }
  emitAppSync("sms.comms_class_wall.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") { const { error } = await supabase.from("comms_class_wall").delete().eq("id", entry.studentKey); if (error) throw error; restored++; }
      else if (entry.changeType === "updated") { const { error } = await (supabase.from("comms_class_wall") as any).update(entry.previousState).eq("id", entry.studentKey); if (error) throw error; restored++; }
    } catch { success = false; }
  }
  return { success, restored };
}

export const commsClassWallModule: ImportModule = {
  id: "comms-class-wall", name: "Comms Class Wall",
  description: "Import class wall posts with priority and broadcast settings",
  icon: "LayoutPanelTop", fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};