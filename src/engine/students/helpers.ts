import type { StudentRecord } from './types';

export function isComplete(student: Partial<StudentRecord>): boolean {
  return !!(student.registrationNumber && student.name && student.class);
}

export function getDisplayName(student: Partial<StudentRecord>): string {
  return student.name || student.firstName || student.registrationNumber || 'Unknown';
}
