import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { fetchStudentRegister } from "@/lib/student-records";
import { tableExists, tablesExist } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

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

export async function getRequests(options?: {
  status?: string;
  student_id?: string;
  template_id?: string;
}): Promise<CertRequestJoined[]> {
  if (!(await tableExists("certificate_requests"))) return [];
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
      student_name: stu?.display_name,
      admission_no: stu?.admission_no,
      grade: stu?.grade ?? undefined,
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

async function createIssuedCertificate(row: RequestRow): Promise<CertificateRow | null> {
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
  const certificateNo = `CERT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
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

export async function issueRequest(id: string): Promise<CertRequest> {
  if (!(await tableExists("certificate_requests"))) throw new Error("Run the certificates migration first");
  const { data, error } = await supabase
    .from("certificate_requests")
    .update({ status: "verified", comments: "Issued" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;

  const issued = await createIssuedCertificate(data);
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
    student_name: stu?.display_name,
    admission_no: stu?.admission_no,
    grade: stu?.grade ?? undefined,
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
    student_name: stu?.display_name,
    admission_no: stu?.admission_no,
    grade: stu?.grade ?? undefined,
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

export async function bulkIssue(ids: string[]): Promise<void> {
  if (!(await tableExists("certificate_requests"))) return;
  const { data, error } = await supabase
    .from("certificate_requests")
    .update({ status: "verified", comments: "Bulk issued" })
    .in("id", ids)
    .select("*");
  if (error) throw error;
  await Promise.all((data ?? []).map((row) => createIssuedCertificate(row)));
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
