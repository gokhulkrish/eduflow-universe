import { listStudents, getStudentById } from '../../core/students/readModel';
import type { StudentListFilter } from '../../core/students/dto';

export interface LegacyStudentRow {
  id: string;
  adm_no: string | null;
  umis_id: string | null;
  name: string;
  class: string | null;
  section: string | null;
  gender: string | null;
  status: string;
}

export interface LegacyStudentDetail {
  id: string;
  adm_no: string | null;
  umis_id: string | null;
  name: string;
  class: string | null;
  section: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  nationality: string | null;
  community: string | null;
}

export async function legacyListStudents(
  filter: StudentListFilter,
): Promise<LegacyStudentRow[]> {
  const rows = await listStudents(filter);
  return rows.map((row) => ({
    id: row.id,
    adm_no: row.admissionNo ?? null,
    umis_id: row.legacyUmisId ?? null,
    name: row.fullName,
    class: row.className ?? null,
    section: row.sectionName ?? null,
    gender: row.gender ?? null,
    status: 'active',
  }));
}

export async function legacyGetStudentById(
  tenantId: string,
  id: string,
): Promise<LegacyStudentDetail | null> {
  const dto = await getStudentById(tenantId, id);
  if (!dto) return null;

  return {
    id: dto.id,
    adm_no: dto.admissionNo ?? null,
    umis_id: dto.legacyUmisId ?? null,
    name: dto.fullName,
    class: dto.className ?? null,
    section: dto.sectionName ?? null,
    status: dto.status,
    email: dto.email ?? null,
    phone: dto.phone ?? null,
    dob: dto.dateOfBirth ?? null,
    gender: dto.gender ?? null,
    blood_group: dto.bloodGroup ?? null,
    nationality: dto.nationality ?? null,
    community: dto.community ?? null,
  };
}
