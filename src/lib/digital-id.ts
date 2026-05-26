export type IDTemplate = { id: string; name: string; bg_color: string; text_color: string; font: string; logo_url: string; fields: string[]; card_width: number; card_height: number; };
export type DigitalIDEntry = { id: string; entity_type: string; entity_id: string; entity_name: string; id_number: string; template_id: string; issue_date: string; expiry_date: string; status: string; qr_data: string; created_at: string; };

import "@/lib/runtime-storage";
import { emitAppSync } from "@/lib/app-sync";
import { generateId } from "@/lib/utils";

export const digitalIdTemplatesKey = "eduflow_id_templates";
export const digitalIdsKey = "eduflow_digital_ids";
export const busPassesKey = "eduflow_bus_passes";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getTemplates(): IDTemplate[] { return ls(digitalIdTemplatesKey, []); }
export function createTemplate(t: Omit<IDTemplate, "id">): IDTemplate {
  const items = getTemplates(); const n = { ...t, id: generateId() };
  items.push(n); ss(digitalIdTemplatesKey, items); return n;
}
export function deleteTemplate(id: string) { ss(digitalIdTemplatesKey, getTemplates().filter((t) => t.id !== id)); }

export function getIDs(): DigitalIDEntry[] { return ls(digitalIdsKey, []); }
export function createID(e: Omit<DigitalIDEntry, "id" | "created_at" | "qr_data">): DigitalIDEntry {
  const items = getIDs();
  const n: DigitalIDEntry = { ...e, id: generateId(), qr_data: `ID:${e.id_number}|Type:${e.entity_type}|Name:${e.entity_name}`, created_at: new Date().toISOString() };
  items.unshift(n); ss(digitalIdsKey, items); return n;
}
export function createBulkIDs(entries: Omit<DigitalIDEntry, "id" | "created_at" | "qr_data">[]): DigitalIDEntry[] {
  return entries.map((e) => createID(e));
}
export function updateID(id: string, p: Partial<DigitalIDEntry>) { const items = getIDs(); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(digitalIdsKey, items); } }
export function revokeID(id: string) { updateID(id, { status: "revoked" }); }

export const FONTS = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana"];
export const FIELD_OPTIONS = ["Full Name", "ID Number", "Entity Type", "Issue Date", "Expiry Date", "Photo", "QR Code", "Department", "Grade", "Blood Group"];

// Bus Pass
export type BusPass = { id: string; student: string; route: string; pickup: string; dropoff: string; fee: number; issue_date: string; expiry_date: string; status: string; };

export function getBusPasses(): BusPass[] { return ls(busPassesKey, []); }
export function createBusPass(b: Omit<BusPass, "id">): BusPass {
  const items = getBusPasses(); const n = { ...b, id: generateId() };
  items.push(n); ss(busPassesKey, items); return n;
}
export function updateBusPass(id: string, p: Partial<BusPass>) { const items = getBusPasses(); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(busPassesKey, items); } }
export function deleteBusPass(id: string) { ss(busPassesKey, getBusPasses().filter((x) => x.id !== id)); }
