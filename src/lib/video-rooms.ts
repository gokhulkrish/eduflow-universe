import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type Room = { id: string; title: string; date: string; time: string; duration: number; host: string; participants: string[]; status: "scheduled" | "live" | "ended"; };

const STORAGE_KEY = "sms.videorooms.v1";

function ls<T>(d: T): T { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(d)); } catch { return d; } }
function ss(v: any) { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); emitAppSync(STORAGE_KEY); }

export async function getRooms(): Promise<Room[]> {
  const local = ls<Room[]>([]);
  try {
    if (!(await tableExists("video_rooms"))) return local;
    const { data } = await supabase.from("video_rooms").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped: Room[] = data.map((r: any) => ({
        id: r.id, title: r.title, date: r.event_date ?? "",
        time: r.event_time ?? "", duration: r.duration ?? 30,
        host: r.host ?? "", participants: r.participants ?? [],
        status: r.status ?? "scheduled",
      }));
      ss(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createRoom(r: Omit<Room, "id">): Promise<Room> {
  const n: Room = { ...r, id: generateId() };
  try {
    if (await tableExists("video_rooms")) {
      const { data } = await supabase.from("video_rooms").insert({
        title: r.title, event_date: r.date || null, event_time: r.time,
        duration: r.duration, host: r.host,
        participants: r.participants ?? [], status: r.status,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<Room[]>([]);
  items.push(n); ss(items); return n;
}

export async function updateRoom(id: string, p: Partial<Room>) {
  try {
    if (await tableExists("video_rooms")) {
      const upd: any = {};
      if (p.title !== undefined) upd.title = p.title;
      if (p.date !== undefined) upd.event_date = p.date;
      if (p.time !== undefined) upd.event_time = p.time;
      if (p.duration !== undefined) upd.duration = p.duration;
      if (p.host !== undefined) upd.host = p.host;
      if (p.participants !== undefined) upd.participants = p.participants;
      if (p.status !== undefined) upd.status = p.status;
      await supabase.from("video_rooms").update(upd).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<Room[]>([]);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ss(items); }
}

export async function deleteRoom(id: string) {
  try {
    if (await tableExists("video_rooms")) {
      await supabase.from("video_rooms").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(ls<Room[]>([]).filter((x) => x.id !== id));
}
