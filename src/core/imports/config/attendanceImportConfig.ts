import type { ImportContext, ImportEntityConfig, ImportValidationIssue } from '../types';
import type { AttendanceStatus } from '../../attendance/service';
import { markDailyAttendance } from '../../attendance/service';

interface AttendanceNormalizedRow {
  admissionNo?: string;
  legacyUmisId?: string;
  date: string;
  status: AttendanceStatus;
  period?: string;
}

function mapStatusFromLegacy(raw: Record<string, unknown>): AttendanceStatus {
  const v = String(raw['Status'] ?? raw['status'] ?? raw['Attendance'] ?? raw['Mark'] ?? 'present').trim().toLowerCase();
  if (['absent', 'a', 'no', 'n', 'false', '0', 'off'].includes(v)) return 'absent';
  if (['late', 'l', 'tardy', 'delayed'].includes(v)) return 'late';
  if (['half-day', 'halfday', 'half', 'h', 'hd'].includes(v)) return 'half_day';
  if (['od', 'onduty', 'on_duty', 'duty'].includes(v)) return 'od';
  return 'present';
}

function normalizeLegacy(raw: Record<string, unknown>): AttendanceNormalizedRow {
  return {
    admissionNo: String(raw['AdmissionNo'] ?? raw['admission_no'] ?? '').trim() || undefined,
    legacyUmisId: String(raw['UMIS_ID'] ?? raw['umis_id'] ?? '').trim() || undefined,
    date: String(raw['Date'] ?? raw['date'] ?? '').trim(),
    status: mapStatusFromLegacy(raw),
    period: String(raw['Period'] ?? raw['period'] ?? '').trim() || undefined,
  };
}

function normalizeLatest(raw: Record<string, unknown>): AttendanceNormalizedRow {
  return {
    admissionNo: String(raw['AdmissionNo'] ?? raw['admission_no'] ?? '').trim() || undefined,
    legacyUmisId: String(raw['LegacyUMIS'] ?? raw['legacy_umis_id'] ?? '').trim() || undefined,
    date: String(raw['Date'] ?? raw['date'] ?? '').trim(),
    status: (String(raw['Status'] ?? raw['attendance_status'] ?? 'present').trim() as AttendanceStatus),
    period: String(raw['Period'] ?? raw['period'] ?? '').trim() || undefined,
  };
}

export const attendanceImportConfig: ImportEntityConfig<AttendanceNormalizedRow> = {
  entityType: 'attendance',

  normalizeRow(raw, ctx) {
    if (ctx.templateVersion === 'umis-legacy-v1') {
      return normalizeLegacy(raw);
    }
    return normalizeLatest(raw);
  },

  validateRow(normalized): ImportValidationIssue[] {
    const issues: ImportValidationIssue[] = [];
    if (!normalized.admissionNo && !normalized.legacyUmisId) {
      issues.push({
        rowIndex: -1,
        fieldName: 'AdmissionNo',
        errorCode: 'MISSING_KEY',
        message: 'Either AdmissionNo or UMIS ID is required.',
      });
    }
    if (!normalized.date) {
      issues.push({
        rowIndex: -1,
        fieldName: 'Date',
        errorCode: 'REQUIRED',
        message: 'Date is required.',
      });
    }
    return issues;
  },

  async matchExisting(normalized, ctx) {
    const { supabase } = await import('../../../integrations/supabase/client');
    if (!normalized.admissionNo) return 'none';
    const { data } = await supabase
      .from('students')
      .select('id')
      .eq('admission_no', normalized.admissionNo)
      .maybeSingle();
    return data ? 'single' : 'none';
  },

  async applyRow(normalized, ctx) {
    const { supabase } = await import('../../../integrations/supabase/client');
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('admission_no', normalized.admissionNo)
      .maybeSingle();
    if (!student) throw new Error(`Student not found: ${normalized.admissionNo}`);

    await markDailyAttendance({
      tenantId: ctx.tenantId,
      studentId: student.id,
      date: normalized.date,
      status: normalized.status,
      actorId: ctx.batchId,
      force: true,
    });
  },
};
