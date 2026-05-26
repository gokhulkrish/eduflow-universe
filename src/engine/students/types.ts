export interface StudentIdentity {
  id: string;
  studentKey: string;
  registrationNumber: string;
  umisId?: string;
  emisNumber?: string;
}

export interface StudentPersonal {
  name: string;
  firstName: string;
  lastName?: string;
  dob?: string;
  gender?: string;
  bloodGroup?: string;
  nationality?: string;
}

export interface StudentAcademic {
  class: string;
  section?: string;
  rollNumber?: string;
  admissionDate?: string;
  stream?: string;
  house?: string;
  academicYear?: string;
}

export interface StudentFamily {
  fatherName?: string;
  fatherOccupation?: string;
  motherName?: string;
  motherOccupation?: string;
  guardianName?: string;
  annualIncome?: string;
}

export interface StudentContact {
  contactNumber?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  district?: string;
  guardianPhone?: string;
  guardianEmail?: string;
}

export interface StudentAdministrative {
  entryType: 'new' | 'transfer' | 'rejoin';
  status: 'active' | 'inactive' | 'promoted' | 'left';
  community?: string;
  firstGraduate?: string;
  incomeVerified?: string;
  dataCompletenessScore: number;
  importedFromBatchId?: string;
  customFields: Record<string, unknown>;
}

export interface StudentRecord
  extends StudentIdentity,
    StudentPersonal,
    StudentAcademic,
    StudentFamily,
    StudentContact,
    StudentAdministrative {
  createdAt: string;
  updatedAt: string;
}
