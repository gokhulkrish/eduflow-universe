export interface FeatureTarget {
  feature: string;
  legacySource: string;
  targetModule: string;
  targetService: string;
  targetTable: string;
  status: "compatible" | "bridge-required" | "deferred";
}

export const legacyFeatureMap: Record<string, FeatureTarget[]> = {
  "identity-auth": [
    { feature: "Login", legacySource: "window.login()", targetModule: "auth", targetService: "supabase.auth.signInWithPassword", targetTable: "N/A", status: "compatible" },
    { feature: "Role guarding", legacySource: "window.userRole", targetModule: "module-access", targetService: "isModuleEnabled()", targetTable: "module_roles", status: "compatible" },
    { feature: "Session handling", legacySource: "window.session", targetModule: "auth", targetService: "supabase.auth.getSession", targetTable: "N/A", status: "compatible" },
  ],
  "student-master": [
    { feature: "Student CRUD", legacySource: "saveStudent()", targetModule: "student-records", targetService: "saveStudentRecord()", targetTable: "students", status: "compatible" },
    { feature: "Import/Export", legacySource: "importSection", targetModule: "student-import", targetService: "importPipeline", targetTable: "students", status: "compatible" },
    { feature: "Promotion", legacySource: "promoteStudents()", targetModule: "promotion", targetService: "promoteStudents", targetTable: "enrollments", status: "bridge-required" },
    { feature: "Deactivation", legacySource: "deactivateStudent()", targetModule: "student-records", targetService: "deleteStudentRecord()", targetTable: "students", status: "bridge-required" },
  ],
  "academic-structure": [
    { feature: "Classes", legacySource: "classMgmt", targetModule: "class-mgmt", targetService: "manageClasses", targetTable: "class_levels", status: "compatible" },
    { feature: "Sections", legacySource: "sectionMgmt", targetModule: "class-mgmt", targetService: "manageSections", targetTable: "sections", status: "compatible" },
    { feature: "Subjects", legacySource: "subjectMgmt", targetModule: "subject-mgmt", targetService: "manageSubjects", targetTable: "subjects", status: "compatible" },
    { feature: "Teachers", legacySource: "teacherAssign", targetModule: "hr", targetService: "manageTeachers", targetTable: "teachers", status: "compatible" },
    { feature: "Timetable", legacySource: "timetable", targetModule: "timetable", targetService: "manageTimetable", targetTable: "timetable_entries", status: "compatible" },
  ],
  attendance: [
    { feature: "Daily/Period", legacySource: "attendanceClassSection", targetModule: "attendance", targetService: "markAttendance", targetTable: "attendance", status: "bridge-required" },
    { feature: "Bulk upload", legacySource: "attendanceImport", targetModule: "import-engine/adapters/attendance-adapter", targetService: "commitRows", targetTable: "attendance", status: "compatible" },
    { feature: "Manual override", legacySource: "overrideAttendance()", targetModule: "core/attendance/service", targetService: "overrideAttendance", targetTable: "attendance", status: "bridge-required" },
    { feature: "Reports", legacySource: "attendanceReport", targetModule: "reports", targetService: "getAttendanceReport", targetTable: "attendance", status: "compatible" },
  ],
  assessment: [
    { feature: "Exams", legacySource: "examSection", targetModule: "exams", targetService: "getExamSchedules", targetTable: "exam_schedules", status: "compatible" },
    { feature: "Marks entry", legacySource: "marksEntry()", targetModule: "exams", targetService: "saveMarks", targetTable: "exam_marks", status: "compatible" },
    { feature: "Grading rules", legacySource: "gradeRules", targetModule: "exams", targetService: "calculateGrade", targetTable: "grade_schemes", status: "compatible" },
    { feature: "Remarks", legacySource: "remarkTemplates", targetModule: "exams", targetService: "generateRemarks", targetTable: "remarks_templates", status: "bridge-required" },
  ],
  "fees-finance": [
    { feature: "Fee plans", legacySource: "feeStructure", targetModule: "fees", targetService: "getFeeStructures", targetTable: "fee_structures", status: "compatible" },
    { feature: "Invoices", legacySource: "feeInvoice", targetModule: "fees", targetService: "getInvoices", targetTable: "fee_invoices", status: "compatible" },
    { feature: "Payments", legacySource: "feePayment", targetModule: "fees", targetService: "recordPayment", targetTable: "fee_payments", status: "compatible" },
    { feature: "Concessions", legacySource: "feeConcession", targetModule: "fees", targetService: "applyConcession", targetTable: "fee_concessions", status: "compatible" },
    { feature: "Dues", legacySource: "feeDues", targetModule: "fees", targetService: "getDefaulters", targetTable: "fee_invoices", status: "compatible" },
  ],
  communication: [
    { feature: "SMS templates", legacySource: "smsTemplates", targetModule: "comms", targetService: "sendSMS", targetTable: "message_templates", status: "bridge-required" },
    { feature: "Email templates", legacySource: "emailTemplates", targetModule: "comms", targetService: "sendEmail", targetTable: "message_templates", status: "bridge-required" },
    { feature: "Campaigns", legacySource: "campaignMgmt", targetModule: "comms", targetService: "createCampaign", targetTable: "message_campaigns", status: "bridge-required" },
    { feature: "Logs", legacySource: "messageLogs", targetModule: "comms", targetService: "getMessageLogs", targetTable: "message_logs", status: "bridge-required" },
  ],
  operations: [
    { feature: "Batch import wizards", legacySource: "importSection", targetModule: "import-engine", targetService: "runPipeline", targetTable: "import_batches", status: "compatible" },
    { feature: "Data cleanups", legacySource: "cleanup()", targetModule: "migration-certification", targetService: "verifyCompliance", targetTable: "N/A", status: "bridge-required" },
    { feature: "Audit trails", legacySource: "activityTrace", targetModule: "student-records", targetService: "insertAuditEntry", targetTable: "audit_log", status: "compatible" },
  ],
  "institute-identity": [
    { feature: "Institute Profile", legacySource: "window.saveInstituteInformation()", targetModule: "institute", targetService: "saveProfile()", targetTable: "institute_profile", status: "bridge-required" },
    { feature: "Institute Settings", legacySource: "window.renderInstituteInformationPage()", targetModule: "institute", targetService: "loadProfile()", targetTable: "institute_profile", status: "bridge-required" },
  ],
};
