import type { ImportContext, ImportEntityConfig, ImportValidationIssue } from '../types';

export interface StudentNormalizedRow {
  admissionNo?: string;
  legacyUmisId?: string;
  firstName: string;
  lastName?: string;
  classCode?: string;
  sectionCode?: string;
  dateOfBirth?: string;
  guardianPhone?: string;
  email?: string;
}

function normalizeLegacy(raw: Record<string, unknown>): StudentNormalizedRow {
  return {
    admissionNo: String(raw['AdmissionNo'] ?? raw['admission_no'] ?? raw['Admission No'] ?? '').trim() || undefined,
    legacyUmisId: String(raw['UMIS_ID'] ?? raw['umis_id'] ?? raw['umisId'] ?? '').trim() || undefined,
    firstName: String(raw['FirstName'] ?? raw['first_name'] ?? raw['firstName'] ?? '').trim(),
    lastName: String(raw['LastName'] ?? raw['last_name'] ?? raw['lastName'] ?? '').trim() || undefined,
    classCode: String(raw['Class'] ?? raw['class'] ?? raw['Grade'] ?? raw['grade'] ?? '').trim() || undefined,
    sectionCode: String(raw['Section'] ?? raw['section'] ?? raw['Sec'] ?? raw['sec'] ?? '').trim() || undefined,
    dateOfBirth: String(raw['DOB'] ?? raw['dob'] ?? raw['DateOfBirth'] ?? raw['date_of_birth'] ?? '').trim() || undefined,
  };
}

function normalizeLatest(raw: Record<string, unknown>): StudentNormalizedRow {
  return {
    admissionNo: String(raw['AdmissionNo'] ?? raw['admission_no'] ?? '').trim() || undefined,
    legacyUmisId: String(raw['LegacyUMIS'] ?? raw['legacy_umis_id'] ?? '').trim() || undefined,
    firstName: String(raw['FirstName'] ?? raw['first_name'] ?? '').trim(),
    lastName: String(raw['LastName'] ?? raw['last_name'] ?? '').trim() || undefined,
    classCode: String(raw['ClassCode'] ?? raw['class_code'] ?? '').trim() || undefined,
    sectionCode: String(raw['SectionCode'] ?? raw['section_code'] ?? '').trim() || undefined,
    dateOfBirth: String(raw['DateOfBirth'] ?? raw['date_of_birth'] ?? '').trim() || undefined,
    guardianPhone: String(raw['GuardianPhone'] ?? raw['guardian_phone'] ?? '').trim() || undefined,
    email: String(raw['Email'] ?? raw['email'] ?? '').trim() || undefined,
  };
}

export const studentsImportConfig: ImportEntityConfig<StudentNormalizedRow> = {
  entityType: 'students',

  normalizeRow(raw, ctx) {
    if (ctx.templateVersion === 'umis-legacy-v1' || ctx.templateVersion.startsWith('umis-')) {
      return normalizeLegacy(raw);
    }
    return normalizeLatest(raw);
  },

  validateRow(normalized, ctx) {
    const issues: ImportValidationIssue[] = [];
    if (!normalized.admissionNo && !normalized.legacyUmisId) {
      issues.push({
        rowIndex: -1,
        fieldName: 'AdmissionNo',
        errorCode: 'MISSING_KEY',
        message: 'Either AdmissionNo or UMIS ID must be provided.',
      });
    }
    if (!normalized.firstName) {
      issues.push({
        rowIndex: -1,
        fieldName: 'FirstName',
        errorCode: 'REQUIRED',
        message: 'FirstName is required.',
      });
    }
    if (ctx.schemaVersion === 'core-v2' && normalized.guardianPhone && !/^\+?\d{7,15}$/.test(normalized.guardianPhone)) {
      issues.push({
        rowIndex: -1,
        fieldName: 'GuardianPhone',
        errorCode: 'INVALID_PHONE',
        message: 'Guardian phone must be 7-15 digits.',
      });
    }
    return issues;
  },

  async matchExisting(normalized, ctx) {
    const { supabase } = await import('../../../integrations/supabase/client');
    const query = supabase.from('students').select('id');
    if (normalized.admissionNo) {
      query.eq('admission_no', normalized.admissionNo);
    } else if (normalized.legacyUmisId) {
      query.eq('umis_id', normalized.legacyUmisId);
    } else {
      return 'none';
    }
    const { data } = await query.maybeSingle();
    return data ? 'single' : 'none';
  },

  async applyRow(normalized, ctx) {
    const { supabase } = await import('../../../integrations/supabase/client');
    const payload: Record<string, any> = {
      first_name: normalized.firstName,
      last_name: normalized.lastName || null,
      admission_no: normalized.admissionNo || null,
      umis_id: normalized.legacyUmisId || null,
      dob: normalized.dateOfBirth || null,
    };
    if (normalized.email) payload.email = normalized.email;

    const existing = await supabase
      .from('students')
      .select('id')
      .eq('admission_no', normalized.admissionNo)
      .maybeSingle();

    if (existing.data) {
      await (supabase.from('students') as any).update(payload).eq('id', existing.data.id);
    } else {
      await (supabase.from('students') as any).insert(payload);
    }
  },
};
