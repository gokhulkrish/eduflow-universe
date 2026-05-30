import type { ImportModule, ImportModuleFieldGroup, ImportModuleMatchStrategy, ImportCommitResult, ImportBatch, ImportPreviewRow, ImportRollbackEntry } from "../types";
import { emitAppSync } from "@/lib/app-sync";
import { supabase } from "@/integrations/supabase/client";

const fieldGroups: ImportModuleFieldGroup[] = [
  {
    title: "Device Identity",
    fields: [
      { key: "name", label: "Device Name", aliases: ["name", "device name", "hostname", "equipment"], required: true },
      { key: "type", label: "Device Type", aliases: ["type", "device_type", "device type", "category"], required: true },
      { key: "brand", label: "Brand", aliases: ["brand", "make", "manufacturer", "vendor"] },
      { key: "model", label: "Model", aliases: ["model", "product", "version"] },
    ],
  },
  {
    title: "Network Configuration",
    fields: [
      { key: "ip_address", label: "IP Address", aliases: ["ip_address", "ip", "ip address", "address"] },
      { key: "mac_address", label: "MAC Address", aliases: ["mac_address", "mac", "mac address", "physical address"] },
      { key: "firmware_version", label: "Firmware Version", aliases: ["firmware_version", "firmware", "os version"] },
    ],
  },
  {
    title: "Location & Status",
    fields: [
      { key: "location", label: "Location", aliases: ["location", "building", "room", "site"] },
      { key: "status", label: "Status", aliases: ["status", "state", "condition", "operational"] },
    ],
  },
];

const matchStrategies: ImportModuleMatchStrategy[] = [
  { id: "name_only", label: "Device Name Only", fields: ["name"] },
  { id: "ip_only", label: "IP Address Only", fields: ["ip_address"] },
  { id: "name_or_ip", label: "Name OR IP", fields: ["name", "ip_address"] },
];

async function loadExistingRecords(): Promise<Record<string, unknown>[]> {
  const { data } = await (supabase.from("it_network_devices") as any).select("id, name, device_type, brand, model, ip_address, mac_address, location, status, firmware_version").order("name");
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id, name: r.name, type: r.device_type, brand: r.brand, model: r.model,
    ip_address: r.ip_address, mac_address: r.mac_address, location: r.location,
    status: r.status, firmware_version: r.firmware_version,
  }));
}

async function commitRows(rows: ImportPreviewRow[], _batch: ImportBatch, signal?: AbortSignal): Promise<ImportCommitResult> {
  const result: ImportCommitResult = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [], rowResults: [] };
  const CONCURRENCY = 5;
  async function processRow(row: ImportPreviewRow): Promise<void> {
    if (row.action === "skip") { result.skipped++; return; }
    try {
      const name = row.mapped.name || row.sourceRow.name || "";
      if (!name) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Device Name is required" }); return; }
      const db: Record<string, unknown> = {};
      db.name = name; db.device_type = row.mapped.type ?? row.sourceRow.type ?? null;
      db.brand = row.mapped.brand ?? row.sourceRow.brand ?? null;
      db.model = row.mapped.model ?? row.sourceRow.model ?? null;
      db.ip_address = row.mapped.ip_address ?? row.sourceRow.ip_address ?? null;
      db.mac_address = row.mapped.mac_address ?? row.sourceRow.mac_address ?? null;
      db.location = row.mapped.location ?? row.sourceRow.location ?? null;
      db.status = row.mapped.status ?? row.sourceRow.status ?? "online";
      db.firmware_version = row.mapped.firmware_version ?? row.sourceRow.firmware_version ?? null;
      const { data: existing } = await supabase.from("it_network_devices").select("id").eq("name", name).maybeSingle();
      if (row.action === "insert" && !existing) {
        const { data: res, error } = await (supabase.from("it_network_devices") as any).insert(db).select().single();
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.inserted++; result.rowResults!.push({ rowKey: row.rowKey, id: res.id, action: "inserted" }); }
      } else if (row.action === "update" || existing) {
        const targetId = existing?.id;
        if (!targetId) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: "Device not found: "+name }); return; }
        const { error } = await (supabase.from("it_network_devices") as any).update(db).eq("id", targetId);
        if (error) { result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: error.message }); }
        else { result.updated++; result.rowResults!.push({ rowKey: row.rowKey, id: targetId, action: "updated" }); }
      }
    } catch (err) {
      result.failed++; result.errors.push({ rowNumber: row.sourceRowIndex, message: err instanceof Error ? err.message : (err && typeof err === "object" ? ((err as Record<string, unknown>).message as string) ?? "Unknown error" : "Unknown error") });
    }
  }
  for (let i = 0; i < rows.length; i += CONCURRENCY) { if (signal?.aborted) break; await Promise.all(rows.slice(i, i + CONCURRENCY).map(processRow)); }
  emitAppSync("sms.it_network_devices.v1");
  return result;
}

async function rollbackRows(rollbackData: ImportRollbackEntry[]): Promise<{ success: boolean; restored: number }> {
  let restored = 0, success = true;
  for (const entry of rollbackData) {
    try {
      if (entry.changeType === "inserted") { const { error } = await supabase.from("it_network_devices").delete().eq("id", entry.studentKey); if (error) throw error; restored++; }
      else if (entry.changeType === "updated") { const { error } = await (supabase.from("it_network_devices") as any).update(entry.previousState).eq("id", entry.studentKey); if (error) throw error; restored++; }
    } catch { success = false; }
  }
  return { success, restored };
}

export const itNetworkModule: ImportModule = {
  id: "it-network", name: "IT Network",
  description: "Import network device records with IP and MAC address tracking",
  icon: "Network", fieldGroups, matchStrategies,
  adapter: { loadExistingRecords, commitRows, rollbackRows },
};