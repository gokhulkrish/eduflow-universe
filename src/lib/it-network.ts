import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type ItNetworkDevice = { id: string; name: string; type: string; brand: string; model: string; ip_address: string; mac_address: string; location: string; status: string; firmware_version: string; purchase_date: string; uplink: string; notes: string; created_at: string; };
export type IpAllocation = { id: string; ip_address: string; device_name: string; device_type: string; location: string; assigned_to: string; notes: string; created_at: string; };
export const DEVICES_KEY = "eduflow_it_network_devices";
export const IPAM_KEY = "eduflow_it_ipam";

function hd(r: any): ItNetworkDevice { return { id: r.id, name: r.name ?? "", type: r.device_type ?? "", brand: r.brand ?? "", model: r.model ?? "", ip_address: r.ip_address ?? "", mac_address: r.mac_address ?? "", location: r.location ?? "", status: r.status ?? "online", firmware_version: r.firmware_version ?? "", purchase_date: r.purchase_date ?? "", uplink: r.uplink ?? "", notes: r.notes ?? "", created_at: r.created_at ?? "" }; }
function hi(r: any): IpAllocation { return { id: r.id, ip_address: r.ip_address ?? "", device_name: r.device_name ?? "", device_type: r.device_type ?? "", location: r.location ?? "", assigned_to: r.assigned_to ?? "", notes: r.notes ?? "", created_at: r.created_at ?? "" }; }

function dl(): ItNetworkDevice[] { try { return JSON.parse(localStorage.getItem(DEVICES_KEY) ?? "[]"); } catch { return []; } }
function ds(v: ItNetworkDevice[]) { localStorage.setItem(DEVICES_KEY, JSON.stringify(v)); }
function il(): IpAllocation[] { try { return JSON.parse(localStorage.getItem(IPAM_KEY) ?? "[]"); } catch { return []; } }
function is(v: IpAllocation[]) { localStorage.setItem(IPAM_KEY, JSON.stringify(v)); }

export async function getNetworkDevices(): Promise<ItNetworkDevice[]> {
  if (await tableExists("it_network_devices")) { const { data } = await supabase.from("it_network_devices").select("*").order("name"); return (data ?? []).map(hd); }
  return dl();
}
export async function createNetworkDevice(i: Omit<ItNetworkDevice, "id" | "created_at">): Promise<ItNetworkDevice> {
  if (await tableExists("it_network_devices")) { const db: any = { ...i, device_type: i.type }; delete db.type; const { data } = await supabase.from("it_network_devices").insert(db).select().single(); return hd(data); }
  const item: ItNetworkDevice = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = dl(); items.push(item); ds(items); return item;
}
export async function updateNetworkDevice(id: string, updates: Partial<ItNetworkDevice>): Promise<void> {
  if (await tableExists("it_network_devices")) { const db: any = {}; for (const k of Object.keys(updates)) { const v = (updates as any)[k]; if (v !== undefined) db[k === "type" ? "device_type" : k] = v; } await supabase.from("it_network_devices").update(db).eq("id", id); return; }
  ds(dl().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteNetworkDevice(id: string): Promise<void> {
  if (await tableExists("it_network_devices")) { await supabase.from("it_network_devices").delete().eq("id", id); return; }
  ds(dl().filter((d) => d.id !== id));
}
export async function getIpAllocations(): Promise<IpAllocation[]> {
  if (await tableExists("it_ip_allocations")) { const { data } = await supabase.from("it_ip_allocations").select("*").order("ip_address"); return (data ?? []).map(hi); }
  return il();
}
export async function createIpAllocation(i: Omit<IpAllocation, "id" | "created_at">): Promise<IpAllocation> {
  if (await tableExists("it_ip_allocations")) { const { data } = await supabase.from("it_ip_allocations").insert(i).select().single(); return hi(data); }
  const item: IpAllocation = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = il(); items.push(item); is(items); return item;
}
