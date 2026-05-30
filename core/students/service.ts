import { z } from "zod";
import { supabase } from "../../src/integrations/supabase/client";
import { saveStudentRecord, deleteStudentRecord, studentRegisterSyncKey } from "../../src/lib/student-records";
import { emitAppSync } from "../../src/lib/app-sync";
import { isFeatureEnabled } from "../../src/lib/featureToggles";
import { writeAuditEntry } from "../audit/service";
import { refreshMonitoringSnapshot } from "../monitoring/snapshot";

export const createStudentSchema = z.object({
  firstName: z.string().min(2).max(60),
  lastName: z.string().max(80).optional(),
  admissionNo: z.string().regex(/^[A-Za-z0-9\-/]+$/),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(["Male", "Female", "Other"]),
  bloodGroup: z.string().optional(),
  nationality: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  grade: z.string().min(1),
  section: z.string().optional(),
  roll: z.string().optional(),
  stream: z.string().optional(),
  house: z.string().optional(),
  community: z.string().optional(),
  umisId: z.string().optional(),
  emisId: z.string().optional(),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

const LEGACY_STUDENT_STORAGE_KEY = "sms.student-register.v1";

function writeLegacyDual(student: Record<string, unknown>): void {
  try {
    const raw = localStorage.getItem(LEGACY_STUDENT_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    if (Array.isArray(existing)) {
      const idx = existing.findIndex((s: any) => s.id === student.id || s.studentId === student.id);
      if (idx >= 0) existing[idx] = student;
      else existing.unshift(student);
      localStorage.setItem(LEGACY_STUDENT_STORAGE_KEY, JSON.stringify(existing));
    }
  } catch {
    // legacy store not available
  }
}

function removeLegacyDual(studentId: string): void {
  try {
    const raw = localStorage.getItem(LEGACY_STUDENT_STORAGE_KEY);
    if (!raw) return;
    const existing = JSON.parse(raw);
    if (Array.isArray(existing)) {
      localStorage.setItem(
        LEGACY_STUDENT_STORAGE_KEY,
        JSON.stringify(existing.filter((s: any) => s.id !== studentId && s.studentId !== studentId)),
      );
    }
  } catch {
    // legacy store not available
  }
}

export async function bulkTransfer(
  rows: { sourceRow: Record<string, string>; mapped: Record<string, string>; action: 'insert' | 'update' | 'skip'; existingId?: string }[],
  batchId: string,
): Promise<{ inserted: number; updated: number; skipped: number; failed: number; errors: { rowNumber: number; message: string }[] }> {
  const result = { inserted: 0, updated: 0, skipped: 0, failed: 0, errors: [] as { rowNumber: number; message: string }[] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.action === 'skip') { result.skipped++; continue; }

    try {
      const values: Record<string, string> = {
        ...row.mapped,
        ...(row.action === 'update' && row.existingId ? { studentId: row.existingId, id: row.existingId } : {}),
      };
      const saved = await saveStudentRecord(values);

      const studentId = String(saved.id);
      await supabase.from('students').update({
        meta: ((saved as any).meta ? { ...(saved as any).meta as Record<string, unknown>, import: { ...((saved as any).meta as any)?.import ?? {}, batchId } } : { import: { batchId } }) as any,
        updated_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      } as any).eq('id', studentId);

      if (row.action === 'insert') result.inserted++;
      else result.updated++;
    } catch (err) {
      result.failed++;
      result.errors.push({ rowNumber: i, message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  if (result.updated + result.inserted > 0) {
    emitAppSync(studentRegisterSyncKey);
  }

  return result;
}

export async function createStudent(input: CreateStudentInput) {
  const parsed = createStudentSchema.parse(input);

  if (isFeatureEnabled("useNewStudentWrites")) {
    const saved = await saveStudentRecord(parsed as Record<string, string>);

    if (isFeatureEnabled("useDualWrite")) {
      writeLegacyDual(saved as unknown as Record<string, unknown>);
    }

    await writeAuditEntry({
      actorId: (await supabase.auth.getUser()).data.user?.id ?? null,
      action: "core.student.created",
      entity: "students",
      entityId: saved.id,
      after: parsed as unknown as Record<string, unknown>,
      source: "native",
    });

    const tenantId = String((saved as any)?.institution_id ?? "");
    if (tenantId) {
      void refreshMonitoringSnapshot({ tenantId }).catch(() => {});
    }

    return saved;
  }

  const saved = await saveStudentRecord(parsed as Record<string, string>);
  const tenantId = String((saved as any)?.institution_id ?? "");
  if (tenantId) {
    void refreshMonitoringSnapshot({ tenantId }).catch(() => {});
  }
  return saved;
}

export async function updateStudent(studentId: string, input: Partial<CreateStudentInput>) {
  const values: Record<string, string> = {
    studentId,
    ...Object.fromEntries(Object.entries(input).filter(([_, v]) => v !== undefined)),
  };

  if (isFeatureEnabled("useNewStudentWrites")) {
    const { data: before } = await supabase.from("students").select("*").eq("id", studentId).single();
    const saved = await saveStudentRecord(values);

    if (isFeatureEnabled("useDualWrite")) {
      writeLegacyDual(saved as unknown as Record<string, unknown>);
    }

    await writeAuditEntry({
      actorId: (await supabase.auth.getUser()).data.user?.id ?? null,
      action: "core.student.updated",
      entity: "students",
      entityId: studentId,
      before: before as unknown as Record<string, unknown>,
      after: input as unknown as Record<string, unknown>,
      source: "native",
    });

    const tenantId = String((saved as any)?.institution_id ?? "");
    if (tenantId) {
      void refreshMonitoringSnapshot({ tenantId }).catch(() => {});
    }

    return saved;
  }

  const saved = await saveStudentRecord(values);
  const tenantId = String((saved as any)?.institution_id ?? "");
  if (tenantId) {
    void refreshMonitoringSnapshot({ tenantId }).catch(() => {});
  }
  return saved;
}

export async function deactivateStudent(studentId: string, reason?: string) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? null;
  const leftOn = new Date().toISOString().slice(0, 10);

  const { error: studentError } = await supabase
    .from("students")
    .update({ status: "transferred" })
    .eq("id", studentId);

  if (studentError) throw studentError;

  const { data: before } = await supabase
    .from("enrollments")
    .select("*")
    .eq("student_id", studentId)
    .single();

  const { error } = await supabase
    .from("enrollments")
    .update({ status: "transferred", left_on: leftOn })
    .eq("student_id", studentId);

  if (error) throw error;

  if (isFeatureEnabled("useDualWrite")) {
    removeLegacyDual(studentId);
  }

  await writeAuditEntry({
    actorId: userId,
    action: "core.student.deactivated",
    entity: "students",
    entityId: studentId,
    before: before as unknown as Record<string, unknown>,
    after: { status: "transferred", leftOn },
    metadata: { reason: reason ?? null, leftOn },
    source: "native",
  });

  emitAppSync(studentRegisterSyncKey);
  const tenantId = String((before as any)?.institution_id ?? "");
  if (tenantId) {
    void refreshMonitoringSnapshot({ tenantId }).catch(() => {});
  }
}

export async function deleteStudentPermanently(studentId: string) {
  if (isFeatureEnabled("useDualWrite")) {
    removeLegacyDual(studentId);
  }
  return deleteStudentRecord(studentId);
}
