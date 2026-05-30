import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Telephone Directory Fields",
      fields: [
      { key: "name", label: "Name", aliases: ["name", "full name", "contact name", "person"], required: true },
      { key: "role", label: "Role", aliases: ["role", "designation", "position", "title"] },
      { key: "phone", label: "Phone", aliases: ["phone", "telephone", "mobile", "contact number", "phone number"] },
      { key: "email", label: "Email", aliases: ["email", "e-mail", "email address", "mail"] },
      { key: "department", label: "Department", aliases: ["department", "dept", "division", "unit"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "name_only", label: "Name Only", fields: ["name"] },
  { id: "name_only", label: "Name Only", fields: ["role"] },
  { id: "name_or_name", label: "Name OR Name", fields: ["name", "role"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("contacts") as any).select("id, name, role, phone, email, department").order("name");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const record: Record<string, unknown> = {};
      record["name"] = row.mapped["name"] || row.sourceRow["name"] || null;       record["role"] = row.mapped["role"] || row.sourceRow["role"] || null;       record["phone"] = row.mapped["phone"] || row.sourceRow["phone"] || null;       record["email"] = row.mapped["email"] || row.sourceRow["email"] || null;       record["department"] = row.mapped["department"] || row.sourceRow["department"] || null;

      const firstKey = "name";
      if (!record[firstKey]) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Name is required" }); return; }

      const { data: existing } = await supabase.from("contacts").select("id").eq(firstKey, record[firstKey] as string).maybeSingle();

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("contacts") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Name not found: {firstKey}" }); return; }
        const { error } = await (supabase.from("contacts") as any).update(record).eq("id", targetId);
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
  emitAppSync("sms.contacts.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("contacts").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("contacts") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const contactsModule: ImportModule = {
  id: "contacts",
  name: "Contacts",
  description: "Import staff contact records including phone and email",
  icon: "Phone",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};