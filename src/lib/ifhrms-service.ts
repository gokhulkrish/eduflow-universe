import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";
import {
  getStaff, getLeaveTypes, getLeaveBalances, getLeaveRequests, createLeaveRequest, updateLeaveStatus,
  getPayrollRuns, createPayrollRun, updatePayrollStatus,
  getAppraisals, getJobOpenings, getCandidates,
  type LeaveType, type LeaveBalance,
} from "@/lib/hr";
import {
  type IFHRMSEmployee, type IFHRMSLeaveRequest, type IFHRMSPayrollRun, type IFHRMSAppraisal,
  type IFHRMSJobOpening, type IFHRMSCandidate,
  loadLocalEmployees, saveLocalEmployees,
  loadLocalLeaveRequests, saveLocalLeaveRequests,
  loadLocalPayrollRuns, saveLocalPayrollRuns,
} from "@/lib/ifhrms-state";

async function writeAudit(action: string, entityId: string, metadata: Record<string, unknown>) {
  try {
    if (!(await tableExists("audit_log"))) return;
    const { data: auth } = await supabase.auth.getUser();
    await supabase.from("audit_log").insert({
      actor: auth?.user?.id ?? null,
      action,
      entity: "ifhrms",
      entity_id: entityId,
      metadata,
    });
  } catch {}
}

export async function loadEmployees(): Promise<IFHRMSEmployee[]> {
  try {
    if (await tableExists("staff" as any)) {
      const { data, error } = await supabase.from("staff").select("*").order("full_name");
      if (error) throw error;
      return (data ?? []).map((s: any) => ({
        id: s.id,
        employeeNo: s.employee_no ?? "",
        fullName: s.full_name ?? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
        email: s.email ?? "",
        phone: s.phone ?? "",
        department: s.department ?? s.department_id ?? "",
        designation: s.designation ?? "",
        status: (s.status === "active" || s.status === "inactive" ? s.status : "active") as "active" | "inactive" | "suspended",
        userId: s.user_id ?? null,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
      }));
    }
  } catch {}
  return loadLocalEmployees();
}

export async function loadLeaveTypesData(): Promise<LeaveType[]> {
  try { return await getLeaveTypes(); } catch { return []; }
}

export async function loadLeaveBalancesData(staffId?: string): Promise<(LeaveBalance & { leave_name?: string })[]> {
  try { return await getLeaveBalances(staffId); } catch { return []; }
}

export async function loadLeaveRequestsData(): Promise<IFHRMSLeaveRequest[]> {
  try {
    const rows = await getLeaveRequests();
    return rows.map((r: any) => ({
      id: r.id,
      staffId: r.staff_id,
      staffName: r.staff_name ?? "",
      leaveTypeId: r.leave_type_id,
      leaveName: r.leave_name ?? "",
      startDate: r.start_date,
      endDate: r.end_date,
      days: r.days,
      reason: r.reason ?? null,
      status: (["pending", "approved", "rejected", "cancelled"].includes(r.status) ? r.status : "pending") as IFHRMSLeaveRequest["status"],
      approvedBy: r.approved_by ?? null,
      approvedAt: r.approved_at ?? null,
      createdAt: r.created_at,
    }));
  } catch {}
  return loadLocalLeaveRequests();
}

export async function createLeaveRequestAction(data: { staffId: string; leaveTypeId: string; startDate: string; endDate: string; days: number; reason?: string }): Promise<IFHRMSLeaveRequest> {
  const s = new Date(data.startDate), e = new Date(data.endDate);
  const days = data.days || Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const result = await createLeaveRequest({
    staff_id: data.staffId, leave_type_id: data.leaveTypeId,
    start_date: data.startDate, end_date: data.endDate, days, reason: data.reason,
  });
  writeAudit("ifhrms.leave.created", result.id, { staffId: data.staffId, days });
  return (await loadLeaveRequestsData()).find((r) => r.id === result.id)!;
}

export async function approveLeaveAction(id: string): Promise<void> {
  await updateLeaveStatus(id, "approved");
  writeAudit("ifhrms.leave.approved", id, {});
}

export async function rejectLeaveAction(id: string): Promise<void> {
  await updateLeaveStatus(id, "rejected");
  writeAudit("ifhrms.leave.rejected", id, {});
}

export async function loadPayrollRunsData(): Promise<IFHRMSPayrollRun[]> {
  try {
    const rows = await getPayrollRuns();
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      paymentDate: r.payment_date ?? null,
      status: (["draft", "processing", "completed", "cancelled"].includes(r.status) ? r.status : "draft") as IFHRMSPayrollRun["status"],
      totalAmount: r.total_amount ?? 0,
      employeeCount: r.employee_count ?? 0,
      processedAt: r.processed_at ?? null,
      createdAt: r.created_at,
    }));
  } catch {}
  return loadLocalPayrollRuns();
}

export async function createPayrollRunAction(data: { name: string; periodStart: string; periodEnd: string; paymentDate?: string; employeeCount?: number }): Promise<IFHRMSPayrollRun> {
  const result = await createPayrollRun({
    name: data.name, period_start: data.periodStart, period_end: data.periodEnd,
    payment_date: data.paymentDate, employee_count: data.employeeCount ?? 0,
  });
  writeAudit("ifhrms.payroll.created", result.id, { name: data.name });
  return (await loadPayrollRunsData()).find((r) => r.id === result.id)!;
}

export async function processPayrollRun(id: string): Promise<void> {
  await updatePayrollStatus(id, "processing");
  writeAudit("ifhrms.payroll.processed", id, {});
}

export async function completePayrollRun(id: string): Promise<void> {
  await updatePayrollStatus(id, "completed");
  writeAudit("ifhrms.payroll.completed", id, {});
}

export async function loadAppraisalsData(): Promise<IFHRMSAppraisal[]> {
  try {
    const rows = await getAppraisals();
    return rows.map((a: any) => ({
      id: a.id,
      staffId: a.staff_id,
      staffName: a.staff_name ?? "",
      reviewerId: a.reviewer_id ?? null,
      reviewerName: a.reviewer_name ?? null,
      reviewPeriod: a.review_period,
      overallRating: a.overall_rating ?? null,
      comments: a.comments ?? null,
      status: (["pending", "submitted", "completed"].includes(a.status) ? a.status : "pending") as IFHRMSAppraisal["status"],
      submittedAt: a.submitted_at ?? null,
      completedAt: a.completed_at ?? null,
      createdAt: a.created_at,
    }));
  } catch { return []; }
}

export async function loadJobOpeningsData(): Promise<IFHRMSJobOpening[]> {
  try {
    const rows = await getJobOpenings();
    return rows.map((j: any) => ({
      id: j.id,
      title: j.title,
      department: j.department ?? null,
      location: j.location ?? null,
      type: j.type,
      status: (["open", "closed", "filled"].includes(j.status) ? j.status : "open") as IFHRMSJobOpening["status"],
      postedAt: j.posted_at,
      closesAt: j.closes_at ?? null,
    }));
  } catch { return []; }
}

export async function loadCandidatesData(): Promise<IFHRMSCandidate[]> {
  try {
    const rows = await getCandidates();
    return rows.map((c: any) => ({
      id: c.id,
      jobOpeningId: c.job_opening_id,
      jobTitle: c.job_title ?? "",
      name: c.name,
      email: c.email ?? null,
      phone: c.phone ?? null,
      status: (["applied", "screened", "interviewed", "offered", "hired", "rejected"].includes(c.status) ? c.status : "applied") as IFHRMSCandidate["status"],
      appliedAt: c.applied_at,
      notes: c.notes ?? null,
      resumeUrl: c.resume_url ?? null,
    }));
  } catch { return []; }
}

export async function bulkImportEmployees(
  rows: Array<{ name: string; email: string; department: string; designation: string }>
): Promise<{ success: boolean; created: number; errors: string[] }> {
  const errors: string[] = [];
  let created = 0;
  for (const row of rows) {
    if (!row.name?.trim()) { errors.push("Row: name missing"); continue; }
    try {
      if (await tableExists("staff" as any)) {
        const { error } = await supabase.from("staff").insert({
          employee_no: `EMP${Date.now()}${created}`,
          full_name: row.name.trim(),
          email: row.email?.trim() || null,
          department: row.department?.trim() || null,
          designation: row.designation?.trim() || null,
          status: "active",
        });
        if (error) { errors.push(`${row.name}: ${error.message}`); continue; }
      } else {
        const emps = loadLocalEmployees();
        emps.push({
          id: generateId(),
          employeeNo: `EMP${Date.now()}${created}`,
          fullName: row.name.trim(),
          email: row.email?.trim() || "",
          phone: "",
          department: row.department?.trim() || "",
          designation: row.designation?.trim() || "",
          status: "active",
          userId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        saveLocalEmployees(emps);
      }
      created++;
    } catch (e: any) { errors.push(`${row.name}: ${e.message}`); }
  }
  return { success: errors.length === 0 || created > 0, created, errors };
}
