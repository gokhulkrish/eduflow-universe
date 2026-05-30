import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
    {
      title: "Research & Innovation Fields",
      fields: [
      { key: "researchTitle", label: "Research Title", aliases: ["research_title", "research title", "title", "project"], required: true },
      { key: "principalInvestigator", label: "Principal Investigator", aliases: ["principal_investigator", "principal investigator", "PI", "investigator", "lead"] },
      { key: "fundingAgency", label: "Funding Agency", aliases: ["funding_agency", "funding agency", "funder", "sponsor"] },
      { key: "grantAmount", label: "Grant Amount", aliases: ["grant_amount", "grant amount", "amount", "budget", "funding"] },
      { key: "researchStage", label: "Research Stage", aliases: ["research_stage", "research stage", "stage", "phase"] }
      ],
    }
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "researchTitle_only", label: "Research Title Only", fields: ["researchTitle"] },
  { id: "name_only", label: "Principal Investigator Only", fields: ["principalInvestigator"] },
  { id: "researchTitle_or_name", label: "Research Title OR Principal Investigator", fields: ["researchTitle", "principalInvestigator"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("research_projects") as any).select("id, research_title, principal_investigator, funding_agency, grant_amount, research_stage").order("research_title");
  return (data || []).map((r: Record<string, unknown>) => {
    const out: Record<string, unknown> = { id: r.id };
    out["researchTitle"] = r["research_title"] ?? null;     out["principalInvestigator"] = r["principal_investigator"] ?? null;     out["fundingAgency"] = r["funding_agency"] ?? null;     out["grantAmount"] = r["grant_amount"] ?? null;     out["researchStage"] = r["research_stage"] ?? null;
    return out;
  });
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;

  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const idVal = row.mapped.researchTitle || row.sourceRow.researchTitle || "";
      if (!idVal) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Research Title is required" }); return; }

      const { data: existing } = await supabase.from("research_projects").select("id").eq("research_title", idVal).maybeSingle();
      const db: Record<string, unknown> = {};
      db.research_title = row.mapped.researchTitle ?? row.sourceRow.researchTitle ?? null;
      db.principal_investigator = row.mapped.principalInvestigator ?? row.sourceRow.principalInvestigator ?? null;
      db.funding_agency = row.mapped.fundingAgency ?? row.sourceRow.fundingAgency ?? null;
      db.grant_amount = row.mapped.grantAmount ?? row.sourceRow.grantAmount ?? null;
      db.research_stage = row.mapped.researchStage ?? row.sourceRow.researchStage ?? null;

      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("research_projects") as any).insert(db).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Research Title not found: {idField}" }); return; }
        const { error } = await (supabase.from("research_projects") as any).update(db).eq("id", targetId);
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
  emitAppSync("sms.research_projects.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") {
        const { error } = await supabase.from("research_projects").delete().eq("id", entry.studentKey);
        if (error) throw error; restored++;
      } else if (entry.changeType === "updated") {
        const { error } = await (supabase.from("research_projects") as any).update(entry.previousState).eq("id", entry.studentKey);
        if (error) throw error; restored++;
      }
    } catch { success = false; }
  }
  return { success, restored };
}

export const researchModule: ImportModule = {
  id: "research",
  name: "Research & Innovation",
  description: "Import research projects with funding and investigator details",
  icon: "FlaskConical",
  fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};