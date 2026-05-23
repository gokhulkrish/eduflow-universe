import { z } from 'zod';

export const moduleFieldTypes = ["text", "textarea", "number", "select", "checkbox", "date", "email", "phone", "url", "rich-text"] as const;

const HomeInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const HomeUpdateSchema = HomeInsertSchema.partial();

const HomeSelectSchema = HomeInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const DashboardDataProcessingInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const DashboardDataProcessingUpdateSchema = DashboardDataProcessingInsertSchema.partial();

const DashboardDataProcessingSelectSchema = DashboardDataProcessingInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const DashboardAnalyticalInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const DashboardAnalyticalUpdateSchema = DashboardAnalyticalInsertSchema.partial();

const DashboardAnalyticalSelectSchema = DashboardAnalyticalInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const DashboardScholarshipStatusInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const DashboardScholarshipStatusUpdateSchema = DashboardScholarshipStatusInsertSchema.partial();

const DashboardScholarshipStatusSelectSchema = DashboardScholarshipStatusInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const AddStudentInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const AddStudentUpdateSchema = AddStudentInsertSchema.partial();

const AddStudentSelectSchema = AddStudentInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const RegisteredStudentsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const RegisteredStudentsUpdateSchema = RegisteredStudentsInsertSchema.partial();

const RegisteredStudentsSelectSchema = RegisteredStudentsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const PartialSavedStudentsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const PartialSavedStudentsUpdateSchema = PartialSavedStudentsInsertSchema.partial();

const PartialSavedStudentsSelectSchema = PartialSavedStudentsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const AdmissionsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const AdmissionsUpdateSchema = AdmissionsInsertSchema.partial();

const AdmissionsSelectSchema = AdmissionsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const CertificatesInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const CertificatesUpdateSchema = CertificatesInsertSchema.partial();

const CertificatesSelectSchema = CertificatesInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ImportCreateInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ImportCreateUpdateSchema = ImportCreateInsertSchema.partial();

const ImportCreateSelectSchema = ImportCreateInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ImportMapInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ImportMapUpdateSchema = ImportMapInsertSchema.partial();

const ImportMapSelectSchema = ImportMapInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ImportKeyingInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ImportKeyingUpdateSchema = ImportKeyingInsertSchema.partial();

const ImportKeyingSelectSchema = ImportKeyingInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ImportDuplicateReviewInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ImportDuplicateReviewUpdateSchema = ImportDuplicateReviewInsertSchema.partial();

const ImportDuplicateReviewSelectSchema = ImportDuplicateReviewInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ImportValidationInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ImportValidationUpdateSchema = ImportValidationInsertSchema.partial();

const ImportValidationSelectSchema = ImportValidationInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ImportPreviewInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ImportPreviewUpdateSchema = ImportPreviewInsertSchema.partial();

const ImportPreviewSelectSchema = ImportPreviewInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ImportTransferInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ImportTransferUpdateSchema = ImportTransferInsertSchema.partial();

const ImportTransferSelectSchema = ImportTransferInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const CollegeInfoInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const CollegeInfoUpdateSchema = CollegeInfoInsertSchema.partial();

const CollegeInfoSelectSchema = CollegeInfoInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const CourseInfoInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const CourseInfoUpdateSchema = CourseInfoInsertSchema.partial();

const CourseInfoSelectSchema = CourseInfoInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const UserManagementInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const UserManagementUpdateSchema = UserManagementInsertSchema.partial();

const UserManagementSelectSchema = UserManagementInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const AcademicsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const AcademicsUpdateSchema = AcademicsInsertSchema.partial();

const AcademicsSelectSchema = AcademicsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const TimetableInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const TimetableUpdateSchema = TimetableInsertSchema.partial();

const TimetableSelectSchema = TimetableInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const HomeworkInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const HomeworkUpdateSchema = HomeworkInsertSchema.partial();

const HomeworkSelectSchema = HomeworkInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const AssignmentsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const AssignmentsUpdateSchema = AssignmentsInsertSchema.partial();

const AssignmentsSelectSchema = AssignmentsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const AttendanceInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const AttendanceUpdateSchema = AttendanceInsertSchema.partial();

const AttendanceSelectSchema = AttendanceInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ExamsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ExamsUpdateSchema = ExamsInsertSchema.partial();

const ExamsSelectSchema = ExamsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const VideoRoomsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const VideoRoomsUpdateSchema = VideoRoomsInsertSchema.partial();

const VideoRoomsSelectSchema = VideoRoomsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const QuizInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const QuizUpdateSchema = QuizInsertSchema.partial();

const QuizSelectSchema = QuizInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const PeopleInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const PeopleUpdateSchema = PeopleInsertSchema.partial();

const PeopleSelectSchema = PeopleInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const AdministrationInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const AdministrationUpdateSchema = AdministrationInsertSchema.partial();

const AdministrationSelectSchema = AdministrationInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const PayrollInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const PayrollUpdateSchema = PayrollInsertSchema.partial();

const PayrollSelectSchema = PayrollInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ReceptionInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ReceptionUpdateSchema = ReceptionInsertSchema.partial();

const ReceptionSelectSchema = ReceptionInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const FeesInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const FeesUpdateSchema = FeesInsertSchema.partial();

const FeesSelectSchema = FeesInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ScholarshipsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ScholarshipsUpdateSchema = ScholarshipsInsertSchema.partial();

const ScholarshipsSelectSchema = ScholarshipsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const CommunicationInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const CommunicationUpdateSchema = CommunicationInsertSchema.partial();

const CommunicationSelectSchema = CommunicationInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ChatInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ChatUpdateSchema = ChatInsertSchema.partial();

const ChatSelectSchema = ChatInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const EventsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const EventsUpdateSchema = EventsInsertSchema.partial();

const EventsSelectSchema = EventsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const MediaInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const MediaUpdateSchema = MediaInsertSchema.partial();

const MediaSelectSchema = MediaInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const HostelInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const HostelUpdateSchema = HostelInsertSchema.partial();

const HostelSelectSchema = HostelInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const TransportInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const TransportUpdateSchema = TransportInsertSchema.partial();

const TransportSelectSchema = TransportInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const LibraryInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const LibraryUpdateSchema = LibraryInsertSchema.partial();

const LibrarySelectSchema = LibraryInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const InventoryInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const InventoryUpdateSchema = InventoryInsertSchema.partial();

const InventorySelectSchema = InventoryInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const TaskManagementInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const TaskManagementUpdateSchema = TaskManagementInsertSchema.partial();

const TaskManagementSelectSchema = TaskManagementInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const PlacementInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const PlacementUpdateSchema = PlacementInsertSchema.partial();

const PlacementSelectSchema = PlacementInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ReportsAnalyticsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const ReportsAnalyticsUpdateSchema = ReportsAnalyticsInsertSchema.partial();

const ReportsAnalyticsSelectSchema = ReportsAnalyticsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const AlumniInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const AlumniUpdateSchema = AlumniInsertSchema.partial();

const AlumniSelectSchema = AlumniInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const SystemInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const SystemUpdateSchema = SystemInsertSchema.partial();

const SystemSelectSchema = SystemInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const SettingsBackupInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const SettingsBackupUpdateSchema = SettingsBackupInsertSchema.partial();

const SettingsBackupSelectSchema = SettingsBackupInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const SettingsHeaderRegistryInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const SettingsHeaderRegistryUpdateSchema = SettingsHeaderRegistryInsertSchema.partial();

const SettingsHeaderRegistrySelectSchema = SettingsHeaderRegistryInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const SettingsWorkspaceControlInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const SettingsWorkspaceControlUpdateSchema = SettingsWorkspaceControlInsertSchema.partial();

const SettingsWorkspaceControlSelectSchema = SettingsWorkspaceControlInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const SettingsAiPolicyInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const SettingsAiPolicyUpdateSchema = SettingsAiPolicyInsertSchema.partial();

const SettingsAiPolicySelectSchema = SettingsAiPolicyInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const SettingsStartupTraceInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const SettingsStartupTraceUpdateSchema = SettingsStartupTraceInsertSchema.partial();

const SettingsStartupTraceSelectSchema = SettingsStartupTraceInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const SettingsBatchHistoryInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  module_status: z.enum(['live', 'needs-wiring', 'coming-soon']).optional(),
  domain_key: z.string().optional(),
  domain_label: z.string().optional(),
  renderer: z.string().optional(),
  launch_type: z.string().optional(),
  submodules: z.array(z.string()).default([]),
  payload: z.record(z.unknown()).default({})
}).strict();

const SettingsBatchHistoryUpdateSchema = SettingsBatchHistoryInsertSchema.partial();

const SettingsBatchHistorySelectSchema = SettingsBatchHistoryInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const DepartmentsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  departmentname: z.string().trim().min(1, "Department Name is required"),
  departmentcode: z.string().trim().min(1, "Department Code is required"),
  hodname: z.string().optional(),
  programlevel: z.enum(["UG","PG","Research","Diploma","Certificate"] as [string, ...string[]]).optional(),
  sanctionedintake: z.number({ invalid_type_error: "Sanctioned Intake must be a number" }).finite().optional(),
  naacnbastatus: z.enum(["Not Applied","Applied","Accredited","Re-Accreditation Due"] as [string, ...string[]]).optional()
}).strict();

const DepartmentsUpdateSchema = DepartmentsInsertSchema.partial();

const DepartmentsSelectSchema = DepartmentsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const FacultyHRInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  facultyname: z.string().trim().min(1, "Faculty / Staff Name is required"),
  employeecode: z.string().trim().min(1, "Employee Code is required"),
  designation: z.string().optional(),
  departmentname: z.string().optional(),
  workloadhours: z.number({ invalid_type_error: "Weekly Workload Hours must be a number" }).finite().optional(),
  employmentstatus: z.enum(["Active","On Leave","Contract","Relieved","Retired"] as [string, ...string[]]).optional()
}).strict();

const FacultyHRUpdateSchema = FacultyHRInsertSchema.partial();

const FacultyHRSelectSchema = FacultyHRInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const CurriculumOutcomeInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  curriculumname: z.string().trim().min(1, "Curriculum / Regulation is required"),
  coursecode: z.string().optional(),
  semester: z.string().optional(),
  outcomemapstatus: z.enum(["Draft","Mapped","Reviewed","Approved"] as [string, ...string[]]).optional(),
  syllabuscoverage: z.number({ invalid_type_error: "Syllabus Coverage % must be a number" }).finite().optional(),
  attainmentband: z.enum(["Low","Medium","High","Excellent"] as [string, ...string[]]).optional()
}).strict();

const CurriculumOutcomeUpdateSchema = CurriculumOutcomeInsertSchema.partial();

const CurriculumOutcomeSelectSchema = CurriculumOutcomeInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const LmsElearningInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  courseroom: z.string().trim().min(1, "Course Room is required"),
  contentunit: z.string().optional(),
  facultyowner: z.string().optional(),
  engagementpercent: z.number({ invalid_type_error: "Engagement % must be a number" }).finite().optional(),
  completionstatus: z.enum(["Not Started","In Progress","Completed","Needs Intervention"] as [string, ...string[]]).optional()
}).strict();

const LmsElearningUpdateSchema = LmsElearningInsertSchema.partial();

const LmsElearningSelectSchema = LmsElearningInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ResearchInnovationInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  researchtitle: z.string().trim().min(1, "Project / Publication Title is required"),
  principalinvestigator: z.string().optional(),
  fundingagency: z.string().optional(),
  grantamount: z.number({ invalid_type_error: "Grant Amount must be a number" }).finite().optional(),
  researchstage: z.enum(["Proposal","Approved","Ongoing","Completed","Published","Patented"] as [string, ...string[]]).optional()
}).strict();

const ResearchInnovationUpdateSchema = ResearchInnovationInsertSchema.partial();

const ResearchInnovationSelectSchema = ResearchInnovationInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const AccreditationIQACInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  qualitycycle: z.string().trim().min(1, "Quality Cycle is required"),
  framework: z.enum(["NAAC","NBA","NIRF","AISHE","AQAR","Internal Audit"] as [string, ...string[]]).optional(),
  criterion: z.string().optional(),
  evidencestatus: z.enum(["Pending","Collected","Verified","Submitted","Accepted"] as [string, ...string[]]).optional(),
  owner: z.string().optional()
}).strict();

const AccreditationIQACUpdateSchema = AccreditationIQACInsertSchema.partial();

const AccreditationIQACSelectSchema = AccreditationIQACInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const FinanceAccountingInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  voucherno: z.string().trim().min(1, "Voucher / Receipt No is required"),
  accounthead: z.string().trim().min(1, "Account Head is required"),
  transactiontype: z.enum(["Income","Expense","Transfer","Adjustment"] as [string, ...string[]]).optional(),
  amount: z.number({ invalid_type_error: "Amount must be a number" }).finite("Amount must be finite"),
  approvalstatus: z.enum(["Draft","Pending","Approved","Rejected","Posted"] as [string, ...string[]]).optional()
}).strict();

const FinanceAccountingUpdateSchema = FinanceAccountingInsertSchema.partial();

const FinanceAccountingSelectSchema = FinanceAccountingInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const ProcurementAssetsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  requesttitle: z.string().trim().min(1, "Request / Asset Title is required"),
  vendorname: z.string().optional(),
  assettag: z.string().optional(),
  departmentname: z.string().optional(),
  procurementstatus: z.enum(["Requested","Quoted","Approved","Ordered","Received","Issued"] as [string, ...string[]]).optional()
}).strict();

const ProcurementAssetsUpdateSchema = ProcurementAssetsInsertSchema.partial();

const ProcurementAssetsSelectSchema = ProcurementAssetsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const GrievanceHelpdeskInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  tickettitle: z.string().trim().min(1, "Ticket Title is required"),
  requestertype: z.enum(["Student","Parent","Faculty","Staff","Public"] as [string, ...string[]]).optional(),
  priorityband: z.enum(["Low","Medium","High","Critical"] as [string, ...string[]]).optional(),
  assignedteam: z.string().optional(),
  slastatus: z.enum(["Within SLA","At Risk","Breached","Resolved"] as [string, ...string[]]).optional()
}).strict();

const GrievanceHelpdeskUpdateSchema = GrievanceHelpdeskInsertSchema.partial();

const GrievanceHelpdeskSelectSchema = GrievanceHelpdeskInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const HealthWellbeingInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  casetitle: z.string().trim().min(1, "Case / Visit Title is required"),
  personname: z.string().optional(),
  casetype: z.enum(["Medical","Counselling","Emergency","Wellbeing","Follow-up"] as [string, ...string[]]).optional(),
  followupdate: z.string().optional(),
  carestatus: z.enum(["Open","Monitoring","Referred","Closed"] as [string, ...string[]]).optional()
}).strict();

const HealthWellbeingUpdateSchema = HealthWellbeingInsertSchema.partial();

const HealthWellbeingSelectSchema = HealthWellbeingInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const SecurityComplianceInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  controltitle: z.string().trim().min(1, "Control / Incident Title is required"),
  controltype: z.enum(["Security","Data Privacy","Consent","Role Audit","Incident"] as [string, ...string[]]).optional(),
  owner: z.string().optional(),
  risklevel: z.enum(["Low","Medium","High","Critical"] as [string, ...string[]]).optional(),
  closurestatus: z.enum(["Open","In Review","Mitigated","Closed"] as [string, ...string[]]).optional()
}).strict();

const SecurityComplianceUpdateSchema = SecurityComplianceInsertSchema.partial();

const SecurityComplianceSelectSchema = SecurityComplianceInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

const DocumentDmsInsertSchema = z.object({
  module_registry_id: z.string().uuid("module_registry_id must be a valid UUID"),
  module_key: z.string().trim().min(1, "module_key is required"),
  record_title: z.string().trim().min(1, "record_title is required"),
  summary: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  deleted_at: z.string().nullable().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  documenttitle: z.string().trim().min(1, "Document Title is required"),
  documenttype: z.enum(["Student File","Policy","Evidence","Template","Certificate","Contract"] as [string, ...string[]]).optional(),
  owner: z.string().optional(),
  expirydate: z.string().optional(),
  documentstatus: z.enum(["Draft","Under Review","Approved","Expired","Archived"] as [string, ...string[]]).optional()
}).strict();

const DocumentDmsUpdateSchema = DocumentDmsInsertSchema.partial();

const DocumentDmsSelectSchema = DocumentDmsInsertSchema.extend({
  id: z.string().uuid(),
  created_at: z.string().min(1),
  updated_at: z.string().min(1)
});

export const moduleInsertSchemas = {
  home: HomeInsertSchema,
  dashboardDataProcessing: DashboardDataProcessingInsertSchema,
  dashboardAnalytical: DashboardAnalyticalInsertSchema,
  dashboardScholarshipStatus: DashboardScholarshipStatusInsertSchema,
  addStudent: AddStudentInsertSchema,
  registeredStudents: RegisteredStudentsInsertSchema,
  partialSavedStudents: PartialSavedStudentsInsertSchema,
  admissions: AdmissionsInsertSchema,
  certificates: CertificatesInsertSchema,
  importCreate: ImportCreateInsertSchema,
  importMap: ImportMapInsertSchema,
  importKeying: ImportKeyingInsertSchema,
  importDuplicateReview: ImportDuplicateReviewInsertSchema,
  importValidation: ImportValidationInsertSchema,
  importPreview: ImportPreviewInsertSchema,
  importTransfer: ImportTransferInsertSchema,
  collegeInfo: CollegeInfoInsertSchema,
  courseInfo: CourseInfoInsertSchema,
  userManagement: UserManagementInsertSchema,
  academics: AcademicsInsertSchema,
  timetable: TimetableInsertSchema,
  homework: HomeworkInsertSchema,
  assignments: AssignmentsInsertSchema,
  attendance: AttendanceInsertSchema,
  exams: ExamsInsertSchema,
  videoRooms: VideoRoomsInsertSchema,
  quiz: QuizInsertSchema,
  people: PeopleInsertSchema,
  administration: AdministrationInsertSchema,
  payroll: PayrollInsertSchema,
  reception: ReceptionInsertSchema,
  fees: FeesInsertSchema,
  scholarships: ScholarshipsInsertSchema,
  communication: CommunicationInsertSchema,
  chat: ChatInsertSchema,
  events: EventsInsertSchema,
  media: MediaInsertSchema,
  hostel: HostelInsertSchema,
  transport: TransportInsertSchema,
  library: LibraryInsertSchema,
  inventory: InventoryInsertSchema,
  taskManagement: TaskManagementInsertSchema,
  placement: PlacementInsertSchema,
  reportsAnalytics: ReportsAnalyticsInsertSchema,
  alumni: AlumniInsertSchema,
  system: SystemInsertSchema,
  settingsBackup: SettingsBackupInsertSchema,
  settingsHeaderRegistry: SettingsHeaderRegistryInsertSchema,
  settingsWorkspaceControl: SettingsWorkspaceControlInsertSchema,
  settingsAiPolicy: SettingsAiPolicyInsertSchema,
  settingsStartupTrace: SettingsStartupTraceInsertSchema,
  settingsBatchHistory: SettingsBatchHistoryInsertSchema,
  departments: DepartmentsInsertSchema,
  facultyHR: FacultyHRInsertSchema,
  curriculumOutcome: CurriculumOutcomeInsertSchema,
  lmsElearning: LmsElearningInsertSchema,
  researchInnovation: ResearchInnovationInsertSchema,
  accreditationIQAC: AccreditationIQACInsertSchema,
  financeAccounting: FinanceAccountingInsertSchema,
  procurementAssets: ProcurementAssetsInsertSchema,
  grievanceHelpdesk: GrievanceHelpdeskInsertSchema,
  healthWellbeing: HealthWellbeingInsertSchema,
  securityCompliance: SecurityComplianceInsertSchema,
  documentDms: DocumentDmsInsertSchema,
} as const;

export const moduleUpdateSchemas = {
  home: HomeUpdateSchema,
  dashboardDataProcessing: DashboardDataProcessingUpdateSchema,
  dashboardAnalytical: DashboardAnalyticalUpdateSchema,
  dashboardScholarshipStatus: DashboardScholarshipStatusUpdateSchema,
  addStudent: AddStudentUpdateSchema,
  registeredStudents: RegisteredStudentsUpdateSchema,
  partialSavedStudents: PartialSavedStudentsUpdateSchema,
  admissions: AdmissionsUpdateSchema,
  certificates: CertificatesUpdateSchema,
  importCreate: ImportCreateUpdateSchema,
  importMap: ImportMapUpdateSchema,
  importKeying: ImportKeyingUpdateSchema,
  importDuplicateReview: ImportDuplicateReviewUpdateSchema,
  importValidation: ImportValidationUpdateSchema,
  importPreview: ImportPreviewUpdateSchema,
  importTransfer: ImportTransferUpdateSchema,
  collegeInfo: CollegeInfoUpdateSchema,
  courseInfo: CourseInfoUpdateSchema,
  userManagement: UserManagementUpdateSchema,
  academics: AcademicsUpdateSchema,
  timetable: TimetableUpdateSchema,
  homework: HomeworkUpdateSchema,
  assignments: AssignmentsUpdateSchema,
  attendance: AttendanceUpdateSchema,
  exams: ExamsUpdateSchema,
  videoRooms: VideoRoomsUpdateSchema,
  quiz: QuizUpdateSchema,
  people: PeopleUpdateSchema,
  administration: AdministrationUpdateSchema,
  payroll: PayrollUpdateSchema,
  reception: ReceptionUpdateSchema,
  fees: FeesUpdateSchema,
  scholarships: ScholarshipsUpdateSchema,
  communication: CommunicationUpdateSchema,
  chat: ChatUpdateSchema,
  events: EventsUpdateSchema,
  media: MediaUpdateSchema,
  hostel: HostelUpdateSchema,
  transport: TransportUpdateSchema,
  library: LibraryUpdateSchema,
  inventory: InventoryUpdateSchema,
  taskManagement: TaskManagementUpdateSchema,
  placement: PlacementUpdateSchema,
  reportsAnalytics: ReportsAnalyticsUpdateSchema,
  alumni: AlumniUpdateSchema,
  system: SystemUpdateSchema,
  settingsBackup: SettingsBackupUpdateSchema,
  settingsHeaderRegistry: SettingsHeaderRegistryUpdateSchema,
  settingsWorkspaceControl: SettingsWorkspaceControlUpdateSchema,
  settingsAiPolicy: SettingsAiPolicyUpdateSchema,
  settingsStartupTrace: SettingsStartupTraceUpdateSchema,
  settingsBatchHistory: SettingsBatchHistoryUpdateSchema,
  departments: DepartmentsUpdateSchema,
  facultyHR: FacultyHRUpdateSchema,
  curriculumOutcome: CurriculumOutcomeUpdateSchema,
  lmsElearning: LmsElearningUpdateSchema,
  researchInnovation: ResearchInnovationUpdateSchema,
  accreditationIQAC: AccreditationIQACUpdateSchema,
  financeAccounting: FinanceAccountingUpdateSchema,
  procurementAssets: ProcurementAssetsUpdateSchema,
  grievanceHelpdesk: GrievanceHelpdeskUpdateSchema,
  healthWellbeing: HealthWellbeingUpdateSchema,
  securityCompliance: SecurityComplianceUpdateSchema,
  documentDms: DocumentDmsUpdateSchema,
} as const;

export const moduleSelectSchemas = {
  home: HomeSelectSchema,
  dashboardDataProcessing: DashboardDataProcessingSelectSchema,
  dashboardAnalytical: DashboardAnalyticalSelectSchema,
  dashboardScholarshipStatus: DashboardScholarshipStatusSelectSchema,
  addStudent: AddStudentSelectSchema,
  registeredStudents: RegisteredStudentsSelectSchema,
  partialSavedStudents: PartialSavedStudentsSelectSchema,
  admissions: AdmissionsSelectSchema,
  certificates: CertificatesSelectSchema,
  importCreate: ImportCreateSelectSchema,
  importMap: ImportMapSelectSchema,
  importKeying: ImportKeyingSelectSchema,
  importDuplicateReview: ImportDuplicateReviewSelectSchema,
  importValidation: ImportValidationSelectSchema,
  importPreview: ImportPreviewSelectSchema,
  importTransfer: ImportTransferSelectSchema,
  collegeInfo: CollegeInfoSelectSchema,
  courseInfo: CourseInfoSelectSchema,
  userManagement: UserManagementSelectSchema,
  academics: AcademicsSelectSchema,
  timetable: TimetableSelectSchema,
  homework: HomeworkSelectSchema,
  assignments: AssignmentsSelectSchema,
  attendance: AttendanceSelectSchema,
  exams: ExamsSelectSchema,
  videoRooms: VideoRoomsSelectSchema,
  quiz: QuizSelectSchema,
  people: PeopleSelectSchema,
  administration: AdministrationSelectSchema,
  payroll: PayrollSelectSchema,
  reception: ReceptionSelectSchema,
  fees: FeesSelectSchema,
  scholarships: ScholarshipsSelectSchema,
  communication: CommunicationSelectSchema,
  chat: ChatSelectSchema,
  events: EventsSelectSchema,
  media: MediaSelectSchema,
  hostel: HostelSelectSchema,
  transport: TransportSelectSchema,
  library: LibrarySelectSchema,
  inventory: InventorySelectSchema,
  taskManagement: TaskManagementSelectSchema,
  placement: PlacementSelectSchema,
  reportsAnalytics: ReportsAnalyticsSelectSchema,
  alumni: AlumniSelectSchema,
  system: SystemSelectSchema,
  settingsBackup: SettingsBackupSelectSchema,
  settingsHeaderRegistry: SettingsHeaderRegistrySelectSchema,
  settingsWorkspaceControl: SettingsWorkspaceControlSelectSchema,
  settingsAiPolicy: SettingsAiPolicySelectSchema,
  settingsStartupTrace: SettingsStartupTraceSelectSchema,
  settingsBatchHistory: SettingsBatchHistorySelectSchema,
  departments: DepartmentsSelectSchema,
  facultyHR: FacultyHRSelectSchema,
  curriculumOutcome: CurriculumOutcomeSelectSchema,
  lmsElearning: LmsElearningSelectSchema,
  researchInnovation: ResearchInnovationSelectSchema,
  accreditationIQAC: AccreditationIQACSelectSchema,
  financeAccounting: FinanceAccountingSelectSchema,
  procurementAssets: ProcurementAssetsSelectSchema,
  grievanceHelpdesk: GrievanceHelpdeskSelectSchema,
  healthWellbeing: HealthWellbeingSelectSchema,
  securityCompliance: SecurityComplianceSelectSchema,
  documentDms: DocumentDmsSelectSchema,
} as const;

export const moduleSchemas = {
  home: { insert: HomeInsertSchema, update: HomeUpdateSchema, select: HomeSelectSchema },
  dashboardDataProcessing: { insert: DashboardDataProcessingInsertSchema, update: DashboardDataProcessingUpdateSchema, select: DashboardDataProcessingSelectSchema },
  dashboardAnalytical: { insert: DashboardAnalyticalInsertSchema, update: DashboardAnalyticalUpdateSchema, select: DashboardAnalyticalSelectSchema },
  dashboardScholarshipStatus: { insert: DashboardScholarshipStatusInsertSchema, update: DashboardScholarshipStatusUpdateSchema, select: DashboardScholarshipStatusSelectSchema },
  addStudent: { insert: AddStudentInsertSchema, update: AddStudentUpdateSchema, select: AddStudentSelectSchema },
  registeredStudents: { insert: RegisteredStudentsInsertSchema, update: RegisteredStudentsUpdateSchema, select: RegisteredStudentsSelectSchema },
  partialSavedStudents: { insert: PartialSavedStudentsInsertSchema, update: PartialSavedStudentsUpdateSchema, select: PartialSavedStudentsSelectSchema },
  admissions: { insert: AdmissionsInsertSchema, update: AdmissionsUpdateSchema, select: AdmissionsSelectSchema },
  certificates: { insert: CertificatesInsertSchema, update: CertificatesUpdateSchema, select: CertificatesSelectSchema },
  importCreate: { insert: ImportCreateInsertSchema, update: ImportCreateUpdateSchema, select: ImportCreateSelectSchema },
  importMap: { insert: ImportMapInsertSchema, update: ImportMapUpdateSchema, select: ImportMapSelectSchema },
  importKeying: { insert: ImportKeyingInsertSchema, update: ImportKeyingUpdateSchema, select: ImportKeyingSelectSchema },
  importDuplicateReview: { insert: ImportDuplicateReviewInsertSchema, update: ImportDuplicateReviewUpdateSchema, select: ImportDuplicateReviewSelectSchema },
  importValidation: { insert: ImportValidationInsertSchema, update: ImportValidationUpdateSchema, select: ImportValidationSelectSchema },
  importPreview: { insert: ImportPreviewInsertSchema, update: ImportPreviewUpdateSchema, select: ImportPreviewSelectSchema },
  importTransfer: { insert: ImportTransferInsertSchema, update: ImportTransferUpdateSchema, select: ImportTransferSelectSchema },
  collegeInfo: { insert: CollegeInfoInsertSchema, update: CollegeInfoUpdateSchema, select: CollegeInfoSelectSchema },
  courseInfo: { insert: CourseInfoInsertSchema, update: CourseInfoUpdateSchema, select: CourseInfoSelectSchema },
  userManagement: { insert: UserManagementInsertSchema, update: UserManagementUpdateSchema, select: UserManagementSelectSchema },
  academics: { insert: AcademicsInsertSchema, update: AcademicsUpdateSchema, select: AcademicsSelectSchema },
  timetable: { insert: TimetableInsertSchema, update: TimetableUpdateSchema, select: TimetableSelectSchema },
  homework: { insert: HomeworkInsertSchema, update: HomeworkUpdateSchema, select: HomeworkSelectSchema },
  assignments: { insert: AssignmentsInsertSchema, update: AssignmentsUpdateSchema, select: AssignmentsSelectSchema },
  attendance: { insert: AttendanceInsertSchema, update: AttendanceUpdateSchema, select: AttendanceSelectSchema },
  exams: { insert: ExamsInsertSchema, update: ExamsUpdateSchema, select: ExamsSelectSchema },
  videoRooms: { insert: VideoRoomsInsertSchema, update: VideoRoomsUpdateSchema, select: VideoRoomsSelectSchema },
  quiz: { insert: QuizInsertSchema, update: QuizUpdateSchema, select: QuizSelectSchema },
  people: { insert: PeopleInsertSchema, update: PeopleUpdateSchema, select: PeopleSelectSchema },
  administration: { insert: AdministrationInsertSchema, update: AdministrationUpdateSchema, select: AdministrationSelectSchema },
  payroll: { insert: PayrollInsertSchema, update: PayrollUpdateSchema, select: PayrollSelectSchema },
  reception: { insert: ReceptionInsertSchema, update: ReceptionUpdateSchema, select: ReceptionSelectSchema },
  fees: { insert: FeesInsertSchema, update: FeesUpdateSchema, select: FeesSelectSchema },
  scholarships: { insert: ScholarshipsInsertSchema, update: ScholarshipsUpdateSchema, select: ScholarshipsSelectSchema },
  communication: { insert: CommunicationInsertSchema, update: CommunicationUpdateSchema, select: CommunicationSelectSchema },
  chat: { insert: ChatInsertSchema, update: ChatUpdateSchema, select: ChatSelectSchema },
  events: { insert: EventsInsertSchema, update: EventsUpdateSchema, select: EventsSelectSchema },
  media: { insert: MediaInsertSchema, update: MediaUpdateSchema, select: MediaSelectSchema },
  hostel: { insert: HostelInsertSchema, update: HostelUpdateSchema, select: HostelSelectSchema },
  transport: { insert: TransportInsertSchema, update: TransportUpdateSchema, select: TransportSelectSchema },
  library: { insert: LibraryInsertSchema, update: LibraryUpdateSchema, select: LibrarySelectSchema },
  inventory: { insert: InventoryInsertSchema, update: InventoryUpdateSchema, select: InventorySelectSchema },
  taskManagement: { insert: TaskManagementInsertSchema, update: TaskManagementUpdateSchema, select: TaskManagementSelectSchema },
  placement: { insert: PlacementInsertSchema, update: PlacementUpdateSchema, select: PlacementSelectSchema },
  reportsAnalytics: { insert: ReportsAnalyticsInsertSchema, update: ReportsAnalyticsUpdateSchema, select: ReportsAnalyticsSelectSchema },
  alumni: { insert: AlumniInsertSchema, update: AlumniUpdateSchema, select: AlumniSelectSchema },
  system: { insert: SystemInsertSchema, update: SystemUpdateSchema, select: SystemSelectSchema },
  settingsBackup: { insert: SettingsBackupInsertSchema, update: SettingsBackupUpdateSchema, select: SettingsBackupSelectSchema },
  settingsHeaderRegistry: { insert: SettingsHeaderRegistryInsertSchema, update: SettingsHeaderRegistryUpdateSchema, select: SettingsHeaderRegistrySelectSchema },
  settingsWorkspaceControl: { insert: SettingsWorkspaceControlInsertSchema, update: SettingsWorkspaceControlUpdateSchema, select: SettingsWorkspaceControlSelectSchema },
  settingsAiPolicy: { insert: SettingsAiPolicyInsertSchema, update: SettingsAiPolicyUpdateSchema, select: SettingsAiPolicySelectSchema },
  settingsStartupTrace: { insert: SettingsStartupTraceInsertSchema, update: SettingsStartupTraceUpdateSchema, select: SettingsStartupTraceSelectSchema },
  settingsBatchHistory: { insert: SettingsBatchHistoryInsertSchema, update: SettingsBatchHistoryUpdateSchema, select: SettingsBatchHistorySelectSchema },
  departments: { insert: DepartmentsInsertSchema, update: DepartmentsUpdateSchema, select: DepartmentsSelectSchema },
  facultyHR: { insert: FacultyHRInsertSchema, update: FacultyHRUpdateSchema, select: FacultyHRSelectSchema },
  curriculumOutcome: { insert: CurriculumOutcomeInsertSchema, update: CurriculumOutcomeUpdateSchema, select: CurriculumOutcomeSelectSchema },
  lmsElearning: { insert: LmsElearningInsertSchema, update: LmsElearningUpdateSchema, select: LmsElearningSelectSchema },
  researchInnovation: { insert: ResearchInnovationInsertSchema, update: ResearchInnovationUpdateSchema, select: ResearchInnovationSelectSchema },
  accreditationIQAC: { insert: AccreditationIQACInsertSchema, update: AccreditationIQACUpdateSchema, select: AccreditationIQACSelectSchema },
  financeAccounting: { insert: FinanceAccountingInsertSchema, update: FinanceAccountingUpdateSchema, select: FinanceAccountingSelectSchema },
  procurementAssets: { insert: ProcurementAssetsInsertSchema, update: ProcurementAssetsUpdateSchema, select: ProcurementAssetsSelectSchema },
  grievanceHelpdesk: { insert: GrievanceHelpdeskInsertSchema, update: GrievanceHelpdeskUpdateSchema, select: GrievanceHelpdeskSelectSchema },
  healthWellbeing: { insert: HealthWellbeingInsertSchema, update: HealthWellbeingUpdateSchema, select: HealthWellbeingSelectSchema },
  securityCompliance: { insert: SecurityComplianceInsertSchema, update: SecurityComplianceUpdateSchema, select: SecurityComplianceSelectSchema },
  documentDms: { insert: DocumentDmsInsertSchema, update: DocumentDmsUpdateSchema, select: DocumentDmsSelectSchema },
} as const;

export {
  HomeInsertSchema,
  DashboardDataProcessingInsertSchema,
  DashboardAnalyticalInsertSchema,
  DashboardScholarshipStatusInsertSchema,
  AddStudentInsertSchema,
  RegisteredStudentsInsertSchema,
  PartialSavedStudentsInsertSchema,
  AdmissionsInsertSchema,
  CertificatesInsertSchema,
  ImportCreateInsertSchema,
  ImportMapInsertSchema,
  ImportKeyingInsertSchema,
  ImportDuplicateReviewInsertSchema,
  ImportValidationInsertSchema,
  ImportPreviewInsertSchema,
  ImportTransferInsertSchema,
  CollegeInfoInsertSchema,
  CourseInfoInsertSchema,
  UserManagementInsertSchema,
  AcademicsInsertSchema,
  TimetableInsertSchema,
  HomeworkInsertSchema,
  AssignmentsInsertSchema,
  AttendanceInsertSchema,
  ExamsInsertSchema,
  VideoRoomsInsertSchema,
  QuizInsertSchema,
  PeopleInsertSchema,
  AdministrationInsertSchema,
  PayrollInsertSchema,
  ReceptionInsertSchema,
  FeesInsertSchema,
  ScholarshipsInsertSchema,
  CommunicationInsertSchema,
  ChatInsertSchema,
  EventsInsertSchema,
  MediaInsertSchema,
  HostelInsertSchema,
  TransportInsertSchema,
  LibraryInsertSchema,
  InventoryInsertSchema,
  TaskManagementInsertSchema,
  PlacementInsertSchema,
  ReportsAnalyticsInsertSchema,
  AlumniInsertSchema,
  SystemInsertSchema,
  SettingsBackupInsertSchema,
  SettingsHeaderRegistryInsertSchema,
  SettingsWorkspaceControlInsertSchema,
  SettingsAiPolicyInsertSchema,
  SettingsStartupTraceInsertSchema,
  SettingsBatchHistoryInsertSchema,
  DepartmentsInsertSchema,
  FacultyHRInsertSchema,
  CurriculumOutcomeInsertSchema,
  LmsElearningInsertSchema,
  ResearchInnovationInsertSchema,
  AccreditationIQACInsertSchema,
  FinanceAccountingInsertSchema,
  ProcurementAssetsInsertSchema,
  GrievanceHelpdeskInsertSchema,
  HealthWellbeingInsertSchema,
  SecurityComplianceInsertSchema,
  DocumentDmsInsertSchema,
};

export type ModuleSchemaKey = keyof typeof moduleSchemas;

export function getModuleInsertSchema(key: ModuleSchemaKey) { return moduleSchemas[key].insert; }
export function getModuleUpdateSchema(key: ModuleSchemaKey) { return moduleSchemas[key].update; }
export function getModuleSelectSchema(key: ModuleSchemaKey) { return moduleSchemas[key].select; }
