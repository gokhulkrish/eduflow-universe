import "@/lib/runtime-storage";
import { emitAppSync } from "@/lib/app-sync";

export type Company = { id: string; name: string; industry: string; website: string; contacts: string; past_drives: number; offers_made: number; created_at: string; };
export type JobPosting = { id: string; title: string; company: string; company_id: string; location: string; description: string; requirements: string; salary: string; vacancy: number; deadline: string; status: string; created_at: string; };
export type PlacementRegistration = { id: string; job_id: string; student: string; registered_at: string; status: string; };
export type InterviewStage = { id: string; reg_id: string; stage: string; status: string; feedback: string; conducted_at: string; };

export const companiesKey = "eduflow_companies";
export const jobsKey = "eduflow_jobs";
export const placementRegistrationsKey = "eduflow_placement_regs";
export const interviewStagesKey = "eduflow_interviews";

function ls<T>(k: string, def: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(def)); } catch { return def; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export function getCompanies(): Company[] { return ls(companiesKey, []); }
export function createCompany(c: Omit<Company, "id" | "created_at">): Company {
  const items = getCompanies(); const n = { ...c, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  items.unshift(n); ss(companiesKey, items); return n;
}
export function updateCompany(id: string, p: Partial<Company>) { const items = getCompanies(); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(companiesKey, items); } }
export function deleteCompany(id: string) { ss(companiesKey, getCompanies().filter((x) => x.id !== id)); }

export function getJobs(): JobPosting[] { return ls(jobsKey, []); }
export function createJob(j: Omit<JobPosting, "id" | "created_at">): JobPosting {
  const items = getJobs(); const n = { ...j, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  items.unshift(n); ss(jobsKey, items); return n;
}
export function updateJob(id: string, p: Partial<JobPosting>) { const items = getJobs(); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(jobsKey, items); } }
export function deleteJob(id: string) { ss(jobsKey, getJobs().filter((x) => x.id !== id)); }

export function getRegistrations(jobId?: string): PlacementRegistration[] {
  const all = ls(placementRegistrationsKey, [] as PlacementRegistration[]); return jobId ? all.filter((r) => r.job_id === jobId) : all;
}
export function registerStudent(jobId: string, student: string): PlacementRegistration {
  const items = ls(placementRegistrationsKey, [] as PlacementRegistration[]); const n = { id: crypto.randomUUID(), job_id: jobId, student, registered_at: new Date().toISOString(), status: "registered" };
  items.push(n); ss(placementRegistrationsKey, items); return n;
}
export function updateRegistration(id: string, status: string) {
  const items = ls(placementRegistrationsKey, [] as PlacementRegistration[]); const i = items.findIndex((r) => r.id === id); if (i >= 0) { items[i].status = status; ss(placementRegistrationsKey, items); }
}

export function getInterviews(regId?: string): InterviewStage[] {
  const all = ls(interviewStagesKey, [] as InterviewStage[]); return regId ? all.filter((x) => x.reg_id === regId) : all;
}
export function addInterviewStage(regId: string, stage: string): InterviewStage {
  const items = ls(interviewStagesKey, [] as InterviewStage[]); const n = { id: crypto.randomUUID(), reg_id: regId, stage, status: "pending", feedback: "", conducted_at: "" };
  items.push(n); ss(interviewStagesKey, items); return n;
}
export function updateInterviewStage(id: string, p: Partial<InterviewStage>) {
  const items = ls(interviewStagesKey, [] as InterviewStage[]); const i = items.findIndex((x) => x.id === id); if (i >= 0) { items[i] = { ...items[i], ...p }; ss(interviewStagesKey, items); }
}

export function getPlacementAnalytics() {
  const jobs = getJobs(); const regs = getRegistrations(); const companies = getCompanies();
  const openJobs = jobs.filter((j) => j.status === "open");
  const totalVacancies = openJobs.reduce((s, j) => s + (j.vacancy || 1), 0);
  const placed = regs.filter((r) => r.status === "placed");
  return { totalJobs: jobs.length, openJobs: openJobs.length, totalVacancies, totalRegistrations: regs.length, placed: placed.length, companies: companies.length, avgSalary: jobs.filter((j) => j.salary).reduce((s, j) => s + (Number(j.salary.replace(/[^0-9.]/g, "")) || 0), 0) / Math.max(1, jobs.filter((j) => j.salary).length) };
}
