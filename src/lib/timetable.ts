import { supabase } from "@/integrations/supabase/client";
import { readSupabaseRows } from "@/lib/supabase-query";
import { tableExists, tablesExist } from "@/lib/supabase-health";

export type TimeSlot = {
  id: string;
  name: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_break: boolean;
  created_at: string;
};

export type TimetableEntry = {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  time_slot_id: string;
  day_of_week: number;
  academic_year_id: string | null;
  room: string | null;
  created_at: string;
  updated_at: string;
};

export type TimetableEntryJoined = TimetableEntry & {
  subject_name?: string;
  subject_code?: string;
  teacher_name?: string;
  slot_name?: string;
  start_time?: string;
  end_time?: string;
  is_break?: boolean;
  grade?: string;
  section?: string;
};

export type Substitution = {
  id: string;
  timetable_entry_id: string;
  original_teacher_id: string;
  substitute_teacher_id: string;
  date: string;
  reason: string | null;
  status: string;
  created_at: string;
};

export type SubstitutionJoined = Substitution & {
  original_teacher_name?: string;
  substitute_teacher_name?: string;
  subject_name?: string;
  class_name?: string;
};

export type GridCell = {
  entry: TimetableEntryJoined | null;
  slot: TimeSlot;
};

export type TimetableGrid = Map<number, GridCell[]>; // day_of_week -> cells

export type Conflict = {
  type: "teacher" | "room";
  description: string;
  day: number;
  period: string;
  entries: TimetableEntryJoined[];
};

export type TeacherWorkload = {
  teacher_id: string;
  teacher_name: string;
  total_periods: number;
  periods_per_day: number[];
};

export type TimetableClass = {
  id: string;
  grade: string | null;
  section: string | null;
  stream?: string | null;
};

export type TimetableSubject = {
  id: string;
  name: string;
  code: string | null;
};

export type TimetableStaff = {
  id: string;
  full_name: string;
  status: string;
};

export type TimetableSchemaStatus = {
  ready: boolean;
  missingTables: string[];
};

const REQUIRED_TIMETABLE_TABLES = ["time_slots", "timetable_entries", "substitutions", "classes", "subjects", "staff"] as const;

export async function getTimetableSchemaStatus(): Promise<TimetableSchemaStatus> {
  const checks = await Promise.all(
    REQUIRED_TIMETABLE_TABLES.map(async (table) => ({ table, exists: await tableExists(table) }))
  );
  const missingTables = checks.filter((check) => !check.exists).map((check) => check.table);
  return { ready: missingTables.length === 0, missingTables };
}

export async function getTimetableClasses(): Promise<TimetableClass[]> {
  if (!(await tableExists("classes"))) return [];
  const result = await supabase.from("classes").select("id,grade,section,stream").order("grade").returns<TimetableClass[]>();
  return readSupabaseRows(result, []);
}

export async function getTimetableSubjects(): Promise<TimetableSubject[]> {
  if (!(await tableExists("subjects"))) return [];
  const result = await supabase.from("subjects").select("id,name,code").order("name").returns<TimetableSubject[]>();
  return readSupabaseRows(result, []);
}

export async function getTimetableStaff(): Promise<TimetableStaff[]> {
  if (!(await tableExists("staff"))) return [];
  const result = await supabase.from("staff").select("id,full_name,status").eq("status", "active").order("full_name").returns<TimetableStaff[]>();
  return readSupabaseRows(result, []);
}

async function timetableCoreReady(): Promise<boolean> {
  return tablesExist(["time_slots", "timetable_entries", "classes", "subjects", "staff"]);
}

export async function getTimeSlots(): Promise<TimeSlot[]> {
  if (!(await tableExists("time_slots"))) return [];
  const { data, error } = await supabase.from("time_slots").select("*").order("day_of_week").order("start_time");
  if (error) throw error;
  return (data ?? []) as unknown as TimeSlot[];
}

export async function saveTimeSlot(slot: Omit<TimeSlot, "id" | "created_at"> & { id?: string }): Promise<TimeSlot> {
  if (!(await tableExists("time_slots"))) throw new Error("Run timetable migration first");
  if (slot.id) {
    const { data, error } = await supabase.from("time_slots").update({ name: slot.name, start_time: slot.start_time, end_time: slot.end_time, is_break: slot.is_break }).eq("id", slot.id).select("*").single();
    if (error) throw error;
    return data as unknown as TimeSlot;
  }
  const { data, error } = await supabase.from("time_slots").insert({ name: slot.name, day_of_week: slot.day_of_week, start_time: slot.start_time, end_time: slot.end_time, is_break: slot.is_break }).select("*").single();
  if (error) throw error;
  return data as unknown as TimeSlot;
}

export async function deleteTimeSlot(id: string): Promise<void> {
  if (!(await tableExists("time_slots"))) return;
  const { error } = await supabase.from("time_slots").delete().eq("id", id);
  if (error) throw error;
}

export async function getTimetableEntries(classId?: string): Promise<TimetableEntryJoined[]> {
  if (!(await timetableCoreReady())) return [];
  let q = supabase.from("timetable_entries").select("*");
  if (classId) q = q.eq("class_id", classId);
  const { data, error } = await q;
  if (error) throw error;
  const entries = (data ?? []) as unknown as TimetableEntry[];

  const [slots, subjects, staffList, classes] = await Promise.all([
    getTimeSlots(),
    getTimetableSubjects(),
    getTimetableStaff(),
    getTimetableClasses(),
  ]);

  const slotMap = new Map(slots.map((s) => [s.id, s]));
  const subjMap = new Map(subjects.map((s) => [s.id, s]));
  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  return entries.map((e) => {
    const slot = slotMap.get(e.time_slot_id);
    const subj = subjMap.get(e.subject_id);
    const teacher = staffMap.get(e.teacher_id);
    const cls = classMap.get(e.class_id);
    return {
      ...e,
      subject_name: subj?.name,
      subject_code: subj?.code ?? undefined,
      teacher_name: teacher ? String(teacher.full_name ?? "").trim() : undefined,
      slot_name: slot?.name,
      start_time: slot?.start_time,
      end_time: slot?.end_time,
      is_break: slot?.is_break,
      grade: cls?.grade ?? undefined,
      section: cls?.section ?? undefined,
    };
  });
}

export async function saveTimetableEntry(e: Omit<TimetableEntry, "id" | "created_at" | "updated_at"> & { id?: string }): Promise<TimetableEntry> {
  if (!(await tableExists("timetable_entries"))) throw new Error("Run timetable migration first");
  if (e.id) {
    const { data, error } = await supabase.from("timetable_entries").update({ subject_id: e.subject_id, teacher_id: e.teacher_id, room: e.room }).eq("id", e.id).select("*").single();
    if (error) throw error;
    return data as unknown as TimetableEntry;
  }
  const { data, error } = await supabase.from("timetable_entries").insert({ class_id: e.class_id, subject_id: e.subject_id, teacher_id: e.teacher_id, time_slot_id: e.time_slot_id, day_of_week: e.day_of_week, academic_year_id: e.academic_year_id, room: e.room }).select("*").single();
  if (error) throw error;
  return data as unknown as TimetableEntry;
}

export async function deleteTimetableEntry(id: string): Promise<void> {
  if (!(await tableExists("timetable_entries"))) return;
  const { error } = await supabase.from("timetable_entries").delete().eq("id", id);
  if (error) throw error;
}

export function buildGrid(entries: TimetableEntryJoined[], slots: TimeSlot[]): Map<number, GridCell[]> {
  const grid = new Map<number, GridCell[]>();
  const bySlot = new Map(entries.map((e) => [`${e.day_of_week}-${e.time_slot_id}`, e]));
  for (let d = 0; d <= 6; d++) {
    const daySlots = slots.filter((s) => s.day_of_week === d);
    grid.set(d, daySlots.map((slot) => ({
      slot,
      entry: bySlot.get(`${d}-${slot.id}`) ?? null,
    })));
  }
  return grid;
}

export function detectConflicts(entries: TimetableEntryJoined[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const teacherDaySlot = new Map<string, TimetableEntryJoined[]>();

  for (const e of entries) {
    const key = `${e.teacher_id}-${e.day_of_week}-${e.time_slot_id}`;
    const list = teacherDaySlot.get(key) ?? [];
    list.push(e);
    teacherDaySlot.set(key, list);
  }

  for (const [, list] of teacherDaySlot) {
    if (list.length > 1) {
      conflicts.push({
        type: "teacher",
        description: `${list[0].teacher_name} has ${list.length} classes in same period`,
        day: list[0].day_of_week,
        period: list[0].slot_name ?? "",
        entries: list,
      });
    }
  }

  return conflicts;
}

export function getTeacherWorkload(entries: TimetableEntryJoined[]): TeacherWorkload[] {
  const byTeacher = new Map<string, { name: string; perDay: number[] }>();
  for (const e of entries) {
    if (!e.teacher_id) continue;
    const t = byTeacher.get(e.teacher_id) ?? { name: e.teacher_name ?? "Unknown", perDay: [0, 0, 0, 0, 0, 0, 0] };
    t.perDay[e.day_of_week]++;
    byTeacher.set(e.teacher_id, t);
  }
  return [...byTeacher.entries()].map(([teacher_id, t]) => ({
    teacher_id,
    teacher_name: t.name,
    total_periods: t.perDay.reduce((a, b) => a + b, 0),
    periods_per_day: t.perDay,
  })).sort((a, b) => b.total_periods - a.total_periods);
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function getSubstitutions(dateFilter?: string): Promise<SubstitutionJoined[]> {
  if (!(await tableExists("substitutions")) || !(await timetableCoreReady())) return [];
  let q = supabase.from("substitutions").select("*").order("date", { ascending: false });
  if (dateFilter) q = q.eq("date", dateFilter);
  const { data, error } = await q;
  if (error) throw error;
  const subs = (data ?? []) as unknown as Substitution[];

  const [entries, staffList] = await Promise.all([
    getTimetableEntries(),
    getTimetableStaff(),
  ]);
  const entryMap = new Map(entries.map((e) => [e.id, e]));
  const staffMap = new Map(staffList.map((s) => [s.id, s]));
  const nameOf = (id: string) => { const s = staffMap.get(id); return s ? String(s.full_name ?? "").trim() : "Unknown"; };

  return subs.map((s) => {
    const entry = entryMap.get(s.timetable_entry_id);
    return {
      ...s,
      original_teacher_name: nameOf(s.original_teacher_id),
      substitute_teacher_name: nameOf(s.substitute_teacher_id),
      subject_name: entry?.subject_name,
      class_name: entry?.grade ? `${entry.grade}${entry.section ? ` ${entry.section}` : ""}` : undefined,
    };
  });
}

export async function createSubstitution(sub: Omit<Substitution, "id" | "created_at">): Promise<Substitution> {
  if (!(await tableExists("substitutions"))) throw new Error("Run timetable migration first");
  const { data, error } = await supabase.from("substitutions").insert({
    timetable_entry_id: sub.timetable_entry_id,
    original_teacher_id: sub.original_teacher_id,
    substitute_teacher_id: sub.substitute_teacher_id,
    date: sub.date,
    reason: sub.reason,
    status: sub.status,
  }).select("*").single();
  if (error) throw error;
  return data as unknown as Substitution;
}

export async function updateSubstitutionStatus(id: string, status: string): Promise<void> {
  if (!(await tableExists("substitutions"))) return;
  const { error } = await supabase.from("substitutions").update({ status }).eq("id", id);
  if (error) throw error;
}
