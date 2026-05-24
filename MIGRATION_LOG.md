# MIGRATION_LOG

| Module | Old Versions Found | Status | New File | Schema Table | Notes |
|---|---|---|---|---|---|
| `home` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Dashboard.tsx` + `components/modules/Home/` | `module_home` | Dashboard page is a full real-time analytics implementation with recharts. |
| `dashboard-data-processing` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Dashboard.tsx` | `module_dashboard_data_processing` | Tab within the Dashboard page. |
| `dashboard-analytical` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Dashboard.tsx` | `module_dashboard_analytical` | Tab within the Dashboard page. |
| `dashboard-scholarship-status` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Dashboard.tsx` | `module_dashboard_scholarship_status` | Tab within the Dashboard page. |
| `add-student` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/AddStudent.tsx` | `module_add_student` | Full student creation form. |
| `registered-students` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Students.tsx` | `module_registered_students` | Data table with ribbon toolbar, search, pagination, CSV export. |
| `partial-saved-students` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/StudentInformation.tsx` | `module_partial_saved_students` | Draft management via localStorage sync. |
| `admissions` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/Admissions.tsx` | `module_admissions` | Full admissions portal with pipeline stages, screening workflow. |
| `certificates` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/Certificates.tsx` | `module_certificates` | Template CRUD, request workflow, QR verification, bulk generation. |
| `import-create` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Import.tsx` | `module_import_create` | Multi-step import wizard with file upload, batch details, mode selection. |
| `import-map` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Import.tsx` | `module_import_map` | Schema mapping with auto-mapping, header registry, drift detection. |
| `import-keying` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Import.tsx` | `module_import_keying` | Match strategy selection with fuzzy threshold slider. |
| `import-duplicate-review` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Import.tsx` | `module_import_duplicate_review` | Duplicate group detection with per-group action overrides. |
| `import-validation` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Import.tsx` | `module_import_validation` | Validation runtime with quality scoring, blockers, warnings. |
| `import-preview` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Import.tsx` | `module_import_preview` | Per-row preview with action overrides and diff summaries. |
| `import-transfer` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Import.tsx` | `module_import_transfer` | Commit engine with rollback snapshots and error reporting. |
| `collegeInfo` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/InstituteSettings.tsx` | `module_collegeInfo` | Institute profile editor with branding and accreditation info. |
| `courseInfo` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/CourseInformation.tsx` | `module_courseInfo` | Course management with CRUD, seat allocation. |
| `userManagement` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/UserManagement.tsx` | `module_userManagement` | User directory with RBAC integration. |
| `academics` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/ClassManagement.tsx` + `src/pages/SubjectManagement.tsx` | `module_academics` | Class and subject management with section assignments. |
| `timetable` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/Timetable.tsx` | `module_timetable` | Timetable with time slots, substitutions, teacher views. |
| `homework` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/Homework.tsx` | `module_homework` | Dedicated Homework page with assign, track, mark submitted. |
| `assignments` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/Assignments.tsx` | `module_assignments` | Assignment lifecycle with submissions and grading. |
| `attendance` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/Attendance.tsx` | `module_attendance` | Roll-call with present/absent/late cycling, cohort filters. |
| `exams` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Exams.tsx` | `module_exams` | Full exam lifecycle: schedules, marks, results, transcripts, PDF generation. |
| `videoRooms` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/VideoRooms.tsx` | `module_videoRooms` | Dedicated Video Rooms page with schedule, start/end, copy link. |
| `quiz` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/QuizModule.tsx` | `module_quiz` | Quiz bank and quiz attempts. |
| `people` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/Staff.tsx` + `src/pages/Students.tsx` | `module_people` | Staff/student directory with search and detail views. |
| `administration` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/Administration.tsx` | `module_administration` | Dedicated Administration page with tasks & notices. |
| `payroll` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/HR.tsx` | `module_payroll` | Payroll runs, items, and appraisal integration. |
| `reception` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/ReceptionManagement.tsx` | `module_reception` | Visitor, call, and postal management. |
| `fees` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Fees.tsx` | `module_fees` | Full fee management: structures, invoices, payments, concessions, reminders, ledgers, defaulters. |
| `scholarships` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Scholarship.tsx` | `module_scholarships` | Scholarship applications, verification, approval, disbursement. |
| `communication` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/Comms.tsx` | `module_communication` | Announcements and polls with priority/audience badges. |
| `chat` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/Chat.tsx` | `module_chat` | Real-time messaging with threads and participants. |
| `events` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/Events.tsx` | `module_events` | Event calendar with holidays, birthdays, anniversaries. |
| `media` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/MediaFileManagement.tsx` | `module_media` | Media uploads, video, document management. |
| `hostel` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/Hostel.tsx` | `module_hostel` | Room occupancy tracking with progress bars. |
| `transport` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/Transport.tsx` | `module_transport` | Route management with fare badges. |
| `library` | legacy shell + bridge patch 7 | ✅ LIVE | `src/pages/Library.tsx` | `module_library` | Catalog, loans, reservations, fines management. |
| `inventory` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/InventoryModule.tsx` | `module_inventory` | Products, purchases, sales, stock tracking. |
| `taskManagement` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/TaskManagement.tsx` | `module_taskManagement` | Task CRUD with active/completed/snoozed views. |
| `placement` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/PlacementCell.tsx` | `module_placement` | Jobs, recruiters, interview pipeline, analytics. |
| `reportsAnalytics` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Reports.tsx` | `module_reportsAnalytics` | Multi-tab reports with charts and data tables. |
| `alumni` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/AlumniModule.tsx` | `module_alumni` | Alumni directory with search, add/edit, pagination. |
| `system` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/System.tsx` | `module_system` | Dedicated System page with status, cache mgmt, diagnostics. |
| `settingsBackup` | legacy shell + bridge patch 7 + future module stubs | ✅ LIVE | `src/pages/Backups.tsx` + `src/pages/Settings.tsx` | `module_settingsBackup` | Backup management and settings configuration. |
| `settings-header-registry` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/SettingsHeaders.tsx` | `module_settings_header_registry` | Header registry with custom fields and alias management. |
| `settings-workspace-control` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Settings.tsx` | `module_settings_workspace_control` | Workspace sidebar/campus/language configuration. |
| `settings-ai-policy` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Settings.tsx` | `module_settings_ai_policy` | AI confidence, fee/attendance risk, access rules. |
| `settings-startup-trace` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Settings.tsx` | `module_settings_startup_trace` | Startup loader, animation, trace widget controls. |
| `settings-batch-history` | runtime shell + legacy monolith | ✅ LIVE | `src/pages/Import.tsx` | `module_settings_batch_history` | Saved/previewed/transferred import batch history. |
| `promotion-engine` | localStorage mock | ✅ LIVE | `src/pages/PromotionEngine.tsx` | `promotion_rules`, `promotion_runs` | Supabase-backed promotion with real eligibility checks. |
| `monitoring-dashboard` | legacy monolith | ✅ LIVE | `api/monitoring` | `monitoring_overview` view | Unified student/attendance/exam/scoring projection. |
| `scoring-engine` | legacy monolith | ✅ LIVE | `core/scoring/subjectiveToStandard.ts` | `audit_log` (scoring events) | Keyword-rubric scoring with 4 dimensions and composite index. |
| `comms-engine` | localStorage only | ⚡ BRIDGE | `core/comms/service.ts` | `message_templates`, `message_campaigns`, `message_logs` | Template CRUD, campaign scheduling, `{{variable}}` expansion. |
| `audit-service` | scattered writes | ✅ LIVE | `core/audit/service.ts` | `audit_log` | Centralized writeAuditEntry() with before/after snapshots. |
| `import-batch-server` | IndexedDB only | ⚡ BRIDGE | `supabase/migrations/20260524170000_*` | `import_batches`, `import_files`, `import_rows`, `import_row_errors` | Server-side batch storage with RLS, complements client engine. |
| `remark-templates` | inline only | ✅ LIVE | `core/academics/remarks.ts` | `remarks_templates` | Score-range-based template matching with {{variable}} expansion. |
