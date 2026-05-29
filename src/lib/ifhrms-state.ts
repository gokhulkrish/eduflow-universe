export interface IFHRMSEmployee {
  id: string;
  employeeNo: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: "active" | "inactive" | "suspended";
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IFHRMSLeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  leaveTypeId: string;
  leaveName: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
}

export interface IFHRMSPayrollRun {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string | null;
  status: "draft" | "processing" | "completed" | "cancelled";
  totalAmount: number;
  employeeCount: number;
  processedAt: string | null;
  createdAt: string;
}

export interface IFHRMSAppraisal {
  id: string;
  staffId: string;
  staffName: string;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewPeriod: string;
  overallRating: number | null;
  comments: string | null;
  status: "pending" | "submitted" | "completed";
  submittedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface IFHRMSJobOpening {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  type: string;
  status: "open" | "closed" | "filled";
  postedAt: string;
  closesAt: string | null;
}

export interface IFHRMSCandidate {
  id: string;
  jobOpeningId: string;
  jobTitle: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: "applied" | "screened" | "interviewed" | "offered" | "hired" | "rejected";
  appliedAt: string;
  notes: string | null;
  resumeUrl: string | null;
}

const EMPLOYEES_KEY = "eduflow.ifhrms.employees.v1";
const LEAVES_KEY = "eduflow.ifhrms.leaves.v1";
const PAYROLL_KEY = "eduflow.ifhrms.payroll.v1";

export function loadLocalEmployees(): IFHRMSEmployee[] {
  try { return JSON.parse(localStorage.getItem(EMPLOYEES_KEY) || "[]"); } catch { return []; }
}

export function saveLocalEmployees(data: IFHRMSEmployee[]): void {
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(data));
}

export function loadLocalLeaveRequests(): IFHRMSLeaveRequest[] {
  try { return JSON.parse(localStorage.getItem(LEAVES_KEY) || "[]"); } catch { return []; }
}

export function saveLocalLeaveRequests(data: IFHRMSLeaveRequest[]): void {
  localStorage.setItem(LEAVES_KEY, JSON.stringify(data));
}

export function loadLocalPayrollRuns(): IFHRMSPayrollRun[] {
  try { return JSON.parse(localStorage.getItem(PAYROLL_KEY) || "[]"); } catch { return []; }
}

export function saveLocalPayrollRuns(data: IFHRMSPayrollRun[]): void {
  localStorage.setItem(PAYROLL_KEY, JSON.stringify(data));
}
