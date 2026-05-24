# Patch 00 — Legacy Feature Inventory

> Stable IDs for every feature in the legacy `SMS-2.html` monolith, grouped by domain.
> Each ID follows the pattern `{DOMAIN}-{SUBDOMAIN}-{NN}` for traceability in later patches.

## Identity & Auth

| ID | Domain | Legacy Name / Label | Entry Point | Core JS Functions / Globals | Data Entities Touched | Notes |
|----|--------|---------------------|-------------|----------------------------|----------------------|-------|
| IDA-LOGIN-01 | Identity | Login form | Login screen | `window.login()`, `window.authenticate()` | `auth.users`, `sessions` | Handles username/password and OTP |
| IDA-ROLE-01 | Identity | Role guarding | App initialization | `window.userRole`, `window.hasAccess()` | `module_roles`, `role_permissions` | Gating based on role hierarchy |
| IDA-SESS-01 | Identity | Session handling | Page load | `window.session`, `window.refreshSession()` | `sessions` | Token refresh on interval |
| IDA-MFA-01 | Identity | MFA verification | Login flow | `window.verifyMfa()` | `auth.users`, `mfa_tokens` | Optional two-factor |

## Student Master Data

| ID | Domain | Legacy Name / Label | Entry Point | Core JS Functions / Globals | Data Entities Touched | Notes |
|----|--------|---------------------|-------------|----------------------------|----------------------|-------|
| STU-CRUD-01 | Students | Add Student | Students > Add | `window.saveStudent()`, `addStudentSection` | `students`, `enrollments` | Form with 25+ fields |
| STU-CRUD-02 | Students | Edit Student | Students > List > Edit | `window.editStudent()`, `populateForm()` | `students`, `enrollments` | Pre-populates from existing record |
| STU-CRUD-03 | Students | Delete Student | Students > List > Delete | `window.deleteStudent()`, `confirmDelete()` | `students` | Soft delete with confirmation |
| STU-LIST-01 | Students | Student Directory | Students > List | `window.renderStudentTable()`, `registeredSection` | `students`, `enrollments` | Paginated table with search |
| STU-IMPORT-01 | Students | Batch Import (UMIS) | Import > Create Batch | `window.importUMIS()`, `importSection` | `students`, `import_batches` | Excel/CSV pipeline |
| STU-EXPORT-01 | Students | Export Students | Students > Export | `window.exportCSV()` | `students` | CSV download |
| STU-PROMOTE-01 | Students | Promotion Engine | Students > Promote | `window.promoteStudents()` | `enrollments` | Bulk grade promotion |
| STU-DEACT-01 | Students | Deactivate Student | Students > Deactivate | `window.deactivateStudent()` | `enrollments` | Marks as left/transferred |

## Academic Structure

| ID | Domain | Legacy Name / Label | Entry Point | Core JS Functions / Globals | Data Entities Touched | Notes |
|----|--------|---------------------|-------------|----------------------------|----------------------|-------|
| ACA-CLASS-01 | Academic | Class Management | Academics > Classes | `window.manageClasses()` | `class_levels` | CRUD for grades |
| ACA-SEC-01 | Academic | Section Management | Academics > Sections | `window.manageSections()` | `sections` | A/B/C per class |
| ACA-SUBJ-01 | Academic | Subject Management | Academics > Subjects | `window.manageSubjects()` | `subjects` | Per-class subject assignment |
| ACA-TEACH-01 | Academic | Teacher Assignment | Academics > Teachers | `window.assignTeacher()` | `teachers`, `teacher_subjects` | Subject-teacher mapping |
| ACA-TT-01 | Academic | Timetable | Academics > Timetable | `window.manageTimetable()` | `timetable_entries` | Period/day grid |

## Attendance

| ID | Domain | Legacy Name / Label | Entry Point | Core JS Functions / Globals | Data Entities Touched | Notes |
|----|--------|---------------------|-------------|----------------------------|----------------------|-------|
| ATT-DAILY-01 | Attendance | Daily Attendance | Attendance > Daily | `window.markAttendance()`, `attendanceClassSection` | `attendance` | Per-class daily grid |
| ATT-PERIOD-01 | Attendance | Period-wise | Attendance > Period | `window.markPeriodAttendance()` | `attendance` | With period column |
| ATT-BULK-01 | Attendance | Bulk Upload | Attendance > Import | `window.bulkUploadAttendance()`, `attendanceImport` | `attendance` | CSV file import |
| ATT-OVERRIDE-01 | Attendance | Manual Override | Attendance > Override | `window.overrideAttendance()` | `attendance` | Admin override with reason |
| ATT-REPORT-01 | Attendance | Attendance Report | Reports > Attendance | `window.attendanceReport()` | `attendance`, `students` | Summary by class/period |

## Assessment & Exams

| ID | Domain | Legacy Name / Label | Entry Point | Core JS Functions / Globals | Data Entities Touched | Notes |
|----|--------|---------------------|-------------|----------------------------|----------------------|-------|
| ASM-EXAM-01 | Assessment | Exam Schedule | Exams > Schedule | `window.createExam()`, `examSection` | `exam_schedules` | Term/exam type selection |
| ASM-MARKS-01 | Assessment | Marks Entry | Exams > Marks | `window.enterMarks()`, `marksEntry()` | `exam_marks` | Student-wise marks grid |
| ASM-GRADE-01 | Assessment | Grading | Exams > Grades | `window.calculateGrade()`, `gradeRules` | `grade_schemes` | A+ through F calculation |
| ASM-GPA-01 | Assessment | GPA Calculation | Exams > GPA | `window.calculateGPA()` | `exam_marks` | 10-point scale |
| ASM-DIST-01 | Assessment | Grade Distribution | Exams > Distribution | `window.getGradeDistribution()` | `exam_marks` | Count per grade |
| ASM-PASS-01 | Assessment | Pass/Fail Stats | Exams > Stats | `window.getPassFailStats()` | `exam_marks` | Pass rate calculation |
| ASM-REMARK-01 | Assessment | Remark Templates | Exams > Remarks | `window.remarkTemplates` | `remarks_templates` | Score-range remark matching |
| ASM-SUBJ-01 | Assessment | Subjective Scoring | Exams > Observations | `window.scoreObservation()` | `audit_log` | Free-text to 1-10 |

## Fees & Finance

| ID | Domain | Legacy Name / Label | Entry Point | Core JS Functions / Globals | Data Entities Touched | Notes |
|----|--------|---------------------|-------------|----------------------------|----------------------|-------|
| FEE-PLAN-01 | Fees | Fee Structure | Fees > Plans | `window.getFeeStructures()`, `feeStructure` | `fee_structures` | Per-grade fee plans |
| FEE-INV-01 | Fees | Invoice Generation | Fees > Invoices | `window.generateInvoice()`, `feeInvoice` | `fee_invoices` | Auto-generated per student |
| FEE-PAY-01 | Fees | Payment Recording | Fees > Payments | `window.recordPayment()`, `feePayment` | `fee_payments` | Cash/cheque/online |
| FEE-CONC-01 | Fees | Concession | Fees > Concession | `window.applyConcession()`, `feeConcession` | `fee_concessions` | Percentage or fixed discount |
| FEE-DUE-01 | Fees | Defaulter Report | Fees > Defaulters | `window.getDefaulters()`, `feeDues` | `fee_invoices` | Overdue filter |
| FEE-REM-01 | Fees | Payment Reminders | Fees > Reminders | `window.sendReminders()` | `fee_reminders` | SMS/email notifications |

## Communication

| ID | Domain | Legacy Name / Label | Entry Point | Core JS Functions / Globals | Data Entities Touched | Notes |
|----|--------|---------------------|-------------|----------------------------|----------------------|-------|
| COM-SMS-01 | Communication | SMS Templates | Comms > SMS Templates | `window.smsTemplates` | `message_templates` | {{variable}} expansion |
| COM-EMAIL-01 | Communication | Email Templates | Comms > Email Templates | `window.emailTemplates` | `message_templates` | Subject + body |
| COM-CAMP-01 | Communication | Campaigns | Comms > Campaigns | `window.createCampaign()`, `campaignMgmt` | `message_campaigns` | Scheduled send |
| COM-LOG-01 | Communication | Message Logs | Comms > Logs | `window.getMessageLogs()` | `message_logs` | Delivery tracking |

## Operations & Tools

| ID | Domain | Legacy Name / Label | Entry Point | Core JS Functions / Globals | Data Entities Touched | Notes |
|----|--------|---------------------|-------------|----------------------------|----------------------|-------|
| OPS-BATCH-01 | Operations | Batch Import Wizard | Import > Batch | `window.runImportPipeline()`, `importSection` | `import_batches`, `import_files`, `import_rows`, `import_row_errors` | 7-step pipeline |
| OPS-CLEAN-01 | Operations | Data Cleanup | System > Cleanup | `window.cleanupData()` | multiple | Orphan removal |
| OPS-AUDIT-01 | Operations | Audit Trail | System > Audit | `window.viewAuditLog()` | `audit_log` | Activity history |
| OPS-BACKUP-01 | Operations | Backup | System > Backup | `window.backupData()` | all | Full system export |

**Total: 38 features across 8 domains.**
