import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Scholarship Identity",
    fields: [
      { key: "name", label: "Scholarship Name", aliases: ["name", "scholarship name", "scheme", "award"], required: true },
      { key: "provider", label: "Provider", aliases: ["provider", "sponsor", "organization", "funded by"] },
      { key: "description", label: "Description", aliases: ["description", "desc", "details", "benefits"] },
    ],
  },
  {
    title: "Eligibility & Value",
    fields: [
      { key: "eligibility", label: "Eligibility", aliases: ["eligibility", "criteria", "requirements", "qualification"] },
      { key: "amount", label: "Amount", aliases: ["amount", "value", "award amount", "scholarship value"] },
      { key: "status", label: "Status", aliases: ["status", "state", "active", "availability"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "name_only", label: "Scholarship Name Only", fields: ["name"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("scholarships") as any).select("id, name, provider, description, eligibility, amount, status").order("name");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;
  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const name = row.mapped.name || row.sourceRow.name || "";
      if (!name) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Scholarship Name is required" }); return; }
      const record: Record<string, unknown> = {};
      record.name = name; record.provider = row.mapped.provider ?? row.sourceRow.provider ?? null;
      record.description = row.mapped.description ?? row.sourceRow.description ?? null;
      record.eligibility = row.mapped.eligibility ?? row.sourceRow.eligibility ?? null;
      record.amount = parseFloat(row.mapped.amount ?? row.sourceRow.amount ?? "0") || 0;
      record.status = row.mapped.status ?? row.sourceRow.status ?? "active";
      const { data: existing } = await supabase.from("scholarships").select("id").eq("name", name).maybeSingle();
      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("scholarships") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Scholarship not found: "+name }); return; }
        const { error } = await (supabase.from("scholarships") as any).update(record).eq("id", targetId);
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }
  for (let i = 0; i < rows.length; i += CONCURRENCY) { if (signal?.aborted) break; await Promise.all(rows.slice(i, i + CONCURRENCY).map(processRow)); }
  emitAppSync("sms.scholarships.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") { const { error } = await supabase.from("scholarships").delete().eq("id", entry.studentKey); if (error) throw error; restored++; }
      else if (entry.changeType === "updated") { const { error } = await (supabase.from("scholarships") as any).update(entry.previousState).eq("id", entry.studentKey); if (error) throw error; restored++; }
    } catch { success = false; }
  }
  return { success, restored };
}

export const scholarshipModule: ImportModule = {
  id: "scholarship", name: "Scholarship",
  description: "Import scholarship schemes with eligibility criteria and award amounts",
  icon: "GraduationCap", fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};