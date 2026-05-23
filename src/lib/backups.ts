import { emitAppSync } from "@/lib/app-sync";

export type BackupEntry = { id: string; name: string; size: string; tables: number; rows: number; encrypted: boolean; schedule: string; created_at: string; status: string; };

export const backupsKey = "eduflow_backups";
export const backupScheduleKey = "eduflow_backup_schedule";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getBackups(): BackupEntry[] { return ls(backupsKey, []); }

export function createBackup(name: string, encrypted = false): BackupEntry {
  const items = getBackups();
  const n: BackupEntry = { id: crypto.randomUUID(), name, size: `${(Math.random() * 5 + 0.5).toFixed(1)} MB`, tables: 24 + Math.floor(Math.random() * 8), rows: 5000 + Math.floor(Math.random() * 15000), encrypted, schedule: "manual", created_at: new Date().toISOString(), status: "completed" };
  items.unshift(n); ss(backupsKey, items); return n;
}

export function deleteBackup(id: string) { ss(backupsKey, getBackups().filter((b) => b.id !== id)); }

export function setSchedule(frequency: string) {
  localStorage.setItem(backupScheduleKey, frequency);
  emitAppSync(backupScheduleKey);
}

export function getSchedule(): string {
  return localStorage.getItem(backupScheduleKey) ?? "never";
}
