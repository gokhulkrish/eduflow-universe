/**
 * Timetable State Contracts & Persistence
 * 
 * This module defines the contracts and state management for Timetable module.
 * Used to defer rollout until workflow, persistence, and state contracts are confirmed safe.
 */

export interface TimeSlotContract {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  order: number;
}

export interface TimetableEntryContract {
  id: string;
  classId: string;
  subjectId: string;
  staffId?: string;
  dayOfWeek: string;
  timeSlotId: string;
  room?: string;
  isSubstitution: boolean;
  createdAt: string;
}

export interface TimetableSubstitutionContract {
  id: string;
  entryId: string;
  substituteStaffId: string;
  date: string;
  reason?: string;
  approvedAt?: string;
  status: "pending" | "approved" | "rejected";
}

export interface TimetablePersistenceContract {
  timeSlots: TimeSlotContract[];
  entries: TimetableEntryContract[];
  substitutions: TimetableSubstitutionContract[];
  conflicts: string[];
  lastSyncAt: string;
}

export const DEFAULT_TIME_SLOTS: TimeSlotContract[] = [
  { id: "slot-1", name: "Period 1", startTime: "09:00", endTime: "09:45", duration: 45, order: 1 },
  { id: "slot-2", name: "Period 2", startTime: "09:45", endTime: "10:30", duration: 45, order: 2 },
  { id: "slot-3", name: "Period 3", startTime: "10:30", endTime: "11:15", duration: 45, order: 3 },
  { id: "slot-4", name: "Period 4", startTime: "11:15", endTime: "12:00", duration: 45, order: 4 },
  { id: "slot-break", name: "Lunch Break", startTime: "12:00", endTime: "12:45", duration: 45, order: 5 },
  { id: "slot-5", name: "Period 5", startTime: "12:45", endTime: "13:30", duration: 45, order: 6 },
  { id: "slot-6", name: "Period 6", startTime: "13:30", endTime: "14:15", duration: 45, order: 7 },
  { id: "slot-7", name: "Period 7", startTime: "14:15", endTime: "15:00", duration: 45, order: 8 },
];

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIMETABLE_SLOTS_KEY = "eduflow.timetable.slots.v1";
const TIMETABLE_ENTRIES_KEY = "eduflow.timetable.entries.v1";
const TIMETABLE_SUBS_KEY = "eduflow.timetable.substitutions.v1";
const TIMETABLE_CONFLICTS_KEY = "eduflow.timetable.conflicts.v1";

export function loadTimetableState(): TimetablePersistenceContract {
  try {
    return {
      timeSlots: JSON.parse(localStorage.getItem(TIMETABLE_SLOTS_KEY) || JSON.stringify(DEFAULT_TIME_SLOTS)),
      entries: JSON.parse(localStorage.getItem(TIMETABLE_ENTRIES_KEY) || "[]"),
      substitutions: JSON.parse(localStorage.getItem(TIMETABLE_SUBS_KEY) || "[]"),
      conflicts: JSON.parse(localStorage.getItem(TIMETABLE_CONFLICTS_KEY) || "[]"),
      lastSyncAt: new Date().toISOString(),
    };
  } catch {
    return {
      timeSlots: DEFAULT_TIME_SLOTS,
      entries: [],
      substitutions: [],
      conflicts: [],
      lastSyncAt: new Date().toISOString(),
    };
  }
}

export function saveTimetableState(state: TimetablePersistenceContract): {
  success: boolean;
  error?: string;
} {
  try {
    localStorage.setItem(TIMETABLE_SLOTS_KEY, JSON.stringify(state.timeSlots));
    localStorage.setItem(TIMETABLE_ENTRIES_KEY, JSON.stringify(state.entries));
    localStorage.setItem(TIMETABLE_SUBS_KEY, JSON.stringify(state.substitutions));
    localStorage.setItem(TIMETABLE_CONFLICTS_KEY, JSON.stringify(state.conflicts));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function detectTimetableConflicts(state: TimetablePersistenceContract): string[] {
  const conflicts: string[] = [];
  const staffSchedule = new Map<string, Set<string>>();

  for (const entry of state.entries) {
    if (!entry.staffId) continue;

    const key = `${entry.dayOfWeek}:${entry.timeSlotId}`;
    const staffKey = `${entry.staffId}:${key}`;

    if (staffSchedule.has(staffKey)) {
      conflicts.push(`Staff ${entry.staffId} has conflicting class on ${entry.dayOfWeek}`);
    } else {
      staffSchedule.set(staffKey, new Set());
    }
  }

  return [...new Set(conflicts)];
}

export function validateTimetableEntry(entry: Partial<TimetableEntryContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!entry.classId?.trim()) errors.push("Class is required");
  if (!entry.subjectId?.trim()) errors.push("Subject is required");
  if (!entry.dayOfWeek?.trim()) errors.push("Day of week is required");
  if (!entry.timeSlotId?.trim()) errors.push("Time slot is required");

  if (entry.dayOfWeek && !DAY_NAMES.includes(entry.dayOfWeek)) {
    errors.push(`Invalid day: ${entry.dayOfWeek}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateTimetableState(state: TimetablePersistenceContract): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate entries
  for (const entry of state.entries) {
    const validation = validateTimetableEntry(entry);
    if (!validation.valid) errors.push(...validation.errors);
  }

  // Check for conflicts
  const conflicts = detectTimetableConflicts(state);
  if (conflicts.length > 0) {
    errors.push(...conflicts);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
