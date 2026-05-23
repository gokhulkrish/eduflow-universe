export type LeaveRequest = { id: string; employee: string; department: string; type: string; start_date: string; end_date: string; reason: string; status: string; applied_at: string; };
export type Holiday = { id: string; name: string; date: string; type: string; };

import { emitAppSync } from "@/lib/app-sync";

export const leaveRequestsKey = "eduflow_leave_requests";
export const holidaysKey = "eduflow_holidays";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getLeaveRequests(): LeaveRequest[] { return ls(leaveRequestsKey, []); }
export function createLeaveRequest(l: Omit<LeaveRequest, "id" | "applied_at">): LeaveRequest {
  const items = getLeaveRequests(); const n = { ...l, id: crypto.randomUUID(), applied_at: new Date().toISOString() };
  items.unshift(n); ss(leaveRequestsKey, items); return n;
}
export function updateLeaveRequest(id: string, status: string) {
  const items = getLeaveRequests(); const i = items.findIndex((l) => l.id === id); if (i >= 0) { items[i].status = status; ss(leaveRequestsKey, items); }
}

export function getHolidays(): Holiday[] { return ls(holidaysKey, []); }
export function addHoliday(h: Omit<Holiday, "id">): Holiday {
  const items = getHolidays(); const n = { ...h, id: crypto.randomUUID() };
  items.push(n); ss(holidaysKey, items); return n;
}
export function deleteHoliday(id: string) { ss(holidaysKey, getHolidays().filter((h) => h.id !== id)); }

export const LEAVE_TYPES = ["Sick", "Casual", "Annual", "Personal", "Maternity", "Paternity", "Other"];
export const LEAVE_DAYS: Record<string, number> = { Sick: 12, Casual: 12, Annual: 20, Personal: 5, Maternity: 90, Paternity: 15, Other: 5 };
export const DEPARTMENTS = ["Academic", "Admin", "Finance", "HR", "Transport", "Library", "Sports", "Management"];

export function getRemaining(employee: string, type: string): number {
  const used = getLeaveRequests().filter((l) => l.employee === employee && l.type === type && l.status !== "rejected").reduce((sum, l) => {
    const start = new Date(l.start_date); const end = new Date(l.end_date);
    return sum + Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  }, 0);
  return (LEAVE_DAYS[type] ?? 10) - used;
}

export function getUsageReport(department?: string) {
  const all = getLeaveRequests();
  const filtered = department ? all.filter((l) => l.department === department) : all;
  const total = filtered.length; const approved = filtered.filter((l) => l.status === "approved").length;
  const rejected = filtered.filter((l) => l.status === "rejected").length; const pending = filtered.filter((l) => l.status === "pending").length;
  const byType: Record<string, number> = {};
  LEAVE_TYPES.forEach((t) => byType[t] = filtered.filter((l) => l.type === t).length);
  return { total, approved, rejected, pending, byType };
}
