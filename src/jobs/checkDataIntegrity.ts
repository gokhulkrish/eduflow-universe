import { pool } from '@/db/pool';
import { logAudit } from '@/core/audit/log';

export async function checkDataIntegrity(tenantId: string) {
  const orphanLedgers = await pool.query(
    `select l.id
     from public.fee_ledgers l
     left join public.students s on s.id = l.student_id
     where l.institution_id = $1 and s.id is null`,
    [tenantId],
  );

  for (const row of orphanLedgers.rows) {
    await logAudit({
      tenantId,
      source: 'job',
      action: 'detect_orphan_fee_ledger',
      entityType: 'fee_ledger',
      entityId: row.id,
      meta: { severity: 'high' },
    });
  }

  const orphanAttendance = await pool.query(
    `select a.id
     from public.attendance a
     left join public.students s on s.id = a.student_id
     where s.id is null`,
  );

  for (const row of orphanAttendance.rows) {
    await logAudit({
      tenantId,
      source: 'job',
      action: 'detect_orphan_attendance',
      entityType: 'attendance',
      entityId: row.id,
      meta: { severity: 'high' },
    });
  }

  const orphanMarks = await pool.query(
    `select m.id
     from public.exam_marks m
     left join public.students s on s.id = m.student_id
     where m.institution_id = $1 and s.id is null`,
    [tenantId],
  );

  for (const row of orphanMarks.rows) {
    await logAudit({
      tenantId,
      source: 'job',
      action: 'detect_orphan_exam_mark',
      entityType: 'exam_mark',
      entityId: row.id,
      meta: { severity: 'high' },
    });
  }

  const orphanQueue = await pool.query(
    `select q.id
     from public.message_queue q
     left join public.message_templates t on t.id = q.template_id
     where q.institution_id = $1 and t.id is null`,
    [tenantId],
  );

  for (const row of orphanQueue.rows) {
    await logAudit({
      tenantId,
      source: 'job',
      action: 'detect_orphan_message_queue',
      entityType: 'message_queue',
      entityId: row.id,
      meta: { severity: 'medium' },
    });
  }
}
