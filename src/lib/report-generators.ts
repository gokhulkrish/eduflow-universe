import { supabase } from "@/integrations/supabase/client";
import { fetchStudentRegister } from "@/lib/student-records";
import { tableExists, tablesExist } from "@/lib/supabase-health";
import { isModuleEnabled } from "@/lib/module-access";
import {
  getOverviewKpis, getGradeDistribution, getSubjectPerformance, getExamPassFail,
  getMonthlyCollection, getDefaulterReport, getAttendanceReport, getConcessionSummary,
  type KpiCard, type GradeDistrib, type SubjectPerformance, type ExamPassFail,
  type MonthlyCollection, type DefaulterRow, type AttendanceRow, type ConcessionSummary,
} from "@/lib/reports";

export type ReportCategory = "overview" | "academic" | "financial" | "attendance" | "students" | "staff" | "library" | "hostel" | "transport" | "admissions" | "inventory";

export type ReportColumn = { key: string; label: string };

export interface ReportGenerator<T = unknown> {
  id: string;
  title: string;
  category: ReportCategory;
  description: string;
  columns: ReportColumn[];
  generate: (filters?: Record<string, string>) => Promise<T[]>;
}

// ── Overview ────────────────────────────────────────────────────

export const overviewKpisReport: ReportGenerator<KpiCard> = {
  id: "overview-kpis",
  title: "Overview KPIs",
  category: "overview",
  description: "Key performance indicators across all modules",
  columns: [
    { key: "label", label: "Metric" },
    { key: "value", label: "Value" },
    { key: "subtitle", label: "Subtitle" },
    { key: "trend", label: "Trend" },
  ],
  generate: async () => getOverviewKpis(),
};

export const cohortDistributionReport: ReportGenerator<GradeDistrib> = {
  id: "cohort-distribution",
  title: "Cohort Distribution",
  category: "overview",
  description: "Per-grade breakdown of students, attendance, fees, and exam results",
  columns: [
    { key: "grade", label: "Cohort" },
    { key: "total", label: "Students" },
    { key: "present", label: "Present" },
    { key: "absent", label: "Absent" },
    { key: "paid", label: "Fee Paid" },
    { key: "pending", label: "Fee Pending" },
    { key: "passed", label: "Exam Passed" },
    { key: "failed", label: "Exam Failed" },
  ],
  generate: async () => getGradeDistribution(),
};

// ── Academic ────────────────────────────────────────────────────

export const subjectPerformanceReport: ReportGenerator<SubjectPerformance> = {
  id: "subject-performance",
  title: "Subject Performance",
  category: "academic",
  description: "Average marks, pass rate, and student count per subject",
  columns: [
    { key: "subject", label: "Subject" },
    { key: "code", label: "Code" },
    { key: "avg_marks", label: "Avg Marks" },
    { key: "max_marks", label: "Max Marks" },
    { key: "pass_rate", label: "Pass Rate (%)" },
    { key: "total_students", label: "Students" },
  ],
  generate: async () => getSubjectPerformance(),
};

export const passFailReport: ReportGenerator<ExamPassFail> = {
  id: "pass-fail",
  title: "Pass / Fail by Cohort",
  category: "academic",
  description: "Exam pass and fail counts and rates per grade",
  columns: [
    { key: "grade", label: "Cohort" },
    { key: "total", label: "Total" },
    { key: "passed", label: "Passed" },
    { key: "failed", label: "Failed" },
    { key: "pass_rate", label: "Pass Rate (%)" },
  ],
  generate: async () => getExamPassFail(),
};

// ── Financial ───────────────────────────────────────────────────

export const monthlyCollectionReport: ReportGenerator<MonthlyCollection> = {
  id: "monthly-collection",
  title: "Monthly Collection",
  category: "financial",
  description: "Monthly fee collection broken down by payment method",
  columns: [
    { key: "month", label: "Month" },
    { key: "collected", label: "Collected" },
    { key: "count", label: "Transactions" },
    { key: "cash", label: "Cash" },
    { key: "online", label: "Online" },
    { key: "cheque", label: "Cheque" },
  ],
  generate: async () => getMonthlyCollection(),
};

export const defaulterReport: ReportGenerator<DefaulterRow> = {
  id: "defaulters",
  title: "Defaulters",
  category: "financial",
  description: "Students with overdue fee invoices",
  columns: [
    { key: "student_name", label: "Student" },
    { key: "admission_no", label: "Admission No" },
    { key: "grade", label: "Cohort" },
    { key: "outstanding", label: "Outstanding" },
    { key: "due_date", label: "Due Date" },
    { key: "days_overdue", label: "Days Overdue" },
    { key: "invoices", label: "Invoices" },
  ],
  generate: async (filters) => getDefaulterReport(filters?.grade),
};

export const concessionReport: ReportGenerator<ConcessionSummary> = {
  id: "concessions",
  title: "Concessions by Type",
  category: "financial",
  description: "Fee concessions aggregated by type",
  columns: [
    { key: "type", label: "Type" },
    { key: "count", label: "Count" },
    { key: "total_amount", label: "Total Amount" },
  ],
  generate: async () => getConcessionSummary(),
};

// ── Attendance ──────────────────────────────────────────────────

export const attendanceReport: ReportGenerator<AttendanceRow> = {
  id: "attendance-report",
  title: "Attendance Report",
  category: "attendance",
  description: "Per-student attendance percentages across all cohorts",
  columns: [
    { key: "student_name", label: "Student" },
    { key: "admission_no", label: "Admission No" },
    { key: "grade", label: "Cohort" },
    { key: "percent", label: "Attendance %" },
    { key: "total_days", label: "Total Days" },
    { key: "present", label: "Present" },
    { key: "status", label: "Status" },
  ],
  generate: async (filters) => getAttendanceReport(filters?.grade),
};

// ── Students ────────────────────────────────────────────────────

export const studentRosterReport: ReportGenerator = {
  id: "student-roster",
  title: "Student Roster",
  category: "students",
  description: "Full student register with admission details and status",
  columns: [
    { key: "admission_no", label: "Admission No" },
    { key: "display_name", label: "Name" },
    { key: "grade", label: "Cohort" },
    { key: "section", label: "Section" },
    { key: "roll_number", label: "Roll No" },
    { key: "attendance_percent", label: "Attendance %" },
    { key: "fee_status", label: "Fee Status" },
    { key: "status", label: "Status" },
  ],
  generate: async () => {
    const students = await fetchStudentRegister();
    return students.map((s) => ({
      admission_no: s.admission_no,
      display_name: s.display_name,
      grade: s.grade ?? "",
      section: s.section ?? "",
      roll_number: s.roll_number ?? "",
      attendance_percent: s.attendance_percent,
      fee_status: s.fee_status,
      status: s.status,
    }));
  },
};

// ── Staff ───────────────────────────────────────────────────────

export const staffRosterReport: ReportGenerator = {
  id: "staff-roster",
  title: "Staff Roster",
  category: "staff",
  description: "Active staff members and their details",
  columns: [
    { key: "name", label: "Name" },
    { key: "department", label: "Department" },
    { key: "designation", label: "Designation" },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
  ],
  generate: async () => {
    if (!(await tableExists("staff"))) return [];
    const { data } = await supabase.from("staff").select("name, department, designation, email, status");
    return (data ?? []).map((r: any) => ({
      name: r.name ?? "",
      department: r.department ?? "",
      designation: r.designation ?? "",
      email: r.email ?? "",
      status: r.status ?? "active",
    }));
  },
};

// ── Library ─────────────────────────────────────────────────────

export const libraryReport: ReportGenerator = {
  id: "library-books",
  title: "Library Books",
  category: "library",
  description: "Library book inventory and availability",
  columns: [
    { key: "title", label: "Title" },
    { key: "author", label: "Author" },
    { key: "isbn", label: "ISBN" },
    { key: "status", label: "Status" },
  ],
  generate: async () => {
    if (!(await tableExists("library_books"))) return [];
    const { data } = await supabase.from("library_books").select("title, author, isbn, status");
    return (data ?? []).map((r: any) => ({
      title: r.title ?? "",
      author: r.author ?? "",
      isbn: r.isbn ?? "",
      status: r.status ?? "available",
    }));
  },
};

// ── Hostel ──────────────────────────────────────────────────────

export const hostelReport: ReportGenerator = {
  id: "hostel-occupancy",
  title: "Hostel Occupancy",
  category: "hostel",
  description: "Hostel room occupancy and allocation",
  columns: [
    { key: "hostel", label: "Hostel" },
    { key: "room", label: "Room" },
    { key: "occupant", label: "Occupant" },
    { key: "status", label: "Status" },
  ],
  generate: async () => {
    if (!(await tableExists("hostels"))) return [];
    const { data } = await supabase.from("hostels").select("name, room_number, occupant_name, status");
    return (data ?? []).map((r: any) => ({
      hostel: r.name ?? "",
      room: r.room_number ?? "",
      occupant: r.occupant_name ?? "",
      status: r.status ?? "vacant",
    }));
  },
};

// ── Transport ───────────────────────────────────────────────────

export const transportReport: ReportGenerator = {
  id: "transport-routes",
  title: "Transport Routes",
  category: "transport",
  description: "Transport route and vehicle allocation",
  columns: [
    { key: "route", label: "Route" },
    { key: "vehicle", label: "Vehicle" },
    { key: "driver", label: "Driver" },
    { key: "students", label: "Students" },
  ],
  generate: async () => {
    if (!(await tableExists("transport_routes"))) return [];
    const { data } = await supabase.from("transport_routes").select("route_name, vehicle_number, driver_name, student_count");
    return (data ?? []).map((r: any) => ({
      route: r.route_name ?? "",
      vehicle: r.vehicle_number ?? "",
      driver: r.driver_name ?? "",
      students: r.student_count ?? 0,
    }));
  },
};

// ── Admissions ──────────────────────────────────────────────────

export const admissionsReport: ReportGenerator = {
  id: "admissions-summary",
  title: "Admissions Summary",
  category: "admissions",
  description: "New admissions and application statuses",
  columns: [
    { key: "name", label: "Name" },
    { key: "program", label: "Program" },
    { key: "status", label: "Status" },
    { key: "applied_on", label: "Applied On" },
  ],
  generate: async () => {
    if (!(await tableExists("admissions"))) return [];
    const { data } = await supabase.from("admissions").select("name, program, status, created_at").order("created_at", { ascending: false });
    return (data ?? []).map((r: any) => ({
      name: r.name ?? "",
      program: r.program ?? "",
      status: r.status ?? "pending",
      applied_on: r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
    }));
  },
};

// ── Inventory ───────────────────────────────────────────────────

export const inventoryReport: ReportGenerator = {
  id: "inventory-items",
  title: "Inventory Items",
  category: "inventory",
  description: "Inventory stock and availability",
  columns: [
    { key: "item", label: "Item" },
    { key: "category", label: "Category" },
    { key: "quantity", label: "Quantity" },
    { key: "status", label: "Status" },
  ],
  generate: async () => {
    if (!(await tableExists("inventory_items"))) return [];
    const { data } = await supabase.from("inventory_items").select("name, category, quantity, status");
    return (data ?? []).map((r: any) => ({
      item: r.name ?? "",
      category: r.category ?? "",
      quantity: r.quantity ?? 0,
      status: r.status ?? "in_stock",
    }));
  },
};

// ── Registry ────────────────────────────────────────────────────

export const allReportGenerators: ReportGenerator[] = [
  overviewKpisReport,
  cohortDistributionReport,
  subjectPerformanceReport,
  passFailReport,
  monthlyCollectionReport,
  defaulterReport,
  concessionReport,
  attendanceReport,
  studentRosterReport,
  staffRosterReport,
  libraryReport,
  hostelReport,
  transportReport,
  admissionsReport,
  inventoryReport,
];

export const reportGeneratorsByCategory = allReportGenerators.reduce(
  (acc, g) => {
    (acc[g.category] ??= []).push(g);
    return acc;
  },
  {} as Record<ReportCategory, ReportGenerator[]>,
);

export const reportGeneratorMap = allReportGenerators.reduce(
  (acc, g) => {
    acc[g.id] = g;
    return acc;
  },
  {} as Record<string, ReportGenerator>,
);
