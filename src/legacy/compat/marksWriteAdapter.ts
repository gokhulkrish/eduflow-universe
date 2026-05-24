import { upsertMark } from '../../core/assessment/service';

export interface LegacyMarksPayload {
  tenant_id: string;
  term_id: string;
  component_id: string;
  subject_id: string;
  student_id: string;
  max_marks: number;
  marks: number;
  remarks?: string;
  actor_id: string;
}

export async function legacyUpsertMark(payload: LegacyMarksPayload) {
  await upsertMark({
    tenantId: payload.tenant_id,
    termId: payload.term_id,
    componentId: payload.component_id,
    subjectId: payload.subject_id,
    studentId: payload.student_id,
    rawMarks: payload.marks,
    maxMarks: payload.max_marks,
    remarks: payload.remarks,
    actorId: payload.actor_id,
  });
}
