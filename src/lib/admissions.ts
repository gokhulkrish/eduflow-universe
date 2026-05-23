import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { tableExists } from "@/lib/supabase-health";

export type AdmissionStage = "new" | "screening" | "verified" | "shortlisted" | "offered" | "enrolled" | "rejected";

export const ADMISSION_STAGES: { value: AdmissionStage; label: string; color: string }[] = [
  { value: "new", label: "New", color: "bg-muted text-muted-foreground" },
  { value: "screening", label: "Screening", color: "bg-primary/15 text-primary" },
  { value: "verified", label: "Verified", color: "bg-info/15 text-info" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-accent/20 text-accent-foreground" },
  { value: "offered", label: "Offer Made", color: "bg-warning/15 text-warning" },
  { value: "enrolled", label: "Enrolled", color: "bg-success/15 text-success" },
  { value: "rejected", label: "Rejected", color: "bg-destructive/15 text-destructive" },
];

export const STAGE_ORDER: AdmissionStage[] = ["new", "screening", "verified", "shortlisted", "offered", "enrolled"];

export const VALID_TRANSITIONS: Record<AdmissionStage, AdmissionStage[]> = {
  new: ["screening", "rejected"],
  screening: ["verified", "rejected"],
  verified: ["shortlisted", "rejected"],
  shortlisted: ["offered", "rejected"],
  offered: ["enrolled", "rejected"],
  enrolled: [],
  rejected: [],
};

export type AdmissionApplicant = {
  id: string;
  admission_no: string;
  first_name: string;
  last_name: string | null;
  display_name: string;
  dob: string | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  community: string | null;
  nationality: string | null;
  stage: AdmissionStage;
  documents_status: "pending" | "partial" | "submitted" | "verified";
  merit_score: number | null;
  applied_grade: string | null;
  applied_date: string;
  updated_at: string;
  notes: string | null;
  meta: Json | null;
};

export type AdmissionSummary = {
  total: number;
  new: number;
  screening: number;
  verified: number;
  shortlisted: number;
  offered: number;
  enrolled: number;
  rejected: number;
};

const readMetaStage = (meta: Json | null): AdmissionStage => {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return "new";
  const admission = (meta as Record<string, unknown>).admission;
  if (!admission || typeof admission !== "object" || Array.isArray(admission)) return "new";
  const stage = (admission as Record<string, unknown>).stage;
  if (typeof stage === "string" && ADMISSION_STAGES.some((s) => s.value === stage)) return stage as AdmissionStage;
  return "new";
};

const readMetaString = (meta: Json | null, group: string, key: string): string | null => {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const section = (meta as Record<string, unknown>)[group];
  if (!section || typeof section !== "object" || Array.isArray(section)) return null;
  const value = (section as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
};

const readMetaNumber = (meta: Json | null, group: string, key: string): number | null => {
  const raw = readMetaString(meta, group, key);
  if (raw === null) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

const normalizeApplicant = (row: Record<string, unknown>): AdmissionApplicant => ({
  id: String(row.id ?? ""),
  admission_no: String(row.admission_no ?? ""),
  first_name: String(row.first_name ?? ""),
  last_name: typeof row.last_name === "string" ? row.last_name : null,
  display_name: String(row.display_name ?? [row.first_name, row.last_name].filter(Boolean).join(" ")),
  dob: typeof row.dob === "string" ? row.dob : null,
  gender: typeof row.gender === "string" ? row.gender : null,
  email: typeof row.email === "string" ? row.email : null,
  phone: typeof row.phone === "string" ? row.phone : null,
  community: typeof row.community === "string" ? row.community : null,
  nationality: typeof row.nationality === "string" ? row.nationality : null,
  stage: readMetaStage(row.meta as Json | null),
  documents_status: (["pending", "partial", "submitted", "verified"].includes(
    readMetaString(row.meta as Json | null, "admission", "documents_status") ?? ""
  )
    ? readMetaString(row.meta as Json | null, "admission", "documents_status")
    : "pending") as AdmissionApplicant["documents_status"],
  merit_score: readMetaNumber(row.meta as Json | null, "admission", "merit_score"),
  applied_grade: readMetaString(row.meta as Json | null, "admission", "applied_grade"),
  applied_date: readMetaString(row.meta as Json | null, "admission", "applied_date") ?? String(row.created_at ?? ""),
  updated_at: String(row.updated_at ?? ""),
  notes: readMetaString(row.meta as Json | null, "admission", "notes"),
  meta: row.meta as Json | null,
});

export async function fetchAdmissionApplicants(): Promise<AdmissionApplicant[]> {
  if (!(await tableExists("students"))) return [];
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .not("meta", "is", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return ((data ?? []) as Record<string, unknown>[])
    .map(normalizeApplicant)
    .filter((a) => a.stage !== "enrolled" || a.stage === "enrolled");
}

export async function fetchAdmissionApplicantsByStage(stage: AdmissionStage): Promise<AdmissionApplicant[]> {
  const all = await fetchAdmissionApplicants();
  return all.filter((a) => a.stage === stage);
}

export async function fetchAdmissionSummary(): Promise<AdmissionSummary> {
  const applicants = await fetchAdmissionApplicants();
  return {
    total: applicants.length,
    new: applicants.filter((a) => a.stage === "new").length,
    screening: applicants.filter((a) => a.stage === "screening").length,
    verified: applicants.filter((a) => a.stage === "verified").length,
    shortlisted: applicants.filter((a) => a.stage === "shortlisted").length,
    offered: applicants.filter((a) => a.stage === "offered").length,
    enrolled: applicants.filter((a) => a.stage === "enrolled").length,
    rejected: applicants.filter((a) => a.stage === "rejected").length,
  };
}

export function canTransition(from: AdmissionStage, to: AdmissionStage): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function updateAdmissionStage(
  studentId: string,
  stage: AdmissionStage,
  extras?: { notes?: string; merit_score?: number; documents_status?: string }
): Promise<void> {
  if (!(await tableExists("students"))) {
    throw new Error("Missing students table — run the student schema migration first.");
  }
  const { data: current, error: fetchError } = await supabase
    .from("students")
    .select("meta")
    .eq("id", studentId)
    .single();

  if (fetchError) throw fetchError;

  const meta = (current?.meta ?? {}) as Record<string, unknown>;
  const admission = (meta.admission ?? {}) as Record<string, unknown>;

  const updatedAdmission: Record<string, unknown> = {
    ...admission,
    stage,
    ...(extras?.notes !== undefined ? { notes: extras.notes } : {}),
    ...(extras?.merit_score !== undefined ? { merit_score: extras.merit_score } : {}),
    ...(extras?.documents_status !== undefined ? { documents_status: extras.documents_status } : {}),
    updated_at: new Date().toISOString(),
  };

  const updatedMeta = { ...meta, admission: updatedAdmission };

  const { error: updateError } = await supabase
    .from("students")
    .update({ meta: updatedMeta as Json })
    .eq("id", studentId);

  if (updateError) throw updateError;

  if (await tableExists("audit_log")) {
    await supabase.from("audit_log").insert({
      action: `admission.stage.${stage}`,
      entity: "students",
      entity_id: studentId,
      metadata: { stage, ...(extras?.notes ? { notes: extras.notes } : {}) },
    });
  }
}

export async function createAdmissionApplication(values: Record<string, string>): Promise<string> {
  if (!(await tableExists("students"))) {
    throw new Error("Missing students table — run the student schema migration first.");
  }
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const meta: Record<string, unknown> = {
    admission: {
      stage: "new",
      applied_date: new Date().toISOString().slice(0, 10),
      documents_status: "pending",
      applied_grade: values.appliedGrade || null,
      notes: values.admissionNotes || null,
    },
  };

  const payload = {
    admission_no: values.admissionNo || `ADM-${Date.now().toString(36).toUpperCase()}`,
    first_name: values.firstName,
    last_name: values.lastName || null,
    dob: values.dob || null,
    gender: values.gender || null,
    nationality: values.nationality || "Indian",
    email: values.email || null,
    phone: values.phone || null,
    address: values.address || null,
    community: values.community || null,
    meta: meta as Json,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from("students")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;

  if (await tableExists("audit_log")) {
    await supabase.from("audit_log").insert({
      actor: userId,
      action: "admission.application.created",
      entity: "students",
      entity_id: data.id,
      metadata: { admission_no: payload.admission_no },
    });
  }

  return data.id;
}
