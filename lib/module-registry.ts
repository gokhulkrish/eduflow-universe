export type ModuleKind = 'architecture' | 'legacy-pack';
export type ModuleStatus = 'live' | 'needs-wiring' | 'coming-soon';
export type ModuleLaunchType = 'section' | 'dashboard-tab' | 'import-step' | 'erp-workspace' | 'settings-tab';
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date' | 'email' | 'phone' | 'url' | 'rich-text';

export interface ModuleField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
}

export interface ModuleDefinition {
  key: string;
  label: string;
  kind: ModuleKind;
  status?: ModuleStatus;
  category?: string;
  domainKey?: string;
  domainLabel?: string;
  description?: string;
  launchType?: ModuleLaunchType;
  sectionId?: string;
  tabKey?: string;
  step?: string;
  tabId?: string;
  moduleKey?: string;
  workspaceKey?: string;
  route?: string;
  renderer?: string;
  sourceLine?: number;
  submodules: string[];
  fields: ModuleField[];
}

export const primaryModules: ModuleDefinition[] = [
  {
    "key": "home",
    "label": "Home",
    "status": "live",
    "launchType": "section",
    "sectionId": "homeSection",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderHomeWorkspace",
    "submodules": [
      "reminders",
      "todos",
      "notifications",
      "notices",
      "alerts"
    ],
    "sourceLine": 79679,
    "domainKey": "overviewMonitoring",
    "domainLabel": "Overview & Monitoring",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "dashboard-data-processing",
    "label": "Dashboard Data Processing",
    "status": "live",
    "launchType": "dashboard-tab",
    "sectionId": "dashboardSection",
    "tabKey": "data-processing",
    "step": "",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderDashboardWorkspace",
    "submodules": [
      "filters",
      "validation buckets",
      "eKYC",
      "approval",
      "critical gaps"
    ],
    "sourceLine": 79680,
    "domainKey": "overviewMonitoring",
    "domainLabel": "Overview & Monitoring",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "dashboard-analytical",
    "label": "Dashboard Analytical",
    "status": "live",
    "launchType": "dashboard-tab",
    "sectionId": "dashboardSection",
    "tabKey": "analytical",
    "step": "",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderDashboardWorkspace",
    "submodules": [
      "gender",
      "stream",
      "residence",
      "income",
      "academic distribution"
    ],
    "sourceLine": 79681,
    "domainKey": "overviewMonitoring",
    "domainLabel": "Overview & Monitoring",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "dashboard-scholarship-status",
    "label": "Dashboard Scholarship Status",
    "status": "live",
    "launchType": "dashboard-tab",
    "sectionId": "dashboardSection",
    "tabKey": "scholarship-status",
    "step": "",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderDashboardWorkspace",
    "submodules": [
      "bank verification",
      "scholarship flow",
      "anomalies",
      "appeal buckets"
    ],
    "sourceLine": 79682,
    "domainKey": "overviewMonitoring",
    "domainLabel": "Overview & Monitoring",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "add-student",
    "label": "Add Student",
    "status": "live",
    "launchType": "section",
    "sectionId": "addStudentSection",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderCustomStudentFields",
    "submodules": [
      "form",
      "header registry",
      "custom fields",
      "group master",
      "summary"
    ],
    "sourceLine": 79688,
    "domainKey": "studentRegistry",
    "domainLabel": "Student Intake & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "registered-students",
    "label": "Registered Students",
    "status": "live",
    "launchType": "section",
    "sectionId": "registeredSection",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderGrid",
    "submodules": [
      "filters",
      "register grid",
      "drawer",
      "export"
    ],
    "sourceLine": 79689,
    "domainKey": "studentRegistry",
    "domainLabel": "Student Intake & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "partial-saved-students",
    "label": "Partial Saved Students",
    "status": "live",
    "launchType": "section",
    "sectionId": "addStudentSection",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "partialStudentsave",
    "renderer": "showSection",
    "submodules": [
      "draft list",
      "resume entry",
      "delete draft"
    ],
    "sourceLine": 79690,
    "domainKey": "studentRegistry",
    "domainLabel": "Student Intake & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "admissions",
    "label": "Admissions",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "admissions",
    "workspaceKey": "applications",
    "route": "",
    "renderer": "renderAdmissionsWorkspace",
    "submodules": [
      "applications",
      "validation",
      "umisValidation",
      "selection",
      "openStatus",
      "records"
    ],
    "sourceLine": 79691,
    "domainKey": "studentRegistry",
    "domainLabel": "Student Intake & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "certificates",
    "label": "Certificates",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "certificates",
    "workspaceKey": "overview",
    "route": "",
    "renderer": "renderCertificatesWorkspace",
    "submodules": [
      "letters",
      "templates",
      "issued",
      "verification",
      "records"
    ],
    "sourceLine": 79692,
    "domainKey": "studentRegistry",
    "domainLabel": "Student Intake & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "import-create",
    "label": "Import Create Batch",
    "status": "live",
    "launchType": "import-step",
    "sectionId": "importSection",
    "tabKey": "",
    "step": "create",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "setImportStep",
    "submodules": [
      "file source",
      "batch details",
      "mode"
    ],
    "sourceLine": 79698,
    "domainKey": "importDataQuality",
    "domainLabel": "Import & Data Quality",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "import-map",
    "label": "Import Schema Mapping",
    "status": "live",
    "launchType": "import-step",
    "sectionId": "importSection",
    "tabKey": "",
    "step": "map",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderImportHeaderLists",
    "submodules": [
      "source headers",
      "target headers",
      "mapping confidence"
    ],
    "sourceLine": 79699,
    "domainKey": "importDataQuality",
    "domainLabel": "Import & Data Quality",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "import-keying",
    "label": "Import Keying Strategy",
    "status": "live",
    "launchType": "import-step",
    "sectionId": "importSection",
    "tabKey": "",
    "step": "keying",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderImportKeyingEditor",
    "submodules": [
      "matching rules",
      "duplicate keys",
      "normalization"
    ],
    "sourceLine": 79700,
    "domainKey": "importDataQuality",
    "domainLabel": "Import & Data Quality",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "import-duplicate-review",
    "label": "Import Duplicate Review",
    "status": "live",
    "launchType": "import-step",
    "sectionId": "importSection",
    "tabKey": "",
    "step": "duplicates",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderDuplicateWorkspaceShell",
    "submodules": [
      "duplicate groups",
      "merge decisions",
      "audit panel"
    ],
    "sourceLine": 79701,
    "domainKey": "importDataQuality",
    "domainLabel": "Import & Data Quality",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "import-validation",
    "label": "Import Validation",
    "status": "live",
    "launchType": "import-step",
    "sectionId": "importSection",
    "tabKey": "",
    "step": "validate",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "setImportStep",
    "submodules": [
      "errors",
      "warnings",
      "completeness",
      "blockers"
    ],
    "sourceLine": 79702,
    "domainKey": "importDataQuality",
    "domainLabel": "Import & Data Quality",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "import-preview",
    "label": "Import Preview",
    "status": "live",
    "launchType": "import-step",
    "sectionId": "importSection",
    "tabKey": "",
    "step": "preview",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "setImportStep",
    "submodules": [
      "diff preview",
      "sample rows",
      "commit risk summary"
    ],
    "sourceLine": 79703,
    "domainKey": "importDataQuality",
    "domainLabel": "Import & Data Quality",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "import-transfer",
    "label": "Import Transfer",
    "status": "live",
    "launchType": "import-step",
    "sectionId": "importSection",
    "tabKey": "",
    "step": "transfer",
    "tabId": "",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "setImportStep",
    "submodules": [
      "commit",
      "progress",
      "outcome summary"
    ],
    "sourceLine": 79704,
    "domainKey": "importDataQuality",
    "domainLabel": "Import & Data Quality",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "collegeInfo",
    "label": "Institute Information",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "collegeInfo",
    "workspaceKey": "overview",
    "route": "",
    "renderer": "renderCollegeInfoWorkspace",
    "submodules": [
      "overview",
      "contact",
      "hoi",
      "nodal",
      "accreditation",
      "records"
    ],
    "sourceLine": 79710,
    "domainKey": "instituteGovernance",
    "domainLabel": "Institute & Governance",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "courseInfo",
    "label": "Course Information",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "courseInfo",
    "workspaceKey": "mapping",
    "route": "",
    "renderer": "renderCourseInfoWorkspace",
    "submodules": [
      "overview",
      "mapping",
      "seats",
      "records"
    ],
    "sourceLine": 79711,
    "domainKey": "instituteGovernance",
    "domainLabel": "Institute & Governance",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "userManagement",
    "label": "User Management",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "userManagement",
    "workspaceKey": "users",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "users",
      "institutes",
      "passwordreset",
      "records"
    ],
    "sourceLine": 79712,
    "domainKey": "instituteGovernance",
    "domainLabel": "Institute & Governance",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "academics",
    "label": "Academic Management",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "academics",
    "workspaceKey": "classes",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "classes",
      "subjects",
      "lessons",
      "records"
    ],
    "sourceLine": 79718,
    "domainKey": "academicDelivery",
    "domainLabel": "Academic Delivery",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "timetable",
    "label": "Timetable",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "timetable",
    "workspaceKey": "creator",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "creator",
      "teacher",
      "class",
      "day",
      "allotment",
      "records"
    ],
    "sourceLine": 79719,
    "domainKey": "academicDelivery",
    "domainLabel": "Academic Delivery",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "homework",
    "label": "Homework",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "homework",
    "workspaceKey": "planner",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "planner",
      "submissions",
      "approval",
      "records"
    ],
    "sourceLine": 79720,
    "domainKey": "academicDelivery",
    "domainLabel": "Academic Delivery",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "assignments",
    "label": "Assignments",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "assignments",
    "workspaceKey": "planner",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "planner",
      "submissions",
      "grading",
      "approval",
      "records"
    ],
    "sourceLine": 79721,
    "domainKey": "academicDelivery",
    "domainLabel": "Academic Delivery",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "attendance",
    "label": "Attendance Management",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "attendance",
    "workspaceKey": "student",
    "route": "",
    "renderer": "renderAttendanceWorkspace",
    "submodules": [
      "overview",
      "student",
      "staff",
      "absentees",
      "reports",
      "register"
    ],
    "sourceLine": 79722,
    "domainKey": "academicDelivery",
    "domainLabel": "Academic Delivery",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "exams",
    "label": "Exams & Marks Management",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "exams",
    "workspaceKey": "schedule",
    "route": "",
    "renderer": "renderExamsWorkspace",
    "submodules": [
      "overview",
      "schedule",
      "marks",
      "results",
      "eligibility",
      "records"
    ],
    "sourceLine": 79723,
    "domainKey": "academicDelivery",
    "domainLabel": "Academic Delivery",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "videoRooms",
    "label": "Video Rooms",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "videoRooms",
    "workspaceKey": "live",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "live",
      "schedule",
      "attendance",
      "records"
    ],
    "sourceLine": 79724,
    "domainKey": "academicDelivery",
    "domainLabel": "Academic Delivery",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "quiz",
    "label": "Quiz",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "quiz",
    "workspaceKey": "quizzes",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "banks",
      "quizzes",
      "attempts",
      "records"
    ],
    "sourceLine": 79725,
    "domainKey": "academicDelivery",
    "domainLabel": "Academic Delivery",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "people",
    "label": "People Directory",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "people",
    "workspaceKey": "students",
    "route": "",
    "renderer": "renderPeopleWorkspace",
    "submodules": [
      "overview",
      "students",
      "teachers",
      "staff",
      "parents",
      "directory",
      "discipline",
      "blocked",
      "records"
    ],
    "sourceLine": 79731,
    "domainKey": "peopleWorkforce",
    "domainLabel": "People & Workforce",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "administration",
    "label": "Administration",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "administration",
    "workspaceKey": "overview",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "records"
    ],
    "sourceLine": 79732,
    "domainKey": "peopleWorkforce",
    "domainLabel": "People & Workforce",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "payroll",
    "label": "Payroll",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "payroll",
    "workspaceKey": "salary",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "salary",
      "transactions",
      "payslips",
      "records"
    ],
    "sourceLine": 79733,
    "domainKey": "peopleWorkforce",
    "domainLabel": "People & Workforce",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "reception",
    "label": "Reception",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "reception",
    "workspaceKey": "visitors",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "visitors",
      "calls",
      "postal",
      "records"
    ],
    "sourceLine": 79734,
    "domainKey": "peopleWorkforce",
    "domainLabel": "People & Workforce",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "fees",
    "label": "Fee Management",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "fees",
    "workspaceKey": "ledger",
    "route": "",
    "renderer": "renderFeeManagementWorkspace",
    "submodules": [
      "overview",
      "ledger",
      "structure",
      "receipts",
      "concessions",
      "reminders",
      "records"
    ],
    "sourceLine": 79740,
    "domainKey": "financeScholarship",
    "domainLabel": "Finance & Scholarship",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "scholarships",
    "label": "Scholarship",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "scholarships",
    "workspaceKey": "verification",
    "route": "",
    "renderer": "renderScholarshipsWorkspace",
    "submodules": [
      "overview",
      "applications",
      "verification",
      "approval",
      "disbursement",
      "records"
    ],
    "sourceLine": 79741,
    "domainKey": "financeScholarship",
    "domainLabel": "Finance & Scholarship",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "communication",
    "label": "Communication Hub",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "communication",
    "workspaceKey": "notices",
    "route": "",
    "renderer": "renderCommunicationWorkspace",
    "submodules": [
      "overview",
      "notices",
      "messages",
      "emergency",
      "feedback",
      "feeds",
      "conversations",
      "classwall",
      "records"
    ],
    "sourceLine": 79747,
    "domainKey": "communicationEngagement",
    "domainLabel": "Communication & Engagement",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "chat",
    "label": "Chat",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "chat",
    "workspaceKey": "threads",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "threads",
      "groups",
      "broadcasts",
      "records"
    ],
    "sourceLine": 79748,
    "domainKey": "communicationEngagement",
    "domainLabel": "Communication & Engagement",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "events",
    "label": "Events & Holidays",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "events",
    "workspaceKey": "calendar",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "calendar",
      "holidays",
      "birthdays",
      "anniversaries",
      "records"
    ],
    "sourceLine": 79749,
    "domainKey": "communicationEngagement",
    "domainLabel": "Communication & Engagement",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "media",
    "label": "Media",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "media",
    "workspaceKey": "uploads",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "uploads",
      "videos",
      "documents",
      "magazine",
      "records"
    ],
    "sourceLine": 79750,
    "domainKey": "communicationEngagement",
    "domainLabel": "Communication & Engagement",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "hostel",
    "label": "Hostel",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "hostel",
    "workspaceKey": "overview",
    "route": "",
    "renderer": "renderHostelWorkspace",
    "submodules": [
      "overview",
      "rooms",
      "allocations",
      "mess",
      "attendance",
      "records"
    ],
    "sourceLine": 79756,
    "domainKey": "campusOperations",
    "domainLabel": "Campus Operations",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "transport",
    "label": "Transport",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "transport",
    "workspaceKey": "routes",
    "route": "",
    "renderer": "renderTransportWorkspace",
    "submodules": [
      "overview",
      "routes",
      "stops",
      "vehicles",
      "routeStudents",
      "passes",
      "records"
    ],
    "sourceLine": 79757,
    "domainKey": "campusOperations",
    "domainLabel": "Campus Operations",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "library",
    "label": "Library",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "library",
    "workspaceKey": "catalog",
    "route": "",
    "renderer": "renderLibraryWorkspace",
    "submodules": [
      "overview",
      "catalog",
      "circulation",
      "activity",
      "fines",
      "records"
    ],
    "sourceLine": 79758,
    "domainKey": "campusOperations",
    "domainLabel": "Campus Operations",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "inventory",
    "label": "Inventory",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "inventory",
    "workspaceKey": "stock",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "products",
      "purchases",
      "sales",
      "stock",
      "reports",
      "records"
    ],
    "sourceLine": 79759,
    "domainKey": "campusOperations",
    "domainLabel": "Campus Operations",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "taskManagement",
    "label": "Task Management",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "taskManagement",
    "workspaceKey": "active",
    "route": "",
    "renderer": "renderTaskManagementWorkspace",
    "submodules": [
      "overview",
      "active",
      "completed",
      "snoozed",
      "records"
    ],
    "sourceLine": 79760,
    "domainKey": "campusOperations",
    "domainLabel": "Campus Operations",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "placement",
    "label": "Placement",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "placement",
    "workspaceKey": "overview",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "records"
    ],
    "sourceLine": 79766,
    "domainKey": "careerReporting",
    "domainLabel": "Career & Reporting",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "reportsAnalytics",
    "label": "Reports & Analytics",
    "status": "live",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "reportsAnalytics",
    "workspaceKey": "umisAnalytics",
    "route": "",
    "renderer": "renderReportsAnalyticsWorkspace",
    "submodules": [
      "overview",
      "dashboards",
      "umisAnalytics",
      "academic",
      "finance",
      "operational",
      "records"
    ],
    "sourceLine": 79767,
    "domainKey": "careerReporting",
    "domainLabel": "Career & Reporting",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "alumni",
    "label": "Alumni",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "alumni",
    "workspaceKey": "directory",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "directory",
      "engagement",
      "records"
    ],
    "sourceLine": 79768,
    "domainKey": "careerReporting",
    "domainLabel": "Career & Reporting",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "system",
    "label": "System",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "system",
    "workspaceKey": "overview",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "records"
    ],
    "sourceLine": 79774,
    "domainKey": "platformRegistry",
    "domainLabel": "Platform & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "settingsBackup",
    "label": "Settings & Backup",
    "status": "coming-soon",
    "launchType": "erp-workspace",
    "sectionId": "",
    "tabKey": "",
    "step": "",
    "tabId": "",
    "moduleKey": "settingsBackup",
    "workspaceKey": "academicYears",
    "route": "",
    "renderer": "renderWorkspaceComingSoon",
    "submodules": [
      "overview",
      "academicYears",
      "admissions",
      "holidayList",
      "examRules",
      "examGrades",
      "promotions",
      "leaveMaster",
      "notifications",
      "standards",
      "smsTemplates",
      "locations",
      "records"
    ],
    "sourceLine": 79775,
    "domainKey": "platformRegistry",
    "domainLabel": "Platform & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "settings-header-registry",
    "label": "Header Registry",
    "status": "live",
    "launchType": "settings-tab",
    "sectionId": "settingsHeadersSection",
    "tabKey": "",
    "step": "",
    "tabId": "internalHeaderTab",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderUnifiedHeaderRegistryWorkspace",
    "submodules": [
      "student fields",
      "detected headers",
      "custom fields",
      "institute fields"
    ],
    "sourceLine": 79776,
    "domainKey": "platformRegistry",
    "domainLabel": "Platform & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "settings-workspace-control",
    "label": "Workspace Control",
    "status": "live",
    "launchType": "settings-tab",
    "sectionId": "settingsHeadersSection",
    "tabKey": "",
    "step": "",
    "tabId": "erpControlTab",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderErpSettingsControlPanel",
    "submodules": [
      "sidebar order",
      "controls",
      "campuses",
      "language"
    ],
    "sourceLine": 79777,
    "domainKey": "platformRegistry",
    "domainLabel": "Platform & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "settings-ai-policy",
    "label": "Workspace AI & Policy",
    "status": "live",
    "launchType": "settings-tab",
    "sectionId": "settingsHeadersSection",
    "tabKey": "",
    "step": "",
    "tabId": "erpPolicyTab",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderErpSettingsPolicyPanel",
    "submodules": [
      "AI confidence",
      "fee risk",
      "attendance risk",
      "access rules"
    ],
    "sourceLine": 79778,
    "domainKey": "platformRegistry",
    "domainLabel": "Platform & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "settings-startup-trace",
    "label": "Startup & Trace",
    "status": "live",
    "launchType": "settings-tab",
    "sectionId": "settingsHeadersSection",
    "tabKey": "",
    "step": "",
    "tabId": "experienceTab",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderExperienceSettingsPanel",
    "submodules": [
      "startup loader",
      "animation",
      "trace widget",
      "UX behavior"
    ],
    "sourceLine": 79779,
    "domainKey": "platformRegistry",
    "domainLabel": "Platform & Registry",
    "kind": "architecture",
    "fields": []
  },
  {
    "key": "settings-batch-history",
    "label": "Batch History",
    "status": "live",
    "launchType": "settings-tab",
    "sectionId": "settingsHeadersSection",
    "tabKey": "",
    "step": "",
    "tabId": "importBatchHistoryTab",
    "moduleKey": "",
    "workspaceKey": "",
    "route": "",
    "renderer": "renderImportBatchHistory",
    "submodules": [
      "saved batches",
      "previewed batches",
      "transferred batches"
    ],
    "sourceLine": 79780,
    "domainKey": "platformRegistry",
    "domainLabel": "Platform & Registry",
    "kind": "architecture",
    "fields": []
  }
] as ModuleDefinition[];

export const legacyPackModules: ModuleDefinition[] = [
  {
    "key": "departments",
    "label": "Departments & Programs",
    "category": "Academic Governance",
    "description": "Department registry, HOD ownership, program capacity, accreditation mapping, and academic-year readiness.",
    "fields": [
      {
        "key": "departmentName",
        "label": "Department Name",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "departmentCode",
        "label": "Department Code",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "hodName",
        "label": "HOD / Coordinator",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "programLevel",
        "label": "Program Level",
        "type": "select",
        "required": false,
        "options": [
          "UG",
          "PG",
          "Research",
          "Diploma",
          "Certificate"
        ]
      },
      {
        "key": "sanctionedIntake",
        "label": "Sanctioned Intake",
        "type": "number",
        "required": false,
        "options": []
      },
      {
        "key": "naacNbaStatus",
        "label": "NAAC / NBA Status",
        "type": "select",
        "required": false,
        "options": [
          "Not Applied",
          "Applied",
          "Accredited",
          "Re-Accreditation Due"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29828
  },
  {
    "key": "facultyHR",
    "label": "Faculty & HR",
    "category": "People & Workforce",
    "description": "Faculty profiles, workload, appointments, leave, service records, and compliance documentation.",
    "fields": [
      {
        "key": "facultyName",
        "label": "Faculty / Staff Name",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "employeeCode",
        "label": "Employee Code",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "designation",
        "label": "Designation",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "departmentName",
        "label": "Department",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "workloadHours",
        "label": "Weekly Workload Hours",
        "type": "number",
        "required": false,
        "options": []
      },
      {
        "key": "employmentStatus",
        "label": "Employment Status",
        "type": "select",
        "required": false,
        "options": [
          "Active",
          "On Leave",
          "Contract",
          "Relieved",
          "Retired"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29845
  },
  {
    "key": "curriculumOutcome",
    "label": "Curriculum & Outcomes",
    "category": "Academic Delivery",
    "description": "Curriculum versioning, CO-PO mapping, syllabus coverage, outcome attainment, and academic audit readiness.",
    "fields": [
      {
        "key": "curriculumName",
        "label": "Curriculum / Regulation",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "courseCode",
        "label": "Course Code",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "semester",
        "label": "Semester",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "outcomeMapStatus",
        "label": "Outcome Map Status",
        "type": "select",
        "required": false,
        "options": [
          "Draft",
          "Mapped",
          "Reviewed",
          "Approved"
        ]
      },
      {
        "key": "syllabusCoverage",
        "label": "Syllabus Coverage %",
        "type": "number",
        "required": false,
        "options": []
      },
      {
        "key": "attainmentBand",
        "label": "Attainment Band",
        "type": "select",
        "required": false,
        "options": [
          "Low",
          "Medium",
          "High",
          "Excellent"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29862
  },
  {
    "key": "lmsElearning",
    "label": "LMS & E-Learning",
    "category": "Learning",
    "description": "Course content, online sessions, digital assignments, learning analytics, and LMS engagement signals.",
    "fields": [
      {
        "key": "courseRoom",
        "label": "Course Room",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "contentUnit",
        "label": "Content Unit",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "facultyOwner",
        "label": "Faculty Owner",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "engagementPercent",
        "label": "Engagement %",
        "type": "number",
        "required": false,
        "options": []
      },
      {
        "key": "completionStatus",
        "label": "Completion Status",
        "type": "select",
        "required": false,
        "options": [
          "Not Started",
          "In Progress",
          "Completed",
          "Needs Intervention"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29879
  },
  {
    "key": "researchInnovation",
    "label": "Research & Innovation",
    "category": "Research",
    "description": "Projects, publications, patents, grants, incubation, MoUs, and innovation-cell tracking.",
    "fields": [
      {
        "key": "researchTitle",
        "label": "Project / Publication Title",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "principalInvestigator",
        "label": "Principal Investigator",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "fundingAgency",
        "label": "Funding Agency",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "grantAmount",
        "label": "Grant Amount",
        "type": "number",
        "required": false,
        "options": []
      },
      {
        "key": "researchStage",
        "label": "Stage",
        "type": "select",
        "required": false,
        "options": [
          "Proposal",
          "Approved",
          "Ongoing",
          "Completed",
          "Published",
          "Patented"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29895
  },
  {
    "key": "accreditationIQAC",
    "label": "Accreditation & IQAC",
    "category": "Governance",
    "description": "NAAC, NBA, NIRF, AISHE, SSR/DVV evidence, quality cycles, and IQAC action tracking.",
    "fields": [
      {
        "key": "qualityCycle",
        "label": "Quality Cycle",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "framework",
        "label": "Framework",
        "type": "select",
        "required": false,
        "options": [
          "NAAC",
          "NBA",
          "NIRF",
          "AISHE",
          "AQAR",
          "Internal Audit"
        ]
      },
      {
        "key": "criterion",
        "label": "Criterion / Metric",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "evidenceStatus",
        "label": "Evidence Status",
        "type": "select",
        "required": false,
        "options": [
          "Pending",
          "Collected",
          "Verified",
          "Submitted",
          "Accepted"
        ]
      },
      {
        "key": "owner",
        "label": "Owner",
        "type": "text",
        "required": false,
        "options": []
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29911
  },
  {
    "key": "financeAccounting",
    "label": "Finance & Accounting",
    "category": "Finance",
    "description": "Accounts, budgets, vouchers, receipts, expenses, audit trails, and department-wise cost centers.",
    "fields": [
      {
        "key": "voucherNo",
        "label": "Voucher / Receipt No",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "accountHead",
        "label": "Account Head",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "transactionType",
        "label": "Transaction Type",
        "type": "select",
        "required": false,
        "options": [
          "Income",
          "Expense",
          "Transfer",
          "Adjustment"
        ]
      },
      {
        "key": "amount",
        "label": "Amount",
        "type": "number",
        "required": true,
        "options": []
      },
      {
        "key": "approvalStatus",
        "label": "Approval Status",
        "type": "select",
        "required": false,
        "options": [
          "Draft",
          "Pending",
          "Approved",
          "Rejected",
          "Posted"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29927
  },
  {
    "key": "procurementAssets",
    "label": "Procurement & Assets",
    "category": "Campus Operations",
    "description": "Purchase requests, vendor management, stock inward, asset allocation, AMC and maintenance planning.",
    "fields": [
      {
        "key": "requestTitle",
        "label": "Request / Asset Title",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "vendorName",
        "label": "Vendor",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "assetTag",
        "label": "Asset Tag",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "departmentName",
        "label": "Department",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "procurementStatus",
        "label": "Procurement Status",
        "type": "select",
        "required": false,
        "options": [
          "Requested",
          "Quoted",
          "Approved",
          "Ordered",
          "Received",
          "Issued"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29943
  },
  {
    "key": "grievanceHelpdesk",
    "label": "Grievance & Helpdesk",
    "category": "Student Success",
    "description": "Student, parent, faculty and staff grievances with SLA tracking, escalation, and resolution notes.",
    "fields": [
      {
        "key": "ticketTitle",
        "label": "Ticket Title",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "requesterType",
        "label": "Requester Type",
        "type": "select",
        "required": false,
        "options": [
          "Student",
          "Parent",
          "Faculty",
          "Staff",
          "Public"
        ]
      },
      {
        "key": "priorityBand",
        "label": "Priority",
        "type": "select",
        "required": false,
        "options": [
          "Low",
          "Medium",
          "High",
          "Critical"
        ]
      },
      {
        "key": "assignedTeam",
        "label": "Assigned Team",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "slaStatus",
        "label": "SLA Status",
        "type": "select",
        "required": false,
        "options": [
          "Within SLA",
          "At Risk",
          "Breached",
          "Resolved"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29959
  },
  {
    "key": "healthWellbeing",
    "label": "Health & Wellbeing",
    "category": "Student Success",
    "description": "Health records, counselling, wellbeing interventions, emergency contacts, and campus clinic follow-ups.",
    "fields": [
      {
        "key": "caseTitle",
        "label": "Case / Visit Title",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "personName",
        "label": "Person Name",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "caseType",
        "label": "Case Type",
        "type": "select",
        "required": false,
        "options": [
          "Medical",
          "Counselling",
          "Emergency",
          "Wellbeing",
          "Follow-up"
        ]
      },
      {
        "key": "followUpDate",
        "label": "Follow-up Date",
        "type": "date",
        "required": false,
        "options": []
      },
      {
        "key": "careStatus",
        "label": "Care Status",
        "type": "select",
        "required": false,
        "options": [
          "Open",
          "Monitoring",
          "Referred",
          "Closed"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29975
  },
  {
    "key": "securityCompliance",
    "label": "Security & Compliance",
    "category": "Platform",
    "description": "Gate passes, visitor security, data protection, consent records, role audit and compliance incidents.",
    "fields": [
      {
        "key": "controlTitle",
        "label": "Control / Incident Title",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "controlType",
        "label": "Control Type",
        "type": "select",
        "required": false,
        "options": [
          "Security",
          "Data Privacy",
          "Consent",
          "Role Audit",
          "Incident"
        ]
      },
      {
        "key": "owner",
        "label": "Owner",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "riskLevel",
        "label": "Risk Level",
        "type": "select",
        "required": false,
        "options": [
          "Low",
          "Medium",
          "High",
          "Critical"
        ]
      },
      {
        "key": "closureStatus",
        "label": "Closure Status",
        "type": "select",
        "required": false,
        "options": [
          "Open",
          "In Review",
          "Mitigated",
          "Closed"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 29991
  },
  {
    "key": "documentDms",
    "label": "Documents & DMS",
    "category": "Content",
    "description": "Document templates, institutional evidence, student files, approvals, expiry alerts, and digital records.",
    "fields": [
      {
        "key": "documentTitle",
        "label": "Document Title",
        "type": "text",
        "required": true,
        "options": []
      },
      {
        "key": "documentType",
        "label": "Document Type",
        "type": "select",
        "required": false,
        "options": [
          "Student File",
          "Policy",
          "Evidence",
          "Template",
          "Certificate",
          "Contract"
        ]
      },
      {
        "key": "owner",
        "label": "Owner",
        "type": "text",
        "required": false,
        "options": []
      },
      {
        "key": "expiryDate",
        "label": "Expiry Date",
        "type": "date",
        "required": false,
        "options": []
      },
      {
        "key": "documentStatus",
        "label": "Document Status",
        "type": "select",
        "required": false,
        "options": [
          "Draft",
          "Under Review",
          "Approved",
          "Expired",
          "Archived"
        ]
      }
    ],
    "kind": "legacy-pack",
    "sourceLine": 30007
  }
] as ModuleDefinition[];

export const allModules: ModuleDefinition[] = [...primaryModules, ...legacyPackModules];
export const moduleLookup = new Map(allModules.map(module => [module.key, module] as const));

export function getModuleDefinition(key: string): ModuleDefinition | undefined {
  return moduleLookup.get(key);
}

export function getModuleTableName(key: string): string {
  return 'module_' + sanitizeKey(key);
}

export function sanitizeKey(input: string): string {
  return String(input).replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

export function toPascalCase(input: string): string {
  return String(input).replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('');
}

export function toCamelCase(input: string): string {
  const value = toPascalCase(input);
  return value ? value.charAt(0).toLowerCase() + value.slice(1) : value;
}

export function getPrimaryModulesByDomain(): Record<string, ModuleDefinition[]> {
  return primaryModules.reduce<Record<string, ModuleDefinition[]>>((acc, module) => {
    const key = module.domainLabel || 'Unclassified';
    acc[key] = acc[key] || [];
    acc[key].push(module);
    return acc;
  }, {});
}

export const primaryModuleDomains = Object.entries(getPrimaryModulesByDomain()).map(([label, modules]) => ({ label, modules }));
export const moduleKeyList = allModules.map(module => module.key);
