import { pool } from '@/db/pool';
import { renderTemplate } from './templateEngine';

export async function processQueuedMessages(limit = 100) {
  const client = await pool.connect();
  try {
    await client.query('begin');

    const queueRes = await client.query(
      `select q.id, q.institution_id, q.campaign_id, q.template_id, q.channel, q.to_address, q.payload,
              t.subject, t.body
       from public.message_queue q
       join public.message_templates t on t.id = q.template_id
       where q.status = 'queued'
         and (q.scheduled_at is null or q.scheduled_at <= now())
       order by q.created_at asc
       limit $1
       for update skip locked`,
      [limit],
    );

    for (const row of queueRes.rows) {
      try {
        const context = typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {});
        const payload = {
          subject: row.subject ? renderTemplate(row.subject, context) : null,
          body: renderTemplate(row.body, context),
        };

        await client.query(
          `update public.message_queue
           set status = 'sent', attempts = attempts + 1, processed_at = now(), updated_at = now()
           where id = $1`,
          [row.id],
        );

        await client.query(
          `insert into public.message_logs (institution_id, queue_id, campaign_id, template_id, channel, to_address, payload, status)
           values ($1,$2,$3,$4,$5,$6,$7,'sent')`,
          [row.institution_id, row.id, row.campaign_id, row.template_id, row.channel, row.to_address, JSON.stringify(payload)],
        );
      } catch (error: any) {
        await client.query(
          `update public.message_queue
           set status = 'failed', attempts = attempts + 1, last_error = $2, updated_at = now()
           where id = $1`,
          [row.id, error?.message ?? 'Unknown communication error'],
        );

        await client.query(
          `insert into public.message_logs (institution_id, queue_id, campaign_id, template_id, channel, to_address, payload, status, error_message)
           values ($1,$2,$3,$4,$5,$6,$7,'failed',$8)`,
          [row.institution_id, row.id, row.campaign_id, row.template_id, row.channel, row.to_address, JSON.stringify(row.payload), error?.message ?? 'Unknown communication error'],
        );
      }
    }

    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
