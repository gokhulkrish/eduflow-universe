# Patch 00 — Static Scan of SMS-2.html

> Analysis of the legacy `SMS-2.html` monolith — script blocks, global functions, and domain keywords.

## Script Blocks

The legacy `SMS-2.html` contains the following script structure:

| # | Type | Scope | Key Functions | Lines (approx) |
|---|------|-------|---------------|----------------|
| 1 | Inline | Auth | `login()`, `authenticate()`, `verifyMfa()`, `refreshSession()` | 200+ |
| 2 | Inline | Students | `saveStudent()`, `editStudent()`, `deleteStudent()`, `renderStudentTable()`, `promoteStudents()`, `deactivateStudent()` | 500+ |
| 3 | Inline | Attendance | `markAttendance()`, `markPeriodAttendance()`, `bulkUploadAttendance()`, `overrideAttendance()`, `attendanceReport()` | 350+ |
| 4 | Inline | Exams | `createExam()`, `enterMarks()`, `calculateGrade()`, `calculateGPA()`, `getGradeDistribution()`, `getPassFailStats()`, `scoreObservation()` | 450+ |
| 5 | Inline | Fees | `getFeeStructures()`, `generateInvoice()`, `recordPayment()`, `applyConcession()`, `getDefaulters()`, `sendReminders()` | 400+ |
| 6 | Inline | Comms | `sendSMS()`, `sendEmail()`, `createCampaign()`, `getMessageLogs()` | 200+ |
| 7 | Inline | Import | `runImportPipeline()`, `validateRow()`, `parseCSV()`, `commitImport()`, `rollbackImport()` | 350+ |
| 8 | Inline | Admin | `cleanupData()`, `viewAuditLog()`, `backupData()`, `manageClasses()`, `manageSections()`, `manageSubjects()` | 300+ |
| 9 | External | jQuery + UI | DOM manipulation, form validation, modal dialogs | External lib |
| 10 | Inline | Init | `initApp()`, router logic, menu rendering | 150+ |

## Global Variables

| Variable | Type | Domain | Used By |
|----------|------|--------|---------|
| `window.userRole` | string | Identity | Role gating everywhere |
| `window.session` | object | Identity | Auth checks |
| `window.currentUser` | object | Identity | Profile display |
| `window.studentRegister` | array | Students | Student directory |
| `window.attendanceCache` | object | Attendance | Daily marking |
| `window.examList` | array | Assessment | Exam schedule |
| `window.feeStructures` | array | Fees | Fee management |
| `window.messageLogs` | array | Communication | Email/SMS logs |
| `window.importState` | object | Operations | Batch import state machine |

## Domain Keyword Scan

| Keyword | Occurrences | Domain |
|---------|-------------|--------|
| `attendance` | 47 | Attendance |
| `exam` | 52 | Assessment |
| `fee` | 38 | Fees |
| `student` | 89 | Students |
| `import` | 28 | Operations |
| `UMIS` | 6 | Students (import) |
| `template` | 12 | Communication |
| `campaign` | 8 | Communication |
| `audit` | 9 | Operations |
| `promote` | 5 | Students |
| `grade` | 34 | Assessment |
| `timetable` | 14 | Academic Structure |

## Key Observations

1. **Monolithic structure** — All functionality is in a single HTML file with inline scripts.
2. **Global namespace pollution** — 10+ top-level globals, risk of collision.
3. **No module system** — All functions are globally accessible, no imports/exports.
4. **DOM-centric** — Functions directly manipulate DOM (no virtual DOM or components).
5. **localStorage for persistence** — Student register, fee records, attendance stored in localStorage.
6. **No TypeScript** — All plain JavaScript with no type checking.
