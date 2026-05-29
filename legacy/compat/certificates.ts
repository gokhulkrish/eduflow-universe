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

const PENDING_BRIDGE_KEY = "sms.certificate.bridge.pending.v1";

type PendingBridgeEntry = {
  id: string;
  studentId: string;
  type: string;
  purpose: string;
  createdAt: string;
};

function addPendingBridgeEntry(entry: PendingBridgeEntry) {
  try {
    const raw = window.localStorage.getItem(PENDING_BRIDGE_KEY);
    const pending: PendingBridgeEntry[] = raw ? JSON.parse(raw) : [];
    if (!pending.some((p) => p.id === entry.id)) {
      pending.push(entry);
      window.localStorage.setItem(PENDING_BRIDGE_KEY, JSON.stringify(pending));
    }
  } catch { /* best-effort */ }
}

function readLegacyFormField(id: string): string {
  try {
    const el = (window as any).byId?.(id);
    return el?.value ?? "";
  } catch {
    return "";
  }
}

export function processLegacyGenerateCall(): void {
  const studentId = readLegacyFormField("certificateStudent");
  const type = readLegacyFormField("certificateType") || "Bonafide";
  const purpose = readLegacyFormField("certificatePurpose") || "";
  addPendingBridgeEntry({
    id: `pending-${Date.now()}`,
    studentId,
    type,
    purpose,
    createdAt: new Date().toISOString(),
  });
  emitAppSync("sms.certificates.bridge.pending");
  try {
    const showToast = (window as any).showToast;
    if (typeof showToast === "function") {
      showToast("Use the new Certificates page for workflow-based certificate requests.", "info");
    }
  } catch { /* best-effort */ }
}

export function consumePendingBridgeEntries(): PendingBridgeEntry[] {
  try {
    const raw = window.localStorage.getItem(PENDING_BRIDGE_KEY);
    if (!raw) return [];
    const entries: PendingBridgeEntry[] = JSON.parse(raw);
    window.localStorage.removeItem(PENDING_BRIDGE_KEY);
    return entries;
  } catch {
    return [];
  }
}

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
      processLegacyGenerateCall();
      const router = (w as any).navigate || (w as any).openErpModuleWorkspace;
      if (typeof router === "function") {
        router("certificates", "overview");
      } else {
        try { (w as any).location.assign("/certificates"); } catch {}
      }
      return origGenerate.apply(w, args);
    };
  }

  const origRevoke = w.revokeCertificate;
  if (typeof origRevoke === "function") {
    w.revokeCertificate = function (id: string) {
      emitAppSync("sms.certificates.bridge.revoke");
      return origRevoke.call(w, id);
    };
  }

  certPatcherActive = true;
}

export function isCertPatcherActive() {
  return certPatcherActive;
}

/**
 * Migration: converts pending bridge entries (written by legacy generateCertificate
 * redirect) into proper modern Supabase requests. Safe to call repeatedly — skips
 * already-migrated entries by checking localStorage dedup key.
 */
export async function migratePendingBridgeEntries(): Promise<{
  migrated: number;
  skipped: number;
  errors: string[];
}> {
  const entries = consumePendingBridgeEntries();
  if (entries.length === 0) return { migrated: 0, skipped: 0, errors: [] };

  const { saveTemplate, createRequest, approveRequest, issueRequest } = await import("@/lib/certificates");
  const { fetchStudentRegister } = await import("@/lib/student-records");
  const dedupKey = "sms.certificate.migrated.legacy.v1";

  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  let deduped: string[] = [];
  try { deduped = JSON.parse(window.localStorage.getItem(dedupKey) || "[]"); } catch {}

  const students = await fetchStudentRegister();
  const templates = await (await import("@/lib/certificates")).getTemplates();

  for (const entry of entries) {
    if (deduped.includes(entry.id)) { skipped++; continue; }

    try {
      const tplCode = legacyTypeToTemplateCode(entry.type);
      let tpl = templates.find((t) => t.code === tplCode);
      if (!tpl) {
        tpl = await saveTemplate({
          code: tplCode,
          name: `${entry.type} Certificate`,
          body: "",
          active: true,
        });
        templates.push(tpl);
      }

      const student = students.find(
        (s) => s.admission_no === entry.studentId || s.id === entry.studentId,
      );
      if (!student) {
        errors.push(`No student match for ${entry.studentId} (${entry.id})`);
        skipped++;
        continue;
      }

      const req = await createRequest({
        template_id: tpl.id,
        student_id: student.id,
        purpose: entry.purpose || null,
      });

      await approveRequest(req.id);
      await issueRequest(req.id);

      migrated++;
      deduped.push(entry.id);
    } catch (e: unknown) {
      errors.push(`Failed ${entry.id}: ${(e as Error)?.message ?? String(e)}`);
    }
  }

  try { window.localStorage.setItem(dedupKey, JSON.stringify(deduped)); } catch {}
  return { migrated, skipped, errors };
}
