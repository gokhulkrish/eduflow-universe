import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { fetchStudentRegister } from "@/lib/student-records";
import { tableExists, tablesExist } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";
import { emitAppSync } from "@/lib/app-sync";

type TemplateRow = Tables<"certificate_templates">;
type RequestRow = Tables<"certificate_requests">;
type CertificateRow = Tables<"certificates">;

type UiStatus = "requested" | "approved" | "issued" | "revoked";
type DbRequestStatus = RequestRow["status"];

const toTemplateCode = (template: Pick<TemplateRow, "name" | "id">): string =>
  template.name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24) || template.id.slice(0, 8).toUpperCase();

const toUiStatus = (status: DbRequestStatus): UiStatus => {
  if (status === "verified") return "issued";
  if (status === "agreed" || status === "appealed") return "approved";
  if (status === "rejected") return "revoked";
  return "requested";
};

const toDbStatus = (status: UiStatus): DbRequestStatus => {
  if (status === "issued") return "verified";
  if (status === "approved") return "agreed";
  if (status === "revoked") return "rejected";
  return "pending";
};

export type CertTemplate = {
  id: string;
  code: string;
  name: string;
  body: string;
  active: boolean;
  created_at: string;
  institution_id?: string;
};

export type CertRequest = {
  id: string;
  template_id: string;
  student_id: string;
  purpose: string | null;
  status: UiStatus;
  approved_by: string | null;
  approved_at: string | null;
  issued_at: string | null;
  revoked_at: string | null;
  revoke_reason: string | null;
  qr_token: string;
  created_at: string;
  updated_at: string;
  /** Current workflow stage (multi-stage pipeline) — derived from comments JSON */
  currentStage?: WorkflowStageId | null;
  /** Full workflow state including history */
  workflowState?: WorkflowState | null;
};

export type CertRequestJoined = CertRequest & {
  template_name?: string;
  template_code?: string;
  student_name?: string;
  admission_no?: string;
  grade?: string;
  // Legacy / joined fields used by the UI and legacy templates
  template_body?: string | null;
  template_html?: string | null;
  template?: string | null;
  qr_base64?: string | null;
  year?: string | null;
  branch?: string | null;
  academic_year?: string | null;
  section?: string | null;
  authority?: string | null;
  no?: string | null;
  dated?: string | null;
};

export type CertRecord = {
  id: string;
  request_id: string | null;
  student_id: string;
  student_name?: string;
  template_name?: string;
  template_code?: string;
  certificate_no: string;
  issued_on: string;
  issued_by: string | null;
  verification_code: string;
  qr_token: string;
  status: string;
};

const normalizeTemplate = (row: TemplateRow): CertTemplate => ({
  id: row.id,
  code: toTemplateCode(row),
  name: row.name,
  body: row.template_html,
  active: row.status === "active",
  created_at: row.created_at,
  institution_id: row.institution_id,
});

const normalizeRequest = (row: RequestRow, issued?: CertificateRow | null): CertRequest => {
  const status = toUiStatus(row.status);
  const ws = parseWorkflowState(row.comments);
  return {
    id: row.id,
    template_id: row.template_id,
    student_id: row.student_id,
    purpose: row.purpose,
    status,
    approved_by: null,
    approved_at: status === "approved" || status === "issued" ? row.updated_at : null,
    issued_at: issued?.issued_on ?? (status === "issued" ? row.updated_at : null),
    revoked_at: status === "revoked" ? row.updated_at : null,
    revoke_reason: status === "revoked" ? row.comments : null,
    qr_token: row.qr_token,
    created_at: row.created_at,
    updated_at: row.updated_at,
    currentStage: ws?.currentStage ?? getCurrentStageId(row.status, row.comments),
    workflowState: ws,
  };
};

async function getDefaultInstitutionId(): Promise<string> {
  if (!(await tableExists("institutions"))) {
    throw new Error("Missing institutions table — run base migrations first");
  }

  const { data, error } = await supabase
    .from("institutions")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.id) throw new Error("Create an institution before saving certificate templates");
  return data.id;
}

async function getCertificatesByRequestIds(ids: string[]): Promise<Map<string, CertificateRow>> {
  if (ids.length === 0 || !(await tableExists("certificates"))) return new Map();
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .in("request_id", ids);
  if (error) throw error;

  const map = new Map<string, CertificateRow>();
  for (const row of data ?? []) {
    if (row.request_id && !map.has(row.request_id)) map.set(row.request_id, row);
  }
  return map;
}

export async function getTemplates(): Promise<CertTemplate[]> {
  if (!(await tableExists("certificate_templates"))) return [];
  const { data, error } = await supabase
    .from("certificate_templates")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []).map(normalizeTemplate);
}

export async function getTemplate(id: string): Promise<CertTemplate | null> {
  if (!(await tableExists("certificate_templates"))) return null;
  const { data, error } = await supabase
    .from("certificate_templates")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return normalizeTemplate(data);
}

export async function saveTemplate(
  tpl: Omit<CertTemplate, "id" | "created_at"> & { id?: string }
): Promise<CertTemplate> {
  if (!(await tableExists("certificate_templates"))) {
    throw new Error("Run the certificates migration first");
  }

  const payload = {
    name: tpl.name,
    template_html: tpl.body,
    status: tpl.active ? "active" : "inactive",
  } as const;

  if (tpl.id) {
    const { data, error } = await supabase
      .from("certificate_templates")
      .update(payload)
      .eq("id", tpl.id)
      .select("*")
      .single();
    if (error) throw error;
    return normalizeTemplate(data);
  }

  const { data, error } = await supabase
    .from("certificate_templates")
    .insert({
      ...payload,
      institution_id: tpl.institution_id ?? (await getDefaultInstitutionId()),
      variables: [],
    })
    .select("*")
    .single();
  if (error) throw error;
  return normalizeTemplate(data);
}

export async function deleteTemplate(id: string): Promise<void> {
  if (!(await tableExists("certificate_templates"))) return;
  const { error } = await supabase.from("certificate_templates").delete().eq("id", id);
  if (error) throw error;
}

export async function seedDefaultTemplates(): Promise<number> {
  const { DEFAULT_TEMPLATES } = await import("@/lib/certificate-styles");
  if (!(await tableExists("certificate_templates"))) return 0;

  const { data: existing } = await supabase
    .from("certificate_templates")
    .select("name");

  const existingNames = new Set((existing ?? []).map((r) => r.name));

  // resolve institution_id once
  let institutionId: string | undefined;
  try {
    institutionId = await getDefaultInstitutionId();
  } catch {
    return 0; // no institution yet, can't seed
  }

  let seeded = 0;

  for (const tpl of DEFAULT_TEMPLATES) {
    if (existingNames.has(tpl.name)) {
      // Update existing template body so QR and other improvements take effect
      await supabase
        .from("certificate_templates")
        .update({ template_html: tpl.body })
        .eq("name", tpl.name)
        .eq("institution_id", institutionId);
      continue;
    }
    const { error } = await supabase.from("certificate_templates").insert({
      name: tpl.name,
      template_html: tpl.body,
      status: "active",
      institution_id: institutionId,
      variables: [],
    });
    if (!error) seeded++;
  }

  return seeded;
}

let _templatesSeeded = false;

export async function getRequests(options?: {
  status?: string;
  student_id?: string;
  template_id?: string;
}): Promise<CertRequestJoined[]> {
  if (!(await tableExists("certificate_requests"))) return [];
  if (!_templatesSeeded) {
    _templatesSeeded = true;
    try { await seedDefaultTemplates(); } catch { /* non-critical */ }
  }
  let q = supabase.from("certificate_requests").select("*").order("created_at", { ascending: false });
  if (options?.status) q = q.eq("status", toDbStatus(options.status as UiStatus));
  if (options?.student_id) q = q.eq("student_id", options.student_id);
  if (options?.template_id) q = q.eq("template_id", options.template_id);
  const { data, error } = await q;
  if (error) throw error;

  const rows = data ?? [];
  const [templates, students, issuedMap] = await Promise.all([
    getTemplates(),
    fetchStudentRegister(),
    getCertificatesByRequestIds(rows.map((row) => row.id)),
  ]);
  const tplMap = new Map(templates.map((t) => [t.id, t]));
  const stuMap = new Map(students.map((s) => [s.id, s]));

  return rows.map((row) => {
    const normalized = normalizeRequest(row, issuedMap.get(row.id));
    const tpl = tplMap.get(row.template_id);
    const stu = stuMap.get(row.student_id);
    return {
      ...normalized,
      template_name: tpl?.name,
      template_code: tpl?.code,
      template_body: tpl?.body ?? null,
      template_html: tpl?.body ?? null,
      template: tpl?.name ?? null,
      student_name: stu?.display_name,
      admission_no: stu?.admission_no,
      grade: stu?.grade ?? undefined,
      year: stu?.grade ?? null,
      branch: stu?.stream ?? null,
      academic_year: stu?.academic_year ?? null,
      section: stu?.section ?? null,
    };
  });
}

export async function createRequest(req: {
  template_id: string;
  student_id: string;
  purpose?: string | null;
}): Promise<CertRequest> {
  if (!(await tableExists("certificate_requests"))) {
    throw new Error("Run the certificates migration first");
  }
  const { data, error } = await supabase
    .from("certificate_requests")
    .insert({
      template_id: req.template_id,
      student_id: req.student_id,
      purpose: req.purpose ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return normalizeRequest(data);
}

export async function approveRequest(id: string): Promise<CertRequest> {
  if (!(await tableExists("certificate_requests"))) throw new Error("Run the certificates migration first");
  const { data, error } = await supabase
    .from("certificate_requests")
    .update({ status: "agreed", comments: "Approved for issuance" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeRequest(data);
}

async function createIssuedCertificate(
  row: RequestRow,
  numberingFormat?: string
): Promise<CertificateRow | null> {
  if (!(await tablesExist(["certificates", "certificate_templates"]))) return null;

  const { data: existing, error: existingError } = await supabase
    .from("certificates")
    .select("*")
    .eq("request_id", row.id)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const template = await getTemplate(row.template_id);
  const { data: auth } = await supabase.auth.getUser();

  // Generate certificate number using the configured format
  const fmt = numberingFormat ?? "CERT-{year}-{seq:05d}";
  // Get next sequence number
  const { count } = await supabase
    .from("certificates")
    .select("*", { count: "exact", head: true });
  const nextSeq = (count ?? 0) + 1;

  const { generateCertificateNumber } = await import("@/lib/certificate-styles");
  const certificateNo = generateCertificateNumber(fmt, nextSeq, {
    type: template?.code ?? "CERT",
    branch: "",
  });

  const verificationCode = row.qr_token || generateId().replace(/-/g, "");

  const { data, error } = await supabase
    .from("certificates")
    .insert({
      request_id: row.id,
      student_id: row.student_id,
      template_id: row.template_id,
      certificate_no: certificateNo,
      issued_by: auth.user?.id ?? null,
      verification_code: verificationCode,
      content_snapshot: template?.body ?? "",
      meta: { request_qr_token: row.qr_token },
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function issueRequest(id: string, numberingFormat?: string): Promise<CertRequest> {
  if (!(await tableExists("certificate_requests"))) throw new Error("Run the certificates migration first");
  const { data, error } = await supabase
    .from("certificate_requests")
    .update({ status: "verified", comments: "Issued" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  const issued = await createIssuedCertificate(data, numberingFormat);
  return normalizeRequest(data, issued);
}

export async function revokeRequest(id: string, reason: string): Promise<CertRequest> {
  if (!(await tableExists("certificate_requests"))) throw new Error("Run the certificates migration first");
  const { data, error } = await supabase
    .from("certificate_requests")
    .update({ status: "rejected", comments: reason })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeRequest(data);
}

export async function deleteRequest(id: string): Promise<void> {
  if (!(await tableExists("certificate_requests"))) return;
  const { error } = await supabase.from("certificate_requests").delete().eq("id", id);
  if (error) throw error;
}

export async function verifyByQr(qrToken: string): Promise<CertRequestJoined | null> {
  if (!(await tableExists("certificate_requests"))) return null;
  const { data, error } = await supabase
    .from("certificate_requests")
    .select("*")
    .eq("qr_token", qrToken)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const [tpl, students, issuedMap] = await Promise.all([
    getTemplate(data.template_id),
    fetchStudentRegister(),
    getCertificatesByRequestIds([data.id]),
  ]);
  const stu = students.find((s) => s.id === data.student_id);
  return {
    ...normalizeRequest(data, issuedMap.get(data.id)),
    template_name: tpl?.name,
    template_code: tpl?.code,
    template_body: tpl?.body ?? null,
    template_html: tpl?.body ?? null,
    template: tpl?.name ?? null,
    student_name: stu?.display_name,
    admission_no: stu?.admission_no,
    grade: stu?.grade ?? undefined,
    year: stu?.grade ?? null,
    branch: stu?.stream ?? null,
    academic_year: stu?.academic_year ?? null,
    section: stu?.section ?? null,
  };
}

export async function lookupByCertificateNo(
  certificateNo: string
): Promise<CertRequestJoined | null> {
  if (!(await tablesExist(["certificates", "certificate_requests"]))) return null;
  const { data: cert, error: certErr } = await supabase
    .from("certificates")
    .select("request_id, student_id, template_id, certificate_no, issued_on")
    .eq("certificate_no", certificateNo)
    .maybeSingle();
  if (certErr) throw certErr;
  if (!cert) return null;

  const { data: req, error: reqErr } = await supabase
    .from("certificate_requests")
    .select("*")
    .eq("id", cert.request_id)
    .maybeSingle();
  if (reqErr) throw reqErr;
  if (!req) return null;

  const [tpl, students, issuedMap] = await Promise.all([
    getTemplate(cert.template_id),
    fetchStudentRegister(),
    getCertificatesByRequestIds([req.id]),
  ]);
  const stu = students.find((s) => s.id === cert.student_id);
  return {
    ...normalizeRequest(req, issuedMap.get(req.id)),
    template_name: tpl?.name,
    template_code: tpl?.code,
    template_body: tpl?.body ?? null,
    template_html: tpl?.body ?? null,
    template: tpl?.name ?? null,
    student_name: stu?.display_name,
    admission_no: stu?.admission_no,
    grade: stu?.grade ?? undefined,
    year: stu?.grade ?? null,
    branch: stu?.stream ?? null,
    academic_year: stu?.academic_year ?? null,
    section: stu?.section ?? null,
    no: cert.certificate_no,
  };
}

export async function bulkGenerateRequests(
  templateId: string,
  studentIds: string[],
  purpose?: string
): Promise<CertRequest[]> {
  if (!(await tableExists("certificate_requests"))) {
    throw new Error("Run the certificates migration first");
  }
  const inserts = studentIds.map((sid) => ({
    template_id: templateId,
    student_id: sid,
    purpose: purpose ?? null,
    status: "agreed" as const,
    comments: "Bulk approved for issuance",
  }));
  const { data, error } = await supabase.from("certificate_requests").insert(inserts).select("*");
  if (error) throw error;
  return (data ?? []).map((row) => normalizeRequest(row));
}

export async function bulkIssue(ids: string[], numberingFormat?: string): Promise<void> {
  if (!(await tableExists("certificate_requests"))) return;
  const { data, error } = await supabase
    .from("certificate_requests")
    .update({ status: "verified", comments: "Bulk issued" })
    .in("id", ids)
    .select("*");
  if (error) throw error;
  await Promise.all((data ?? []).map((row) => createIssuedCertificate(row, numberingFormat)));
}

export const STATUS_STEPS = ["requested", "approved", "issued", "revoked"] as const;

export function getNextStatus(current: string): string | null {
  const idx = STATUS_STEPS.indexOf(current as typeof STATUS_STEPS[number]);
  if (idx < 0 || idx >= STATUS_STEPS.length - 1) return null;
  return STATUS_STEPS[idx + 1];
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    requested: "bg-muted text-foreground border-border/40",
    approved: "bg-primary/15 text-primary border-primary/30",
    issued: "bg-success/15 text-success border-success/30",
    revoked: "bg-destructive/15 text-destructive border-destructive/30",
  };
  return map[status] ?? "bg-muted text-muted-foreground";
}

// ════════════════════════════════════════════════════════════
// Multi-Stage Workflow (TN e-Sevai style)
// Stages: hod_review → office_review → principal_review → issuance → delivery
// State is stored as JSON in the `comments` field — no migration needed.
// ════════════════════════════════════════════════════════════

export type WorkflowStageId =
  | "hod_review"
  | "office_review"
  | "principal_review"
  | "issuance"
  | "delivery";

export type WorkflowStageDef = {
  id: WorkflowStageId;
  label: string;
  roles: string[];
  description: string;
};

export const WORKFLOW_STAGES: WorkflowStageDef[] = [
  { id: "hod_review", label: "HOD Review", roles: ["hod"], description: "Department head verifies purpose & eligibility" },
  { id: "office_review", label: "Office Verification", roles: ["staff", "admin"], description: "Office checks fee clearance & records" },
  { id: "principal_review", label: "Principal Approval", roles: ["principal"], description: "Final authority approves issuance" },
  { id: "issuance", label: "Issuance", roles: ["certificate", "admin"], description: "Certificate is generated & signed" },
  { id: "delivery", label: "Delivery", roles: ["student", "staff"], description: "Certificate delivered & acknowledged" },
];

export type WorkflowAction = {
  stage: WorkflowStageId;
  action: "submit" | "approve" | "reject" | "issue" | "deliver";
  by?: string;
  at: string;
  reason?: string;
};

export type WorkflowState = {
  currentStage: WorkflowStageId;
  history: WorkflowAction[];
};

function parseWorkflowState(comments: string | null): WorkflowState | null {
  if (!comments) return null;
  try {
    const parsed = JSON.parse(comments);
    if (parsed && typeof parsed === "object" && "currentStage" in parsed) {
      return parsed as WorkflowState;
    }
  } catch {}
  return null;
}

export function getCurrentStageId(status: string, comments: string | null): WorkflowStageId | null {
  const ws = parseWorkflowState(comments);
  if (ws?.currentStage) return ws.currentStage;
  if (status === "verified") return "issuance";
  if (status === "pending" || status === "agreed" || status === "appealed") return "hod_review";
  return null;
}

export function getNextStageId(current: WorkflowStageId | null): WorkflowStageId | null {
  if (!current) return "hod_review";
  const idx = WORKFLOW_STAGES.findIndex((s) => s.id === current);
  if (idx < 0 || idx >= WORKFLOW_STAGES.length - 1) return null;
  return WORKFLOW_STAGES[idx + 1].id;
}

export function getStageColor(stageId: WorkflowStageId): string {
  const map: Record<WorkflowStageId, string> = {
    hod_review: "bg-amber-100 text-amber-800 border-amber-300",
    office_review: "bg-blue-100 text-blue-800 border-blue-300",
    principal_review: "bg-purple-100 text-purple-800 border-purple-300",
    issuance: "bg-green-100 text-green-800 border-green-300",
    delivery: "bg-teal-100 text-teal-800 border-teal-300",
  };
  return map[stageId] ?? "bg-muted text-muted-foreground";
}

export function getStageLabel(stageId: WorkflowStageId): string {
  return WORKFLOW_STAGES.find((s) => s.id === stageId)?.label ?? stageId;
}

export async function stageApprove(
  id: string,
  config?: { comments?: string; by?: string },
  numberingFormat?: string
): Promise<CertRequest> {
  const { data: row, error: fetchErr } = await supabase
    .from("certificate_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;

  const ws = parseWorkflowState(row.comments) ?? {
    currentStage: "hod_review" as WorkflowStageId,
    history: [],
  };

  const isIssuanceStage = ws.currentStage === "issuance";
  const nextStage = getNextStageId(ws.currentStage);

  // When approving at issuance stage → issue certificate + advance to delivery
  if (isIssuanceStage) {
    ws.history.push({ stage: ws.currentStage, action: "issue", by: config?.by, at: new Date().toISOString(), reason: config?.comments });
    ws.currentStage = "delivery";
    const { data, error } = await supabase.from("certificate_requests").update({ status: "verified", comments: JSON.stringify(ws) }).eq("id", id).select("*").single();
    if (error) throw error;
    const issued = await createIssuedCertificate(data, numberingFormat);
    return normalizeRequest(data, issued);
  }

  // Last stage (delivery) → mark completed
  if (nextStage === null) {
    ws.history.push({ stage: ws.currentStage, action: "deliver", by: config?.by, at: new Date().toISOString(), reason: config?.comments });
    ws.currentStage = "delivery";
    const { data, error } = await supabase.from("certificate_requests").update({ comments: JSON.stringify(ws) }).eq("id", id).select("*").single();
    if (error) throw error;
    return normalizeRequest(data);
  }

  // Normal stage advance
  ws.history.push({ stage: ws.currentStage, action: "approve", by: config?.by, at: new Date().toISOString(), reason: config?.comments });
  ws.currentStage = nextStage;
  const { data, error } = await supabase
    .from("certificate_requests")
    .update({ comments: JSON.stringify(ws) })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeRequest(data);
}

export async function stageReject(
  id: string,
  reason: string,
  config?: { by?: string }
): Promise<CertRequest> {
  const { data: row, error: fetchErr } = await supabase
    .from("certificate_requests")
    .select("*")
    .eq("id", id)
    .single();
  if (fetchErr) throw fetchErr;

  const ws = parseWorkflowState(row.comments) ?? {
    currentStage: "hod_review" as WorkflowStageId,
    history: [],
  };

  ws.history.push({
    stage: ws.currentStage,
    action: "reject",
    by: config?.by,
    at: new Date().toISOString(),
    reason,
  });

  const { data, error } = await supabase
    .from("certificate_requests")
    .update({ status: "rejected", comments: JSON.stringify(ws), revoke_reason: reason })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return normalizeRequest(data);
}

export async function getWorkflowHistory(id: string): Promise<WorkflowAction[]> {
  const { data, error } = await supabase
    .from("certificate_requests")
    .select("comments")
    .eq("id", id)
    .single();
  if (error) throw error;
  const ws = parseWorkflowState(data?.comments ?? null);
  return ws?.history ?? [];
}

// ════════════════════════════════════════════════════════════════
// Legacy bridge / compatibility functions (adopted from legacy/compat/certificates.ts)
// ════════════════════════════════════════════════════════════════

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

const PENDING_BRIDGE_KEY = "sms.certificate.bridge.pending.v1";

type PendingBridgeEntry = {
  id: string;
  studentId: string;
  type: string;
  purpose: string;
  createdAt: string;
};

let certPatcherActive = false;

export function isCertPatcherActive() {
  return certPatcherActive;
}

function openLegacyDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open("gctStudentPortalDB", 7);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

export async function readLegacyCertificatesFromIndexedDB(): Promise<LegacyCertificateRecord[]> {
  const db = await openLegacyDb();
  if (!db) return [];
  try {
    if (!db.objectStoreNames.contains("certificateLog")) {
      db.close();
      return [];
    }
    const tx = db.transaction("certificateLog", "readonly");
    const store = tx.objectStore("certificateLog");
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
    Bonafide: "BONAFIDE",
    Transfer: "TRANSFER",
    Conduct: "CONDUCT",
    Study: "STUDY",
    Character: "CHARACTER",
    Leaving: "LEAVING",
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
  const [requests, templates] = await Promise.all([getRequests(filters), getTemplates()]);
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
  const [requests, templates] = await Promise.all([getRequests(), getTemplates()]);

  return {
    totalTemplates: templates?.length ?? 0,
    totalRequests: requests?.length ?? 0,
    pendingApprovals: requests?.filter((r) => r.status === "requested")?.length ?? 0,
    issuedCertificates: requests?.filter((r) => r.status === "issued")?.length ?? 0,
    revokedCertificates: requests?.filter((r) => r.status === "revoked")?.length ?? 0,
    qrVerified: requests?.filter((r) => r.qr_base64)?.length ?? 0,
  };
}

export function validateCertificateTemplate(template: Partial<CertTemplate>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!template.code?.trim()) errors.push("Template code is required");
  if (!template.name?.trim()) errors.push("Template name is required");
  if (!template.body?.trim()) errors.push("Template body/HTML is required");
  return { valid: errors.length === 0, errors };
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

export async function migratePendingBridgeEntries(): Promise<{
  migrated: number;
  skipped: number;
  errors: string[];
}> {
  const entries = consumePendingBridgeEntries();
  if (entries.length === 0) return { migrated: 0, skipped: 0, errors: [] };

  const dedupKey = "sms.certificate.migrated.legacy.v1";

  let migrated = 0;
  let skipped = 0;
  const errors: string[] = [];

  let deduped: string[] = [];
  try { deduped = JSON.parse(window.localStorage.getItem(dedupKey) || "[]"); } catch {}

  const students = await fetchStudentRegister();
  const templates = await getTemplates();

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
