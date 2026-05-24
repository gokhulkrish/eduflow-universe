// Patch 00 — Skeleton. Stub for legacy attendance compatibility.
// Implementation deferred — current flow uses core/attendance/service.ts directly.

export interface LegacyAttendanceFilter {
  classId?: string;
  sectionId?: string;
  date?: string;
  period?: number;
}

export interface LegacyAttendanceRecord {
  studentId: string;
  date: string;
  status: string;
  period: number;
}

export async function listAttendanceLegacyCompatible(
  _filter: LegacyAttendanceFilter,
): Promise<LegacyAttendanceRecord[]> {
  throw new Error("listAttendanceLegacyCompatible: not implemented — wired in a later patch");
}
