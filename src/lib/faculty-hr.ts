import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

export type FacultyHr = {
  id: string;
  facultyName: string;
  employeeCode: string;
  designation: string;
  departmentName: string;
  workloadHours: number;
  employmentStatus: string;
};

export const FACULTY_HR_KEY = "eduflow_faculty_hr";
export const EMPLOYMENT_STATUSES = ["Active", "On Leave", "Contract", "Relieved", "Retired"];

function hydrate(row: any): FacultyHr {
  return { id: row.id, facultyName: row.faculty_name ?? "", employeeCode: row.employee_code ?? "", designation: row.designation ?? "", departmentName: row.department_name ?? "", workloadHours: row.workload_hours ?? 0, employmentStatus: row.employment_status ?? "" };
}

function loadFallback(): FacultyHr[] {
  try { return JSON.parse(localStorage.getItem(FACULTY_HR_KEY) ?? "[]"); } catch { return []; }
}

function saveFallback(items: FacultyHr[]) {
  localStorage.setItem(FACULTY_HR_KEY, JSON.stringify(items));
}

export async function getFaculty(): Promise<FacultyHr[]> {
  if (await tableExists("faculty_hr")) {
    const { data } = await supabase.from("faculty_hr").select("*").order("faculty_name");
    return (data ?? []).map(hydrate);
  }
  return loadFallback();
}

export async function createFaculty(input: Omit<FacultyHr, "id">): Promise<FacultyHr> {
  if (await tableExists("faculty_hr")) {
    const payload = { faculty_name: input.facultyName, employee_code: input.employeeCode, designation: input.designation, department_name: input.departmentName, workload_hours: input.workloadHours, employment_status: input.employmentStatus };
    const { data } = await supabase.from("faculty_hr").insert(payload).select().single();
    return hydrate(data);
  }
  const items = loadFallback();
  const item: FacultyHr = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...input };
  items.push(item);
  saveFallback(items);
  return item;
}

export async function deleteFaculty(id: string): Promise<void> {
  if (await tableExists("faculty_hr")) {
    await supabase.from("faculty_hr").delete().eq("id", id);
    return;
  }
  saveFallback(loadFallback().filter((e) => e.id !== id));
}
