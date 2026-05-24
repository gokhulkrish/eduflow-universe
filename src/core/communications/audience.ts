import { pool } from '@/db/pool';

export interface AudienceQuery {
  classIds?: string[];
  sectionIds?: string[];
  studentIds?: string[];
  role?: 'student' | 'parent' | 'staff';
}

export async function resolveAudience(tenantId: string, audience: AudienceQuery) {
  const params: any[] = [tenantId];
  const where: string[] = ['institution_id = $1'];
  let i = 1;

  if (audience.studentIds?.length) {
    params.push(audience.studentIds);
    where.push(`student_id = any($${++i})`);
  }

  if (audience.classIds?.length) {
    params.push(audience.classIds);
    where.push(`class_id = any($${++i})`);
  }

  if (audience.sectionIds?.length) {
    params.push(audience.sectionIds);
    where.push(`section_id = any($${++i})`);
  }

  const query = `
    select student_id, full_name, primary_phone, primary_email
    from public.student_contact_view
    where ${where.join(' and ')}
  `;

  const res = await pool.query(query, params);
  return res.rows;
}
