import { getRequests, getTemplates, type CertRequestJoined, type CertTemplate } from "@/lib/certificates";

export type LegacyCertificatesResult = {
  requests: CertRequestJoined[];
  templates: CertTemplate[];
  total: number;
};

export async function bridgeLegacyCertificates(filters?: {
  status?: string;
  student_id?: string;
  template_id?: string;
}): Promise<LegacyCertificatesResult> {
  const [requests, templates] = await Promise.all([
    getRequests(filters),
    getTemplates(),
  ]);
  return { requests, templates, total: requests.length };
}
