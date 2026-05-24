import { z } from 'zod';
import { supabase } from '../../integrations/supabase/client';
import {
  createStudent as legacyCreate,
  updateStudent as legacyUpdate,
  deactivateStudent as legacyDeactivate,
  type CreateStudentInput as LegacyCreateInput,
} from '../../../core/students/service';
import { isFeatureEnabled } from '../../lib/featureToggles';
import { writeAuditEntry } from '../../../core/audit/service';

export interface CreateStudentInput {
  tenantId: string;
  admissionNo?: string;
  legacyUmisId?: string;
  firstName: string;
  middleName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  classId?: string;
  sectionId?: string;
  joinedOn?: string;
}

export interface UpdateStudentInput {
  tenantId: string;
  id: string;
  admissionNo?: string | null;
  legacyUmisId?: string | null;
  firstName?: string;
  middleName?: string | null;
  lastName?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null;
  classId?: string | null;
  sectionId?: string | null;
  status?: 'active' | 'inactive' | 'promoted' | 'left';
  joinedOn?: string | null;
  leftOn?: string | null;
}

export interface DeactivateStudentInput {
  tenantId: string;
  id: string;
  leftOn?: string;
}

type WriteKind = 'create' | 'update' | 'deactivate';

export async function createStudent(input: CreateStudentInput): Promise<string> {
  if (!input.firstName) {
    throw new Error('firstName is required');
  }

  const payload: Record<string, string> = {
    firstName: input.firstName,
    admissionNo: input.admissionNo || `AUTO-${Date.now()}`,
    gender: input.gender || 'Other',
    grade: input.classId || '',
  };
  if (input.lastName) payload.lastName = input.lastName;
  if (input.dateOfBirth) payload.dob = input.dateOfBirth;
  if (input.middleName) payload.middleName = input.middleName;
  if (input.sectionId) payload.section = input.sectionId;

  const saved = await legacyCreate(payload as unknown as LegacyCreateInput);

  await syncLegacyAfterWrite('create', { ...input, id: saved.id });
  await logStudentWrite('core.student.created', saved.id, null, payload);

  return saved.id;
}

export async function updateStudent(input: UpdateStudentInput): Promise<void> {
  const { data: before } = await supabase
    .from('students')
    .select('*')
    .eq('id', input.id)
    .single();

  await legacyUpdate(input.id, {
    firstName: input.firstName,
    lastName: input.lastName,
    admissionNo: input.admissionNo,
  } as any);

  await syncLegacyAfterWrite('update', input);
  await logStudentWrite('core.student.updated', input.id, before as any, input);
}

export async function deactivateStudent(input: DeactivateStudentInput): Promise<void> {
  await legacyDeactivate(input.id);

  await syncLegacyAfterWrite('deactivate', input);
  await logStudentWrite('core.student.deactivated', input.id, null, { status: 'left' });
}

async function syncLegacyAfterWrite(kind: WriteKind, payload: any) {
  if (!isFeatureEnabled('useNewStudentWrites')) {
    return;
  }
}

async function logStudentWrite(action: string, entityId: string, before: any, after: any) {
  const { data: auth } = await supabase.auth.getUser();
  await writeAuditEntry({
    actorId: auth.user?.id ?? null,
    action,
    entity: 'students',
    entityId,
    before: before ?? undefined,
    after,
    source: 'native',
  }).catch(() => {});
}
