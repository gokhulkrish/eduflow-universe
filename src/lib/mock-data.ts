// Centralized mock data for NextGen EduERP
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

export const performanceByGrade = [
  { grade: "Grade 6", avg: 82 },
  { grade: "Grade 7", avg: 78 },
  { grade: "Grade 8", avg: 85 },
  { grade: "Grade 9", avg: 80 },
  { grade: "Grade 10", avg: 88 },
  { grade: "Grade 11", avg: 76 },
  { grade: "Grade 12", avg: 91 },
];

export const departmentDist = [
  { name: "Science", value: 38 },
  { name: "Commerce", value: 27 },
  { name: "Arts", value: 22 },
  { name: "Vocational", value: 13 },
];

export const students = [
  { id: "STU-2041", name: "Aarav Sharma", grade: "10-A", roll: 12, attendance: 96, fees: "Paid", avatar: "AS" },
  { id: "STU-2042", name: "Mei Lin Chen", grade: "9-B", roll: 18, attendance: 92, fees: "Pending", avatar: "MC" },
  { id: "STU-2043", name: "Liam O'Brien", grade: "11-C", roll: 7, attendance: 88, fees: "Paid", avatar: "LO" },
  { id: "STU-2044", name: "Zara Hussain", grade: "12-A", roll: 3, attendance: 99, fees: "Paid", avatar: "ZH" },
  { id: "STU-2045", name: "Diego Martinez", grade: "8-B", roll: 22, attendance: 84, fees: "Overdue", avatar: "DM" },
  { id: "STU-2046", name: "Ananya Iyer", grade: "10-B", roll: 14, attendance: 97, fees: "Paid", avatar: "AI" },
  { id: "STU-2047", name: "Noah Williams", grade: "11-A", roll: 9, attendance: 91, fees: "Pending", avatar: "NW" },
  { id: "STU-2048", name: "Sofia Rossi", grade: "9-A", roll: 21, attendance: 95, fees: "Paid", avatar: "SR" },
];

export const notifications = [
  { id: 1, title: "Fee payment received", desc: "Aarav Sharma · $1,200", time: "2m", type: "success" },
  { id: 2, title: "New admission application", desc: "Riya Patel · Grade 9", time: "12m", type: "info" },
  { id: 3, title: "Low attendance alert", desc: "Class 8-B below 85%", time: "1h", type: "warning" },
  { id: 4, title: "Exam results published", desc: "Mid-term · Grade 10", time: "3h", type: "success" },
  { id: 5, title: "Server backup complete", desc: "Snapshot 2026-05-18", time: "5h", type: "info" },
];

export const activities = [
  { user: "Principal Anita Verma", action: "approved 12 admissions", time: "5 min ago" },
  { user: "Accountant Raj Mehta", action: "posted fee receipts for Grade 10", time: "23 min ago" },
  { user: "Teacher Sara Kim", action: "uploaded Math midterm results", time: "1 hr ago" },
  { user: "Librarian J. Cole", action: "issued 8 new books", time: "2 hr ago" },
  { user: "Transport Mgr K. Singh", action: "updated Route B schedule", time: "4 hr ago" },
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
