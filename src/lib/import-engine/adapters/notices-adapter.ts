import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Notices Fields",
      fields: [
      { key: "title", label: "Title", aliases: ["title", "notice title", "subject", "heading"], required: true },
      { key: "body", label: "Body", aliases: ["body", "content", "description", "message", "text"] },
      { key: "priority", label: "Priority", aliases: ["priority", "level", "importance", "urgency"] },
      { key: "pinned", label: "Pinned", aliases: ["pinned", "pin", "is pinned", "sticky"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "title_only", label: "Title Only", fields: ["title"] },
  { id: "name_only", label: "Name Only", fields: ["body"] },
  { id: "title_or_name", label: "Title OR Name", fields: ["title", "body"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("notices") as any).select("id, title, body, priority, pinned").order("title");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["title"] = row.mapped["title"] || row.sourceRow["title"] || null;       record["body"] = row.mapped["body"] || row.sourceRow["body"] || null;       record["priority"] = row.mapped["priority"] || row.sourceRow["priority"] || null;       record["pinned"] = row.mapped["pinned"] || row.sourceRow["pinned"] || null;

      const firstKey = "title";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Title is required" }); return; }

      const { data: existing } = await supabase.from("notices").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("notices") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Title not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("notices") as any).update(record).eq("id", targetId);
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }

  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    if (signal?.aborted) break;
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(processRow));
  }
  emitAppSync("sms.notices.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("notices").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("notices") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const noticesModule: ImportModule = {
  id: "notices",
  name: "Notices",
  description: "Import notice board announcements with priority and pinning",
  icon: "ClipboardList",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};