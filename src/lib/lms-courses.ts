import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
export type LmsCourse = { id: string; courseRoom: string; contentUnit: string; facultyOwner: string; engagementPercent: number; completionStatus: string; };
export const LMS_KEY = "eduflow_lms";
function h(r: any): LmsCourse { return { id: r.id, courseRoom: r.course_room ?? "", contentUnit: r.content_unit ?? "", facultyOwner: r.faculty_owner ?? "", engagementPercent: r.engagement_percent ?? 0, completionStatus: r.completion_status ?? "Not Started" }; }
function toDb(i: Omit<LmsCourse, "id">) { return { course_room: i.courseRoom, content_unit: i.contentUnit, faculty_owner: i.facultyOwner, engagement_percent: i.engagementPercent, completion_status: i.completionStatus }; }
function lf(): LmsCourse[] { try { return JSON.parse(localStorage.getItem(LMS_KEY) ?? "[]"); } catch { return []; } }
function sf(v: LmsCourse[]) { localStorage.setItem(LMS_KEY, JSON.stringify(v)); }
export async function getLmsCourses(): Promise<LmsCourse[]> {
  if (await tableExists("lms_courses")) { const { data } = await supabase.from("lms_courses").select("*").order("course_room"); return (data ?? []).map(h); }
  return lf();
}
export async function createLmsCourse(i: Omit<LmsCourse, "id">): Promise<LmsCourse> {
  if (await tableExists("lms_courses")) { const { data } = await supabase.from("lms_courses").insert(toDb(i)).select().single(); return h(data); }
  const item: LmsCourse = { id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2), ...i }; const items = lf(); items.push(item); sf(items); return item;
}
export async function updateLmsCourse(id: string, updates: Partial<LmsCourse>): Promise<void> {
  if (await tableExists("lms_courses")) {
    const db: any = {};
    if (updates.courseRoom !== undefined) db.course_room = updates.courseRoom;
    if (updates.contentUnit !== undefined) db.content_unit = updates.contentUnit;
    if (updates.facultyOwner !== undefined) db.faculty_owner = updates.facultyOwner;
    if (updates.engagementPercent !== undefined) db.engagement_percent = updates.engagementPercent;
    if (updates.completionStatus !== undefined) db.completion_status = updates.completionStatus;
    await supabase.from("lms_courses").update(db).eq("id", id);
    return;
  }
  const items = lf(); const idx = items.findIndex((c) => c.id === id); if (idx >= 0) { items[idx] = { ...items[idx], ...updates }; sf(items); }
}

export async function deleteLmsCourse(id: string): Promise<void> {
  if (await tableExists("lms_courses")) { await supabase.from("lms_courses").delete().eq("id", id); return; }
  sf(lf().filter((c) => c.id !== id));
}
