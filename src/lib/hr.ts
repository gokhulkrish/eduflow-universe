import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type LeaveType = { id: string; name: string; code: string; days_per_year: number; carry_forward: boolean; requires_approval: boolean; active: boolean };
export type LeaveBalance = { id: string; staff_id: string; leave_type_id: string; year: number; total_days: number; used_days: number; carried_days: number };
export type LeaveRequest = { id: string; staff_id: string; leave_type_id: string; start_date: string; end_date: string; days: number; reason: string | null; status: string; approved_by: string | null; approved_at: string | null; created_at: string };
export type PayrollRun = { id: string; name: string; period_start: string; period_end: string; payment_date: string | null; status: string; total_amount: number; employee_count: number; processed_at: string | null };
export type Appraisal = { id: string; staff_id: string; reviewer_id: string | null; review_period: string; overall_rating: number | null; comments: string | null; status: string; submitted_at: string | null; completed_at: string | null };
export type JobOpening = { id: string; title: string; department: string | null; location: string | null; type: string; status: string; posted_at: string; closes_at: string | null };
export type Candidate = { id: string; job_opening_id: string; name: string; email: string | null; phone: string | null; status: string; applied_at: string; notes: string | null };

export async function getStaff(): Promise<any[]> {
  if (!(await tableExists("staff"))) return [];
  const { data } = await supabase.from("staff").select("*").order("full_name");
  return (data ?? []) as any[];
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  if (!(await tableExists("leave_types"))) return [];
  const { data } = await supabase.from("leave_types").select("*").order("name");
  return (data ?? []) as LeaveType[];
}

export async function getLeaveBalances(staffId?: string): Promise<(LeaveBalance & { leave_name?: string })[]> {
  if (!(await tableExists("leave_balances"))) return [];
  const q = supabase.from("leave_balances").select("*");
  if (staffId) q.eq("staff_id", staffId);
  const { data } = await q;
  const rows = (data ?? []) as LeaveBalance[];
  const types = await getLeaveTypes();
  const tMap = new Map(types.map((t) => [t.id, t]));
  return rows.map((r) => ({ ...r, leave_name: tMap.get(r.leave_type_id)?.name }));
}

export async function getLeaveRequests(statusFilter?: string): Promise<(LeaveRequest & { staff_name?: string; leave_name?: string })[]> {
  if (!(await tableExists("leave_requests"))) return [];
  let q = supabase.from("leave_requests").select("*").order("created_at", { ascending: false });
  if (statusFilter) q = q.eq("status", statusFilter);
  const { data } = await q;
  const rows = (data ?? []) as LeaveRequest[];
  const [types, staff] = await Promise.all([getLeaveTypes(), getStaff()]);
  const tMap = new Map(types.map((t) => [t.id, t.name]));
  const sMap = new Map(staff.map((s: any) => [s.id, String(s.full_name ?? "").trim()]));
  return rows.map((r) => ({ ...r, staff_name: sMap.get(r.staff_id)?.trim(), leave_name: tMap.get(r.leave_type_id) }));
}

export async function createLeaveRequest(req: { staff_id: string; leave_type_id: string; start_date: string; end_date: string; days: number; reason?: string }): Promise<LeaveRequest> {
  if (!(await tableExists("leave_requests"))) throw new Error("Run HR migration first");
  const { data, error } = await supabase.from("leave_requests").insert({ ...req, reason: req.reason ?? null }).select("*").single();
  if (error) throw error; return data as unknown as LeaveRequest;
}

export async function updateLeaveStatus(id: string, status: string, approvedBy?: string): Promise<void> {
  if (!(await tableExists("leave_requests"))) return;
  const upd: any = { status };
  if (status === "approved" || status === "rejected") { upd.approved_by = approvedBy ?? null; upd.approved_at = new Date().toISOString(); }
  const { error } = await supabase.from("leave_requests").update(upd).eq("id", id);
  if (error) throw error;
}

export async function getPayrollRuns(): Promise<PayrollRun[]> {
  if (!(await tableExists("payroll_runs"))) return [];
  const { data } = await supabase.from("payroll_runs").select("*").order("period_start", { ascending: false });
  return (data ?? []) as PayrollRun[];
}

export async function createPayrollRun(run: { name: string; period_start: string; period_end: string; payment_date?: string; total_amount?: number; employee_count?: number }): Promise<PayrollRun> {
  if (!(await tableExists("payroll_runs"))) throw new Error("Run HR migration first");
  const { data, error } = await supabase.from("payroll_runs").insert(run).select("*").single();
  if (error) throw error; return data as unknown as PayrollRun;
}

export async function updatePayrollStatus(id: string, status: string): Promise<void> {
  if (!(await tableExists("payroll_runs"))) return;
  const upd: any = { status };
  if (status === "completed") upd.processed_at = new Date().toISOString();
  const { error } = await supabase.from("payroll_runs").update(upd).eq("id", id);
  if (error) throw error;
}

export async function getAppraisals(): Promise<(Appraisal & { staff_name?: string; reviewer_name?: string })[]> {
  if (!(await tableExists("appraisals"))) return [];
  const { data } = await supabase.from("appraisals").select("*").order("created_at", { ascending: false });
  const rows = (data ?? []) as Appraisal[];
  const staff = await getStaff();
  const sMap = new Map(staff.map((s: any) => [s.id, String(s.full_name ?? "").trim()]));
  return rows.map((r) => ({ ...r, staff_name: sMap.get(r.staff_id), reviewer_name: r.reviewer_id ? sMap.get(r.reviewer_id) : undefined }));
}

export async function getJobOpenings(): Promise<JobOpening[]> {
  if (!(await tableExists("job_openings"))) return [];
  const { data } = await supabase.from("job_openings").select("*").order("posted_at", { ascending: false });
  return (data ?? []) as JobOpening[];
}

export async function getCandidates(jobId?: string): Promise<(Candidate & { job_title?: string })[]> {
  if (!(await tableExists("candidates"))) return [];
  let q = supabase.from("candidates").select("*").order("applied_at", { ascending: false });
  if (jobId) q = q.eq("job_opening_id", jobId);
  const { data } = await q;
  const rows = (data ?? []) as Candidate[];
  const jobs = await getJobOpenings();
  const jMap = new Map(jobs.map((j) => [j.id, j.title]));
  return rows.map((r) => ({ ...r, job_title: jMap.get(r.job_opening_id) }));
}
