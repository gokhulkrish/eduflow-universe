import { pool } from '@/db/pool';
import { renderTemplate } from './templateEngine';
import { resolveAudience, type AudienceQuery } from './audience';

export type Channel = 'sms' | 'email' | 'push' | 'notice';

export interface SendMessageInput {
  tenantId: string;
  channel: Channel;
  to: string;
  templateCode: string;
  context: Record<string, string | number | boolean | null | undefined>;
}

export interface QueueCampaignInput {
  tenantId: string;
  name: string;
  templateCode: string;
  audience: AudienceQuery;
  createdBy?: string;
  scheduledAt?: string;
}

export async function sendMessage(input: SendMessageInput): Promise<void> {
  const tmplRes = await pool.query(
    `select id, subject, body, channel from public.message_templates
     where institution_id = $1 and code = $2 and is_active = true and deleted_at is null limit 1`,
    [input.tenantId, input.templateCode],
  );
  const tmpl = tmplRes.rows[0];
  if (!tmpl) throw new Error('Template not found');
  if (tmpl.channel !== input.channel) throw new Error('Template channel mismatch');

  const payload = {
    subject: tmpl.subject ? renderTemplate(tmpl.subject, input.context) : null,
    body: renderTemplate(tmpl.body, input.context),
  };

  await pool.query(
    `insert into public.message_logs (institution_id, template_id, channel, to_address, payload, status)
     values ($1,$2,$3,$4,$5,$6)`,
    [input.tenantId, tmpl.id, input.channel, input.to, JSON.stringify(payload), 'sent'],
  );
}

export async function queueCampaign(input: QueueCampaignInput): Promise<string> {
  const tmplRes = await pool.query(
    `select id, channel from public.message_templates
     where institution_id = $1 and code = $2 and is_active = true and deleted_at is null limit 1`,
    [input.tenantId, input.templateCode],
  );
  const tmpl = tmplRes.rows[0];
  if (!tmpl) throw new Error('Template not found');

  const campaignRes = await pool.query(
    `insert into public.message_campaigns (institution_id, name, template_id, audience_query, status, scheduled_at, created_by)
     values ($1,$2,$3,$4,'queued',$5,$6) returning id`,
    [input.tenantId, input.name, tmpl.id, JSON.stringify(input.audience), input.scheduledAt ?? null, input.createdBy ?? null],
  );
  const campaignId = campaignRes.rows[0].id as string;

  const audience = await resolveAudience(input.tenantId, input.audience);
  for (const recipient of audience) {
    const toAddress = tmpl.channel === 'email' ? recipient.primary_email : recipient.primary_phone;
    if (!toAddress) continue;

    await pool.query(
      `insert into public.message_queue (institution_id, campaign_id, template_id, channel, to_address, payload, status, scheduled_at)
       values ($1,$2,$3,$4,$5,$6,'queued',$7)`,
      [input.tenantId, campaignId, tmpl.id, tmpl.channel, toAddress, JSON.stringify(recipient), input.scheduledAt ?? null],
    );
  }

  return campaignId;
}
