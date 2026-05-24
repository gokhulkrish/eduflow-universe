// Patch 00 — Skeleton. Stub for legacy communications compatibility.
// Implementation deferred — current flow uses core/comms/service.ts directly.

export interface LegacyMessageFilter {
  templateId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface LegacyMessageSummary {
  id: string;
  templateName: string;
  recipient: string;
  status: string;
  sentAt: string;
}

export async function getMessagesLegacyCompatible(
  _filter: LegacyMessageFilter,
): Promise<LegacyMessageSummary[]> {
  throw new Error("getMessagesLegacyCompatible: not implemented — wired in a later patch");
}
