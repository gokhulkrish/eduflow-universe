import { supabase } from '../../integrations/supabase/client';
import { pool } from '@/db/pool';
import { markAttendance, bulkUploadAttendance } from '../../../core/attendance/service';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'od' | 'excused' | 'holiday' | 'leave' | 'unknown';

export interface MarkDailyAttendanceInput {
  tenantId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  actorId: string;
  force?: boolean;
  sessionId?: string;
}

export interface BulkMarkDailyAttendanceInput {
  tenantId: string;
  date: string;
  rows: { studentId: string; status: AttendanceStatus }[];
  actorId: string;
  force?: boolean;
  sessionId?: string;
}

export interface AttendanceCorrectionInput {
  recordId: string;
  newStatus: AttendanceStatus;
  reason: string;
  correctedBy: string;
}

function isLocked(row: any, actorId: string, force?: boolean): boolean {
  if (force) return false;
  if (!row.locked_until) return false;
  const today = new Date();
  const lockedUntil = new Date(row.locked_until);
  return today > lockedUntil;
}

export async function markDailyAttendance(input: MarkDailyAttendanceInput): Promise<void> {
  const { data: existing } = await supabase
    .from('attendance')
    .select('id, status, locked_until')
    .eq('student_id', input.studentId)
    .eq('date', input.date)
    .maybeSingle();

  if (existing && isLocked(existing, input.actorId, input.force)) {
    throw new Error('Attendance locked for this date');
  }

  await markAttendance(input.studentId, input.date, input.status, undefined, input.actorId);

  await broadcastAttendanceUpdate({
    tenantId: input.tenantId,
    studentId: input.studentId,
    date: input.date,
    status: input.status,
  });
}

export async function bulkMarkDailyAttendance(input: BulkMarkDailyAttendanceInput): Promise<void> {
  for (const row of input.rows) {
    await markDailyAttendance({
      tenantId: input.tenantId,
      studentId: row.studentId,
      date: input.date,
      status: row.status,
      actorId: input.actorId,
      force: input.force,
      sessionId: input.sessionId,
    });
  }
}

export async function markAllPresent(input: { tenantId: string; date: string; studentIds: string[]; actorId: string }): Promise<void> {
  const records = input.studentIds.map(id => ({
    studentId: id,
    date: input.date,
    status: 'present' as AttendanceStatus,
  }));
  await bulkUploadAttendance(records, input.actorId);
}

export async function markAllAbsent(input: { tenantId: string; date: string; studentIds: string[]; actorId: string }): Promise<void> {
  const records = input.studentIds.map(id => ({
    studentId: id,
    date: input.date,
    status: 'absent' as AttendanceStatus,
  }));
  await bulkUploadAttendance(records, input.actorId);
}

export async function getDailyAttendance(date: string, grade?: string, section?: string) {
  let query = supabase
    .from('attendance')
    .select('id, student_id, date, period, status, remarks, marked_by, created_at, updated_at, session_id, original_status, corrected_by, corrected_at, correction_reason');

  if (grade) {
    query = query.eq('students.enrollments.grade_label', grade);
  }
  if (section) {
    query = query.eq('students.enrollments.section_label', section);
  }

  const { data, error } = await query
    .eq('date', date)
    .order('student_id');

  if (error) throw error;
  return data ?? [];
}

export async function correctAttendance(input: AttendanceCorrectionInput): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const current = await client.query(
      `select institution_id, status, original_status from public.attendance where id = $1 for update`,
      [input.recordId],
    );

    if (current.rows.length === 0) {
      throw new Error('Attendance record not found');
    }

    const row = current.rows[0];

    await client.query(
      `insert into public.attendance_adjustments
       (institution_id, record_id, changed_by, from_status, to_status, note)
       values ($1, $2, $3, $4, $5, $6)`,
      [row.institution_id, input.recordId, input.correctedBy, row.status, input.newStatus, input.reason],
    );

    await client.query(
      `update public.attendance
       set original_status = coalesce(original_status, status),
           status = $2,
           corrected_by = $3,
           corrected_at = now(),
           correction_reason = $4
       where id = $1`,
      [input.recordId, input.newStatus, input.correctedBy, input.reason],
    );

    await client.query('commit');

    supabase.channel('attendance-daily').send({
      type: 'broadcast',
      event: 'attendance:corrected',
      payload: { recordId: input.recordId, newStatus: input.newStatus },
    }).catch(() => {});
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

interface AttendanceUpdateEvent {
  tenantId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
}

async function broadcastAttendanceUpdate(event: AttendanceUpdateEvent): Promise<void> {
  try {
    const channel = supabase.channel('attendance-daily');
    await channel.send({
      type: 'broadcast',
      event: 'attendance:updated',
      payload: event,
    });
  } catch {
    // real-time channel not available
  }
}
