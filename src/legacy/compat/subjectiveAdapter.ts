import { recordObservation } from '../../core/scoring/service';

export interface LegacyObservationPayload {
  tenant_id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  rubric_code: string;
  comment?: string;
  is_disruptive?: string;
  participates_well?: string;
  homework_submitted?: string;
}

function toBooleanFlag(val: unknown): boolean | undefined {
  if (val === undefined || val === null) return undefined;
  const s = String(val).toLowerCase();
  return s === 'y' || s === 'yes' || s === '1' || s === 'true';
}

function parseLegacyDateToISO(d: string): string {
  const match = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return d;
}

export async function legacyRecordObservation(payload: LegacyObservationPayload): Promise<void> {
  const rawPayload: Record<string, unknown> = {
    is_disruptive: toBooleanFlag(payload.is_disruptive),
    participates_well: toBooleanFlag(payload.participates_well),
    homework_submitted: toBooleanFlag(payload.homework_submitted),
  };

  await recordObservation({
    tenantId: payload.tenant_id,
    studentId: payload.student_id,
    teacherId: payload.teacher_id,
    rubricCode: payload.rubric_code,
    observedOn: parseLegacyDateToISO(payload.date),
    comment: payload.comment,
    rawPayload,
  });
}
