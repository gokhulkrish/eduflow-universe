import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type IotDevice = { id: string; name: string; type: string; model: string; serial_no: string; location: string; status: string; firmware: string; last_seen: string; battery_level: number; ip_address: string; notes: string; created_at: string; };
export type IotReading = { id: string; device_id: string; metric: string; value: number; unit: string; recorded_at: string; };
export type RfidLog = { id: string; reader_id: string; reader_name: string; tag_id: string; student_name: string; student_id: string; timestamp: string; direction: string; };
export const DEVICES_KEY = "eduflow_iot_devices";
export const READINGS_KEY = "eduflow_iot_readings";
export const RFID_KEY = "eduflow_iot_rfid";

function hd(r: any): IotDevice { return { id: r.id, name: r.name ?? "", type: r.device_type ?? "", model: r.model ?? "", serial_no: r.serial_no ?? "", location: r.location ?? "", status: r.status ?? "active", firmware: r.firmware ?? "", last_seen: r.last_seen ?? "", battery_level: r.battery_level ?? 100, ip_address: r.ip_address ?? "", notes: r.notes ?? "", created_at: r.created_at ?? "" }; }
function hr(r: any): IotReading { return { id: r.id, device_id: r.device_id, metric: r.metric ?? "", value: r.value ?? 0, unit: r.unit ?? "", recorded_at: r.recorded_at ?? "" }; }
function hf(r: any): RfidLog { return { id: r.id, reader_id: r.reader_id, reader_name: r.reader_name ?? "", tag_id: r.tag_id ?? "", student_name: r.student_name ?? "", student_id: r.student_id ?? "", timestamp: r.timestamp ?? "", direction: r.direction ?? "in" }; }

function dl(): IotDevice[] { try { return JSON.parse(localStorage.getItem(DEVICES_KEY) ?? "[]"); } catch { return []; } }
function ds(v: IotDevice[]) { localStorage.setItem(DEVICES_KEY, JSON.stringify(v)); }
function rl(): IotReading[] { try { return JSON.parse(localStorage.getItem(READINGS_KEY) ?? "[]"); } catch { return []; } }
function rs(v: IotReading[]) { localStorage.setItem(READINGS_KEY, JSON.stringify(v)); }
function fl(): RfidLog[] { try { return JSON.parse(localStorage.getItem(RFID_KEY) ?? "[]"); } catch { return []; } }
function fs(v: RfidLog[]) { localStorage.setItem(RFID_KEY, JSON.stringify(v)); }

export async function getIotDevices(): Promise<IotDevice[]> {
  if (await tableExists("iot_devices")) { const { data } = await supabase.from("iot_devices").select("*").order("name"); return (data ?? []).map(hd); }
  return dl();
}
export async function createIotDevice(i: Omit<IotDevice, "id" | "created_at">): Promise<IotDevice> {
  if (await tableExists("iot_devices")) { const db: any = { ...i, device_type: i.type }; delete db.type; const { data } = await supabase.from("iot_devices").insert(db).select().single(); return hd(data); }
  const item: IotDevice = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, created_at: new Date().toISOString() }; const items = dl(); items.push(item); ds(items); return item;
}
export async function updateIotDevice(id: string, updates: Partial<IotDevice>): Promise<void> {
  if (await tableExists("iot_devices")) { const db: any = {}; for (const k of Object.keys(updates)) { const v = (updates as any)[k]; if (v !== undefined) db[k === "type" ? "device_type" : k] = v; } await supabase.from("iot_devices").update(db).eq("id", id); return; }
  ds(dl().map((x) => x.id === id ? { ...x, ...updates } : x));
}
export async function deleteIotDevice(id: string): Promise<void> {
  if (await tableExists("iot_devices")) { await supabase.from("iot_devices").delete().eq("id", id); return; }
  ds(dl().filter((d) => d.id !== id));
}
export async function getIotReadings(): Promise<IotReading[]> {
  if (await tableExists("iot_readings")) { const { data } = await supabase.from("iot_readings").select("*").order("recorded_at", { ascending: false }); return (data ?? []).map(hr); }
  return rl();
}
export async function createIotReading(i: Omit<IotReading, "id" | "recorded_at">): Promise<IotReading> {
  if (await tableExists("iot_readings")) { const { data } = await supabase.from("iot_readings").insert(i).select().single(); return hr(data); }
  const item: IotReading = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i, recorded_at: new Date().toISOString() }; const items = rl(); items.push(item); rs(items); return item;
}
export async function deleteReadingsByDevice(deviceId: string): Promise<void> {
  if (await tableExists("iot_readings")) { await supabase.from("iot_readings").delete().eq("device_id", deviceId); return; }
  rs(rl().filter((r) => r.device_id !== deviceId));
}
export async function getRfidLogs(): Promise<RfidLog[]> {
  if (await tableExists("iot_rfid_logs")) { const { data } = await supabase.from("iot_rfid_logs").select("*").order("timestamp", { ascending: false }); return (data ?? []).map(hf); }
  return fl();
}
export async function createRfidLog(i: Omit<RfidLog, "id">): Promise<RfidLog> {
  if (await tableExists("iot_rfid_logs")) { const { data } = await supabase.from("iot_rfid_logs").insert(i).select().single(); return hf(data); }
  const item: RfidLog = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i }; const items = fl(); items.push(item); fs(items); return item;
}
