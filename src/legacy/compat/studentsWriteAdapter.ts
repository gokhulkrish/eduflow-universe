import {
  createStudent,
  updateStudent,
  deactivateStudent,
  type CreateStudentInput,
  type UpdateStudentInput,
  type DeactivateStudentInput,
} from '../../core/students/service';

export interface LegacyCreateStudentPayload {
  tenant_id: string;
  adm_no?: string;
  umis_id?: string;
  student_first_name: string;
  student_last_name?: string;
  class_id?: string;
  section_id?: string;
  gender?: string;
  dob?: string;
  joined_on?: string;
}

export interface LegacyUpdateStudentPayload extends LegacyCreateStudentPayload {
  id: string;
}

export interface LegacyDeactivateStudentPayload {
  tenant_id: string;
  id: string;
  left_on?: string;
}

function parseLegacyDateToISO(d?: string): string | undefined {
  if (!d) return undefined;
  const match = d.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  return d;
}

export async function legacyCreateStudent(payload: LegacyCreateStudentPayload): Promise<string> {
  const input: CreateStudentInput = {
    tenantId: payload.tenant_id,
    admissionNo: payload.adm_no,
    legacyUmisId: payload.umis_id,
    firstName: payload.student_first_name,
    lastName: payload.student_last_name,
    gender: mapLegacyGender(payload.gender),
    dateOfBirth: parseLegacyDateToISO(payload.dob),
    classId: payload.class_id,
    sectionId: payload.section_id,
    joinedOn: parseLegacyDateToISO(payload.joined_on),
  };
  return createStudent(input);
}

export async function legacyUpdateStudent(payload: LegacyUpdateStudentPayload): Promise<void> {
  const input: UpdateStudentInput = {
    tenantId: payload.tenant_id,
    id: payload.id,
    admissionNo: payload.adm_no,
    legacyUmisId: payload.umis_id,
    firstName: payload.student_first_name,
    lastName: payload.student_last_name,
    gender: mapLegacyGender(payload.gender) as any,
    dateOfBirth: parseLegacyDateToISO(payload.dob) ?? null,
    classId: payload.class_id,
    sectionId: payload.section_id,
    joinedOn: parseLegacyDateToISO(payload.joined_on) ?? null,
  };
  await updateStudent(input);
}

export async function legacyDeactivateStudent(payload: LegacyDeactivateStudentPayload): Promise<void> {
  const input: DeactivateStudentInput = {
    tenantId: payload.tenant_id,
    id: payload.id,
    leftOn: parseLegacyDateToISO(payload.left_on),
  };
  await deactivateStudent(input);
}

function mapLegacyGender(gender?: string): 'male' | 'female' | 'other' | undefined {
  if (!gender) return undefined;
  const g = gender.toLowerCase();
  if (g === 'male' || g === 'm') return 'male';
  if (g === 'female' || g === 'f') return 'female';
  return 'other';
}
