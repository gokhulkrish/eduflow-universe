import { emitAppSync } from "@/lib/app-sync";

export type LiveSession = {
  id: string; title: string; description: string | null; subject_id: string | null; class_id: string | null;
  meeting_url: string | null; date: string; start_time: string; end_time: string | null;
  host_id: string | null; status: string; recording_url: string | null; created_at: string;
};
export type LiveSessionJoined = LiveSession & { subject_name?: string; class_name?: string; host_name?: string; };

export const liveSessionsKey = "eduflow_live_sessions";

export function getLocalSessions(): LiveSessionJoined[] {
  try { return JSON.parse(localStorage.getItem(liveSessionsKey) ?? "[]"); } catch { return []; }
}

export function saveLocalSession(session: Omit<LiveSession, "id" | "created_at"> & { id?: string }): LiveSessionJoined {
  const sessions = getLocalSessions();
  if (session.id) {
    const idx = sessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) { sessions[idx] = { ...sessions[idx], ...session }; localStorage.setItem(liveSessionsKey, JSON.stringify(sessions)); emitAppSync(liveSessionsKey); return sessions[idx]; }
  }
  const newS = { ...session, id: crypto.randomUUID(), created_at: new Date().toISOString() } as LiveSessionJoined;
  sessions.unshift(newS);
  localStorage.setItem(liveSessionsKey, JSON.stringify(sessions));
  emitAppSync(liveSessionsKey);
  return newS;
}

export function deleteLocalSession(id: string): void {
  const sessions = getLocalSessions().filter((s) => s.id !== id);
  localStorage.setItem(liveSessionsKey, JSON.stringify(sessions));
  emitAppSync(liveSessionsKey);
}
