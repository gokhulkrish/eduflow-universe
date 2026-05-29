import { getRequests, getTemplates, type CertRequestJoined, type CertTemplate, type CertRequest } from "@/lib/certificates";
import { emitAppSync } from "@/lib/app-sync";

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

const LEGACY_DB_NAME = "gctStudentPortalDB";
const LEGACY_DB_VERSION = 7;
const CERTIFICATE_LOG_STORE = "certificateLog";

export type LegacyCertificateRecord = {
  id: string;
  studentId: string;
  studentName?: string;
  type?: string;
  purpose?: string;
  dateRequired?: string;
  status?: string;
  certificateNo?: string;
  issuedBy?: string;
  issuedAt?: string;
  title?: string;
  moduleKey?: string;
  updatedAt?: string;
  revokedReason?: string;
};

function openLegacyDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(LEGACY_DB_NAME, LEGACY_DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

export async function readLegacyCertificatesFromIndexedDB(): Promise<LegacyCertificateRecord[]> {
  const db = await openLegacyDb();
  if (!db) return [];
  try {
    if (!db.objectStoreNames.contains(CERTIFICATE_LOG_STORE)) {
      db.close();
      return [];
    }
    const tx = db.transaction(CERTIFICATE_LOG_STORE, "readonly");
    const store = tx.objectStore(CERTIFICATE_LOG_STORE);
    const records = await new Promise<LegacyCertificateRecord[]>((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => resolve([]);
    });
    db.close();
    return records;
  } catch {
    db.close();
    return [];
  }
}

function legacyTypeToTemplateCode(type: string): string {
  const map: Record<string, string> = {
    "Bonafide": "BONAFIDE",
    "Transfer": "TRANSFER",
    "Conduct": "CONDUCT",
    "Study": "STUDY",
    "Character": "CHARACTER",
    "Leaving": "LEAVING",
  };
  return map[type] ?? type.toUpperCase().replace(/[^A-Z]+/g, "_");
}

function legacyStatusToUiStatus(status?: string): CertRequest["status"] {
  if (!status) return "requested";
  const s = status.toLowerCase();
  if (s === "issued") return "issued";
  if (s === "revoked") return "revoked";
  if (s === "approved") return "approved";
  return "requested";
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

export async function bridgeCertificatesFromLegacyDb(): Promise<LegacyCertificatesResult> {
  const [modernRequests, modernTemplates, legacyRecords] = await Promise.all([
    getRequests(),
    getTemplates(),
    readLegacyCertificatesFromIndexedDB(),
  ]);

  const bridged: CertRequestJoined[] = [...modernRequests];
  const legacyTplCodes = new Set(modernTemplates.map((t) => t.code));

  for (const rec of legacyRecords) {
    const tplCode = legacyTypeToTemplateCode(rec.type ?? "Bonafide");
    if (!legacyTplCodes.has(tplCode)) {
      const existingTpl = modernTemplates.find((t) => t.code === tplCode);
      if (!existingTpl) {
        modernTemplates.push({
          id: `legacy-tpl-${tplCode}`,
          code: tplCode,
          name: rec.type ?? `${tplCode} Certificate`,
          body: "",
          active: true,
          created_at: rec.issuedAt ?? new Date().toISOString(),
        });
        legacyTplCodes.add(tplCode);
      }
    }
    const existingReq = bridged.find((r) => r.qr_token === rec.id || (r as any).legacyId === rec.id);
    if (!existingReq) {
      const uiStatus = legacyStatusToUiStatus(rec.status);
      const id = `legacy-${rec.id}`;
      bridged.push({
        id,
        template_id: `legacy-tpl-${tplCode}`,
        student_id: rec.studentId,
        purpose: rec.purpose,
        status: uiStatus,
        approved_by: rec.issuedBy,
        approved_at: ["approved", "issued"].includes(uiStatus) ? (rec.issuedAt ?? null) : null,
        issued_at: uiStatus === "issued" ? (rec.issuedAt ?? null) : null,
        revoked_at: uiStatus === "revoked" ? (rec.updatedAt ?? null) : null,
        revoke_reason: rec.revokedReason ?? null,
        qr_token: rec.id,
        created_at: rec.issuedAt ?? new Date().toISOString(),
        updated_at: rec.updatedAt ?? rec.issuedAt ?? new Date().toISOString(),
        template_name: rec.type ?? null,
        template_code: tplCode,
        student_name: rec.studentName ?? null,
        admission_no: rec.studentId,
        grade: undefined,
        template_body: null,
        template_html: null,
        template: null,
        qr_base64: null,
        year: null,
        branch: null,
        academic_year: null,
        authority: null,
        no: rec.certificateNo ?? null,
        dated: rec.issuedAt ?? null,
        legacyId: rec.id,
      } as CertRequestJoined & { legacyId: string });
    }
  }

  return { requests: bridged, templates: modernTemplates, total: bridged.length };
}

export async function getCertificateBridgeStats(): Promise<CertificateBridgeStats> {
  const [requests, templates] = await Promise.all([
    getRequests(),
    getTemplates(),
  ]);
  
  const stats: CertificateBridgeStats = {
    totalTemplates: templates?.length ?? 0,
    totalRequests: requests?.length ?? 0,
    pendingApprovals: requests?.filter(r => r.status === "requested")?.length ?? 0,
    issuedCertificates: requests?.filter(r => r.status === "issued")?.length ?? 0,
    revokedCertificates: requests?.filter(r => r.status === "revoked")?.length ?? 0,
    qrVerified: requests?.filter(r => r.qr_base64)?.length ?? 0,
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

let certPatcherActive = false;

export function patchLegacyCertificatesFunctions() {
  if (certPatcherActive || typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;

  const origRender = w.renderCertificatesWorkspace;
  if (typeof origRender === "function") {
    w.renderCertificatesWorkspace = function (...args: unknown[]) {
      const router = (w as any).navigate || (w as any).openErpModuleWorkspace;
      if (typeof router === "function") {
        router("certificates", "overview");
      } else if ((w as any).location) {
        (w as any).location.assign("/certificates");
      }
      return origRender.apply(w, args);
    };
  }

  const origGenerate = w.generateCertificate;
  if (typeof origGenerate === "function") {
    w.generateCertificate = async function (...args: unknown[]) {
      const result = await origGenerate.apply(w, args);
      emitAppSync("sms.certificates.bridge");
      return result;
    };
  }

  certPatcherActive = true;
}

export function isCertPatcherActive() {
  return certPatcherActive;
}
