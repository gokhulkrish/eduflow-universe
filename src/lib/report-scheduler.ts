export type ReportSchedule = {
  id: string;
  reportId: string;
  title: string;
  format: "csv" | "xlsx" | "pdf";
  frequency: "daily" | "weekly" | "monthly";
  nextRun: string;
  recipients: string;
  enabled: boolean;
  createdAt: string;
};

const STORAGE_KEY = "sms.report-schedules.v1";

function loadSchedules(): ReportSchedule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReportSchedule[]) : [];
  } catch {
    return [];
  }
}

function saveSchedules(schedules: ReportSchedule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

export function getSchedules(): ReportSchedule[] {
  return loadSchedules();
}

export function addSchedule(
  reportId: string,
  title: string,
  format: ReportSchedule["format"],
  frequency: ReportSchedule["frequency"],
  nextRun: string,
  recipients: string,
): ReportSchedule {
  const schedules = loadSchedules();
  const schedule: ReportSchedule = {
    id: crypto.randomUUID(),
    reportId,
    title,
    format,
    frequency,
    nextRun,
    recipients,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  schedules.push(schedule);
  saveSchedules(schedules);
  return schedule;
}

export function updateSchedule(id: string, updates: Partial<Omit<ReportSchedule, "id" | "createdAt">>): ReportSchedule | null {
  const schedules = loadSchedules();
  const idx = schedules.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  schedules[idx] = { ...schedules[idx], ...updates };
  saveSchedules(schedules);
  return schedules[idx];
}

export function removeSchedule(id: string) {
  const schedules = loadSchedules().filter((s) => s.id !== id);
  saveSchedules(schedules);
}

export function toggleSchedule(id: string): ReportSchedule | null {
  return updateSchedule(id, { enabled: !loadSchedules().find((s) => s.id === id)?.enabled });
}
