export interface StudentListFilter {
  tenantId: string;
  classId?: string;
  sectionId?: string;
  status?: 'active' | 'inactive' | 'graduated' | 'transferred' | 'withdrawn' | 'alumni';
  search?: string;
}

export interface StudentListItemDTO {
  id: string;
  admissionNo?: string;
  legacyUmisId?: string;
  fullName: string;
  className?: string;
  sectionName?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface StudentDetailDTO extends StudentListItemDTO {
  firstName: string;
  lastName?: string;
  status: string;
  joinedOn?: string;
  leftOn?: string;
  email?: string;
  phone?: string;
  bloodGroup?: string;
  nationality?: string;
  community?: string;
}
