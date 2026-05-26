import "@/lib/runtime-storage";
import { emitAppSync } from "@/lib/app-sync";
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

export function getEvents(): Event[] { return ls(eventsKey, []); }
export function createEvent(e: Omit<Event, "id" | "created_at">): Event {
  const items = getEvents(); const n = { ...e, id: generateId(), created_at: new Date().toISOString() };
  items.unshift(n); ss(eventsKey, items); return n;
}
export function updateEvent(id: string, p: Partial<Event>) { const items = getEvents(); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(eventsKey, items); } }
export function deleteEvent(id: string) { ss(eventsKey, getEvents().filter((x) => x.id !== id)); }

export function getRSVPs(eventId?: string): RSVP[] {
  const all = ls(rsvpsKey, [] as RSVP[]); return eventId ? all.filter((r) => r.event_id === eventId) : all;
}
export function addRSVP(r: Omit<RSVP, "id" | "responded_at">): RSVP {
  const items = ls(rsvpsKey, [] as RSVP[]); const n = { ...r, id: generateId(), responded_at: new Date().toISOString() };
  items.push(n); ss(rsvpsKey, items); return n;
}
export function updateRSVP(id: string, status: string) {
  const items = ls(rsvpsKey, [] as RSVP[]); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i].status = status; ss(rsvpsKey, items); }
}

export function getTickets(eventId?: string): TicketType[] {
  const all = ls(ticketsKey, [] as TicketType[]); return eventId ? all.filter((t) => t.event_id === eventId) : all;
}
export function addTicketType(t: Omit<TicketType, "id">): TicketType {
  const items = ls(ticketsKey, [] as TicketType[]); const n = { ...t, id: generateId() };
  items.push(n); ss(ticketsKey, items); return n;
}
export function sellTicket(ticketId: string) {
  const items = ls(ticketsKey, [] as TicketType[]); const i = items.findIndex((x) => x.id === ticketId);
  if (i >= 0 && items[i].sold < items[i].quantity) { items[i].sold++; ss(ticketsKey, items); }
}
export function deleteTicketType(id: string) { ss(ticketsKey, ls(ticketsKey, [] as TicketType[]).filter((t) => t.id !== id)); }

export function getPhotos(eventId?: string): PhotoGallery[] {
  const all = ls(photosKey, [] as PhotoGallery[]); return eventId ? all.filter((p) => p.event_id === eventId) : all;
}
export function addPhoto(p: Omit<PhotoGallery, "id" | "uploaded_at">): PhotoGallery {
  const items = ls(photosKey, [] as PhotoGallery[]); const n = { ...p, id: generateId(), uploaded_at: new Date().toISOString() };
  items.push(n); ss(photosKey, items); return n;
}
export function deletePhoto(id: string) { ss(photosKey, ls(photosKey, [] as PhotoGallery[]).filter((p) => p.id !== id)); }

export const EVENT_CATEGORIES = ["Academic", "Sports", "Cultural", "Holiday", "Meeting", "Workshop", "Other"];

export function getEventAnalytics(eventId: string) {
  const rsvps = getRSVPs(eventId); const tix = getTickets(eventId);
  return { confirmed: rsvps.filter((r) => r.status === "confirmed").length, declined: rsvps.filter((r) => r.status === "declined").length, maybe: rsvps.filter((r) => r.status === "maybe").length, totalGuests: rsvps.reduce((s, r) => s + r.guests_count, 0), ticketsSold: tix.reduce((s, t) => s + t.sold, 0), totalRevenue: tix.reduce((s, t) => s + t.sold * t.price, 0) };
}
