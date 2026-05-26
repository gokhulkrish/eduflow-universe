export type CanonicalFieldSource =
  | 'base'
  | 'custom'
  | 'fetched'
  | 'import'
  | 'legacy-internal';

export type CanonicalFieldStatus = 'active' | 'archived' | 'deleted';

export type CanonicalFieldGroup =
  | 'Basic Information'
  | 'Institute Information'
  | 'Course Information'
  | 'Academic Information'
  | 'Personal Information'
  | 'Contact Information'
  | 'Family Information'
  | 'Hostel Information'
  | 'Scholarship Information'
  | 'Banking Information'
  | 'Documents & Identity'
  | 'Other Information'
  | 'General Information'
  | 'Head of the Institute'
  | 'Nodal Officer';

export type CanonicalFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'textarea'
  | 'select';

export interface CanonicalStudentField {
  id: string;
  module: 'student';
  key: string;
  label: string;
  group: CanonicalFieldGroup;
  type: CanonicalFieldType;
  status: CanonicalFieldStatus;
  source: CanonicalFieldSource;
  order: number;
  aliases: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  options?: string[];
  defaultValue?: string;
}
