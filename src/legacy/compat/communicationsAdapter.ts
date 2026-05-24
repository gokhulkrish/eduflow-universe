import { sendMessage, queueCampaign } from '../../core/communications/sender';

export async function legacySendFeeReminder(payload: {
  tenant_id: string;
  phone: string;
  template_code: string;
  context: Record<string, string | number | boolean | null | undefined>;
}) {
  return sendMessage({
    tenantId: payload.tenant_id,
    channel: 'sms',
    to: payload.phone,
    templateCode: payload.template_code,
    context: payload.context,
  });
}

export async function legacyQueueAttendanceAlert(payload: {
  tenant_id: string;
  template_code: string;
  audience: Record<string, unknown>;
  created_by?: string;
}) {
  return queueCampaign({
    tenantId: payload.tenant_id,
    name: 'Legacy Attendance Alert',
    templateCode: payload.template_code,
    audience: payload.audience as any,
    createdBy: payload.created_by,
  });
}
