// Centralized mock data for the GCT ERP shell
export const stats = {
  students: 2847,
  teachers: 184,
  revenue: 1284500,
  attendance: 94.6,
};

export const enrollmentTrend = [
  { month: "Jan", students: 2410, revenue: 920 },
  { month: "Feb", students: 2510, revenue: 980 },
  { month: "Mar", students: 2580, revenue: 1020 },
  { month: "Apr", students: 2650, revenue: 1095 },
  { month: "May", students: 2720, revenue: 1140 },
  { month: "Jun", students: 2780, revenue: 1185 },
  { month: "Jul", students: 2847, revenue: 1284 },
];

export const attendanceWeek = [
  { day: "Mon", present: 96, absent: 4 },
  { day: "Tue", present: 94, absent: 6 },
  { day: "Wed", present: 95, absent: 5 },
  { day: "Thu", present: 92, absent: 8 },
  { day: "Fri", present: 93, absent: 7 },
  { day: "Sat", present: 88, absent: 12 },
];

export const performanceByProgram = [
  { program: "B.E. Civil Engineering", avg: 84 },
  { program: "B.E. Mechanical Engineering", avg: 81 },
  { program: "B.E. EEE", avg: 87 },
  { program: "B.E. ECE", avg: 83 },
  { program: "B.E. CSE", avg: 89 },
  { program: "B.Tech IT", avg: 88 },
  { program: "M.E. Structural Engineering", avg: 92 },
];

export const departmentDist = [
  { name: "Civil", value: 18 },
  { name: "Mechanical", value: 17 },
  { name: "EEE", value: 14 },
  { name: "ECE", value: 16 },
  { name: "CSE / IT", value: 21 },
  { name: "Science & Humanities", value: 14 },
];

export const students = [
  { id: "STU-2041", name: "Aarav Sharma", grade: "B.E. CSE Sem 1-A", roll: 12, attendance: 96, fees: "Paid", avatar: "AS" },
  { id: "STU-2042", name: "Meera Nair", grade: "B.E. ECE Sem 2-B", roll: 18, attendance: 92, fees: "Pending", avatar: "MN" },
  { id: "STU-2043", name: "Karthik R", grade: "B.E. Mechanical Sem 1-C", roll: 7, attendance: 88, fees: "Paid", avatar: "KR" },
  { id: "STU-2044", name: "Zara Hussain", grade: "B.Tech IT Sem 2-A", roll: 3, attendance: 99, fees: "Paid", avatar: "ZH" },
  { id: "STU-2045", name: "Arjun Menon", grade: "B.E. Civil Sem 2-B", roll: 22, attendance: 84, fees: "Overdue", avatar: "AM" },
  { id: "STU-2046", name: "Ananya Iyer", grade: "B.E. EEE Sem 1-B", roll: 14, attendance: 97, fees: "Paid", avatar: "AI" },
  { id: "STU-2047", name: "Noah Williams", grade: "M.E. Structural Sem 2-A", roll: 9, attendance: 91, fees: "Pending", avatar: "NW" },
  { id: "STU-2048", name: "Sofia Rossi", grade: "B.Tech IT Sem 1-A", roll: 21, attendance: 95, fees: "Paid", avatar: "SR" },
];

export const notifications = [
  { id: 1, title: "Fee payment received", desc: "Aarav Sharma · ₹12,000", time: "2m", type: "success" },
  { id: 2, title: "New admission application", desc: "Priya R · B.E. CSE", time: "12m", type: "info" },
  { id: 3, title: "Low attendance alert", desc: "B.E. ECE Sem 2-B below 85%", time: "1h", type: "warning" },
  { id: 4, title: "Exam results published", desc: "Mid-sem · B.E. Mechanical Sem 2", time: "3h", type: "success" },
  { id: 5, title: "Server backup complete", desc: "Snapshot 2026-05-18", time: "5h", type: "info" },
];

export const activities = [
  { user: "Principal Dr. K. Manonmani", action: "approved 12 admissions", time: "5 min ago" },
  { user: "Accounts Officer", action: "posted fee receipts for B.E. CSE Sem 2", time: "23 min ago" },
  { user: "Faculty Coordinator", action: "uploaded internal test results", time: "1 hr ago" },
  { user: "Librarian", action: "issued 8 new books", time: "2 hr ago" },
  { user: "Transport Mgr", action: "updated route schedule", time: "4 hr ago" },
];

export const pipelines = [
  {
    name: "Admission Pipeline",
    steps: ["Application", "Verification", "Fee Assignment", "Timetable", "Parent Notify", "Activate"],
    status: "running",
    progress: 72,
  },
  {
    name: "Attendance Pipeline",
    steps: ["Capture", "Aggregate", "Reports", "Notifications", "Analytics"],
    status: "healthy",
    progress: 100,
  },
  {
    name: "Exam → Promotion",
    steps: ["Results", "Validation", "Auto Promotion", "Certificate", "Archive"],
    status: "scheduled",
    progress: 35,
  },
];

// ---- Dashboard hero (merged from legacy dashboardSection + erpOverviewSection) ----
export const dashboardHero = {
  eyebrow: "GCT campus operations overview",
  title: "Government College of Technology",
  subtitle:
    "Track admissions, academics, finance, and campus operations for the Coimbatore campus from one dashboard.",
  academicYear: "Academic Year 2025-26",
  sourceCoverage: "GCT ERP-linked",
  district: "Coimbatore · Thadagam Road",
  lastUpdated: "Live · 3 sec ago",
  heroStats: [
    { label: "Registry Volume", value: "2,847", meta: "students across engineering programs" },
    { label: "Import Operations", value: "31", meta: "batches in the last 30 days" },
    { label: "Workflow Activity", value: "14", meta: "active workflow sessions" },
  ],
};

export const erpKpis = [
  { label: "Active Modules", value: 28, icon: "🧩" },
  { label: "Departments", value: 17, icon: "🏫" },
  { label: "Workspace Records", value: "184K", icon: "🗂️" },
  { label: "Automation Rules", value: 42, icon: "🤖" },
  { label: "Campuses Configured", value: 1, icon: "📍" },
];

export const erpRealtimeFabric = [
  { domain: "Academic", health: 98, signal: "Sem plans synced", state: "healthy" },
  { domain: "Finance", health: 94, signal: "Fee receipts posted", state: "healthy" },
  { domain: "Student Success", health: 88, signal: "3 risk flags raised", state: "watch" },
  { domain: "Campus Ops", health: 91, signal: "Transport routes live", state: "healthy" },
  { domain: "Governance", health: 100, signal: "Policies enforced", state: "healthy" },
  { domain: "Compliance", health: 86, signal: "NAAC review due", state: "watch" },
  { domain: "Platform", health: 99, signal: "All services up", state: "healthy" },
];
