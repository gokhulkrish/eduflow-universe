import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Class Wall Fields",
      fields: [
      { key: "class", label: "Class", aliases: ["class", "class name", "grade", "section"], required: true },
      { key: "author", label: "Author", aliases: ["author", "posted by", "creator", "teacher"] },
      { key: "content", label: "Content", aliases: ["content", "post content", "message", "body", "text"] },
      { key: "attachment", label: "Attachment", aliases: ["attachment", "file", "link", "url", "attach"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "class_only", label: "Class Only", fields: ["class"] },
  { id: "name_only", label: "Name Only", fields: ["author"] },
  { id: "class_or_name", label: "Class OR Name", fields: ["class", "author"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("class_wall_posts") as any).select("id, class, author, content, attachment").order("class");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["class"] = row.mapped["class"] || row.sourceRow["class"] || null;       record["author"] = row.mapped["author"] || row.sourceRow["author"] || null;       record["content"] = row.mapped["content"] || row.sourceRow["content"] || null;       record["attachment"] = row.mapped["attachment"] || row.sourceRow["attachment"] || null;

      const firstKey = "class";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Class is required" }); return; }

      const { data: existing } = await supabase.from("class_wall_posts").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("class_wall_posts") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Class not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("class_wall_posts") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.class_wall_posts.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("class_wall_posts").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("class_wall_posts") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const classWallModule: ImportModule = {
  id: "class-wall",
  name: "Class Wall",
  description: "Import class wall posts including content and attachments",
  icon: "LayoutPanelTop",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};