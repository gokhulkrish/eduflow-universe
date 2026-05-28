import { getRequests, getTemplates, type CertRequestJoined, type CertTemplate } from "@/lib/certificates";

export type LegacyCertificatesResult = {
  requests: CertRequestJoined[];
  templates: CertTemplate[];
  total: number;
};

export interface CertificateBridgeStats {
  totalTemplates: number;
  totalRequests: number;
  pendingApprovals: number;
  issuedCertificates: number;
  revokedCertificates: number;
  qrVerified: number;
}

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

export async function getCertificateBridgeStats(): Promise<CertificateBridgeStats> {
  const [requests, templates] = await Promise.all([
    getRequests(),
    getTemplates(),
  ]);
  
  const stats: CertificateBridgeStats = {
    totalTemplates: templates?.length ?? 0,
    totalRequests: requests?.length ?? 0,
    pendingApprovals: requests?.filter(r => r.status === "pending")?.length ?? 0,
    issuedCertificates: requests?.filter(r => r.status === "issued")?.length ?? 0,
    revokedCertificates: requests?.filter(r => r.status === "revoked")?.length ?? 0,
    qrVerified: requests?.filter(r => r.qr_code)?.length ?? 0,
  };
  
  return stats;
}

export function validateCertificateTemplate(template: Partial<CertTemplate>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!template.code?.trim()) errors.push("Template code is required");
  if (!template.name?.trim()) errors.push("Template name is required");
  if (!template.body?.trim()) errors.push("Template body/HTML is required");
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function bridgeLegacyCertificatesWorkflow() {
  return {
    statuses: ["pending", "approved", "issued", "revoked"],
    transitions: {
      pending: ["approved", "rejected"],
      approved: ["issued"],
      issued: ["revoked"],
      revoked: [],
      rejected: [],
    },
  };
}
