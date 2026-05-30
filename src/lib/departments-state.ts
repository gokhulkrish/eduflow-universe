/**
 * Departments & Programs State Contracts & Persistence
 * 
 * This module defines the contracts and state management for Departments & Programs module.
 * Used to defer rollout until workflow, persistence, and state contracts are confirmed safe.
 */

export interface DepartmentContract {
  id: string;
  departmentName: string;
  departmentCode: string;
  hodName: string;
  programLevel: string;
  sanctionedIntake: number;
  naacNbaStatus: string;
}

export interface DepartmentPersistenceContract {
  departments: DepartmentContract[];
  lastSyncAt: string;
}

export type ProgramLevel = "UG" | "PG" | "Research" | "Diploma" | "Certificate";
export type NaacNbaStatus = "Not Applied" | "Applied" | "Accredited" | "Re-Accreditation Due";

export const PROGRAM_LEVELS: ProgramLevel[] = ["UG", "PG", "Research", "Diploma", "Certificate"];
export const NAAC_NBA_STATUSES: NaacNbaStatus[] = ["Not Applied", "Applied", "Accredited", "Re-Accreditation Due"];

const DEPARTMENTS_STORAGE_KEY = "eduflow_departments";

export function loadDepartmentState(): DepartmentPersistenceContract {
  try {
    return {
      departments: JSON.parse(localStorage.getItem(DEPARTMENTS_STORAGE_KEY) || "[]"),
      lastSyncAt: new Date().toISOString(),
    };
  } catch {
    return {
      departments: [],
      lastSyncAt: new Date().toISOString(),
    };
  }
}

export function saveDepartmentState(state: DepartmentPersistenceContract): {
  success: boolean;
  error?: string;
} {
  try {
    localStorage.setItem(DEPARTMENTS_STORAGE_KEY, JSON.stringify(state.departments));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export function validateDepartment(dept: Partial<DepartmentContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!dept.departmentName?.trim()) errors.push("Department name is required");
  if (!dept.departmentCode?.trim()) errors.push("Department code is required");
  if (dept.sanctionedIntake != null && dept.sanctionedIntake < 0) errors.push("Sanctioned intake cannot be negative");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateDepartmentState(state: DepartmentPersistenceContract): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const dept of state.departments) {
    const validation = validateDepartment(dept);
    if (!validation.valid) errors.push(...validation.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
