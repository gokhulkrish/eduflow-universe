import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Lab Details",
    fields: [
      { key: "name", label: "Lab Name", aliases: ["name", "lab name", "lab", "room"], required: true },
      { key: "location", label: "Location", aliases: ["location", "building", "floor", "room no"] },
      { key: "capacity", label: "Capacity", aliases: ["capacity", "seats", "max students", "strength"] },
      { key: "systems_count", label: "Systems Count", aliases: ["systems_count", "systems", "computers", "workstations"] },
      { key: "incharge", label: "Incharge", aliases: ["incharge", "in charge", "lab incharge", "coordinator"] },
      { key: "status", label: "Status", aliases: ["status", "state", "condition", "availability"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "name_only", label: "Lab Name Only", fields: ["name"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("it_labs") as any).select("id, name, location, capacity, systems_count, incharge, status").order("name");
  return (data || []).map((r: Record<string, unknown>) => ({ ...r }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;
  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const name = row.mapped.name || row.sourceRow.name || "";
      if (!name) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Lab Name is required" }); return; }
      const record: Record<string, unknown> = {};
      record.name = name; record.location = row.mapped.location ?? row.sourceRow.location ?? null;
      record.capacity = parseInt(row.mapped.capacity ?? row.sourceRow.capacity ?? "0") || 0;
      record.systems_count = parseInt(row.mapped.systems_count ?? row.sourceRow.systems_count ?? "0") || 0;
      record.incharge = row.mapped.incharge ?? row.sourceRow.incharge ?? null;
      record.status = row.mapped.status ?? row.sourceRow.status ?? "active";
      const { data: existing } = await supabase.from("it_labs").select("id").eq("name", name).maybeSingle();
      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("it_labs") as any).insert(record).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Lab not found: "+name }); return; }
        const { error } = await (supabase.from("it_labs") as any).update(record).eq("id", targetId);
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }
  for (let i = 0; i < rows.length; i += CONCURRENCY) { if (signal?.aborted) break; await Promise.all(rows.slice(i, i + CONCURRENCY).map(processRow)); }
  emitAppSync("sms.it_labs.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") { const { error } = await supabase.from("it_labs").delete().eq("id", entry.studentKey); if (error) throw error; restored++; }
      else if (entry.changeType === "updated") { const { error } = await (supabase.from("it_labs") as any).update(entry.previousState).eq("id", entry.studentKey); if (error) throw error; restored++; }
    } catch { success = false; }
  }
  return { success, restored };
}

export const itLabsModule: ImportModule = {
  id: "it-labs", name: "IT Labs",
  description: "Import IT lab records with location, capacity, and equipment details",
  icon: "Monitor", fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};