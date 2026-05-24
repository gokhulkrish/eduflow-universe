import type { AttendanceStatus } from '../../core/attendance/service';
import { markDailyAttendance } from '../../core/attendance/service';

export interface LegacyMarkAttendancePayload {
  tenant_id: string;
  student_id: string;
  date: string;
  status: string;
  actor_id: string;
}

function legacyStatusToNew(status: string): AttendanceStatus {
  switch (status.toUpperCase()) {
    case 'A': return 'absent';
    case 'L': return 'late';
    case 'H': return 'half_day';
    case 'OD': case 'O': return 'od';
    default: return 'present';
  }
}

function parseLegacyDateToISO(d: string): string {
  const match = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return d;
}

export async function legacyMarkAttendance(payload: LegacyMarkAttendancePayload) {
  await markDailyAttendance({
    tenantId: payload.tenant_id,
    studentId: payload.student_id,
    date: parseLegacyDateToISO(payload.date),
    status: legacyStatusToNew(payload.status),
    actorId: payload.actor_id,
  });
}
