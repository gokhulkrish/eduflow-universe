# INVENTORY

Source note: the structural map file did not contain a populated ERP module registry, so the module inventory below is reconstructed from the explicit 52-module architecture bridge in `SMS-2.html` plus the legacy ERP module pack in the same file.

## [MODULES]

| # | Module Key | Label | Status | Launch | Renderer | Submodules | Source |
|---|---|---|---|---|---|---|---|
| 1 | `home` | Home | live | section: homeSection | `renderHomeWorkspace` | reminders, todos, notifications, notices, alerts | SMS-2.html:79679 |
| 2 | `dashboard-data-processing` | Dashboard Data Processing | live | dashboard-tab: dashboardSection | `renderDashboardWorkspace` | filters, validation buckets, eKYC, approval, critical gaps | SMS-2.html:79680 |
| 3 | `dashboard-analytical` | Dashboard Analytical | live | dashboard-tab: dashboardSection | `renderDashboardWorkspace` | gender, stream, residence, income, academic distribution | SMS-2.html:79681 |
| 4 | `dashboard-scholarship-status` | Dashboard Scholarship Status | live | dashboard-tab: dashboardSection | `renderDashboardWorkspace` | bank verification, scholarship flow, anomalies, appeal buckets | SMS-2.html:79682 |
| 5 | `add-student` | Add Student | live | section: addStudentSection | `renderCustomStudentFields` | form, header registry, custom fields, group master, summary | SMS-2.html:79688 |
| 6 | `registered-students` | Registered Students | live | section: registeredSection | `renderGrid` | filters, register grid, drawer, export | SMS-2.html:79689 |
| 7 | `partial-saved-students` | Partial Saved Students | needs-wiring | section: addStudentSection | `showSection` | draft list, resume entry, delete draft | SMS-2.html:79690 |
| 8 | `admissions` | Admissions | needs-wiring | erp-workspace: admissions | `renderAdmissionsWorkspace` | applications, validation, umisValidation, selection, openStatus, records | SMS-2.html:79691 |
| 9 | `certificates` | Certificates | needs-wiring | erp-workspace: certificates | `renderCertificatesWorkspace` | letters, templates, issued, verification, records | SMS-2.html:79692 |
| 10 | `import-create` | Import Create Batch | live | import-step: importSection | `setImportStep` | file source, batch details, mode | SMS-2.html:79698 |
| 11 | `import-map` | Import Schema Mapping | live | import-step: importSection | `renderImportHeaderLists` | source headers, target headers, mapping confidence | SMS-2.html:79699 |
| 12 | `import-keying` | Import Keying Strategy | live | import-step: importSection | `renderImportKeyingEditor` | matching rules, duplicate keys, normalization | SMS-2.html:79700 |
| 13 | `import-duplicate-review` | Import Duplicate Review | live | import-step: importSection | `renderDuplicateWorkspaceShell` | duplicate groups, merge decisions, audit panel | SMS-2.html:79701 |
| 14 | `import-validation` | Import Validation | live | import-step: importSection | `setImportStep` | errors, warnings, completeness, blockers | SMS-2.html:79702 |
| 15 | `import-preview` | Import Preview | live | import-step: importSection | `setImportStep` | diff preview, sample rows, commit risk summary | SMS-2.html:79703 |
| 16 | `import-transfer` | Import Transfer | live | import-step: importSection | `setImportStep` | commit, progress, outcome summary | SMS-2.html:79704 |
| 17 | `collegeInfo` | Institute Information | needs-wiring | erp-workspace: collegeInfo | `renderCollegeInfoWorkspace` | overview, contact, hoi, nodal, accreditation, records | SMS-2.html:79710 |
| 18 | `courseInfo` | Course Information | live | erp-workspace: courseInfo | `renderCourseInfoWorkspace` | overview, mapping, seats, records | SMS-2.html:79711 |
| 19 | `userManagement` | User Management | coming-soon | erp-workspace: userManagement | `renderWorkspaceComingSoon` | overview, users, institutes, passwordreset, records | SMS-2.html:79712 |
| 20 | `academics` | Academic Management | coming-soon | erp-workspace: academics | `renderWorkspaceComingSoon` | overview, classes, subjects, lessons, records | SMS-2.html:79718 |
| 21 | `timetable` | Timetable | coming-soon | erp-workspace: timetable | `renderWorkspaceComingSoon` | overview, creator, teacher, class, day, allotment, records | SMS-2.html:79719 |
| 22 | `homework` | Homework | coming-soon | erp-workspace: homework | `renderWorkspaceComingSoon` | overview, planner, submissions, approval, records | SMS-2.html:79720 |
| 23 | `assignments` | Assignments | coming-soon | erp-workspace: assignments | `renderWorkspaceComingSoon` | overview, planner, submissions, grading, approval, records | SMS-2.html:79721 |
| 24 | `attendance` | Attendance Management | needs-wiring | erp-workspace: attendance | `renderAttendanceWorkspace` | overview, student, staff, absentees, reports, register | SMS-2.html:79722 |
| 25 | `exams` | Exams & Marks Management | live | erp-workspace: exams | `renderExamsWorkspace` | overview, schedule, marks, results, eligibility, records | SMS-2.html:79723 |
| 26 | `videoRooms` | Video Rooms | coming-soon | erp-workspace: videoRooms | `renderWorkspaceComingSoon` | overview, live, schedule, attendance, records | SMS-2.html:79724 |
| 27 | `quiz` | Quiz | coming-soon | erp-workspace: quiz | `renderWorkspaceComingSoon` | overview, banks, quizzes, attempts, records | SMS-2.html:79725 |
| 28 | `people` | People Directory | needs-wiring | erp-workspace: people | `renderPeopleWorkspace` | overview, students, teachers, staff, parents, directory, discipline, blocked, records | SMS-2.html:79731 |
| 29 | `administration` | Administration | coming-soon | erp-workspace: administration | `renderWorkspaceComingSoon` | overview, records | SMS-2.html:79732 |
| 30 | `payroll` | Payroll | coming-soon | erp-workspace: payroll | `renderWorkspaceComingSoon` | overview, salary, transactions, payslips, records | SMS-2.html:79733 |
| 31 | `reception` | Reception | coming-soon | erp-workspace: reception | `renderWorkspaceComingSoon` | overview, visitors, calls, postal, records | SMS-2.html:79734 |
| 32 | `fees` | Fee Management | live | erp-workspace: fees | `renderFeeManagementWorkspace` | overview, ledger, structure, receipts, concessions, reminders, records | SMS-2.html:79740 |
| 33 | `scholarships` | Scholarship | live | erp-workspace: scholarships | `renderScholarshipsWorkspace` | overview, applications, verification, approval, disbursement, records | SMS-2.html:79741 |
| 34 | `communication` | Communication Hub | needs-wiring | erp-workspace: communication | `renderCommunicationWorkspace` | overview, notices, messages, emergency, feedback, feeds, conversations, classwall, records | SMS-2.html:79747 |
| 35 | `chat` | Chat | coming-soon | erp-workspace: chat | `renderWorkspaceComingSoon` | overview, threads, groups, broadcasts, records | SMS-2.html:79748 |
| 36 | `events` | Events & Holidays | coming-soon | erp-workspace: events | `renderWorkspaceComingSoon` | overview, calendar, holidays, birthdays, anniversaries, records | SMS-2.html:79749 |
| 37 | `media` | Media | coming-soon | erp-workspace: media | `renderWorkspaceComingSoon` | overview, uploads, videos, documents, magazine, records | SMS-2.html:79750 |
| 38 | `hostel` | Hostel | needs-wiring | erp-workspace: hostel | `renderHostelWorkspace` | overview, rooms, allocations, mess, attendance, records | SMS-2.html:79756 |
| 39 | `transport` | Transport | needs-wiring | erp-workspace: transport | `renderTransportWorkspace` | overview, routes, stops, vehicles, routeStudents, passes, records | SMS-2.html:79757 |
| 40 | `library` | Library | needs-wiring | erp-workspace: library | `renderLibraryWorkspace` | overview, catalog, circulation, activity, fines, records | SMS-2.html:79758 |
| 41 | `inventory` | Inventory | coming-soon | erp-workspace: inventory | `renderWorkspaceComingSoon` | overview, products, purchases, sales, stock, reports, records | SMS-2.html:79759 |
| 42 | `taskManagement` | Task Management | live | erp-workspace: taskManagement | `renderTaskManagementWorkspace` | overview, active, completed, snoozed, records | SMS-2.html:79760 |
| 43 | `placement` | Placement | coming-soon | erp-workspace: placement | `renderWorkspaceComingSoon` | overview, records | SMS-2.html:79766 |
| 44 | `reportsAnalytics` | Reports & Analytics | live | erp-workspace: reportsAnalytics | `renderReportsAnalyticsWorkspace` | overview, dashboards, umisAnalytics, academic, finance, operational, records | SMS-2.html:79767 |
| 45 | `alumni` | Alumni | coming-soon | erp-workspace: alumni | `renderWorkspaceComingSoon` | overview, directory, engagement, records | SMS-2.html:79768 |
| 46 | `system` | System | coming-soon | erp-workspace: system | `renderWorkspaceComingSoon` | overview, records | SMS-2.html:79774 |
| 47 | `settingsBackup` | Settings & Backup | coming-soon | erp-workspace: settingsBackup | `renderWorkspaceComingSoon` | overview, academicYears, admissions, holidayList, examRules, examGrades, promotions, leaveMaster, notifications, standards, smsTemplates, locations, records | SMS-2.html:79775 |
| 48 | `settings-header-registry` | Header Registry | live | settings-tab: settingsHeadersSection | `renderUnifiedHeaderRegistryWorkspace` | student fields, detected headers, custom fields, institute fields | SMS-2.html:79776 |
| 49 | `settings-workspace-control` | Workspace Control | live | settings-tab: settingsHeadersSection | `renderErpSettingsControlPanel` | sidebar order, controls, campuses, language | SMS-2.html:79777 |
| 50 | `settings-ai-policy` | Workspace AI & Policy | live | settings-tab: settingsHeadersSection | `renderErpSettingsPolicyPanel` | AI confidence, fee risk, attendance risk, access rules | SMS-2.html:79778 |
| 51 | `settings-startup-trace` | Startup & Trace | live | settings-tab: settingsHeadersSection | `renderExperienceSettingsPanel` | startup loader, animation, trace widget, UX behavior | SMS-2.html:79779 |
| 52 | `settings-batch-history` | Batch History | live | settings-tab: settingsHeadersSection | `renderImportBatchHistory` | saved batches, previewed batches, transferred batches | SMS-2.html:79780 |

## [FIELD_TABLES]

The legacy source only exposes explicit field arrays for the 12-module ERP pack below. The remaining 40 architecture modules are shell/workspace modules with submodule navigation but no dedicated field tables in the extracted source.

### 1. Departments & Programs (departments)

Category: Academic Governance

Source: SMS-2.html:29828

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `departmentName` | Department Name | text | yes | — |
| `departmentCode` | Department Code | text | yes | — |
| `hodName` | HOD / Coordinator | text | no | — |
| `programLevel` | Program Level | select | no | UG, PG, Research, Diploma, Certificate |
| `sanctionedIntake` | Sanctioned Intake | number | no | — |
| `naacNbaStatus` | NAAC / NBA Status | select | no | Not Applied, Applied, Accredited, Re-Accreditation Due |

### 2. Faculty & HR (facultyHR)

Category: People & Workforce

Source: SMS-2.html:29845

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `facultyName` | Faculty / Staff Name | text | yes | — |
| `employeeCode` | Employee Code | text | yes | — |
| `designation` | Designation | text | no | — |
| `departmentName` | Department | text | no | — |
| `workloadHours` | Weekly Workload Hours | number | no | — |
| `employmentStatus` | Employment Status | select | no | Active, On Leave, Contract, Relieved, Retired |

### 3. Curriculum & Outcomes (curriculumOutcome)

Category: Academic Delivery

Source: SMS-2.html:29862

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `curriculumName` | Curriculum / Regulation | text | yes | — |
| `courseCode` | Course Code | text | no | — |
| `semester` | Semester | text | no | — |
| `outcomeMapStatus` | Outcome Map Status | select | no | Draft, Mapped, Reviewed, Approved |
| `syllabusCoverage` | Syllabus Coverage % | number | no | — |
| `attainmentBand` | Attainment Band | select | no | Low, Medium, High, Excellent |

### 4. LMS & E-Learning (lmsElearning)

Category: Learning

Source: SMS-2.html:29879

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `courseRoom` | Course Room | text | yes | — |
| `contentUnit` | Content Unit | text | no | — |
| `facultyOwner` | Faculty Owner | text | no | — |
| `engagementPercent` | Engagement % | number | no | — |
| `completionStatus` | Completion Status | select | no | Not Started, In Progress, Completed, Needs Intervention |

### 5. Research & Innovation (researchInnovation)

Category: Research

Source: SMS-2.html:29895

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `researchTitle` | Project / Publication Title | text | yes | — |
| `principalInvestigator` | Principal Investigator | text | no | — |
| `fundingAgency` | Funding Agency | text | no | — |
| `grantAmount` | Grant Amount | number | no | — |
| `researchStage` | Stage | select | no | Proposal, Approved, Ongoing, Completed, Published, Patented |

### 6. Accreditation & IQAC (accreditationIQAC)

Category: Governance

Source: SMS-2.html:29911

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `qualityCycle` | Quality Cycle | text | yes | — |
| `framework` | Framework | select | no | NAAC, NBA, NIRF, AISHE, AQAR, Internal Audit |
| `criterion` | Criterion / Metric | text | no | — |
| `evidenceStatus` | Evidence Status | select | no | Pending, Collected, Verified, Submitted, Accepted |
| `owner` | Owner | text | no | — |

### 7. Finance & Accounting (financeAccounting)

Category: Finance

Source: SMS-2.html:29927

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `voucherNo` | Voucher / Receipt No | text | yes | — |
| `accountHead` | Account Head | text | yes | — |
| `transactionType` | Transaction Type | select | no | Income, Expense, Transfer, Adjustment |
| `amount` | Amount | number | yes | — |
| `approvalStatus` | Approval Status | select | no | Draft, Pending, Approved, Rejected, Posted |

### 8. Procurement & Assets (procurementAssets)

Category: Campus Operations

Source: SMS-2.html:29943

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `requestTitle` | Request / Asset Title | text | yes | — |
| `vendorName` | Vendor | text | no | — |
| `assetTag` | Asset Tag | text | no | — |
| `departmentName` | Department | text | no | — |
| `procurementStatus` | Procurement Status | select | no | Requested, Quoted, Approved, Ordered, Received, Issued |

### 9. Grievance & Helpdesk (grievanceHelpdesk)

Category: Student Success

Source: SMS-2.html:29959

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `ticketTitle` | Ticket Title | text | yes | — |
| `requesterType` | Requester Type | select | no | Student, Parent, Faculty, Staff, Public |
| `priorityBand` | Priority | select | no | Low, Medium, High, Critical |
| `assignedTeam` | Assigned Team | text | no | — |
| `slaStatus` | SLA Status | select | no | Within SLA, At Risk, Breached, Resolved |

### 10. Health & Wellbeing (healthWellbeing)

Category: Student Success

Source: SMS-2.html:29975

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `caseTitle` | Case / Visit Title | text | yes | — |
| `personName` | Person Name | text | no | — |
| `caseType` | Case Type | select | no | Medical, Counselling, Emergency, Wellbeing, Follow-up |
| `followUpDate` | Follow-up Date | date | no | — |
| `careStatus` | Care Status | select | no | Open, Monitoring, Referred, Closed |

### 11. Security & Compliance (securityCompliance)

Category: Platform

Source: SMS-2.html:29991

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `controlTitle` | Control / Incident Title | text | yes | — |
| `controlType` | Control Type | select | no | Security, Data Privacy, Consent, Role Audit, Incident |
| `owner` | Owner | text | no | — |
| `riskLevel` | Risk Level | select | no | Low, Medium, High, Critical |
| `closureStatus` | Closure Status | select | no | Open, In Review, Mitigated, Closed |

### 12. Documents & DMS (documentDms)

Category: Content

Source: SMS-2.html:30007

| Field Key | Label | Type | Required | Options |
|---|---|---|---|---|
| `documentTitle` | Document Title | text | yes | — |
| `documentType` | Document Type | select | no | Student File, Policy, Evidence, Template, Certificate, Contract |
| `owner` | Owner | text | no | — |
| `expiryDate` | Expiry Date | date | no | — |
| `documentStatus` | Document Status | select | no | Draft, Under Review, Approved, Expired, Archived |

## [CSS_SHELL]

| # | Class | Role |
|---|---|---|
| 1 | `.erp-sidebar-module-group` | ERP sidebar or module list |
| 2 | `.erp-sidebar-nav-item` | ERP sidebar or module list |
| 3 | `.erp-stat-icon` | ERP sidebar or module list |
| 4 | `.erp-focused-hero` | ERP sidebar or module list |
| 5 | `.erp-panel-workspace-head` | ERP sidebar or module list |
| 6 | `.erp-control-summary` | ERP sidebar or module list |
| 7 | `.erp-card-head` | ERP sidebar or module list |
| 8 | `.erp-statline` | ERP sidebar or module list |
| 9 | `.erp-list` | ERP sidebar or module list |
| 10 | `.erp-form-grid` | ERP sidebar or module list |
| 11 | `.erp-filter-bar` | ERP sidebar or module list |
| 12 | `.erp-metric` | ERP sidebar or module list |
| 13 | `.import-success-box` | Import wizard or batch tooling |
| 14 | `.import-warning-box` | Import wizard or batch tooling |
| 15 | `.import-info-box` | Import wizard or batch tooling |
| 16 | `.import-sticky-footer` | Import wizard or batch tooling |
| 17 | `.import-workspace-actions` | Import wizard or batch tooling |
| 18 | `.import-footer-actions` | Import wizard or batch tooling |
| 19 | `.import-create-grid` | Import wizard or batch tooling |
| 20 | `.import-schema-preview` | Import wizard or batch tooling |
| 21 | `.erp-module-link` | ERP sidebar or module list |
| 22 | `.erp-compact-layout` | ERP sidebar or module list |
| 23 | `.erp-secondary-collapsed` | ERP sidebar or module list |
| 24 | `.erp-reference-card` | ERP sidebar or module list |
| 25 | `.erp-reference-list` | ERP sidebar or module list |
| 26 | `.erp-control-mode` | ERP sidebar or module list |
| 27 | `.dashboard-kpi-grid` | Dashboard KPI or layout |
| 28 | `.import-guidance-card` | Import wizard or batch tooling |
| 29 | `.import-focus-mode` | Import wizard or batch tooling |
| 30 | `.import-step-heading` | Import wizard or batch tooling |
| 31 | `.import-stepper-panel` | Import wizard or batch tooling |
| 32 | `.import-step-pill` | Import wizard or batch tooling |
| 33 | `.import-batch-pagination` | Import wizard or batch tooling |
| 34 | `.import-rail-metric` | Import wizard or batch tooling |
| 35 | `.import-rail-list` | Import wizard or batch tooling |
| 36 | `.import-rail-list-item` | Import wizard or batch tooling |
| 37 | `.import-smart-panel` | Import wizard or batch tooling |
| 38 | `.import-smart-head` | Import wizard or batch tooling |
| 39 | `.import-section-chip` | Import wizard or batch tooling |
| 40 | `.import-step-progress-stat--success` | Import wizard or batch tooling |
| 41 | `.import-step-progress-stat--warning` | Import wizard or batch tooling |
| 42 | `.import-step-progress-stat--danger` | Import wizard or batch tooling |
| 43 | `.import-step-progress-stat--primary` | Import wizard or batch tooling |
| 44 | `.import-config-header-field` | Import wizard or batch tooling |
| 45 | `.import-header-search-wrap` | Import wizard or batch tooling |
| 46 | `.import-header-dropdown-item` | Import wizard or batch tooling |
| 47 | `.import-header-selected` | Import wizard or batch tooling |
| 48 | `.import-action-row` | Import wizard or batch tooling |
| 49 | `.import-action-row--footer` | Import wizard or batch tooling |
| 50 | `.import-config-mappings` | Import wizard or batch tooling |
| 51 | `.import-suggestion-strip` | Import wizard or batch tooling |
| 52 | `.dashboard-workspace` | Dashboard KPI or layout |
| 53 | `.dashboard-hero-heading` | Dashboard KPI or layout |
| 54 | `.dashboard-status-chip` | Dashboard KPI or layout |
| 55 | `.dashboard-hero-stat-card` | Dashboard KPI or layout |
| 56 | `.dashboard-submodule-head` | Dashboard KPI or layout |
| 57 | `.dashboard-filter-field` | Dashboard KPI or layout |
| 58 | `.dashboard-module-head` | Dashboard KPI or layout |
| 59 | `.dashboard-module-kpi` | Dashboard KPI or layout |
| 60 | `.dashboard-donut-center` | Dashboard KPI or layout |
| 61 | `.dashboard-comparison-top` | Dashboard KPI or layout |
| 62 | `.dashboard-progress-label` | Dashboard KPI or layout |
| 63 | `.dashboard-audit-card` | Dashboard KPI or layout |
| 64 | `.dashboard-bar-top` | Dashboard KPI or layout |
| 65 | `.dashboard-scholarship-block` | Dashboard KPI or layout |
| 66 | `.dashboard-summary-chip` | Dashboard KPI or layout |
| 67 | `.dashboard-insight-row-top` | Dashboard KPI or layout |
| 68 | `.import-stepper-bar` | Import wizard or batch tooling |
| 69 | `.dashboard-hero-actions` | Dashboard KPI or layout |
| 70 | `.import-workspace` | Import wizard or batch tooling |
| 71 | `.import-rail` | Import wizard or batch tooling |
| 72 | `.erp-sidebar-category` | ERP sidebar or module list |
| 73 | `.erp-sidebar-category-title` | ERP sidebar or module list |
| 74 | `.import-results` | Import wizard or batch tooling |
| 75 | `.sms52-shell` | SMS 52-module architecture / shell layout |
| 76 | `.sms52-shell__header` | SMS 52-module architecture / shell layout |
| 77 | `.sms52-shell__title` | SMS 52-module architecture / shell layout |
| 78 | `.sms52-shell__breadcrumbs` | SMS 52-module architecture / shell layout |
| 79 | `.sms52-domain-jumpbar` | SMS 52-module architecture / shell layout |
| 80 | `.sms52-domain-jumpchip` | SMS 52-module architecture / shell layout |
| 81 | `.sms52-domain-section` | SMS 52-module architecture / shell layout |
| 82 | `.sms52-domain-section__header` | SMS 52-module architecture / shell layout |
| 83 | `.sms52-domain-section__title` | SMS 52-module architecture / shell layout |
| 84 | `.sms52-domain-section__meta` | SMS 52-module architecture / shell layout |
| 85 | `.sms52-grid--modules` | SMS 52-module architecture / shell layout |
| 86 | `.sms52-card` | SMS 52-module architecture / shell layout |
| 87 | `.sms52-card__head` | SMS 52-module architecture / shell layout |
| 88 | `.sms52-card__title` | SMS 52-module architecture / shell layout |
| 89 | `.sms52-card__status` | SMS 52-module architecture / shell layout |
| 90 | `.sms52-badge--live` | SMS 52-module architecture / shell layout |
| 91 | `.sms52-badge--wire` | SMS 52-module architecture / shell layout |
| 92 | `.sms52-badge--soon` | SMS 52-module architecture / shell layout |
| 93 | `.sms52-card__body` | SMS 52-module architecture / shell layout |
| 94 | `.sms52-card__summary` | SMS 52-module architecture / shell layout |
| 95 | `.sms52-card__submodules` | SMS 52-module architecture / shell layout |
| 96 | `.sms52-chip` | SMS 52-module architecture / shell layout |
| 97 | `.sms52-card__actions` | SMS 52-module architecture / shell layout |
| 98 | `.sms52-card__meta` | SMS 52-module architecture / shell layout |
| 99 | `.sms52-card__audit` | SMS 52-module architecture / shell layout |
| 100 | `.sms52-empty` | SMS 52-module architecture / shell layout |
| 101 | `.sms52-empty__title` | SMS 52-module architecture / shell layout |
| 102 | `.sms52-empty__copy` | SMS 52-module architecture / shell layout |
| 103 | `.sms52-stack` | SMS 52-module architecture / shell layout |
| 104 | `.sms52-stack--horizontal` | SMS 52-module architecture / shell layout |
| 105 | `.sms52-stack--vertical` | SMS 52-module architecture / shell layout |
| 106 | `.sms52-sr-only` | SMS 52-module architecture / shell layout |
| 107 | `.erp-realtime-command-head` | ERP sidebar or module list |
| 108 | `.erp-realtime-card` | ERP sidebar or module list |
| 109 | `.import-stepper` | Import wizard or batch tooling |
| 110 | `.import-wizard-stepper` | Import wizard or batch tooling |
| 111 | `.importKeyConfig` | Import wizard or batch tooling |
| 112 | `.importHeaders` | Import wizard or batch tooling |
| 113 | `.importKeyFields` | Import wizard or batch tooling |
| 114 | `.importTargetCatalogKey` | Import wizard or batch tooling |
| 115 | `.erpWorkspaceKey` | ERP sidebar or module list |
| 116 | `.importMode` | Import wizard or batch tooling |
| 117 | `.importBatches` | Import wizard or batch tooling |
| 118 | `.importBatchesLoaded` | Import wizard or batch tooling |
| 119 | `.importKeyType` | Import wizard or batch tooling |
| 120 | `.importKeyValue` | Import wizard or batch tooling |

## [FUNCTIONS]

### Other Functions

- `seedThemeBeforePaint()`
- `seedShellBeforePaint()`
- `getImportPipelineState()`
- `ensureImportPipelineDualKeyState()`
- `patchImportPipelineState()`
- `resetImportPipelineSection()`
- `setImportStepDirtyState()`
- `markImportStepDirty()`
- `clearImportStepDirty()`
- `appendImportAuditTrace()`
- `hydrateCanonicalFromCurrentState()`
- `getImportPipelineSessionId()`
- `getImportPipelineTrace()`
- `getImportPipelineSnapshots()`
- `isImportStepLocked()`
- `lockImportStep()`
- `unlockImportStep()`
- `computeImportSourceHash()`
- `computeImportMappingHash()`
- `computeImportKeyingHash()`
- `computeImportDuplicateHash()`
- `computeImportValidationHash()`
- `computeImportPreviewHash()`
- `addImportPipelineTrace()`
- `takeImportPipelineSnapshot()`
- `isStepDirty()`
- `markStepClean()`
- `markStepDirty()`
- `isImportStepDirty()`
- `resetImportStepState()`
- `invalidateImportDownstream()`
- `invalidateDownstreamSteps()`
- `invalidateDualKeyWorkflow()`
- `checkStepPrerequisite()`
- `refreshCanonicalPipelineState()`
- `resetImportPipelineState()`
- `escapeHtml()`
- `normalizePlainText()`
- `sanitizeHeaderLabel()`
- `sanitizeUserInput()`

### UI Render & Builders Functions

- `buildHeaderTabsLayout()`
- `renderActivityTracePanel()`
- `buildActivityTraceFieldDetail()`
- `renderStudentDashboard()`
- `buildUmisExactSearchData()`
- `buildGegok12FeatureSearchData()`
- `buildSectionSearchData()`
- `buildImportStepSearchData()`
- `buildErpSearchData()`
- `renderResults()`
- `renderAttendanceRiskBadge()`
- `buildSidebarHomeMarkup()`
- `buildSidebarDashboardMarkup()`
- `buildSidebarStudentGroupMarkup()`
- `buildSidebarSettingsMarkup()`
- `buildErpSidebarModuleMarkup()`
- `buildUmisReferenceWorkspaceHtml()`
- `renderGegok12FeatureCenter()`
- `renderUmisFeatureCenter()`
- `renderDashboardUmisBridge()`
- `buildFieldControl()`
- `buildUiSettingsFieldDescriptor()`
- `buildFieldAliasCatalog()`
- `renderInstituteBrandEditorState()`
- `renderInstituteBrandVisual()`
- `renderTopInstituteProfileCard()`
- `buildBatchTransferSummary()`
- `renderImportPaginationFooter()`
- `buildImportBatchSyncPayload()`
- `renderWorkspaceCanvas()`
- `renderWorkspaceCanvasEnd()`
- `renderWorkspaceCanvasStart()`
- `renderWorkspaceSection()`
- `renderWorkspaceHeader()`
- `renderContextSidebar()`
- `renderRegistryMetricsForActiveScope()`
- `renderRegistryOnce()`
- `buildHeaderLookupIndex()`
- `renderHtmlProgressively()`
- `buildImportFuzzyBigrams()`

### Navigation & Launchers Functions

- `openActivityTracePanel()`
- `openStudentPortal()`
- `launchGegok12MappedFeature()`
- `openSearchDropdown()`
- `launchUmisLocalResource()`
- `launchUmisMappedFeature()`
- `openDatabase()`
- `openStudentFormRecord()`
- `openEditModal()`
- `openDestroyModal()`
- `openAddStudentSettingsGroup()`
- `openAddStudentSettingsTab()`
- `openInstituteBrandLogoPicker()`
- `openImportBatchFromHistory()`
- `openErpModuleWorkspace()`
- `showSection()`
- `openSidebar()`
- `openInstituteBrandModal()`
- `openRegisteredSaveReportDialog()`
- `openRegisteredDownloadDialog()`
- `openRegisteredControlBreakDialog()`
- `openRegisteredGroupByDialog()`
- `openRegisteredReportCenter()`
- `openRegisteredSubscriptionDialog()`
- `openRegisteredChartReport()`
- `openRegisteredPivotReport()`
- `openHomeWorkspaceEditor()`
- `openDrawer()`
- `openAdvancedSettings()`
- `openFilterAdvancedSettings()`
- `openUmisStudentForm()`
- `openAdmissionDecisionModal()`
- `openTaskDrawer()`
- `openProfileDrawer()`
- `openImportGuidance()`

### ERP Modules & Settings Functions

- `getDefaultErpModules()`
- `getDefaultErpSettings()`
- `getDefaultErpAutomations()`
- `normalizeErpModules()`
- `normalizeErpSettings()`
- `normalizeErpAutomations()`
- `normalizeErpRecord()`
- `normalizeErpActivity()`
- `normalizeErpAcademicYear()`
- `getDefaultErpAcademicYears()`
- `normalizeErpAcademicYears()`
- `normalizeErpWorkflow()`

### Compatibility & Cloning Functions

- `cloneErpModuleField()`
- `isLegacyDefaultErpModuleState()`
- `cloneHeaderRegistryFields()`
- `cloneImportPaginationState()`
- `isLegacyOverwriteImportMode()`
- `cloneImportMappingLine()`
- `cloneImportMatchConfig()`
- `cloneFeeStructureGroup()`

### Dashboard Functions

- `getDashboardUmisRoutesForTab()`
- `getDashboardTimestamp()`
- `getDashboardLeaders()`
- `getDashboardRecordDay()`
- `getDashboardWorkspaceState()`
- `getDashboardInstitutionContext()`
- `getDashboardStreamLabel()`
- `getDashboardResidenceLabel()`
- `getDashboardIncomeBand()`
- `getDashboardScholarshipScheme()`
- `getDashboardScholarshipStatus()`
- `getDashboardApbStatus()`
- `getDashboardAppealStatus()`
- `getDashboardFieldGroupRatios()`
- `getDashboardValidationBucket()`
- `getDashboardViewModels()`
- `getDashboardFilterOptions()`

### Dashboard Functions

These are the dashboard-specific functions called out explicitly in the structural map.

| Function | Module / Responsibility |
|---|---|
| `getDashboardUmisRoutesForTab()` | UMIS bridge / dashboard |
| `getDashboardTimestamp()` | Dashboard analytics |
| `getDashboardLeaders()` | Dashboard analytics |
| `getDashboardRecordDay()` | Dashboard analytics |
| `getDashboardWorkspaceState()` | Dashboard |
| `getDashboardInstitutionContext()` | Dashboard |
| `getDashboardStreamLabel()` | Dashboard analytics |
| `getDashboardResidenceLabel()` | Dashboard analytics |
| `getDashboardIncomeBand()` | Dashboard analytics |
| `getDashboardScholarshipScheme()` | Dashboard analytics |
| `getDashboardScholarshipStatus()` | Dashboard analytics |
| `getDashboardApbStatus()` | Dashboard |
| `getDashboardAppealStatus()` | Dashboard |
| `getDashboardFieldGroupRatios()` | Dashboard |
| `getDashboardValidationBucket()` | Dashboard analytics |
| `getDashboardViewModels()` | Dashboard analytics |
| `getDashboardFilterOptions()` | Dashboard analytics |

## [VERSIONS]

| Version ID | Source | Unique Features | Conflicts with other versions |
|---|---|---|---|
| Patch 7 | SMS-2.html:19800, 29824, 79788 | Adds the college ERP realtime command center and 52-module architecture bridge without replacing the legacy engine. | Runs beside the older workspace engine; must not remove existing render paths. |
| legacy-internal | SMS-2.html:33339, 34022, 34205, 35104, 37773, 39014 | Legacy header-registry source path used as a compatibility projection for student/internal headers. | Cannot be treated as user-entered custom data because normalization and source ranking differ. |
| overwritelegacy | SMS-2.html:42635, 42649, 42664, 42707, 70089 | Legacy import overwrite mode that ignores blank incoming values instead of skipping the row. | Differs from safe overwrite and overwrite-with-blanks semantics; row-level behavior is intentionally older. |
| workflow-engine-v1 | SMS-2.html:58812-58813 | Versioned workflow engine state for the SMS runtime. | Coexists with the broader app version markers rather than replacing them. |
| engine-v1 | SMS-2.html:28320, 58813 | Engine readiness and workflow version token appear in runtime logs and app metadata. | Must remain aligned with the app bootstrap and activity-trace logging behavior. |
| version 1.0 / 1.0.0 / 2.0.0 | SMS-2.html:57723, 58232, 58812, 79670 | Multiple version markers across workflows, runtime metadata, and the 52-module architecture registry. | Shows that the file mixes workflow, app, and architecture versioning rather than a single global version. |

## [EDGE_CASES]

| Scope | Source | Edge Case |
|---|---|---|
| Header registry / import pipeline | SMS-2.html:33337-33417, 34021-34207, 37771-37805 | Legacy internal headers are ranked separately from base/import/custom sources and are filtered back into registry projections with explicit source checks. |
| Import duplicate handling | SMS-2.html:42635-42727, 70089 | Legacy overwrite mode preserves non-blank values and ignores blanks instead of forcing a skip, so import previews must keep that compatibility branch. |
| Activity trace | SMS-2.html:28009-28622 | Trace panel state is persisted, deduplicated, and auto-collapsed with guarded hooks around alert/confirm overrides. |
| Registry reset | SMS-2.html:55055-55088 | Reset logic keeps base and legacy-internal fields separate so legacy header sources are not wiped accidentally. |
| 52-module shell | SMS-2.html:79667-80199 | Architecture bridge validates module count, duplicate keys, launch targets, and callable renderer names before enabling the shell. |
