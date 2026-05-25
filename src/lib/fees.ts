import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { fetchStudentRegister, type StudentRegisterRow } from "@/lib/student-records";
import { tableExists, tablesExist } from "@/lib/supabase-health";

// ── Types ──────────────────────────────────────────────────────

export type FeeStructure = {
  id: string;
  name: string;
  grade: string | null;
  academic_year_id: string | null;
  amount: number;
  frequency: string;
  due_day: number | null;
  created_at: string;
  updated_at?: string;
  institution_id?: string;
  fee_category_id?: string;
  class_level_id?: string;
  due_date?: string | null;
  meta?: Json;
};

export type FeeInvoice = {
  id: string;
  student_id: string;
  fee_structure_id: string | null;
  invoice_no: string;
  amount: number;
  amount_paid: number;
  due_date: string | null;
  status: string;
  created_at: string;
};

export type FeePayment = {
  id: string;
  invoice_id: string;
  student_id?: string;
  academic_year_id?: string | null;
  fee_category_id?: string | null;
  amount: number;
  method: string;
  reference: string | null;
  paid_at: string;
  received_by: string | null;
  payment_date?: string;
  amount_paid?: number;
  payment_method?: string;
  transaction_reference?: string | null;
  receipt_no?: string | null;
  status?: string;
  institution_id?: string | null;
  created_by?: string | null;
  meta?: Json;
};

export type InvoiceWithStudent = FeeInvoice & {
  student_name?: string;
  student_admission_no?: string;
  student_grade?: string;
  structure_name?: string;
};

export type DefaulterRow = {
  student_id: string;
  student_name: string;
  admission_no: string;
  grade: string;
  total_due: number;
  total_paid: number;
  outstanding: number;
  invoice_count: number;
  last_payment_date: string | null;
};

export type CollectionSummary = {
  period: string;
  total_collected: number;
  transaction_count: number;
  method_breakdown: Record<string, number>;
};

type LiveFeeStructureRow = {
  id: string;
  institution_id: string;
  fee_category_id: string;
  class_level_id: string;
  academic_year_id: string;
  amount: number;
  due_date: string | null;
  meta: Json;
  created_at: string;
  updated_at: string;
  fee_categories?: { name: string | null } | null;
  class_levels?: { label: string | null } | null;
};

type LiveFeePaymentRow = {
  id: string;
  institution_id: string | null;
  student_id: string;
  academic_year_id: string | null;
  fee_category_id: string | null;
  amount_paid: number;
  payment_date: string;
  payment_method: string | null;
  transaction_reference: string | null;
  receipt_no: string | null;
  status: string | null;
  meta: Json;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type LiveFeeInvoiceRow = {
  id: string;
  student_id: string;
  fee_structure_id: string | null;
  amount: number;
  amount_paid: number;
  due_date: string | null;
  status: string;
  created_at: string;
};

const LEGACY_ALL_GRADES = "all";

const isPlainObject = (value: Json | null | undefined): value is Record<string, Json> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const readMetaString = (meta: Json | null | undefined, key: string): string | null => {
  if (!isPlainObject(meta)) return null;
  const value = meta[key];
  return typeof value === "string" ? value : null;
};

const readMetaNumber = (meta: Json | null | undefined, key: string): number | null => {
  if (!isPlainObject(meta)) return null;
  const value = meta[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const mergeMeta = (...parts: Array<Json | null | undefined>): Json => {
  const result: Record<string, Json> = {};
  for (const part of parts) {
    if (!isPlainObject(part)) continue;
    Object.assign(result, part);
  }
  return result;
};

const normalizeLegacyGrade = (grade: string | null | undefined): string => {
  const next = String(grade ?? "").trim();
  if (!next || next.toLowerCase() === LEGACY_ALL_GRADES) return "All";
  return next;
};

const normalizeLegacyFrequency = (frequency: string | null | undefined, meta: Json | null | undefined): string => {
  const metaFrequency = readMetaString(meta, "frequency")?.trim();
  const legacyFrequency = String(frequency ?? "").trim();
  return metaFrequency || legacyFrequency || "annual";
};

const normalizeFeeStructureRow = (row: LiveFeeStructureRow): FeeStructure => {
  const name = readMetaString(row.meta, "legacy_name") ?? row.fee_categories?.name ?? "Fee Structure";
  const grade = readMetaString(row.meta, "legacy_grade") ?? row.class_levels?.label ?? null;
  const dueDay = readMetaNumber(row.meta, "due_day") ?? (row.due_date ? new Date(row.due_date).getDate() : null);
  return {
    id: row.id,
    name,
    grade,
    academic_year_id: row.academic_year_id ?? null,
    amount: Number(row.amount),
    frequency: normalizeLegacyFrequency(null, row.meta),
    due_day: dueDay,
    created_at: row.created_at,
    updated_at: row.updated_at,
    institution_id: row.institution_id,
    fee_category_id: row.fee_category_id,
    class_level_id: row.class_level_id,
    due_date: row.due_date,
    meta: row.meta,
  };
};

const normalizeFeePaymentRow = (row: LiveFeePaymentRow, invoiceId: string | null): FeePayment => {
  const isRefund = String(row.status ?? "").toLowerCase() === "refunded" || String(row.payment_method ?? "").toLowerCase() === "refund";
  const metaInvoiceId = readMetaString(row.meta, "invoice_id");
  const amount = isRefund ? -Math.abs(Number(row.amount_paid)) : Number(row.amount_paid);
  return {
    id: row.id,
    invoice_id: metaInvoiceId ?? invoiceId ?? "",
    student_id: row.student_id,
    academic_year_id: row.academic_year_id,
    fee_category_id: row.fee_category_id,
    amount,
    method: row.payment_method ?? "cash",
    reference: row.transaction_reference,
    paid_at: row.payment_date,
    received_by: row.created_by,
    payment_date: row.payment_date,
    amount_paid: Number(row.amount_paid),
    payment_method: row.payment_method ?? "cash",
    transaction_reference: row.transaction_reference,
    receipt_no: row.receipt_no,
    status: row.status ?? undefined,
    institution_id: row.institution_id,
    created_by: row.created_by,
    meta: row.meta,
  };
};

type FeeLookupMaps = {
  feeCategories: Map<string, string>;
  classLevels: Map<string, string>;
};

async function loadFeeLookupMaps(): Promise<FeeLookupMaps> {
  const [categoryRows, classLevelRows] = await Promise.all([
    tableExists("fee_categories")
      ? supabase.from("fee_categories").select("id,name")
      : Promise.resolve({ data: [], error: null }),
    tableExists("class_levels")
      ? supabase.from("class_levels").select("id,label")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (categoryRows.error) throw categoryRows.error;
  if (classLevelRows.error) throw classLevelRows.error;

  return {
    feeCategories: new Map((categoryRows.data ?? []).map((row: any) => [String(row.id), String(row.name ?? "")])),
    classLevels: new Map((classLevelRows.data ?? []).map((row: any) => [String(row.id), String(row.label ?? "")])),
  };
}

function enrichFeeStructureRow(row: Record<string, unknown>, lookups: FeeLookupMaps): LiveFeeStructureRow {
  const feeCategoryId = String(row.fee_category_id ?? "");
  const classLevelId = String(row.class_level_id ?? "");
  return {
    ...(row as LiveFeeStructureRow),
    fee_categories: (row as any).fee_categories ?? (feeCategoryId ? { name: lookups.feeCategories.get(feeCategoryId) ?? null } : null),
    class_levels: (row as any).class_levels ?? (classLevelId ? { label: lookups.classLevels.get(classLevelId) ?? null } : null),
  };
}

async function resolveAcademicYearContext(academicYearId?: string | null): Promise<{ id: string; institutionId: string } | null> {
  if (!(await tableExists("academic_years"))) return null;
  if (academicYearId) {
    const { data, error } = await supabase
      .from("academic_years")
      .select("id,institution_id")
      .eq("id", academicYearId)
      .maybeSingle();
    if (error) throw error;
    return data ? { id: data.id, institutionId: data.institution_id } : null;
  }

  const { data, error } = await supabase
    .from("academic_years")
    .select("id,institution_id")
    .eq("is_current", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (data) return { id: data.id, institutionId: data.institution_id };

  const { data: fallback, error: fallbackError } = await supabase
    .from("academic_years")
    .select("id,institution_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (fallbackError) throw fallbackError;
  return fallback ? { id: fallback.id, institutionId: fallback.institution_id } : null;
}

async function getDefaultInstitutionId(): Promise<string | null> {
  if (!(await tableExists("institutions"))) return null;
  const { data, error } = await supabase
    .from("institutions")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function ensureFeeCategoryId(name: string, institutionId: string): Promise<string> {
  if (!(await tableExists("fee_categories"))) throw new Error("Missing fee_categories table — run migration");
  const cleanName = name.trim() || "Unnamed Fee";
  const { data: existing, error: existingError } = await supabase
    .from("fee_categories")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("name", cleanName)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const { data: general, error: generalError } = await supabase
    .from("fee_categories")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("name", "General Fees")
    .maybeSingle();
  if (generalError) throw generalError;
  if (general?.id) return general.id;

  const { data: first, error: firstError } = await supabase
    .from("fee_categories")
    .select("id")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstError) throw firstError;
  if (first?.id) return first.id;

  throw new Error(`No fee categories exist for this institution. Seed at least one category before saving "${cleanName}".`);
}

async function ensureClassLevelId(label: string, institutionId: string): Promise<string> {
  if (!(await tableExists("class_levels"))) throw new Error("Missing class_levels table — run migration");
  const cleanLabel = label.trim() || "All";
  const { data: existing, error: existingError } = await supabase
    .from("class_levels")
    .select("id")
    .eq("institution_id", institutionId)
    .eq("label", cleanLabel)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id;

  const { data: first, error: firstError } = await supabase
    .from("class_levels")
    .select("id")
    .eq("institution_id", institutionId)
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstError) throw firstError;
  if (first?.id) return first.id;

  throw new Error(`No class levels exist for this institution. Seed at least one class level before saving "${cleanLabel}".`);
}

async function buildInvoiceLookup() {
  const [invoices, structures] = await Promise.all([getFeeInvoices(), getFeeStructures()]);
  const structureMap = new Map(structures.map((s) => [s.id, s]));
  const lookup = new Map<string, string>();
  for (const inv of invoices) {
    const structure = inv.fee_structure_id ? structureMap.get(inv.fee_structure_id) : null;
    const key = `${inv.student_id}::${structure?.fee_category_id ?? ""}::${structure?.academic_year_id ?? ""}`;
    if (!lookup.has(key)) lookup.set(key, inv.id);
  }
  return lookup;
}

// ── Fee Structures CRUD ────────────────────────────────────────

export async function getFeeStructures(): Promise<FeeStructure[]> {
  if (!(await tableExists("fee_structures"))) return [];
  const { data, error } = await supabase.from("fee_structures").select("*");
  if (error) throw error;
  const lookups = await loadFeeLookupMaps();
  return (data ?? [])
    .map((row) => normalizeFeeStructureRow(enrichFeeStructureRow(row as Record<string, unknown>, lookups)))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getFeeStructure(id: string): Promise<FeeStructure | null> {
  if (!(await tableExists("fee_structures"))) return null;
  const { data, error } = await supabase.from("fee_structures").select("*").eq("id", id).single();
  if (error) throw error;
  const lookups = await loadFeeLookupMaps();
  return normalizeFeeStructureRow(enrichFeeStructureRow(data as Record<string, unknown>, lookups));
}

export async function saveFeeStructure(
  s: Omit<FeeStructure, "id" | "created_at"> & { id?: string }
): Promise<FeeStructure> {
  if (!(await tableExists("fee_structures"))) throw new Error("Missing fee_structures table — run migration");
  const existing = s.id ? await getFeeStructure(s.id) : null;
  const academicYearContext = await resolveAcademicYearContext(s.academic_year_id ?? existing?.academic_year_id ?? null);
  if (!academicYearContext) throw new Error("No academic year found for fee structure");

  const institutionId = existing?.institution_id ?? academicYearContext.institutionId ?? (await getDefaultInstitutionId());
  if (!institutionId) throw new Error("No institution found for fee structure");

  const feeCategoryId = await ensureFeeCategoryId(s.name, institutionId);
  const classLevelId = await ensureClassLevelId(normalizeLegacyGrade(s.grade), institutionId);
  const payload = {
    institution_id: institutionId,
    fee_category_id: feeCategoryId,
    class_level_id: classLevelId,
    academic_year_id: academicYearContext.id,
    amount: s.amount,
    due_date: s.due_date ?? existing?.due_date ?? null,
    meta: mergeMeta(existing?.meta, s.meta, {
      frequency: normalizeLegacyFrequency(s.frequency, existing?.meta ?? null),
      due_day: s.due_day ?? readMetaNumber(existing?.meta, "due_day") ?? null,
      legacy_name: s.name,
      legacy_grade: s.grade,
    }),
  };

  if (s.id) {
    const { data, error } = await supabase
      .from("fee_structures")
      .update(payload)
      .eq("id", s.id)
      .select("*")
      .single();
    if (error) throw error;
    const lookups = await loadFeeLookupMaps();
    return normalizeFeeStructureRow(enrichFeeStructureRow(data as Record<string, unknown>, lookups));
  }

  const { data, error } = await supabase
    .from("fee_structures")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;
  const lookups = await loadFeeLookupMaps();
  return normalizeFeeStructureRow(enrichFeeStructureRow(data as Record<string, unknown>, lookups));
}

export async function deleteFeeStructure(id: string): Promise<void> {
  if (!(await tableExists("fee_structures"))) return;
  const { error } = await supabase.from("fee_structures").delete().eq("id", id);
  if (error) throw error;
}

// ── Fee Invoices CRUD ─────────────────────────────────────────

export async function getFeeInvoices(): Promise<FeeInvoice[]> {
  if (!(await tableExists("fee_invoices"))) return [];
  const { data, error } = await supabase
    .from("fee_invoices")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FeeInvoice[];
}

export async function getInvoicesByStudent(studentId: string): Promise<FeeInvoice[]> {
  if (!(await tableExists("fee_invoices"))) return [];
  const { data, error } = await supabase
    .from("fee_invoices")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FeeInvoice[];
}

export async function getInvoice(id: string): Promise<FeeInvoice | null> {
  if (!(await tableExists("fee_invoices"))) return null;
  const { data, error } = await supabase
    .from("fee_invoices")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as unknown as FeeInvoice;
}

export async function createFeeInvoice(
  inv: Omit<FeeInvoice, "id" | "created_at" | "invoice_no" | "status" | "amount_paid">
): Promise<FeeInvoice> {
  if (!(await tableExists("fee_invoices"))) throw new Error("Missing fee_invoices table — run migration");
  const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const { data, error } = await supabase
    .from("fee_invoices")
    .insert({
      student_id: inv.student_id,
      fee_structure_id: inv.fee_structure_id,
      invoice_no: invoiceNo,
      amount: inv.amount,
      amount_paid: 0,
      due_date: inv.due_date,
      status: "pending",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as FeeInvoice;
}

export async function deleteFeeInvoice(id: string): Promise<void> {
  if (!(await tableExists("fee_invoices"))) return;
  const { error } = await supabase.from("fee_invoices").delete().eq("id", id);
  if (error) throw error;
}

// ── Payments ───────────────────────────────────────────────────

export async function getPaymentsForInvoice(invoiceId: string): Promise<FeePayment[]> {
  if (!(await tableExists("fee_payments"))) return [];
  const payments = await getAllPayments();
  return payments.filter((payment) => payment.invoice_id === invoiceId);
}

export async function getAllPayments(): Promise<FeePayment[]> {
  if (!(await tableExists("fee_payments"))) return [];
  const [rows, invoiceLookup] = await Promise.all([
    supabase.from("fee_payments").select("*"),
    buildInvoiceLookup(),
  ]);

  const { data, error } = rows;
  if (error) throw error;
  return (data ?? [])
    .map((row) => {
    const live = row as unknown as LiveFeePaymentRow;
    const metaInvoiceId = readMetaString(live.meta, "invoice_id");
    const lookupKey = `${live.student_id}::${live.fee_category_id ?? ""}::${live.academic_year_id ?? ""}`;
    return normalizeFeePaymentRow(live, metaInvoiceId ?? invoiceLookup.get(lookupKey) ?? null);
  })
    .sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime());
}

export async function recordPayment(
  p: Omit<FeePayment, "id" | "paid_at">
): Promise<{ payment: FeePayment; invoice: FeeInvoice }> {
  if (!(await tablesExist(["fee_payments", "fee_invoices"]))) {
    throw new Error("Missing fee tables — run migration");
  }
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const { data: invoice, error: invoiceError } = await supabase
    .from("fee_invoices")
    .select("id,student_id,fee_structure_id,amount,amount_paid,due_date,status,created_at")
    .eq("id", p.invoice_id)
    .single();
  if (invoiceError) throw invoiceError;

  const liveInvoice = invoice as unknown as LiveFeeInvoiceRow;
  const structure = liveInvoice.fee_structure_id ? await getFeeStructure(liveInvoice.fee_structure_id) : null;
  const academicYearId = structure?.academic_year_id ?? null;
  const feeCategoryId = structure?.fee_category_id ?? null;
  const institutionId = structure?.institution_id ?? (await resolveAcademicYearContext(academicYearId))?.institutionId ?? null;

  const { data: payment, error: pErr } = await supabase
    .from("fee_payments")
    .insert({
      institution_id: institutionId,
      student_id: liveInvoice.student_id,
      academic_year_id: academicYearId,
      fee_category_id: feeCategoryId,
      amount_paid: Math.abs(Number(p.amount)),
      payment_date: new Date().toISOString(),
      payment_method: p.method,
      transaction_reference: p.reference,
      receipt_no: null,
      status: "completed",
      meta: { invoice_id: p.invoice_id },
      created_by: userId,
    })
    .select("id,institution_id,student_id,academic_year_id,fee_category_id,amount_paid,payment_date,payment_method,transaction_reference,receipt_no,status,meta,created_by,created_at,updated_at")
    .single();
  if (pErr) throw pErr;

  const pmt = normalizeFeePaymentRow(payment as unknown as LiveFeePaymentRow, p.invoice_id);

  const inv = liveInvoice as unknown as FeeInvoice;
  const newPaid = Number(inv.amount_paid) + Number(p.amount);
  const newStatus = newPaid >= Number(inv.amount) ? "paid" : "partial";

  const { data: updated, error: uErr } = await supabase
    .from("fee_invoices")
    .update({ amount_paid: newPaid, status: newStatus })
    .eq("id", p.invoice_id)
    .select("*")
    .single();
  if (uErr) throw uErr;

  return { payment: pmt, invoice: updated as unknown as FeeInvoice };
}

export async function processRefund(invoiceId: string, amount: number): Promise<FeeInvoice> {
  if (!(await tablesExist(["fee_payments", "fee_invoices"]))) {
    throw new Error("Missing fee tables — run migration");
  }
  const { data: invoice } = await supabase
    .from("fee_invoices")
    .select("id,student_id,fee_structure_id,amount,amount_paid,due_date,status,created_at")
    .eq("id", invoiceId)
    .single();
  const inv = invoice as unknown as FeeInvoice & LiveFeeInvoiceRow;
  const newPaid = Math.max(0, Number(inv.amount_paid) - amount);
  const newStatus = newPaid <= 0 ? "pending" : "partial";

  const { data, error } = await supabase
    .from("fee_invoices")
    .update({ amount_paid: newPaid, status: newStatus })
    .eq("id", invoiceId)
    .select("*")
    .single();
  if (error) throw error;

  const structure = inv.fee_structure_id ? await getFeeStructure(inv.fee_structure_id) : null;
  const academicYearId = structure?.academic_year_id ?? null;
  const feeCategoryId = structure?.fee_category_id ?? null;
  const institutionId = structure?.institution_id ?? (await resolveAcademicYearContext(academicYearId))?.institutionId ?? null;
  const { error: pErr } = await supabase
    .from("fee_payments")
    .insert({
      institution_id: institutionId,
      student_id: inv.student_id,
      academic_year_id: academicYearId,
      fee_category_id: feeCategoryId,
      amount_paid: Math.abs(amount),
      payment_date: new Date().toISOString(),
      payment_method: "refund",
      transaction_reference: `Refund of ${amount}`,
      receipt_no: null,
      status: "refunded",
      meta: { invoice_id: invoiceId, refund_amount: amount },
      created_by: null,
    });
  if (pErr) throw pErr;

  return data as unknown as FeeInvoice;
}

// ── Lookup helpers ─────────────────────────────────────────────

export async function getInvoicesWithDetails(): Promise<InvoiceWithStudent[]> {
  if (!(await tablesExist(["fee_invoices", "students", "fee_structures"]))) return [];
  const [invoices, students] = await Promise.all([
    getFeeInvoices(),
    fetchStudentRegister(),
    getFeeStructures(),
  ]);

  const studentMap = new Map(students.map((s) => [s.id, s]));
  const structMap = new Map((await getFeeStructures()).map((s) => [s.id, s]));

  return invoices.map((inv) => {
    const student = studentMap.get(inv.student_id);
    const structure = inv.fee_structure_id ? structMap.get(inv.fee_structure_id) : null;
    return {
      ...inv,
      student_name: student?.display_name ?? "Unknown",
      student_admission_no: student?.admission_no ?? "",
      student_grade: student?.grade ?? "",
      structure_name: structure?.name ?? "",
    };
  });
}

// ── Reports ────────────────────────────────────────────────────

export async function getDefaulterReport(): Promise<DefaulterRow[]> {
  if (!(await tablesExist(["fee_invoices", "students"]))) return [];
  const students = await fetchStudentRegister();
  const invoices = await getFeeInvoices();

  const studentInvoices = new Map<string, FeeInvoice[]>();
  for (const inv of invoices) {
    const list = studentInvoices.get(inv.student_id) ?? [];
    list.push(inv);
    studentInvoices.set(inv.student_id, list);
  }

  const debtors: DefaulterRow[] = [];
  for (const student of students) {
    const invs = studentInvoices.get(student.id) ?? [];
    if (invs.length === 0) continue;
    const totalDue = invs.reduce((s, i) => s + Number(i.amount), 0);
    const totalPaid = invs.reduce((s, i) => s + Number(i.amount_paid), 0);
    const outstanding = totalDue - totalPaid;
    if (outstanding <= 0) continue;

    const allPayments = await Promise.all(invs.map((i) => getPaymentsForInvoice(i.id)));
    const flatPayments = allPayments.flat().filter((p) => Number(p.amount) > 0);
    const lastPmt = flatPayments.length > 0
      ? flatPayments.sort((a, b) => new Date(b.paid_at).getTime() - new Date(a.paid_at).getTime())[0].paid_at
      : null;

    debtors.push({
      student_id: student.id,
      student_name: student.display_name,
      admission_no: student.admission_no,
      grade: student.grade ?? "",
      total_due: totalDue,
      total_paid: totalPaid,
      outstanding,
      invoice_count: invs.length,
      last_payment_date: lastPmt,
    });
  }

  return debtors.sort((a, b) => b.outstanding - a.outstanding);
}

export async function getCollectionSummary(): Promise<CollectionSummary[]> {
  if (!(await tableExists("fee_payments"))) return [];
  const payments = await getAllPayments();
  const monthly = new Map<string, { total: number; count: number; methods: Record<string, number> }>();

  for (const p of payments) {
    if (Number(p.amount) <= 0) continue;
    const key = new Date(p.paid_at).toISOString().slice(0, 7);
    const entry = monthly.get(key) ?? { total: 0, count: 0, methods: {} };
    entry.total += Number(p.amount);
    entry.count++;
    entry.methods[p.method] = (entry.methods[p.method] ?? 0) + Number(p.amount);
    monthly.set(key, entry);
  }

  return [...monthly.entries()]
    .map(([period, data]) => ({ period, total_collected: data.total, transaction_count: data.count, method_breakdown: data.methods }))
    .sort((a, b) => b.period.localeCompare(a.period));
}

// ── Concessions ────────────────────────────────────────────────

export type FeeConcession = {
  id: string;
  invoice_id: string;
  student_id: string;
  amount: number;
  reason: string;
  approved_by: string | null;
  type: string;
  created_at: string;
  updated_at: string;
};

export type FeeReminder = {
  id: string;
  student_id: string;
  sent_at: string;
  channel: string;
  invoice_ids: string[];
  total_due: number;
  sent_by: string | null;
  status: string;
};

export type FeeLedgerEntry = {
  id: string;
  date: string;
  type: "invoice" | "payment" | "concession" | "refund" | "reminder";
  description: string;
  debit: number;
  credit: number;
  balance: number;
  ref_id: string;
  student_id: string;
  student_name?: string;
};

export type StudentFeeRecord = {
  student_id: string;
  student_name: string;
  admission_no: string;
  grade: string;
  total_billed: number;
  total_concessions: number;
  net_billed: number;
  total_paid: number;
  outstanding: number;
  invoice_count: number;
  last_activity: string | null;
};

const MISSING_TABLE_MSG = "Missing fee_concessions / fee_reminders tables — run migration";

// ── Concessions ────────────────────────────────────────────────

export async function getConcessionsForInvoice(invoiceId: string): Promise<FeeConcession[]> {
  if (!(await tableExists("fee_concessions"))) return [];
  const { data, error } = await supabase
    .from("fee_concessions")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FeeConcession[];
}

export async function getAllConcessions(): Promise<FeeConcession[]> {
  if (!(await tableExists("fee_concessions"))) return [];
  const { data, error } = await supabase
    .from("fee_concessions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FeeConcession[];
}

export async function saveConcession(
  c: Omit<FeeConcession, "id" | "created_at" | "updated_at"> & { id?: string }
): Promise<FeeConcession> {
  if (!(await tableExists("fee_concessions"))) throw new Error(MISSING_TABLE_MSG);
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  if (c.id) {
    const { data, error } = await supabase
      .from("fee_concessions")
      .update({ amount: c.amount, reason: c.reason, type: c.type })
      .eq("id", c.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FeeConcession;
  }

  const { data, error } = await supabase
    .from("fee_concessions")
    .insert({ invoice_id: c.invoice_id, student_id: c.student_id, amount: c.amount, reason: c.reason, type: c.type, approved_by: userId })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as FeeConcession;
}

export async function deleteConcession(id: string): Promise<void> {
  if (!(await tableExists("fee_concessions"))) throw new Error(MISSING_TABLE_MSG);
  const { error } = await supabase.from("fee_concessions").delete().eq("id", id);
  if (error) throw error;
}

// ── Reminders ──────────────────────────────────────────────────

export async function sendFeeReminder(
  studentId: string,
  channel: string,
  invoiceIds: string[],
  totalDue: number
): Promise<FeeReminder> {
  if (!(await tableExists("fee_reminders"))) throw new Error(MISSING_TABLE_MSG);
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;

  const { data, error } = await supabase
    .from("fee_reminders")
    .insert({
      student_id: studentId,
      channel,
      invoice_ids: invoiceIds,
      total_due: totalDue,
      sent_by: userId,
      status: "sent",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as FeeReminder;
}

export async function getRemindersForStudent(studentId: string): Promise<FeeReminder[]> {
  if (!(await tableExists("fee_reminders"))) return [];
  const { data, error } = await supabase
    .from("fee_reminders")
    .select("*")
    .eq("student_id", studentId)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FeeReminder[];
}

export async function getAllReminders(): Promise<FeeReminder[]> {
  if (!(await tableExists("fee_reminders"))) return [];
  const { data, error } = await supabase
    .from("fee_reminders")
    .select("*")
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as FeeReminder[];
}

// ── Fee Ledger (chronological per-student) ─────────────────────

export async function getFeeLedger(studentId?: string): Promise<FeeLedgerEntry[]> {
  if (!(await tablesExist(["fee_invoices", "fee_payments"]))) return [];
  const studentIds = studentId ? [studentId] : (await fetchStudentRegister()).map((s) => s.id);
  const entries: FeeLedgerEntry[] = [];

  const [invoices, concessions, payments] = await Promise.all([
    getFeeInvoices(),
    getAllConcessions(),
    getAllPayments(),
  ]);

  const relevantInvoices = studentId
    ? invoices.filter((i) => i.student_id === studentId)
    : invoices;

  for (const inv of relevantInvoices) {
    entries.push({
      id: `inv-${inv.id}`,
      date: inv.created_at,
      type: "invoice",
      description: `Invoice ${inv.invoice_no}`,
      debit: Number(inv.amount),
      credit: 0,
      balance: 0,
      ref_id: inv.id,
      student_id: inv.student_id,
    });
  }

  for (const inv of relevantInvoices) {
    const invConcessions = studentId
      ? concessions.filter((c) => c.invoice_id === inv.id)
      : concessions.filter((c) => c.invoice_id === inv.id);
    for (const c of invConcessions) {
      entries.push({
        id: `con-${c.id}`,
        date: c.created_at,
        type: "concession",
        description: `Concession (${c.type}): ${c.reason}`,
        debit: 0,
        credit: Number(c.amount),
        balance: 0,
        ref_id: c.id,
        student_id: c.student_id,
      });
    }
  }

  const relevantPayments = studentId
    ? payments.filter((p) => relevantInvoices.some((i) => i.id === p.invoice_id))
    : payments;

  for (const p of relevantPayments) {
    const amount = Number(p.amount);
    entries.push({
      id: `pmt-${p.id}`,
      date: p.paid_at,
      type: amount >= 0 ? "payment" : "refund",
      description: amount >= 0
        ? `Payment via ${p.method}${p.reference ? ` (${p.reference})` : ""}`
        : `Refund: ${p.reference ?? "No reference"}`,
      debit: 0,
      credit: Math.abs(amount),
      balance: 0,
      ref_id: p.id,
      student_id: relevantInvoices.find((i) => i.id === p.invoice_id)?.student_id ?? "",
    });
  }

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let running = 0;
  for (const e of entries) {
    running += e.debit - e.credit;
    e.balance = running;
  }

  entries.reverse();
  return entries;
}

// ── Student Fee Records ───────────────────────────────────────

export async function getStudentFeeRecords(): Promise<StudentFeeRecord[]> {
  if (!(await tablesExist(["fee_invoices", "fee_payments"]))) return [];
  const students = await fetchStudentRegister();
  const invoices = await getFeeInvoices();
  const concessions = await getAllConcessions();
  const payments = await getAllPayments();

  const concessionByStudent = new Map<string, FeeConcession[]>();
  for (const c of concessions) {
    const list = concessionByStudent.get(c.student_id) ?? [];
    list.push(c);
    concessionByStudent.set(c.student_id, list);
  }

  const paymentInvoices = new Map(payments.map((p) => [p.invoice_id, p]));
  const invoiceStudent = new Map(invoices.map((i) => [i.id, i.student_id]));

  return students.map((s) => {
    const invs = invoices.filter((i) => i.student_id === s.id);
    const cons = concessionByStudent.get(s.id) ?? [];
    const totalConcession = cons.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalBilled = invs.reduce((sum, i) => sum + Number(i.amount), 0);
    const totalPaid = invs.reduce((sum, i) => sum + Number(i.amount_paid), 0);
    const allDates = [
      ...invs.map((i) => i.created_at),
      ...cons.map((c) => c.created_at),
    ].sort().reverse();

    return {
      student_id: s.id,
      student_name: s.display_name,
      admission_no: s.admission_no,
      grade: s.grade ?? "",
      total_billed: totalBilled,
      total_concessions: totalConcession,
      net_billed: Math.max(0, totalBilled - totalConcession),
      total_paid: totalPaid,
      outstanding: Math.max(0, totalBilled - totalConcession - totalPaid),
      invoice_count: invs.length,
      last_activity: allDates[0] ?? null,
    };
  }).sort((a, b) => b.outstanding - a.outstanding);
}

// ── Computed helpers ───────────────────────────────────────────

export function getInvoiceStatus(invoice: FeeInvoice): string {
  const paid = Number(invoice.amount_paid);
  const total = Number(invoice.amount);
  if (paid <= 0 && invoice.due_date && new Date(invoice.due_date) < new Date()) return "overdue";
  if (paid >= total) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

export function calculateOutstanding(invoice: FeeInvoice): number {
  return Math.max(0, Number(invoice.amount) - Number(invoice.amount_paid));
}

export function getEffectiveAmount(invoice: FeeInvoice, concessions: FeeConcession[]): number {
  const totalConcession = concessions.reduce((s, c) => s + Number(c.amount), 0);
  return Math.max(0, Number(invoice.amount) - totalConcession);
}

export function getEffectiveOutstanding(invoice: FeeInvoice, concessions: FeeConcession[]): number {
  return Math.max(0, getEffectiveAmount(invoice, concessions) - Number(invoice.amount_paid));
}
