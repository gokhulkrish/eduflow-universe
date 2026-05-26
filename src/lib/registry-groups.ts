import { inferAutomaticHeaderGroup, findMismatchedFields } from "@/lib/auto-header-grouping";

export type FieldGroupKey =
  | 'basicInfo'
  | 'instituteInfo'
  | 'academic'
  | 'contact'
  | 'family'
  | 'courseInfo'
  | 'personal'
  | 'hostel'
  | 'general'
  | 'headOfInstitute'
  | 'nodalOfficer'
  | 'documents'
  | 'other';

export interface RegistryGroup {
  key: string;
  label: string;
  order: number;
  isDefault?: boolean;
}

export interface RegistryFieldConfig {
  scope: 'student';
  key: string;
  label: string;
  source: 'system' | 'custom' | 'import' | 'detected';
  type: 'text' | 'number' | 'date' | 'enum' | 'boolean';
  defaultValue?: string;
  options?: string[];
  notes?: string;
  groupKey: string;
  order: number;
  aliases: string[];
  status: 'active' | 'hidden' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export function normalizeToKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export const DEFAULT_GROUPS: RegistryGroup[] = [
  { key: 'basicInfo',      label: 'Basic Information',        order: 1,  isDefault: true },
  { key: 'instituteInfo',  label: 'Institute Information',    order: 2,  isDefault: true },
  { key: 'academic',       label: 'Academic Details',         order: 3,  isDefault: true },
  { key: 'family',         label: 'Family Information',       order: 4,  isDefault: true },
  { key: 'contact',        label: 'Contact Information',      order: 5,  isDefault: true },
  { key: 'courseInfo',     label: 'Course Information',       order: 6,  isDefault: true },
  { key: 'personal',       label: 'Personal Information',     order: 7,  isDefault: true },
  { key: 'hostel',         label: 'Hostel Information',       order: 8,  isDefault: true },
  { key: 'general',        label: 'General Information',      order: 9,  isDefault: true },
  { key: 'headOfInstitute',label: 'Head of the Institute',    order: 10, isDefault: true },
  { key: 'nodalOfficer',   label: 'Nodal Officer',            order: 11, isDefault: true },
  { key: 'documents',      label: 'Documents & Identity',     order: 12, isDefault: true },
  { key: 'other',          label: 'Other Information',        order: 99, isDefault: true },
];

const FIELD_GROUP_MAP: Record<string, string> = {
  /* ── existing mappings ── */
  registrationNumber: 'basicInfo',
  studentName: 'basicInfo',
  studentname: 'basicInfo',
  firstName: 'basicInfo',
  lastName: 'basicInfo',
  dateOfBirth: 'basicInfo',
  dob: 'basicInfo',
  gender: 'basicInfo',
  bloodGroup: 'basicInfo',
  bloodgroup: 'personal',
  nationality: 'basicInfo',
  photo: 'basicInfo',
  aadhaar: 'instituteInfo',
  aadhar: 'instituteInfo',
  aadhaarnumber: 'documents',
  admissionNo: 'instituteInfo',
  admissionNumber: 'instituteInfo',
  emisId: 'instituteInfo',
  emisid: 'basicInfo',
  umisId: 'instituteInfo',
  umisid: 'basicInfo',
  district: 'instituteInfo',
  block: 'instituteInfo',
  community: 'instituteInfo',
  caste: 'instituteInfo',
  religion: 'instituteInfo',
  grade: 'academic',
  class: 'academic',
  section: 'academic',
  roll: 'academic',
  rollNumber: 'academic',
  stream: 'academic',
  department: 'academic',
  house: 'academic',
  semester: 'academic',
  batch: 'academic',
  fatherName: 'family',
  fathername: 'family',
  fatherOccupation: 'family',
  fatheroccupationsector: 'family',
  motherName: 'family',
  mothername: 'family',
  motherOccupation: 'family',
  motheroccupationsector: 'family',
  guardianName: 'family',
  guardianname: 'family',
  guardianRelation: 'family',
  guardianPhone: 'family',
  annualIncome: 'family',
  annualfamilyincome: 'family',
  parentIncome: 'family',
  email: 'contact',
  phone: 'contact',
  mobile: 'contact',
  alternatePhone: 'contact',
  address: 'contact',
  permanentAddress: 'contact',
  city: 'contact',
  state: 'contact',
  pincode: 'contact',
  postalCode: 'contact',
  postal_code: 'contact',
  firstGraduate: 'other',
  firstgraduate: 'personal',
  incomeVerified: 'other',
  scholarshipNotes: 'other',
  status: 'other',
  transportRoute: 'other',
  hostelName: 'other',

  /* ── spec core identity & status ── */
  regno: 'basicInfo',
  salutation: 'other',

  /* ── spec institute & university ── */
  collegeaishecode: 'instituteInfo',
  collegename: 'instituteInfo',
  institutionregistrationnumber: 'basicInfo',
  affiliateduniversityname: 'instituteInfo',
  collegeinstitutiontype: 'instituteInfo',
  universitytype: 'instituteInfo',
  institutelocationtype: 'instituteInfo',
  institutepostaladdress: 'instituteInfo',
  institutecontactnumber: 'instituteInfo',
  instituteemailaddress: 'instituteInfo',
  institutedistrictblock: 'instituteInfo',
  institutezoneward: 'instituteInfo',
  institutewebsite: 'instituteInfo',
  yearofestablishment: 'other',
  coeducationinstitute: 'instituteInfo',
  headofinstitutename: 'instituteInfo',
  headofinstitutedesignation: 'instituteInfo',
  headofinstituteaadhaar: 'instituteInfo',
  headofinstituteaddress: 'instituteInfo',
  headofinstitutemobile: 'instituteInfo',
  headofinstituteemail: 'instituteInfo',
  nodalofficername: 'other',
  nodalofficerdesignation: 'other',
  nodalofficeraddress: 'contact',
  nodalofficermobile: 'contact',
  nodalofficeremail: 'contact',
  institutebankname: 'instituteInfo',
  institutebankaccountnumber: 'instituteInfo',
  institutebankaccountname: 'instituteInfo',
  institutebankaccounttype: 'instituteInfo',
  instituteifsccode: 'instituteInfo',
  institutebankbranch: 'instituteInfo',
  institutegeolocation: 'instituteInfo',

  /* ── spec course & academic ── */
  coursename: 'courseInfo',
  coursestream: 'courseInfo',
  coursedurationyears: 'courseInfo',
  coursemaximumdurationyears: 'courseInfo',
  coursetype: 'courseInfo',
  coursebranchspecialization: 'courseInfo',
  mediumofinstruction: 'other',
  academicyear: 'academic',
  admissiontype: 'other',
  coursecommencementdate: 'courseInfo',
  studyingyear: 'courseInfo',
  lateralentry: 'other',
  modeofstudy: 'other',
  lastqualificationmodeofstudy: 'other',
  counsellingadmissionnumber: 'basicInfo',

  /* ── spec personal profile ── */
  communitycertificatenumber: 'personal',
  differentlyabled: 'other',
  disabilitytype: 'personal',
  disabilitypercentage: 'personal',

  /* ── spec family & socio-economic ── */
  familycardnumber: 'family',
  incomecertificatenumber: 'family',
  guardianoccupationsector: 'family',

  /* ── spec contact & address ── */
  communicationaddress: 'contact',
  localitytype: 'other',
  corporationmunicipality: 'other',
  taluk: 'contact',
  village_town_locality: 'contact',
  correspondence_address: 'contact',
  ward: 'contact',
  phone_number: 'contact',
  email_id: 'contact',
  website_url: 'contact',
  latitude: 'contact',
  longitude: 'contact',

  /* ── spec hostel ── */
  hosteller: 'hostel',
  hosteljoindate: 'academic',
  hostelleavedate: 'hostel',
  hosteltype: 'hostel',

  /* ── spec special categories ── */
  specialadmissionquota: 'other',

  /* ── spec remarks ── */
  remarks: 'other',

  /* ── spec general institution ── */
  institution_name: 'general',
  institution_category: 'general',
  is_co_education_institute: 'general',

  /* ── spec HOI block ── */
  hoi_salutation: 'headOfInstitute',
  name_of_the_hoi: 'headOfInstitute',
  hoi_gender: 'headOfInstitute',
  hoi_mobile_number: 'headOfInstitute',
  hoi_phone_number: 'headOfInstitute',
  hoi_email_id: 'headOfInstitute',
  hoi_aadhaar_number: 'headOfInstitute',
  hoi_pan_number: 'headOfInstitute',

  /* ── spec nodal officer block ── */
  nodal_officer_salutation: 'nodalOfficer',
  name_of_the_nodal_officer: 'nodalOfficer',
  nodal_officer_gender: 'nodalOfficer',
  nodal_officer_mobile_number: 'nodalOfficer',
  nodal_officer_phone_number: 'nodalOfficer',
  nodal_officer_email_id: 'nodalOfficer',
};

export function defaultGroupForField(key: string, label?: string, aliases?: string[]): string {
  const staticMapKey = FIELD_GROUP_MAP[key.toLowerCase()];
  if (staticMapKey) return staticMapKey;
  const inferred = inferAutomaticHeaderGroup(key, label, undefined, aliases);
  return normalizeToKey(inferred) || 'other';
}

export function diagnoseFieldGrouping(
  fields: { key: string; label?: string; groupKey: string; aliases?: string[] }[],
): { field: string; currentGroup: string; suggestedGroup: string }[] {
  return findMismatchedFields(fields);
}

const NOW = () => new Date().toISOString();

const DEFAULT_FIELD_BASE = { scope: 'student' as const, source: 'system' as const, aliases: [] as string[], status: 'active' as const };

export const DEFAULT_FIELD_CONFIGS: RegistryFieldConfig[] = [
  { ...DEFAULT_FIELD_BASE, key: 'registrationNumber', label: 'Registration Number', type: 'text', groupKey: 'basicInfo', order: 1, aliases: ['reg no', 'reg no.'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'studentName', label: 'Student Name', type: 'text', groupKey: 'basicInfo', order: 2, aliases: ['name', 'full name'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'firstName', label: 'First Name', type: 'text', groupKey: 'basicInfo', order: 3, aliases: ['given name'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'lastName', label: 'Last Name', type: 'text', groupKey: 'basicInfo', order: 4, aliases: ['surname'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'dateOfBirth', label: 'Date of Birth', type: 'date', groupKey: 'basicInfo', order: 5, aliases: ['dob', 'birth date'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'gender', label: 'Gender', type: 'enum', groupKey: 'basicInfo', order: 6, options: ['Male', 'Female', 'Other', 'Prefer not to say'], aliases: ['sex'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'bloodGroup', label: 'Blood Group', type: 'enum', groupKey: 'basicInfo', order: 7, options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'], aliases: ['blood type'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'nationality', label: 'Nationality', type: 'text', groupKey: 'basicInfo', order: 8, aliases: ['citizenship'], defaultValue: 'Indian', createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'photo', label: 'Photo', type: 'text', groupKey: 'basicInfo', order: 9, aliases: ['image', 'picture', 'avatar'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'admissionNo', label: 'Admission No', type: 'text', groupKey: 'instituteInfo', order: 10, aliases: ['admission number', 'adm no'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'aadhaar', label: 'Aadhaar Number', type: 'text', groupKey: 'instituteInfo', order: 11, aliases: ['aadhar', 'uid'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'emisId', label: 'EMIS ID', type: 'text', groupKey: 'instituteInfo', order: 12, aliases: ['emis number', 'emis no'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'umisId', label: 'UMIS ID', type: 'text', groupKey: 'instituteInfo', order: 13, aliases: ['umis number'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'district', label: 'District', type: 'text', groupKey: 'instituteInfo', order: 14, createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'block', label: 'Block', type: 'text', groupKey: 'instituteInfo', order: 15, aliases: ['taluk', 'tehsil'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'community', label: 'Community', type: 'enum', groupKey: 'instituteInfo', order: 16, options: ['OC', 'BC', 'MBC', 'SC', 'ST', 'Other'], aliases: ['caste category'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'religion', label: 'Religion', type: 'text', groupKey: 'instituteInfo', order: 17, createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'grade', label: 'Program / Semester', type: 'enum', groupKey: 'academic', order: 18, aliases: ['class', 'program', 'semester'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'section', label: 'Section', type: 'enum', groupKey: 'academic', order: 19, options: ['A', 'B', 'C', 'D'], aliases: ['division'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'roll', label: 'Roll Number', type: 'text', groupKey: 'academic', order: 20, aliases: ['roll no', 'roll number'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'stream', label: 'Department / Stream', type: 'enum', groupKey: 'academic', order: 21, options: ['Science', 'Commerce', 'Arts', 'Management', 'Vocational', 'N/A'], aliases: ['department', 'branch'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'batch', label: 'Batch / Year', type: 'text', groupKey: 'academic', order: 22, aliases: ['academic year', 'cohort'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'house', label: 'Residence / House', type: 'enum', groupKey: 'academic', order: 23, options: ['North', 'South', 'East', 'West'], aliases: ['house name'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'fatherName', label: "Father's Name", type: 'text', groupKey: 'family', order: 24, aliases: ['father'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'fatherOccupation', label: "Father's Occupation", type: 'text', groupKey: 'family', order: 25, createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'motherName', label: "Mother's Name", type: 'text', groupKey: 'family', order: 26, aliases: ['mother'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'motherOccupation', label: "Mother's Occupation", type: 'text', groupKey: 'family', order: 27, createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'guardianName', label: 'Guardian Name', type: 'text', groupKey: 'family', order: 28, aliases: ['guardian'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'guardianRelation', label: 'Guardian Relation', type: 'enum', groupKey: 'family', order: 29, options: ['Father', 'Mother', 'Brother', 'Sister', 'Uncle', 'Aunt', 'Grandparent', 'Other'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'guardianPhone', label: 'Guardian Phone', type: 'text', groupKey: 'family', order: 30, aliases: ['guardian mobile', 'guardian contact'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'annualIncome', label: 'Annual Income', type: 'text', groupKey: 'family', order: 31, aliases: ['family income', 'parent income'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'email', label: 'Email', type: 'text', groupKey: 'contact', order: 32, aliases: ['email address'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'phone', label: 'Phone Number', type: 'text', groupKey: 'contact', order: 33, aliases: ['mobile', 'mobile number', 'contact number'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'alternatePhone', label: 'Alternate Phone', type: 'text', groupKey: 'contact', order: 34, aliases: ['alt phone', 'secondary phone'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'address', label: 'Address', type: 'text', groupKey: 'contact', order: 35, aliases: ['current address', 'residence'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'city', label: 'City / Town / Village', type: 'text', groupKey: 'contact', order: 36, aliases: ['locality', 'town', 'village'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'state', label: 'State', type: 'text', groupKey: 'contact', order: 37, aliases: ['province'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'pincode', label: 'Pincode', type: 'text', groupKey: 'contact', order: 38, aliases: ['postal code', 'zip'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'firstGraduate', label: 'First Graduate', type: 'enum', groupKey: 'other', order: 39, options: ['Yes', 'No'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'incomeVerified', label: 'Income Verified', type: 'enum', groupKey: 'other', order: 40, options: ['Pending', 'Agreed', 'Appealed'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'scholarshipNotes', label: 'Scholarship Notes', type: 'text', groupKey: 'other', order: 41, aliases: ['scholarship info'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'status', label: 'Status', type: 'enum', groupKey: 'other', order: 42, options: ['Active', 'Transfer', 'Alumni', 'Dropout'], aliases: ['student status'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'transportRoute', label: 'Transport Route', type: 'text', groupKey: 'other', order: 43, aliases: ['route', 'bus route'], createdAt: NOW(), updatedAt: NOW() },
  { ...DEFAULT_FIELD_BASE, key: 'hostelName', label: 'Hostel Name', type: 'text', groupKey: 'other', order: 44, aliases: ['hostel'], createdAt: NOW(), updatedAt: NOW() },
];

/* ── Canonical Student Fields (118 detected headers from spec) ── */

const CORE = { scope: 'student' as const, source: 'detected' as const, aliases: [] as string[], status: 'active' as const };

export const CANONICAL_STUDENT_FIELDS: RegistryFieldConfig[] = [
  /* 1.1 Core Identity & Status */
  { ...CORE, key: 'studentname', label: 'Student Name', type: 'text', groupKey: 'basicInfo', order: 1, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'regno', label: 'Register Number', type: 'text', groupKey: 'basicInfo', order: 2, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'umisid', label: 'UMIS ID', type: 'text', groupKey: 'basicInfo', order: 3, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'emisid', label: 'EMIS ID', type: 'text', groupKey: 'basicInfo', order: 4, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'status', label: 'Status', type: 'enum', groupKey: 'other', order: 5, options: ['Active', 'Transfer', 'Alumni', 'Dropout'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'salutation', label: 'Salutation', type: 'enum', groupKey: 'other', order: 6, options: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'], createdAt: NOW(), updatedAt: NOW() },

  /* 1.2 Institute & University Profile */
  { ...CORE, key: 'collegeaishecode', label: 'AISHE Code', type: 'text', groupKey: 'instituteInfo', order: 7, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'collegename', label: 'Institute Name', type: 'text', groupKey: 'instituteInfo', order: 8, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutionregistrationnumber', label: 'Institution Registration Number', type: 'text', groupKey: 'basicInfo', order: 9, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'affiliateduniversityname', label: 'Affiliated University Name', type: 'text', groupKey: 'instituteInfo', order: 10, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'collegeinstitutiontype', label: 'Institution Type', type: 'text', groupKey: 'instituteInfo', order: 11, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'universitytype', label: 'University Type', type: 'text', groupKey: 'instituteInfo', order: 12, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutelocationtype', label: 'Institute Location Type', type: 'text', groupKey: 'instituteInfo', order: 13, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutepostaladdress', label: 'Institute Postal Address', type: 'text', groupKey: 'instituteInfo', order: 14, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutecontactnumber', label: 'Institute Contact Number', type: 'text', groupKey: 'instituteInfo', order: 15, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'instituteemailaddress', label: 'Institute Email Address', type: 'text', groupKey: 'instituteInfo', order: 16, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutedistrictblock', label: 'Institute District / Block', type: 'text', groupKey: 'instituteInfo', order: 17, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutezoneward', label: 'Institute Zone / Ward', type: 'text', groupKey: 'instituteInfo', order: 18, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutewebsite', label: 'Institute Website', type: 'text', groupKey: 'instituteInfo', order: 19, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'yearofestablishment', label: 'Year of Establishment', type: 'text', groupKey: 'other', order: 20, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'coeducationinstitute', label: 'Co-Education Institute', type: 'enum', groupKey: 'instituteInfo', order: 21, options: ['Yes', 'No'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'headofinstitutename', label: 'Head of Institute Name', type: 'text', groupKey: 'instituteInfo', order: 22, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'headofinstitutedesignation', label: 'Head of Institute Designation', type: 'text', groupKey: 'instituteInfo', order: 23, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'headofinstituteaadhaar', label: 'Head of Institute Aadhaar', type: 'text', groupKey: 'instituteInfo', order: 24, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'headofinstituteaddress', label: 'Head of Institute Address', type: 'text', groupKey: 'instituteInfo', order: 25, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'headofinstitutemobile', label: 'Head of Institute Mobile', type: 'text', groupKey: 'instituteInfo', order: 26, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'headofinstituteemail', label: 'Head of Institute Email', type: 'text', groupKey: 'instituteInfo', order: 27, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodalofficername', label: 'Nodal Officer Name', type: 'text', groupKey: 'other', order: 28, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodalofficerdesignation', label: 'Nodal Officer Designation', type: 'text', groupKey: 'other', order: 29, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodalofficeraddress', label: 'Nodal Officer Address', type: 'text', groupKey: 'contact', order: 30, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodalofficermobile', label: 'Nodal Officer Mobile', type: 'text', groupKey: 'contact', order: 31, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodalofficeremail', label: 'Nodal Officer Email', type: 'text', groupKey: 'contact', order: 32, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutebankname', label: 'Institute Bank Name', type: 'text', groupKey: 'instituteInfo', order: 33, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutebankaccountnumber', label: 'Institute Bank Account Number', type: 'text', groupKey: 'instituteInfo', order: 34, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutebankaccountname', label: 'Institute Bank Account Name', type: 'text', groupKey: 'instituteInfo', order: 35, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutebankaccounttype', label: 'Institute Bank Account Type', type: 'text', groupKey: 'instituteInfo', order: 36, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'instituteifsccode', label: 'Institute IFSC Code', type: 'text', groupKey: 'instituteInfo', order: 37, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutebankbranch', label: 'Institute Bank Branch', type: 'text', groupKey: 'instituteInfo', order: 38, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institutegeolocation', label: 'Institute Geo Location', type: 'text', groupKey: 'instituteInfo', order: 39, createdAt: NOW(), updatedAt: NOW() },

  /* 1.3 Course & Academic Configuration */
  { ...CORE, key: 'coursename', label: 'Course', type: 'text', groupKey: 'courseInfo', order: 40, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'coursestream', label: 'Course Stream', type: 'text', groupKey: 'courseInfo', order: 41, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'coursedurationyears', label: 'Course Duration (Years)', type: 'number', groupKey: 'courseInfo', order: 42, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'coursemaximumdurationyears', label: 'Course Maximum Duration (Years)', type: 'number', groupKey: 'courseInfo', order: 43, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'department', label: 'Department', type: 'text', groupKey: 'courseInfo', order: 44, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'coursetype', label: 'Course Type', type: 'text', groupKey: 'courseInfo', order: 45, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'coursebranchspecialization', label: 'Branch / Specialization', type: 'text', groupKey: 'courseInfo', order: 46, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'mediumofinstruction', label: 'Medium of Instruction', type: 'text', groupKey: 'other', order: 47, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'academicyear', label: 'Academic Year', type: 'text', groupKey: 'academic', order: 48, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'admissiontype', label: 'Admission Type', type: 'text', groupKey: 'other', order: 49, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'coursecommencementdate', label: 'Course Commencement Date', type: 'date', groupKey: 'courseInfo', order: 50, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'studyingyear', label: 'Studying Year', type: 'text', groupKey: 'courseInfo', order: 51, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'lateralentry', label: 'Lateral Entry', type: 'enum', groupKey: 'other', order: 52, options: ['Yes', 'No'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'modeofstudy', label: 'Mode of Study', type: 'text', groupKey: 'other', order: 53, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'lastqualificationmodeofstudy', label: 'Last Qualification Mode of Study', type: 'text', groupKey: 'other', order: 54, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'counsellingadmissionnumber', label: 'Counselling / Admission Number', type: 'text', groupKey: 'basicInfo', order: 55, createdAt: NOW(), updatedAt: NOW() },

  /* 1.4 Personal Profile */
  { ...CORE, key: 'dob', label: 'Date of Birth', type: 'date', groupKey: 'personal', order: 56, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'gender', label: 'Gender', type: 'enum', groupKey: 'personal', order: 57, options: ['Male', 'Female', 'Other', 'Prefer not to say'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'bloodgroup', label: 'Blood Group', type: 'text', groupKey: 'personal', order: 58, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nationality', label: 'Nationality', type: 'text', groupKey: 'personal', order: 59, defaultValue: 'Indian', createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'religion', label: 'Religion', type: 'text', groupKey: 'personal', order: 60, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'community', label: 'Community', type: 'enum', groupKey: 'personal', order: 61, options: ['OC', 'BC', 'MBC', 'SC', 'ST', 'Other'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'caste', label: 'Caste', type: 'text', groupKey: 'personal', order: 62, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'communitycertificatenumber', label: 'Community Certificate Number', type: 'text', groupKey: 'personal', order: 63, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'aadhaarnumber', label: 'Aadhaar Number', type: 'text', groupKey: 'documents', order: 64, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'firstgraduate', label: 'First Graduate', type: 'enum', groupKey: 'personal', order: 65, options: ['Yes', 'No'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'differentlyabled', label: 'Differently Abled', type: 'enum', groupKey: 'other', order: 66, options: ['Yes', 'No'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'disabilitytype', label: 'Disability Type', type: 'text', groupKey: 'personal', order: 67, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'disabilitypercentage', label: 'Disability Percentage', type: 'number', groupKey: 'personal', order: 68, createdAt: NOW(), updatedAt: NOW() },

  /* 1.5 Family & Socio-Economic */
  { ...CORE, key: 'mobile', label: 'Mobile Number', type: 'text', groupKey: 'family', order: 69, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'familycardnumber', label: 'Family Card Number', type: 'text', groupKey: 'family', order: 70, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'fathername', label: 'Father Name', type: 'text', groupKey: 'family', order: 71, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'fatheroccupationsector', label: 'Father Occupation / Sector', type: 'text', groupKey: 'family', order: 72, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'mothername', label: 'Mother Name', type: 'text', groupKey: 'family', order: 73, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'motheroccupationsector', label: 'Mother Occupation / Sector', type: 'text', groupKey: 'family', order: 74, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'guardianname', label: 'Guardian Name', type: 'text', groupKey: 'family', order: 75, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'guardianoccupationsector', label: 'Guardian Occupation / Sector', type: 'text', groupKey: 'family', order: 76, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'annualfamilyincome', label: 'Annual Family Income', type: 'number', groupKey: 'family', order: 77, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'incomecertificatenumber', label: 'Income Certificate Number', type: 'text', groupKey: 'family', order: 78, createdAt: NOW(), updatedAt: NOW() },

  /* 1.6 Contact & Address */
  { ...CORE, key: 'email', label: 'Email', type: 'text', groupKey: 'contact', order: 79, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'permanentaddress', label: 'Permanent Address', type: 'text', groupKey: 'contact', order: 80, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'communicationaddress', label: 'Communication Address', type: 'text', groupKey: 'contact', order: 81, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'localitytype', label: 'Locality Type', type: 'text', groupKey: 'other', order: 82, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'corporationmunicipality', label: 'Corporation / Municipality', type: 'text', groupKey: 'other', order: 83, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'state', label: 'State', type: 'text', groupKey: 'contact', order: 84, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'district', label: 'District', type: 'text', groupKey: 'contact', order: 85, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'taluk', label: 'Taluk', type: 'text', groupKey: 'contact', order: 86, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'village_town_locality', label: 'Village / Town / Locality', type: 'text', groupKey: 'contact', order: 87, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'correspondence_address', label: 'Correspondence Address', type: 'text', groupKey: 'contact', order: 88, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'ward', label: 'Ward', type: 'text', groupKey: 'contact', order: 89, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'postal_code', label: 'Postal Code', type: 'text', groupKey: 'contact', order: 90, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'phone_number', label: 'Phone Number', type: 'text', groupKey: 'contact', order: 91, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'email_id', label: 'Email ID', type: 'text', groupKey: 'contact', order: 92, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'website_url', label: 'Website URL', type: 'text', groupKey: 'contact', order: 93, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'latitude', label: 'Latitude', type: 'number', groupKey: 'contact', order: 94, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'longitude', label: 'Longitude', type: 'number', groupKey: 'contact', order: 95, createdAt: NOW(), updatedAt: NOW() },

  /* 1.7 Hostel & Accommodation */
  { ...CORE, key: 'hosteller', label: 'Hosteller', type: 'enum', groupKey: 'hostel', order: 96, options: ['Yes', 'No'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hosteljoindate', label: 'Hostel Join Date', type: 'date', groupKey: 'academic', order: 97, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hostelleavedate', label: 'Hostel Leave Date', type: 'date', groupKey: 'hostel', order: 98, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hosteltype', label: 'Hostel Type', type: 'text', groupKey: 'hostel', order: 99, createdAt: NOW(), updatedAt: NOW() },

  /* 1.8 Special Categories & Scholarship */
  { ...CORE, key: 'specialadmissionquota', label: 'Special Admission Quota', type: 'text', groupKey: 'other', order: 100, createdAt: NOW(), updatedAt: NOW() },

  /* 1.9 Remarks & Misc */
  { ...CORE, key: 'remarks', label: 'Remarks', type: 'text', groupKey: 'other', order: 101, createdAt: NOW(), updatedAt: NOW() },

  /* 1.10 General Institution Metadata */
  { ...CORE, key: 'institution_name', label: 'Institution Name', type: 'text', groupKey: 'general', order: 102, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'institution_category', label: 'Institution Category', type: 'text', groupKey: 'general', order: 103, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'is_co_education_institute', label: 'Is Co-Education Institute', type: 'enum', groupKey: 'general', order: 104, options: ['Yes', 'No'], createdAt: NOW(), updatedAt: NOW() },

  /* 1.11 HOI Block */
  { ...CORE, key: 'hoi_salutation', label: 'HOI Salutation', type: 'enum', groupKey: 'headOfInstitute', order: 105, options: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'name_of_the_hoi', label: 'Name of the HOI', type: 'text', groupKey: 'headOfInstitute', order: 106, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hoi_gender', label: 'HOI Gender', type: 'enum', groupKey: 'headOfInstitute', order: 107, options: ['Male', 'Female', 'Other'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hoi_mobile_number', label: 'HOI Mobile Number', type: 'text', groupKey: 'headOfInstitute', order: 108, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hoi_phone_number', label: 'HOI Phone Number', type: 'text', groupKey: 'headOfInstitute', order: 109, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hoi_email_id', label: 'HOI Email ID', type: 'text', groupKey: 'headOfInstitute', order: 110, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hoi_aadhaar_number', label: 'HOI Aadhaar Number', type: 'text', groupKey: 'headOfInstitute', order: 111, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'hoi_pan_number', label: 'HOI PAN Number', type: 'text', groupKey: 'headOfInstitute', order: 112, createdAt: NOW(), updatedAt: NOW() },

  /* 1.12 Nodal Officer Block */
  { ...CORE, key: 'nodal_officer_salutation', label: 'Nodal Officer Salutation', type: 'enum', groupKey: 'nodalOfficer', order: 113, options: ['Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'name_of_the_nodal_officer', label: 'Name of the Nodal Officer', type: 'text', groupKey: 'nodalOfficer', order: 114, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodal_officer_gender', label: 'Nodal Officer Gender', type: 'enum', groupKey: 'nodalOfficer', order: 115, options: ['Male', 'Female', 'Other'], createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodal_officer_mobile_number', label: 'Nodal Officer Mobile Number', type: 'text', groupKey: 'nodalOfficer', order: 116, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodal_officer_phone_number', label: 'Nodal Officer Phone Number', type: 'text', groupKey: 'nodalOfficer', order: 117, createdAt: NOW(), updatedAt: NOW() },
  { ...CORE, key: 'nodal_officer_email_id', label: 'Nodal Officer Email ID', type: 'text', groupKey: 'nodalOfficer', order: 118, createdAt: NOW(), updatedAt: NOW() },
];

/* ── Storage helpers (per-scope) ── */

function groupsKey(scope: string): string {
  return `sms.header-groups.${scope}.v1`;
}
function fieldsKey(scope: string): string {
  return `sms.header-group-fields.${scope}.v1`;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/* ── Registry Engine API ── */

export function ensureHeaderFieldGroups(scope: string): RegistryGroup[] {
  const key = groupsKey(scope);
  if (!isBrowser()) return DEFAULT_GROUPS.map(g => ({ ...g }));
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: RegistryGroup[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  localStorage.setItem(key, JSON.stringify(DEFAULT_GROUPS));
  return DEFAULT_GROUPS.map(g => ({ ...g }));
}

export function saveHeaderGroupList(scope: string, groups: RegistryGroup[]): void {
  if (!isBrowser()) return;
  try { localStorage.setItem(groupsKey(scope), JSON.stringify(groups)); } catch {}
}

export function getHeaderFieldEntries(scope: string): RegistryFieldConfig[] {
  const key = fieldsKey(scope);
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: RegistryFieldConfig[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {}
  const defaults = DEFAULT_FIELD_CONFIGS.map(f => ({ ...f }));
  if (isBrowser()) {
    try { localStorage.setItem(key, JSON.stringify(defaults)); } catch {}
  }
  return defaults;
}

export function saveRegistryFieldAdvancedConfig(
  scope: string,
  fieldKey: string,
  config: Partial<RegistryFieldConfig>,
): RegistryFieldConfig[] {
  const entries = getHeaderFieldEntries(scope);
  const now = NOW();
  const idx = entries.findIndex(e => e.key === fieldKey);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...config, scope: 'student', key: fieldKey, updatedAt: now };
  } else {
    entries.push({
      scope: 'student',
      key: fieldKey,
      label: config.label ?? fieldKey,
      source: config.source ?? 'custom',
      type: config.type ?? 'text',
      groupKey: config.groupKey ?? 'other',
      order: config.order ?? entries.length + 1,
      aliases: config.aliases ?? [],
      status: config.status ?? 'active',
      createdAt: now,
      updatedAt: now,
      defaultValue: config.defaultValue,
      options: config.options,
      notes: config.notes,
    });
  }
  if (isBrowser()) {
    try { localStorage.setItem(fieldsKey(scope), JSON.stringify(entries)); } catch {}
  }
  return entries;
}

export function moveRegistryFieldBetweenGroups(
  scope: string,
  fieldKey: string,
  targetGroupKey: string,
): RegistryFieldConfig[] {
  const entries = getHeaderFieldEntries(scope);
  const maxOrder =
    1 +
    Math.max(
      0,
      ...entries.filter(x => x.groupKey === targetGroupKey && x.key !== fieldKey).map(x => x.order),
    );
  const updated = entries.map(f =>
    f.key === fieldKey ? { ...f, groupKey: targetGroupKey, order: maxOrder, updatedAt: NOW() } : f,
  );
  if (isBrowser()) {
    try { localStorage.setItem(fieldsKey(scope), JSON.stringify(updated)); } catch {}
  }
  return updated;
}

/* ── Legacy helpers (backward compat, used by HeaderGroupManager page) ── */

export const STORAGE_KEY_GROUPS = groupsKey('student');
export const STORAGE_KEY_FIELDS = fieldsKey('student');

export function loadGroups(): RegistryGroup[] {
  return ensureHeaderFieldGroups('student');
}

export function saveGroups(groups: RegistryGroup[]): void {
  saveHeaderGroupList('student', groups);
}

export function loadFieldConfigs(): RegistryFieldConfig[] {
  return getHeaderFieldEntries('student');
}

export function saveFieldConfigs(fields: RegistryFieldConfig[]): void {
  if (!isBrowser()) return;
  try { localStorage.setItem(fieldsKey('student'), JSON.stringify(fields)); } catch {}
}

export function parseOptions(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function ensureAliases(existing: string[] | undefined, header: string): string[] {
  const set = new Set((existing ?? []).map(a => a.toLowerCase()));
  set.add(header.toLowerCase());
  return Array.from(set);
}
