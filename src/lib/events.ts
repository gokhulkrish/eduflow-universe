import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type Event = { id: string; title: string; description: string; date: string; time: string; location: string; category: string; organizer: string; capacity: number; created_at: string; };
export type RSVP = { id: string; event_id: string; guest: string; status: string; guests_count: number; notes: string; responded_at: string; };
export type TicketType = { id: string; event_id: string; name: string; price: number; quantity: number; sold: number; };
export type PhotoGallery = { id: string; event_id: string; url: string; caption: string; uploaded_at: string; };

export const eventsKey = "eduflow_events";
export const rsvpsKey = "eduflow_rsvps";
export const ticketsKey = "eduflow_tickets";
export const photosKey = "eduflow_photos";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export async function getEvents(): Promise<Event[]> {
  const local = ls<Event[]>(eventsKey, []);
  try {
    if (!(await tableExists("events"))) return local;
    const { data } = await supabase.from("events").select("*").order("event_date", { ascending: false });
    if (data && data.length > 0) {
      const mapped: Event[] = data.map((r: any) => ({
        id: r.id, title: r.title, description: r.description ?? "",
        date: r.event_date, time: r.event_time ?? "", location: r.location ?? "",
        category: r.category ?? "Other", organizer: r.organizer ?? "",
        capacity: r.capacity ?? 0, created_at: r.created_at,
      }));
      ss(eventsKey, mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createEvent(e: Omit<Event, "id" | "created_at">): Promise<Event> {
  const n: Event = { ...e, id: generateId(), created_at: new Date().toISOString() };
  try {
    if (await tableExists("events")) {
      const { data } = await supabase.from("events").insert({
        title: e.title, description: e.description, event_date: e.date,
        event_time: e.time, location: e.location, category: e.category,
        organizer: e.organizer, capacity: e.capacity,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<Event[]>(eventsKey, []);
  items.unshift(n); ss(eventsKey, items); return n;
}

export async function updateEvent(id: string, p: Partial<Event>) {
  try {
    if (await tableExists("events")) {
      const upd: any = {};
      if (p.title !== undefined) upd.title = p.title;
      if (p.description !== undefined) upd.description = p.description;
      if (p.date !== undefined) upd.event_date = p.date;
      if (p.time !== undefined) upd.event_time = p.time;
      if (p.location !== undefined) upd.location = p.location;
      if (p.category !== undefined) upd.category = p.category;
      if (p.organizer !== undefined) upd.organizer = p.organizer;
      if (p.capacity !== undefined) upd.capacity = p.capacity;
      await supabase.from("events").update(upd).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<Event[]>(eventsKey, []);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ss(eventsKey, items); }
}

export async function deleteEvent(id: string) {
  try {
    if (await tableExists("events")) {
      await supabase.from("events").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(eventsKey, ls<Event[]>(eventsKey, []).filter((x) => x.id !== id));
}

export async function getRSVPs(eventId?: string): Promise<RSVP[]> {
  const all = ls(rsvpsKey, [] as RSVP[]);
  try {
    if (!(await tableExists("event_rsvps"))) return eventId ? all.filter((r) => r.event_id === eventId) : all;
    let q = supabase.from("event_rsvps").select("*");
    if (eventId) q = q.eq("event_id", eventId);
    const { data } = await q;
    if (data) {
      const mapped: RSVP[] = data.map((r: any) => ({
        id: r.id, event_id: r.event_id, guest: r.guest, status: r.status,
        guests_count: r.guests_count ?? 1, notes: r.notes ?? "", responded_at: r.responded_at,
      }));
      return mapped;
    }
  } catch { /* fall through */ }
  return eventId ? all.filter((r) => r.event_id === eventId) : all;
}

export async function addRSVP(r: Omit<RSVP, "id" | "responded_at">): Promise<RSVP> {
  const n: RSVP = { ...r, id: generateId(), responded_at: new Date().toISOString() };
  try {
    if (await tableExists("event_rsvps")) {
      const { data } = await supabase.from("event_rsvps").insert({
        event_id: r.event_id, guest: r.guest, status: r.status,
        guests_count: r.guests_count, notes: r.notes,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<RSVP[]>(rsvpsKey, []);
  items.push(n); ss(rsvpsKey, items); return n;
}

export async function updateRSVP(id: string, status: string) {
  try {
    if (await tableExists("event_rsvps")) {
      await supabase.from("event_rsvps").update({ status }).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<RSVP[]>(rsvpsKey, []);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i].status = status; ss(rsvpsKey, items); }
}

export async function getTickets(eventId?: string): Promise<TicketType[]> {
  const all = ls(ticketsKey, [] as TicketType[]);
  try {
    if (!(await tableExists("event_ticket_types"))) return eventId ? all.filter((t) => t.event_id === eventId) : all;
    let q = supabase.from("event_ticket_types").select("*");
    if (eventId) q = q.eq("event_id", eventId);
    const { data } = await q;
    if (data) {
      return data.map((r: any) => ({
        id: r.id, event_id: r.event_id, name: r.name,
        price: Number(r.price) || 0, quantity: r.quantity ?? 0, sold: r.sold ?? 0,
      }));
    }
  } catch { /* fall through */ }
  return eventId ? all.filter((t) => t.event_id === eventId) : all;
}

export async function addTicketType(t: Omit<TicketType, "id">): Promise<TicketType> {
  const n: TicketType = { ...t, id: generateId() };
  try {
    if (await tableExists("event_ticket_types")) {
      const { data } = await supabase.from("event_ticket_types").insert({
        event_id: t.event_id, name: t.name, price: t.price,
        quantity: t.quantity, sold: 0,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<TicketType[]>(ticketsKey, []);
  items.push(n); ss(ticketsKey, items); return n;
}

export async function sellTicket(ticketId: string) {
  try {
    if (await tableExists("event_ticket_types")) {
      const { data } = await supabase.from("event_ticket_types").select("sold,quantity").eq("id", ticketId).single();
      if (data && data.sold < data.quantity) {
        await supabase.from("event_ticket_types").update({ sold: (data.sold ?? 0) + 1 }).eq("id", ticketId);
      }
    }
  } catch { /* fall through */ }
  const items = ls<TicketType[]>(ticketsKey, []);
  const i = items.findIndex((x) => x.id === ticketId);
  if (i >= 0 && items[i].sold < items[i].quantity) { items[i].sold++; ss(ticketsKey, items); }
}

export async function deleteTicketType(id: string) {
  try {
    if (await tableExists("event_ticket_types")) {
      await supabase.from("event_ticket_types").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(ticketsKey, ls<TicketType[]>(ticketsKey, []).filter((t) => t.id !== id));
}

export async function getPhotos(eventId?: string): Promise<PhotoGallery[]> {
  const all = ls(photosKey, [] as PhotoGallery[]);
  try {
    if (!(await tableExists("event_photos"))) return eventId ? all.filter((p) => p.event_id === eventId) : all;
    let q = supabase.from("event_photos").select("*");
    if (eventId) q = q.eq("event_id", eventId);
    const { data } = await q;
    if (data) {
      return data.map((r: any) => ({
        id: r.id, event_id: r.event_id, url: r.url,
        caption: r.caption ?? "", uploaded_at: r.uploaded_at,
      }));
    }
  } catch { /* fall through */ }
  return eventId ? all.filter((p) => p.event_id === eventId) : all;
}

export async function addPhoto(p: Omit<PhotoGallery, "id" | "uploaded_at">): Promise<PhotoGallery> {
  const n: PhotoGallery = { ...p, id: generateId(), uploaded_at: new Date().toISOString() };
  try {
    if (await tableExists("event_photos")) {
      const { data } = await supabase.from("event_photos").insert({
        event_id: p.event_id, url: p.url, caption: p.caption,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<PhotoGallery[]>(photosKey, []);
  items.push(n); ss(photosKey, items); return n;
}

export async function deletePhoto(id: string) {
  try {
    if (await tableExists("event_photos")) {
      await supabase.from("event_photos").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(photosKey, ls<PhotoGallery[]>(photosKey, []).filter((p) => p.id !== id));
}

export const EVENT_CATEGORIES = ["Academic", "Sports", "Cultural", "Holiday", "Meeting", "Workshop", "Other"];

export async function getEventAnalytics(eventId: string) {
  const [rsvps, tix] = await Promise.all([getRSVPs(eventId), getTickets(eventId)]);
  return {
    confirmed: rsvps.filter((r) => r.status === "confirmed").length,
    declined: rsvps.filter((r) => r.status === "declined").length,
    maybe: rsvps.filter((r) => r.status === "maybe").length,
    totalGuests: rsvps.reduce((s, r) => s + r.guests_count, 0),
    ticketsSold: tix.reduce((s, t) => s + t.sold, 0),
    totalRevenue: tix.reduce((s, t) => s + t.sold * t.price, 0),
  };
}
