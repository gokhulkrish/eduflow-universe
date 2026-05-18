import { ModulePlaceholder } from "@/components/ModulePlaceholder";
import {
  GraduationCap, ClipboardCheck, FileBarChart, Calendar, CreditCard, BookOpen,
  Building2, Bus, Briefcase, UserCog, NotebookPen, BarChart3, Bell, Heart,
  Settings, Award, MessagesSquare, Video, Sparkles, FileSignature, Megaphone,
  Target, CalendarClock, PartyPopper, IdCard, ArrowUpCircle, DatabaseBackup, Shield,
} from "lucide-react";

type Cfg = { title: string; subtitle: string; icon: JSX.Element; features: string[] };

export const moduleConfigs: Record<string, Cfg> = {
  admissions: {
    title: "Admission Management", subtitle: "Application intake · verification · onboarding",
    icon: <GraduationCap className="h-6 w-6" />,
    features: ["Online Application Portal", "Document Verification", "Merit & Lottery Engine", "Fee Slip Generation", "Offer Letters", "Parent Onboarding"],
  },
  attendance: {
    title: "Attendance Tracking", subtitle: "Realtime biometric & RFID sync",
    icon: <ClipboardCheck className="h-6 w-6" />,
    features: ["Class-wise Roll Call", "Biometric Sync", "Auto SMS to Parents", "Leave Approvals", "Trend Analytics", "Discrepancy Audit"],
  },
  exams: {
    title: "Examination & Results", subtitle: "Question banks · grading · transcripts",
    icon: <FileBarChart className="h-6 w-6" />,
    features: ["Exam Scheduler", "Question Bank", "Mark Entry & Moderation", "Grade Calculation", "Result Publishing", "Transcript Export"],
  },
  timetable: {
    title: "Timetable Scheduler", subtitle: "Conflict-free AI-assisted slotting",
    icon: <Calendar className="h-6 w-6" />,
    features: ["Auto Generator", "Conflict Detection", "Teacher Workload Balancer", "Room Allocation", "Substitution Manager", "Calendar Export"],
  },
  fees: {
    title: "Fees & Payments", subtitle: "Multi-gateway · installments · receipts",
    icon: <CreditCard className="h-6 w-6" />,
    features: ["Fee Structures", "Installment Plans", "Online Payments", "Receipts & Refunds", "Defaulter Reports", "Scholarship Adjustments"],
  },
  library: {
    title: "Library Management", subtitle: "Catalog · circulation · digital assets",
    icon: <BookOpen className="h-6 w-6" />,
    features: ["Catalog Search", "Issue / Return", "Fines & Renewals", "Digital Library", "Acquisitions", "Reservation Queue"],
  },
  hostel: {
    title: "Hostel Management", subtitle: "Rooms · attendance · mess · visitors",
    icon: <Building2 className="h-6 w-6" />,
    features: ["Room Allocation", "Mess Menu Planner", "Visitor Logs", "Night Roll Call", "Maintenance Tickets", "Warden Reports"],
  },
  transport: {
    title: "Transport Management", subtitle: "Routes · GPS · driver compliance",
    icon: <Bus className="h-6 w-6" />,
    features: ["Routes & Stops", "Live GPS Tracking", "Driver Roster", "Vehicle Maintenance", "Fee Plans", "Parent Live View"],
  },
  hr: {
    title: "HR & Payroll", subtitle: "End-to-end employee lifecycle",
    icon: <Briefcase className="h-6 w-6" />,
    features: ["Employee Directory", "Payroll Runs", "Tax & Compliance", "Leave & PTO", "Appraisals", "Recruitment Pipeline"],
  },
  staff: {
    title: "Staff Management", subtitle: "Roles · departments · KPIs",
    icon: <UserCog className="h-6 w-6" />,
    features: ["Org Chart", "Department Allocation", "Performance KPIs", "Training Records", "Disciplinary Logs", "Internal Comms"],
  },
  assignments: {
    title: "Assignments & Homework", subtitle: "Distribute · submit · grade",
    icon: <NotebookPen className="h-6 w-6" />,
    features: ["Assignment Builder", "Submissions Inbox", "Plagiarism Check", "Rubric Grading", "Feedback Loops", "Parent Visibility"],
  },
  reports: {
    title: "Reports & Analytics", subtitle: "100+ ready reports · BI export",
    icon: <BarChart3 className="h-6 w-6" />,
    features: ["Academic Reports", "Financial Reports", "Attendance Insights", "Custom Builder", "Export PDF / Excel", "BI Connectors"],
  },
  notifications: {
    title: "Notification Center", subtitle: "Multi-channel campaigns",
    icon: <Bell className="h-6 w-6" />,
    features: ["Email Templates", "SMS Gateway", "Push Notifications", "In-app Alerts", "Scheduled Campaigns", "Delivery Reports"],
  },
  parents: {
    title: "Parent Portal", subtitle: "Single pane for every guardian",
    icon: <Heart className="h-6 w-6" />,
    features: ["Child Overview", "Attendance & Marks", "Fee Payments", "Teacher Chat", "Event Calendar", "Document Vault"],
  },
  settings: {
    title: "Settings", subtitle: "Organization · branding · integrations",
    icon: <Settings className="h-6 w-6" />,
    features: ["Organization Profile", "Branding & Theme", "Integrations", "Roles & Permissions", "Localization", "API Keys"],
  },
  certificates: {
    title: "Certificate Generator", subtitle: "Bulk PDF export with templates",
    icon: <Award className="h-6 w-6" />,
    features: ["Template Designer", "Bulk Generate", "Digital Signature", "QR Verification", "Issuance Log", "Reissue Workflow"],
  },
  chat: {
    title: "Student Chat Rooms", subtitle: "Realtime classroom messaging",
    icon: <MessagesSquare className="h-6 w-6" />,
    features: ["Class Channels", "DMs", "File Sharing", "Moderation Tools", "Read Receipts", "Pinned Messages"],
  },
  live: {
    title: "Live Classes", subtitle: "Integrated video conferencing UI",
    icon: <Video className="h-6 w-6" />,
    features: ["Schedule Sessions", "Join via Link", "Recording Library", "Attendance Capture", "Breakout Rooms", "Chat & Polls"],
  },
  ai: {
    title: "AI Assistant", subtitle: "Insights · suggestions · automation",
    icon: <Sparkles className="h-6 w-6" />,
    features: ["Student Insights", "Auto Lesson Plans", "Risk Detection", "Smart Answers", "Translate & Summarize", "Workflow Suggestions"],
  },
  "online-exams": {
    title: "Online Exams", subtitle: "Secure proctored assessments",
    icon: <FileSignature className="h-6 w-6" />,
    features: ["Test Builder", "Time-bound Sessions", "AI Proctoring", "Auto Grading", "Result Analytics", "Question Randomization"],
  },
  comms: {
    title: "Campus Communication Hub", subtitle: "Broadcast across cohorts",
    icon: <Megaphone className="h-6 w-6" />,
    features: ["Announcements", "Targeted Audiences", "Polls & Surveys", "Newsletter Builder", "Emergency Alerts", "Engagement Stats"],
  },
  placement: {
    title: "Placement Cell", subtitle: "Recruiters · drives · offers",
    icon: <Target className="h-6 w-6" />,
    features: ["Recruiter Directory", "Drive Scheduling", "Student Profiles", "Offer Tracking", "Interview Pipeline", "Analytics"],
  },
  leave: {
    title: "Leave Management", subtitle: "Students & staff workflows",
    icon: <CalendarClock className="h-6 w-6" />,
    features: ["Leave Requests", "Approval Chain", "Calendar View", "Balance Tracking", "Holiday Calendar", "Reports"],
  },
  events: {
    title: "Event Management", subtitle: "From planning to RSVP",
    icon: <PartyPopper className="h-6 w-6" />,
    features: ["Event Planner", "Ticketing", "RSVP Tracking", "Sponsor Pages", "Photo Gallery", "Post-event Reports"],
  },
  "id-cards": {
    title: "Digital ID Cards", subtitle: "QR + NFC enabled IDs",
    icon: <IdCard className="h-6 w-6" />,
    features: ["Template Studio", "Bulk Generation", "QR / NFC Encoding", "Reprint Workflow", "Validity Manager", "Verification API"],
  },
  promotion: {
    title: "Auto Promotion Engine", subtitle: "Year-end promotion automation",
    icon: <ArrowUpCircle className="h-6 w-6" />,
    features: ["Eligibility Rules", "Bulk Promote", "Section Reallocation", "Roll Number Reset", "Archive Records", "Audit Log"],
  },
  backups: {
    title: "Academic Year Backups", subtitle: "Encrypted snapshots & restore",
    icon: <DatabaseBackup className="h-6 w-6" />,
    features: ["Scheduled Snapshots", "On-demand Backup", "Point-in-time Restore", "Encryption Keys", "Off-site Replication", "Audit Trail"],
  },
  security: {
    title: "Security & Audit", subtitle: "ISO 27001 inspired · GDPR ready",
    icon: <Shield className="h-6 w-6" />,
    features: ["Audit Trails", "Login Activity", "MFA Enforcement", "Permission Matrix", "Data Export Requests", "Encryption Status"],
  },
};

export default function GenericModule({ slug }: { slug: string }) {
  const cfg = moduleConfigs[slug];
  if (!cfg) return null;
  return <ModulePlaceholder {...cfg} />;
}
