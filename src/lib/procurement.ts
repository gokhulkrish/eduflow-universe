import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type Procurement = { id: string; requestTitle: string; vendorName: string; assetTag: string; departmentName: string; procurementStatus: string; };
export const PROC_KEY = "eduflow_procurement";
function h(r: any): Procurement { return { id: r.id, requestTitle: r.request_title ?? "", vendorName: r.vendor_name ?? "", assetTag: r.asset_tag ?? "", departmentName: r.department_name ?? "", procurementStatus: r.procurement_status ?? "Requested" }; }
function toDb(i: Omit<Procurement, "id">) { return { request_title: i.requestTitle, vendor_name: i.vendorName, asset_tag: i.assetTag, department_name: i.departmentName, procurement_status: i.procurementStatus }; }
function lf(): Procurement[] { try { return JSON.parse(localStorage.getItem(PROC_KEY) ?? "[]"); } catch { return []; } }
function sf(v: Procurement[]) { localStorage.setItem(PROC_KEY, JSON.stringify(v)); }
export async function getProcurements(): Promise<Procurement[]> {
  if (await tableExists("procurement_requests")) { const { data } = await supabase.from("procurement_requests").select("*").order("request_title"); return (data ?? []).map(h); }
  return lf();
}
export async function createProcurement(i: Omit<Procurement, "id">): Promise<Procurement> {
  if (await tableExists("procurement_requests")) { const { data } = await supabase.from("procurement_requests").insert(toDb(i)).select().single(); return h(data); }
  const item: Procurement = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i }; const items = lf(); items.push(item); sf(items); return item;
}
export async function updateProcurement(id: string, updates: Partial<Procurement>): Promise<void> {
  if (await tableExists("procurement_requests")) {
    const db: any = {};
    if (updates.requestTitle !== undefined) db.request_title = updates.requestTitle;
    if (updates.vendorName !== undefined) db.vendor_name = updates.vendorName;
    if (updates.assetTag !== undefined) db.asset_tag = updates.assetTag;
    if (updates.departmentName !== undefined) db.department_name = updates.departmentName;
    if (updates.procurementStatus !== undefined) db.procurement_status = updates.procurementStatus;
    await supabase.from("procurement_requests").update(db).eq("id", id);
    return;
  }
  const items = lf(); const idx = items.findIndex((p) => p.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteProcurement(id: string): Promise<void> {
  if (await tableExists("procurement_requests")) { await supabase.from("procurement_requests").delete().eq("id", id); return; }
  sf(lf().filter((p) => p.id !== id));
}
