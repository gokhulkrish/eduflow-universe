import { loadHeaderRegistrySettings, loadCustomImportFields } from "@/lib/header-registry";

export type LegacyInstituteInfo = {
  settings: Record<string, unknown>;
  customFields: unknown[];
  syncedAt: string;
};

export interface InstituteProfileContract {
  identity: {
    name: string;
    nickname: string;
    code: string;
    type: string;
    estd: string;
    affiliation: string;
    motto: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    website: string;
  };
  headOfInstitution: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  nodalOfficer: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  accreditation?: {
    body: string;
    grade: string;
    validity: string;
    certificates: string[];
  };
}

export async function bridgeLegacyInstituteInfo(_filters?: Record<string, unknown>): Promise<LegacyInstituteInfo> {
  const settings = loadHeaderRegistrySettings();
  const customFields = loadCustomImportFields();
  return {
    settings: settings as unknown as Record<string, unknown>,
    customFields,
    syncedAt: new Date().toISOString(),
  };
}

export function parseInstituteProfile(settings: Record<string, unknown>): Partial<InstituteProfileContract> {
  return {
    identity: {
      name: (settings.institute_name as string) || "",
      nickname: (settings.institute_nickname as string) || "",
      code: (settings.institute_code as string) || "",
      type: (settings.institute_type as string) || "",
      estd: (settings.established_year as string) || "",
      affiliation: (settings.affiliation as string) || "",
      motto: (settings.motto as string) || "",
    },
    contact: {
      email: (settings.institute_email as string) || "",
      phone: (settings.institute_phone as string) || "",
      address: (settings.institute_address as string) || "",
      website: (settings.website as string) || "",
    },
    headOfInstitution: {
      name: (settings.principal_name as string) || "",
      role: (settings.principal_role as string) || "Principal",
      email: (settings.principal_email as string) || "",
      phone: (settings.principal_phone as string) || "",
    },
    nodalOfficer: {
      name: (settings.nodal_officer_name as string) || "",
      role: (settings.nodal_officer_role as string) || "ERP Nodal Officer",
      email: (settings.nodal_officer_email as string) || "",
      phone: (settings.nodal_officer_phone as string) || "",
    },
  };
}

export function validateInstituteProfile(profile: Partial<InstituteProfileContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!profile.identity?.name?.trim()) errors.push("Institute name is required");
  if (!profile.contact?.email?.trim()) errors.push("Contact email is required");
  if (!profile.contact?.phone?.trim()) errors.push("Contact phone is required");
  if (!profile.headOfInstitution?.name?.trim()) errors.push("Head of Institution name is required");
  
  // Validate email format
  if (profile.contact?.email && !profile.contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("Invalid email format");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
