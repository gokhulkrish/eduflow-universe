import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type ItAsset = { id: string; name: string; category: string; brand: string; model: string; serial_no: string; asset_tag: string; purchase_date: string; warranty_months: number; location: string; status: string; assigned_to_type?: string; assigned_to_name?: string; assigned_to_id?: string; assigned_at?: string; notes: string; created_at: string; };
export type MaintenanceRecord = { id: string; asset_id: string; date: string; type: string; description: string; cost: number; vendor: string; next_due: string; created_at: string; };
export const ASSETS_KEY = "eduflow_it_assets";
export const MAINT_KEY = "eduflow_it_maintenance";

function ha(r: any): ItAsset { return { id: r.id, name: r.name ?? "", category: r.category ?? "desktop", brand: r.brand ?? "", model: r.model ?? "", serial_no: r.serial_no ?? "", asset_tag: r.asset_tag ?? "", purchase_date: r.purchase_date ?? "", warranty_months: r.warranty_months ?? 0, location: r.location ?? "", status: r.status ?? "available", assigned_to_type: r.assigned_to_type || undefined, assigned_to_name: r.assigned_to_name || undefined, assigned_to_id: r.assigned_to_id || undefined, assigned_at: r.assigned_at || undefined, notes: r.notes ?? "", created_at: r.created_at ?? "" }; }
function hm(r: any): MaintenanceRecord { return { id: r.id, asset_id: r.asset_id, date: r.date ?? "", type: r.maint_type ?? "", description: r.description ?? "", cost: r.cost ?? 0, vendor: r.vendor ?? "", next_due: r.next_due ?? "", created_at: r.created_at ?? "" }; }
function toDbAsset(i: Omit<ItAsset, "id" | "created_at">) { return { name: i.name, category: i.category, brand: i.brand, model: i.model, serial_no: i.serial_no, asset_tag: i.asset_tag, purchase_date: i.purchase_date, warranty_months: i.warranty_months, location: i.location, status: i.status, assigned_to_type: i.assigned_to_type || null, assigned_to_name: i.assigned_to_name || null, assigned_to_id: i.assigned_to_id || null, assigned_at: i.assigned_at || null, notes: i.notes }; }

function al(): ItAsset[] { try { return JSON.parse(localStorage.getItem(ASSETS_KEY) ?? "[]"); } catch { return []; } }
function as(v: ItAsset[]) { localStorage.setItem(ASSETS_KEY, JSON.stringify(v)); }
function ml(): MaintenanceRecord[] { try { return JSON.parse(localStorage.getItem(MAINT_KEY) ?? "[]"); } catch { return []; } }
function ms(v: MaintenanceRecord[]) { localStorage.setItem(MAINT_KEY, JSON.stringify(v)); }

export async function getAssets(): Promise<ItAsset[]> {
  if (await tableExists("it_assets")) { const { data } = await supabase.from("it_assets").select("*").order("name"); return (data ?? []).map(ha); }
  return al();
}
export async function createAsset(i: Omit<ItAsset, "id" | "created_at">): Promise<ItAsset> {
  if (await tableExists("it_assets")) { const { data } = await supabase.from("it_assets").insert(toDbAsset(i)).select().single(); return ha(data); }
  const item: ItAsset = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = al(); items.push(item); as(items); return item;
}
export async function updateAsset(id: string, updates: Partial<ItAsset>): Promise<void> {
  if (await tableExists("it_assets")) { const db: any = {}; for (const k of Object.keys(updates)) { const v = (updates as any)[k]; if (v !== undefined) db[k] = v; } await supabase.from("it_assets").update(db).eq("id", id); return; }
  as(al().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteAsset(id: string): Promise<void> {
  if (await tableExists("it_assets")) { await supabase.from("it_assets").delete().eq("id", id); return; }
  as(al().filter((a) => a.id !== id));
}
export async function getMaintenance(): Promise<MaintenanceRecord[]> {
  if (await tableExists("it_maintenance")) { const { data } = await supabase.from("it_maintenance").select("*").order("date", { ascending: false }); return (data ?? []).map(hm); }
  return ml();
}
export async function createMaintenance(i: Omit<MaintenanceRecord, "id" | "created_at">): Promise<MaintenanceRecord> {
  if (await tableExists("it_maintenance")) { const { data } = await supabase.from("it_maintenance").insert({ asset_id: i.asset_id, date: i.date, maint_type: i.type, description: i.description, cost: i.cost, vendor: i.vendor, next_due: i.next_due }).select().single(); return hm(data); }
  const item: MaintenanceRecord = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = ml(); items.push(item); ms(items); return item;
}
export async function deleteMaintenanceByAsset(assetId: string): Promise<void> {
  if (await tableExists("it_maintenance")) { await supabase.from("it_maintenance").delete().eq("asset_id", assetId); return; }
  ms(ml().filter((m) => m.asset_id !== assetId));
}
