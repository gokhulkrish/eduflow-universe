import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Health & Wellbeing Fields",
      fields: [
      { key: "caseTitle", label: "Case Title", aliases: ["case_title", "case title", "title", "case name"], required: true },
      { key: "personName", label: "Person Name", aliases: ["person_name", "person name", "patient", "individual"] },
      { key: "caseType", label: "Case Type", aliases: ["case_type", "case type", "type", "category"] },
      { key: "followUpDate", label: "Follow-Up Date", aliases: ["follow_up_date", "follow up date", "followup", "next appointment"] },
      { key: "careStatus", label: "Care Status", aliases: ["care_status", "care status", "status", "care stage"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "caseTitle_only", label: "Case Title Only", fields: ["caseTitle"] },
  { id: "name_only", label: "Person Name Only", fields: ["personName"] },
  { id: "caseTitle_or_name", label: "Case Title OR Person Name", fields: ["caseTitle", "personName"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("health_cases") as any).select("id, case_title, person_name, case_type, follow_up_date, care_status").order("case_title");
  return (data || []).map((r: Record<string, unknown>) => {
    const out: Record<string, unknown> = { id: r.id };
    out["caseTitle"] = r["case_title"] ?? null;     out["personName"] = r["person_name"] ?? null;     out["caseType"] = r["case_type"] ?? null;     out["followUpDate"] = r["follow_up_date"] ?? null;     out["careStatus"] = r["care_status"] ?? null;
    return out;
  });
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const idVal = row.mapped.caseTitle || row.sourceRow.caseTitle || "";
      if (!idVal) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Case Title is required" }); return; }

      const { data: existing } = await supabase.from("health_cases").select("id").eq("case_title", idVal).maybeSingle();
      const db: Record<string, unknown> = {};
      db.case_title = row.mapped.caseTitle ?? row.sourceRow.caseTitle ?? null;
      db.person_name = row.mapped.personName ?? row.sourceRow.personName ?? null;
      db.case_type = row.mapped.caseType ?? row.sourceRow.caseType ?? null;
      db.follow_up_date = row.mapped.followUpDate ?? row.sourceRow.followUpDate ?? null;
      db.care_status = row.mapped.careStatus ?? row.sourceRow.careStatus ?? null;

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("health_cases") as any).insert(db).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Case Title not found: {idField}" }); return; }
        const { error } = await (supabase.from("health_cases") as any).update(db).eq("id", targetId);
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
  emitAppSync("sms.health_cases.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("health_cases").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("health_cases") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const healthModule: ImportModule = {
  id: "health",
  name: "Health & Wellbeing",
  description: "Import health case records including follow-up scheduling",
  icon: "Heart",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};