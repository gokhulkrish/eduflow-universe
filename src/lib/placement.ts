import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type Company = { id: string; name: string; industry: string; website: string; contacts: string; past_drives: number; offers_made: number; created_at: string; };
export type JobPosting = { id: string; title: string; company: string; company_id: string; location: string; description: string; requirements: string; salary: string; vacancy: number; deadline: string; status: string; created_at: string; };
export type PlacementRegistration = { id: string; job_id: string; student: string; registered_at: string; status: string; };
export type InterviewStage = { id: string; reg_id: string; stage: string; status: string; feedback: string; conducted_at: string; };

export const companiesKey = "eduflow_companies";
export const jobsKey = "eduflow_jobs";
export const placementRegistrationsKey = "eduflow_placement_regs";
export const interviewStagesKey = "eduflow_interviews";

function ls<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) ?? JSON.stringify(d)); } catch { return d; } }
function ss(k: string, v: any) { localStorage.setItem(k, JSON.stringify(v)); emitAppSync(k); }

export async function getCompanies(): Promise<Company[]> {
  const local = ls<Company[]>(companiesKey, []);
  try {
    if (!(await tableExists("placement_companies"))) return local;
    const { data } = await supabase.from("placement_companies").select("*").order("name");
    if (data && data.length > 0) {
      const mapped: Company[] = data.map((r: any) => ({
        id: r.id, name: r.name, industry: r.industry ?? "",
        website: r.website ?? "", contacts: r.contacts ?? "",
        past_drives: r.past_drives ?? 0, offers_made: r.offers_made ?? 0,
        created_at: r.created_at,
      }));
      ss(companiesKey, mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createCompany(c: Omit<Company, "id" | "created_at">): Promise<Company> {
  const n: Company = { ...c, id: generateId(), created_at: new Date().toISOString() };
  try {
    if (await tableExists("placement_companies")) {
      const { data } = await supabase.from("placement_companies").insert({
        name: c.name, industry: c.industry, website: c.website,
        contacts: c.contacts, past_drives: c.past_drives, offers_made: c.offers_made,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<Company[]>(companiesKey, []);
  items.unshift(n); ss(companiesKey, items); return n;
}

export async function updateCompany(id: string, p: Partial<Company>) {
  try {
    if (await tableExists("placement_companies")) {
      await supabase.from("placement_companies").update({
        ...(p.name !== undefined && { name: p.name }),
        ...(p.industry !== undefined && { industry: p.industry }),
        ...(p.website !== undefined && { website: p.website }),
        ...(p.contacts !== undefined && { contacts: p.contacts }),
        ...(p.past_drives !== undefined && { past_drives: p.past_drives }),
        ...(p.offers_made !== undefined && { offers_made: p.offers_made }),
      }).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<Company[]>(companiesKey, []);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ss(companiesKey, items); }
}

export async function deleteCompany(id: string) {
  try {
    if (await tableExists("placement_companies")) {
      await supabase.from("placement_companies").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(companiesKey, ls<Company[]>(companiesKey, []).filter((x) => x.id !== id));
}

export async function getJobs(): Promise<JobPosting[]> {
  const local = ls<JobPosting[]>(jobsKey, []);
  try {
    if (!(await tableExists("job_openings"))) return local;
    const { data } = await supabase.from("job_openings").select("*").order("posted_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped: JobPosting[] = data.map((r: any) => ({
        id: r.id, title: r.title, company: r.department ?? "", company_id: "",
        location: r.location ?? "", description: r.description ?? "",
        requirements: r.requirements ?? "", salary: r.salary ?? "",
        vacancy: r.vacancy ?? 1, deadline: r.closes_at ?? "",
        status: r.status ?? "draft", created_at: r.posted_at ?? r.created_at,
      }));
      ss(jobsKey, mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createJob(j: Omit<JobPosting, "id" | "created_at">): Promise<JobPosting> {
  const n: JobPosting = { ...j, id: generateId(), created_at: new Date().toISOString() };
  try {
    if (await tableExists("job_openings")) {
      const { data } = await supabase.from("job_openings").insert({
        title: j.title, department: j.company, location: j.location,
        type: "full_time", status: j.status || "draft",
        description: j.description, requirements: j.requirements,
        closes_at: j.deadline || null,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<JobPosting[]>(jobsKey, []);
  items.unshift(n); ss(jobsKey, items); return n;
}

export async function updateJob(id: string, p: Partial<JobPosting>) {
  try {
    if (await tableExists("job_openings")) {
      await supabase.from("job_openings").update({
        ...(p.title !== undefined && { title: p.title }),
        ...(p.company !== undefined && { department: p.company }),
        ...(p.location !== undefined && { location: p.location }),
        ...(p.description !== undefined && { description: p.description }),
        ...(p.requirements !== undefined && { requirements: p.requirements }),
        ...(p.salary !== undefined && { salary: p.salary }),
        ...(p.vacancy !== undefined && { vacancy: p.vacancy }),
        ...(p.deadline !== undefined && { closes_at: p.deadline }),
        ...(p.status !== undefined && { status: p.status }),
      }).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<JobPosting[]>(jobsKey, []);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ss(jobsKey, items); }
}

export async function deleteJob(id: string) {
  try {
    if (await tableExists("job_openings")) {
      await supabase.from("job_openings").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(jobsKey, ls<JobPosting[]>(jobsKey, []).filter((x) => x.id !== id));
}

export async function getRegistrations(jobId?: string): Promise<PlacementRegistration[]> {
  const all = ls(placementRegistrationsKey, [] as PlacementRegistration[]);
  try {
    if (!(await tableExists("placement_registrations"))) return jobId ? all.filter((r) => r.job_id === jobId) : all;
    let q = supabase.from("placement_registrations").select("*");
    if (jobId) q = q.eq("job_opening_id", jobId);
    const { data } = await q;
    if (data && data.length > 0) {
      const mapped: PlacementRegistration[] = data.map((r: any) => ({
        id: r.id, job_id: r.job_opening_id ?? "", student: r.student,
        registered_at: r.registered_at, status: r.status ?? "registered",
      }));
      return mapped;
    }
  } catch { /* fall through */ }
  return jobId ? all.filter((r) => r.job_id === jobId) : all;
}

export async function registerStudent(jobId: string, student: string): Promise<PlacementRegistration> {
  const n: PlacementRegistration = { id: generateId(), job_id: jobId, student, registered_at: new Date().toISOString(), status: "registered" };
  try {
    if (await tableExists("placement_registrations")) {
      const { data } = await supabase.from("placement_registrations").insert({
        job_opening_id: jobId, student, status: "registered",
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<PlacementRegistration[]>(placementRegistrationsKey, []);
  items.push(n); ss(placementRegistrationsKey, items); return n;
}

export async function updateRegistration(id: string, status: string) {
  try {
    if (await tableExists("placement_registrations")) {
      await supabase.from("placement_registrations").update({ status }).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<PlacementRegistration[]>(placementRegistrationsKey, []);
  const i = items.findIndex((r) => r.id === id);
  if (i >= 0) { items[i].status = status; ss(placementRegistrationsKey, items); }
}

export async function getInterviews(regId?: string): Promise<InterviewStage[]> {
  const all = ls(interviewStagesKey, [] as InterviewStage[]);
  try {
    if (!(await tableExists("interview_stages"))) return regId ? all.filter((x) => x.reg_id === regId) : all;
    let q = supabase.from("interview_stages").select("*");
    if (regId) q = q.eq("reg_id", regId);
    const { data } = await q;
    if (data && data.length > 0) {
      return data.map((r: any) => ({
        id: r.id, reg_id: r.reg_id, stage: r.stage,
        status: r.status ?? "pending", feedback: r.feedback ?? "",
        conducted_at: r.conducted_at ?? "",
      }));
    }
  } catch { /* fall through */ }
  return regId ? all.filter((x) => x.reg_id === regId) : all;
}

export async function addInterviewStage(regId: string, stage: string): Promise<InterviewStage> {
  const n: InterviewStage = { id: generateId(), reg_id: regId, stage, status: "pending", feedback: "", conducted_at: "" };
  try {
    if (await tableExists("interview_stages")) {
      const { data } = await supabase.from("interview_stages").insert({
        reg_id: regId, stage, status: "pending",
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls<InterviewStage[]>(interviewStagesKey, []);
  items.push(n); ss(interviewStagesKey, items); return n;
}

export async function updateInterviewStage(id: string, p: Partial<InterviewStage>) {
  try {
    if (await tableExists("interview_stages")) {
      await supabase.from("interview_stages").update({
        ...(p.stage !== undefined && { stage: p.stage }),
        ...(p.status !== undefined && { status: p.status }),
        ...(p.feedback !== undefined && { feedback: p.feedback }),
        ...(p.conducted_at !== undefined && { conducted_at: p.conducted_at }),
      }).eq("id", id);
    }
  } catch { /* fall through */ }
  const items = ls<InterviewStage[]>(interviewStagesKey, []);
  const i = items.findIndex((x) => x.id === id);
  if (i >= 0) { items[i] = { ...items[i], ...p }; ss(interviewStagesKey, items); }
}

export async function getPlacementAnalytics() {
  const [jobs, regs, companies] = await Promise.all([getJobs(), getRegistrations(), getCompanies()]);
  const openJobs = jobs.filter((j) => j.status === "open");
  const totalVacancies = openJobs.reduce((s, j) => s + (j.vacancy || 1), 0);
  const placed = regs.filter((r) => r.status === "placed");
  const avgSalary = jobs.filter((j) => j.salary).reduce((s, j) => s + (Number(j.salary.replace(/[^0-9.]/g, "")) || 0), 0) / Math.max(1, jobs.filter((j) => j.salary).length);
  return {
    totalJobs: jobs.length, openJobs: openJobs.length, totalVacancies,
    totalRegistrations: regs.length, placed: placed.length,
    companies: companies.length, avgSalary,
  };
}
