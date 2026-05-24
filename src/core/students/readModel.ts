import type { StudentListFilter, StudentListItemDTO, StudentDetailDTO } from './dto';
import { supabase } from '../../integrations/supabase/client';

export async function listStudents(
  filter: StudentListFilter,
): Promise<StudentListItemDTO[]> {
  let query = supabase
    .from('students')
    .select(`
      id,
      admission_no,
      umis_id,
      first_name,
      last_name,
      gender,
      dob,
      status,
      enrollments!inner(
        grade_label,
        section_label,
        status
      )
    `);

  query = query.eq('institution_id', filter.tenantId);
  query = query.eq('enrollments.status', (filter.status || 'active') as any);

  if (filter.classId) {
    query = query.eq('enrollments.grade_label', filter.classId);
  }

  if (filter.sectionId) {
    query = query.eq('enrollments.section_label', filter.sectionId);
  }

  if (filter.search) {
    const term = `%${filter.search}%`;
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},admission_no.ilike.${term}`);
  }

  const { data, error } = await query
    .order('first_name', { ascending: true })
    .limit(500);

  if (error) {
    console.error('[readModel] listStudents failed:', error);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    admissionNo: row.admission_no ?? undefined,
    legacyUmisId: row.umis_id ?? undefined,
    fullName: [row.first_name, row.last_name].filter(Boolean).join(' '),
    className: row.enrollments?.[0]?.grade_label ?? undefined,
    sectionName: row.enrollments?.[0]?.section_label ?? undefined,
    gender: row.gender ?? undefined,
    dateOfBirth: row.dob ?? undefined,
  }));
}

export async function getStudentById(
  tenantId: string,
  id: string,
): Promise<StudentDetailDTO | null> {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      enrollments(
        grade_label,
        section_label,
        roll_number,
        status,
        joined_on,
        left_on,
        academic_year_label
      )
    `)
    .eq('id', id)
    .eq('institution_id', tenantId)
    .single();

  if (error || !data) {
    console.error('[readModel] getStudentById failed:', error);
    return null;
  }

  const row: any = data;
  const enrollment = row.enrollments?.[0];

  return {
    id: row.id,
    admissionNo: row.admission_no ?? undefined,
    legacyUmisId: row.umis_id ?? undefined,
    fullName: [row.first_name, row.last_name].filter(Boolean).join(' '),
    className: enrollment?.grade_label ?? undefined,
    sectionName: enrollment?.section_label ?? undefined,
    gender: row.gender ?? undefined,
    dateOfBirth: row.dob ?? undefined,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? undefined,
    status: enrollment?.status ?? row.status ?? 'active',
    joinedOn: enrollment?.joined_on ?? undefined,
    leftOn: enrollment?.left_on ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    bloodGroup: row.blood_group ?? undefined,
    nationality: row.nationality ?? undefined,
    community: row.community ?? undefined,
  };
}
