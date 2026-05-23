import { emitAppSync } from "@/lib/app-sync";

export type Announcement = { id: string; title: string; body: string; audience: string; priority: string; author: string; views: number; created_at: string; };
export type User = { id: string; name: string; role: string; email: string; };
export type Poll = { id: string; question: string; options: string[]; votes: number[]; active: boolean; created_at: string; };

export const announcementsKey = "eduflow_announcements";
export const pollsKey = "eduflow_polls";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getAnnouncements(): Announcement[] { return ls(announcementsKey, []); }
export function createAnnouncement(a: Omit<Announcement, "id" | "created_at">): Announcement {
  const items = getAnnouncements(); const n = { ...a, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  items.unshift(n); ss(announcementsKey, items); return n;
}
export function deleteAnnouncement(id: string) { ss(announcementsKey, getAnnouncements().filter((a) => a.id !== id)); }

export function getPolls(): Poll[] { return ls(pollsKey, []); }
export function createPoll(p: Omit<Poll, "id" | "created_at" | "votes">): Poll {
  const items = getPolls(); const n = { ...p, id: crypto.randomUUID(), votes: p.options.map(() => 0), created_at: new Date().toISOString() };
  items.unshift(n); ss(pollsKey, items); return n;
}
export function votePoll(pollId: string, optionIdx: number) {
  const items = getPolls(); const i = items.findIndex((p) => p.id === pollId);
  if (i >= 0 && items[i].active) { items[i].votes[optionIdx]++; ss(pollsKey, items); }
}
export function togglePoll(pollId: string) {
  const items = getPolls(); const i = items.findIndex((p) => p.id === pollId);
  if (i >= 0) { items[i].active = !items[i].active; ss(pollsKey, items); }
}
export function deletePoll(id: string) { ss(pollsKey, getPolls().filter((p) => p.id !== id)); }

export function getDeliveryStats() {
  const anns = getAnnouncements();
  return { total: anns.length, totalViews: anns.reduce((s, a) => s + (a.views || 0), 0), byAudience: {} as Record<string, number> };
}
