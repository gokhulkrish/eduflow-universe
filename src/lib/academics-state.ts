/**
 * Academic Management State Contracts & Persistence
 * 
 * This module defines the contracts and state management for Academic Management module.
 * Used to defer rollout until workflow, persistence, and state contracts are confirmed safe.
 */

export interface AcademicClassContract {
  id: string;
  grade: string;
  section: string;
  stream?: string;
  capacity: number;
  classTeacher?: string;
  room?: string;
  academicYear: string;
  createdAt: string;
}

export interface SubjectContract {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  semester: string;
  department: string;
  practicalHours: number;
  theoryHours: number;
  isElective: boolean;
  createdAt: string;
}

export interface ClassSubjectMapping {
  id: string;
  classId: string;
  subjectId: string;
  staffId?: string;
  semester: string;
  createdAt: string;
}

export interface AcademicPersistenceContract {
  classes: AcademicClassContract[];
  subjects: SubjectContract[];
  mappings: ClassSubjectMapping[];
  lastSyncAt: string;
}

const ACADEMIC_CLASSES_KEY = "eduflow.academics.classes.v1";
const ACADEMIC_SUBJECTS_KEY = "eduflow.academics.subjects.v1";
const ACADEMIC_MAPPINGS_KEY = "eduflow.academics.mappings.v1";

export function loadAcademicState(): AcademicPersistenceContract {
  try {
    return {
      classes: JSON.parse(localStorage.getItem(ACADEMIC_CLASSES_KEY) || "[]"),
      subjects: JSON.parse(localStorage.getItem(ACADEMIC_SUBJECTS_KEY) || "[]"),
      mappings: JSON.parse(localStorage.getItem(ACADEMIC_MAPPINGS_KEY) || "[]"),
      lastSyncAt: new Date().toISOString(),
    };
  } catch {
    return {
      classes: [],
      subjects: [],
      mappings: [],
      lastSyncAt: new Date().toISOString(),
    };
  }
}

export function saveAcademicState(state: AcademicPersistenceContract): {
  success: boolean;
  error?: string;
} {
  try {
    localStorage.setItem(ACADEMIC_CLASSES_KEY, JSON.stringify(state.classes));
    localStorage.setItem(ACADEMIC_SUBJECTS_KEY, JSON.stringify(state.subjects));
    localStorage.setItem(ACADEMIC_MAPPINGS_KEY, JSON.stringify(state.mappings));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function validateAcademicClass(cls: Partial<AcademicClassContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!cls.grade?.trim()) errors.push("Grade/Level is required");
  if (!cls.section?.trim()) errors.push("Section is required");
  if (!cls.capacity || cls.capacity <= 0) errors.push("Capacity must be greater than 0");
  if (!cls.academicYear?.trim()) errors.push("Academic year is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateSubject(subject: Partial<SubjectContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!subject.code?.trim()) errors.push("Subject code is required");
  if (!subject.name?.trim()) errors.push("Subject name is required");
  if (!subject.credits || subject.credits <= 0) errors.push("Credits must be greater than 0");
  if (!subject.department?.trim()) errors.push("Department is required");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateAcademicState(state: AcademicPersistenceContract): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate classes
  for (const cls of state.classes) {
    const classValidation = validateAcademicClass(cls);
    if (!classValidation.valid) errors.push(...classValidation.errors);
  }

  // Validate subjects
  for (const subject of state.subjects) {
    const subjectValidation = validateSubject(subject);
    if (!subjectValidation.valid) errors.push(...subjectValidation.errors);
  }

  // Validate mappings reference valid classes and subjects
  const classIds = new Set(state.classes.map(c => c.id));
  const subjectIds = new Set(state.subjects.map(s => s.id));

  for (const mapping of state.mappings) {
    if (!classIds.has(mapping.classId)) {
      errors.push(`Mapping references non-existent class ${mapping.classId}`);
    }
    if (!subjectIds.has(mapping.subjectId)) {
      errors.push(`Mapping references non-existent subject ${mapping.subjectId}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
