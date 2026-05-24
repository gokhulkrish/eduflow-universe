import type { ImportContext, ImportEntityConfig, ImportValidationIssue } from '../types';
import { upsertMark } from '../../assessment/service';

export interface AssessmentNormalizedRow {
  studentKey?: string;
  termCode: string;
  subjectCode: string;
  componentCode: string;
  maxMarks: number;
  obtainedMarks: number;
}

function normalizeLegacy(raw: Record<string, unknown>): AssessmentNormalizedRow {
  return {
    studentKey: String(raw['AdmissionNo'] ?? raw['StudentName'] ?? '').trim() || undefined,
    termCode: String(raw['Term'] ?? raw['ExamName'] ?? raw['exam_name'] ?? '').trim(),
    subjectCode: String(raw['Subject'] ?? raw['subject'] ?? '').trim(),
    componentCode: String(raw['Component'] ?? raw['component'] ?? raw['ExamType'] ?? '').trim(),
    maxMarks: Number(raw['MaxMarks'] ?? raw['max_marks'] ?? raw['TotalMarks'] ?? 100),
    obtainedMarks: Number(raw['Marks'] ?? raw['marks'] ?? raw['MarksObtained'] ?? 0),
  };
}

function normalizeLatest(raw: Record<string, unknown>): AssessmentNormalizedRow {
  return {
    studentKey: String(raw['AdmissionNo'] ?? raw['admission_no'] ?? '').trim() || undefined,
    termCode: String(raw['TermCode'] ?? raw['term_code'] ?? '').trim(),
    subjectCode: String(raw['SubjectCode'] ?? raw['subject_code'] ?? '').trim(),
    componentCode: String(raw['ComponentCode'] ?? raw['component_code'] ?? '').trim(),
    maxMarks: Number(raw['MaxMarks'] ?? raw['max_marks'] ?? 100),
    obtainedMarks: Number(raw['ObtainedMarks'] ?? raw['obtained_marks'] ?? 0),
  };
}

export const assessmentImportConfig: ImportEntityConfig<AssessmentNormalizedRow> = {
  entityType: 'assessment',

  normalizeRow(raw, ctx) {
    if (ctx.templateVersion === 'umis-legacy-v1') {
      return normalizeLegacy(raw);
    }
    return normalizeLatest(raw);
  },

  validateRow(normalized) {
    const issues: ImportValidationIssue[] = [];
    if (!normalized.studentKey) {
      issues.push({ rowIndex: -1, fieldName: 'AdmissionNo', errorCode: 'REQUIRED', message: 'Student identifier is required.' });
    }
    if (!normalized.termCode) {
      issues.push({ rowIndex: -1, fieldName: 'Term', errorCode: 'REQUIRED', message: 'Term code is required.' });
    }
    if (!normalized.subjectCode) {
      issues.push({ rowIndex: -1, fieldName: 'Subject', errorCode: 'REQUIRED', message: 'Subject code is required.' });
    }
    if (!normalized.componentCode) {
      issues.push({ rowIndex: -1, fieldName: 'Component', errorCode: 'REQUIRED', message: 'Component code is required.' });
    }
    if (normalized.obtainedMarks < 0 || normalized.obtainedMarks > normalized.maxMarks) {
      issues.push({ rowIndex: -1, fieldName: 'Marks', errorCode: 'INVALID_MARKS', message: `Marks ${normalized.obtainedMarks} out of range 0–${normalized.maxMarks}.` });
    }
    return issues;
  },

  async matchExisting() {
    return 'none';
  },

  async applyRow(normalized, ctx) {
    const { supabase } = await import('../../../integrations/supabase/client');

    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('admission_no', normalized.studentKey)
      .maybeSingle();
    if (!student) throw new Error(`Student not found: ${normalized.studentKey}`);

    const { data: term } = await (supabase as any)
      .from('exam_terms')
      .select('id')
      .eq('institution_id', ctx.tenantId)
      .eq('code', normalized.termCode)
      .maybeSingle();
    if (!term) throw new Error(`Term not found: ${normalized.termCode}`);

    const { data: subject } = await supabase
      .from('subjects')
      .select('id')
      .eq('code', normalized.subjectCode)
      .maybeSingle();
    if (!subject) throw new Error(`Subject not found: ${normalized.subjectCode}`);

    const { data: component } = await (supabase as any)
      .from('exam_components')
      .select('id')
      .eq('term_id', term.id)
      .eq('code', normalized.componentCode)
      .maybeSingle();
    if (!component) throw new Error(`Component not found for term ${normalized.termCode}: ${normalized.componentCode}`);

    await upsertMark({
      tenantId: ctx.tenantId,
      termId: term.id,
      componentId: component.id,
      subjectId: subject.id,
      studentId: student.id,
      rawMarks: normalized.obtainedMarks,
      maxMarks: normalized.maxMarks,
      actorId: ctx.batchId,
    });
  },
};
