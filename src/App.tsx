import { Suspense, useEffect, useRef, useState, type ComponentType } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import Auth from "./pages/Auth";
import Mfa from "./pages/Mfa";
import { moduleConfigs } from "./pages/module-configs";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import RouteAccessGuard from "@/components/RouteAccessGuard";
import { LEGACY_ROUTE_ALIASES } from "@/lib/legacy-adapter";
import { supabase } from "@/integrations/supabase/client";
import { subscribeAppSync } from "@/lib/app-sync";
import { importStorageKeys } from "@/lib/student-import";
import { instituteRegistryStorageKey, registryStorageKey } from "@/lib/header-registry";
import { studentRegisterSyncKey } from "@/lib/student-records";
import { requestMonitoringRefresh } from "@/lib/monitoring-refresh";
import { ensureCanonicalStudentFields } from "@/lib/canonical-student-fields";
import { useActivityTrace } from "@/stores/activityTrace";
import { initializeTraceProfiles } from "@/stores/traceProfiles";

function retryableLazy<T extends ComponentType<any>>(importFn: () => Promise<{ default: T }>) {
  return function RetryableLazyWrapper(props: React.ComponentProps<T>) {
    const [version, setVersion] = useState(0);
    const [Comp, setComp] = useState<T | null>(null);
    const [err, setErr] = useState<Error | null>(null);

    useEffect(() => {
      const h = () => {
        setVersion((v) => v + 1);
        setComp(null);
        setErr(null);
      };
      window.addEventListener("sms:lazy-retry", h);
      return () => window.removeEventListener("sms:lazy-retry", h);
    }, []);

    useEffect(() => {
      let cancelled = false;
      let retries = 0;
      const maxRetries = 15;

      const attempt = () => {
        if (cancelled) return;
        importFn()
          .then((m) => { if (!cancelled) setComp(() => m.default); })
          .catch((e) => {
            if (cancelled) return;
            const isImportFail = e.message?.includes?.("Failed to fetch");
            if (isImportFail && retries < maxRetries) {
              retries++;
              const delay = Math.min(1000 * 1.5 ** (retries - 1), 10000);
              setTimeout(attempt, delay);
            } else if (isImportFail) {
              window.location.reload();
            } else {
              if (!cancelled) setErr(e);
            }
          });
      };

      attempt();
      return () => { cancelled = true; };
    }, [version]);

    if (err) throw err;
    if (!Comp) return <PageLoader />;
    return <Comp {...(props as any)} />;
  };
}

const Dashboard = retryableLazy(() => import("./pages/Dashboard"));
const Students = retryableLazy(() => import("./pages/Students"));
const AddStudent = retryableLazy(() => import("./pages/AddStudent"));
const Import = retryableLazy(() => import("./pages/Import"));
const ImportHistory = retryableLazy(() => import("./pages/ImportHistory"));
const Attendance = retryableLazy(() => import("./pages/Attendance"));
const Admissions = retryableLazy(() => import("./pages/Admissions"));
const Exams = retryableLazy(() => import("./pages/Exams"));
const InstituteSettings = retryableLazy(() => import("./pages/InstituteSettings"));
const SettingsHeaders = retryableLazy(() => import("./pages/SettingsHeaders"));
const HeaderGroupManager = retryableLazy(() => import("./pages/HeaderGroupManager"));
const Automation = retryableLazy(() => import("./pages/Automation"));
const Migration = retryableLazy(() => import("./pages/Migration"));
const Permissions = retryableLazy(() => import("./pages/Permissions"));
const Staff = retryableLazy(() => import("./pages/Staff"));
const Fees = retryableLazy(() => import("./pages/Fees"));
const Library = retryableLazy(() => import("./pages/Library"));
const Hostel = retryableLazy(() => import("./pages/Hostel"));
const Transport = retryableLazy(() => import("./pages/Transport"));
const Certificates = retryableLazy(() => import("./pages/Certificates"));
const Reports = retryableLazy(() => import("./pages/Reports"));
const Timetable = retryableLazy(() => import("./pages/Timetable"));
const HR = retryableLazy(() => import("./pages/HR"));
const Assignments = retryableLazy(() => import("./pages/Assignments"));
const Notifications = retryableLazy(() => import("./pages/Notifications"));
const ParentPortal = retryableLazy(() => import("./pages/ParentPortal"));
const Chat = retryableLazy(() => import("./pages/Chat"));
const Live = retryableLazy(() => import("./pages/Live"));
const AI = retryableLazy(() => import("./pages/AI"));
const OnlineExams = retryableLazy(() => import("./pages/OnlineExams"));
const Comms = retryableLazy(() => import("./pages/Comms"));
const CommsTemplates = retryableLazy(() => import("./pages/CommsTemplates"));
const CommsCampaigns = retryableLazy(() => import("./pages/CommsCampaigns"));
const CommsBulkComposer = retryableLazy(() => import("./pages/CommsBulkComposer"));
const CommsLogs = retryableLazy(() => import("./pages/CommsLogs"));
const CommsNotices = retryableLazy(() => import("./pages/CommsNotices"));
const CommsEmergency = retryableLazy(() => import("./pages/CommsEmergency"));
const CommsFeedback = retryableLazy(() => import("./pages/CommsFeedback"));
const CommsClassWall = retryableLazy(() => import("./pages/CommsClassWall"));
const CommsAutomation = retryableLazy(() => import("./pages/CommsAutomation"));
const PlacementCell = retryableLazy(() => import("./pages/PlacementCell"));
const LeaveMgmt = retryableLazy(() => import("./pages/LeaveMgmt"));
const Events = retryableLazy(() => import("./pages/Events"));
const DigitalID = retryableLazy(() => import("./pages/DigitalID"));
const PromotionEngine = retryableLazy(() => import("./pages/PromotionEngine"));
const Backups = retryableLazy(() => import("./pages/Backups"));
const SecurityAudit = retryableLazy(() => import("./pages/SecurityAudit"));
const Settings = retryableLazy(() => import("./pages/Settings"));
const HolidayManagement = retryableLazy(() => import("./pages/HolidayManagement"));
const LeaveMaster = retryableLazy(() => import("./pages/LeaveMaster"));
const ClassManagement = retryableLazy(() => import("./pages/ClassManagement"));
const SubjectManagement = retryableLazy(() => import("./pages/SubjectManagement"));
const LessonManagement = retryableLazy(() => import("./pages/LessonManagement"));
const NoticeBoard = retryableLazy(() => import("./pages/NoticeBoard"));
const MediaFileManagement = retryableLazy(() => import("./pages/MediaFileManagement"));
const DisciplineRecord = retryableLazy(() => import("./pages/DisciplineRecord"));
const TelephoneDirectory = retryableLazy(() => import("./pages/TelephoneDirectory"));
const ClassWallManagement = retryableLazy(() => import("./pages/ClassWallManagement"));
const ActivityLog = retryableLazy(() => import("./pages/ActivityLog"));
const ReceptionManagement = retryableLazy(() => import("./pages/ReceptionManagement"));
const TaskManagement = retryableLazy(() => import("./pages/TaskManagement"));
const AlumniModule = retryableLazy(() => import("./pages/AlumniModule"));
const QuizModule = retryableLazy(() => import("./pages/QuizModule"));
const InventoryModule = retryableLazy(() => import("./pages/InventoryModule"));
const AccountManagement = retryableLazy(() => import("./pages/AccountManagement"));
const CourseInformation = retryableLazy(() => import("./pages/CourseInformation"));
const StudentInformation = retryableLazy(() => import("./pages/StudentInformation"));
const UserManagement = retryableLazy(() => import("./pages/UserManagement"));
const StudentSearch = retryableLazy(() => import("./pages/StudentSearch"));
const Scholarship = retryableLazy(() => import("./pages/Scholarship"));
const GrievanceRedressal = retryableLazy(() => import("./pages/GrievanceRedressal"));
const Homework = retryableLazy(() => import("./pages/Homework"));
const VideoRooms = retryableLazy(() => import("./pages/VideoRooms"));
const Administration = retryableLazy(() => import("./pages/Administration"));
const SystemPage = retryableLazy(() => import("./pages/System"));
const Departments = retryableLazy(() => import("./pages/Departments"));
const CurriculumOutcomes = retryableLazy(() => import("./pages/CurriculumOutcomes"));
const LmsElearning = retryableLazy(() => import("./pages/LmsElearning"));
const ResearchInnovation = retryableLazy(() => import("./pages/ResearchInnovation"));
const AccreditationIQAC = retryableLazy(() => import("./pages/AccreditationIQAC"));
const HealthWellbeing = retryableLazy(() => import("./pages/HealthWellbeing"));
const DocumentDms = retryableLazy(() => import("./pages/DocumentDms"));
const ProcurementAssets = retryableLazy(() => import("./pages/ProcurementAssets"));
const MonitoringDashboard = retryableLazy(() => import("./pages/MonitoringDashboard"));
const ScoringWorkspace = retryableLazy(() => import("./pages/ScoringWorkspace"));
const MessagingControlCenter = retryableLazy(() => import("./pages/MessagingControlCenter"));
const GenericModule = retryableLazy(() => import("./pages/GenericModule"));
const WorkspaceRegistry = retryableLazy(() => import("./pages/WorkspaceRegistry"));
const WorkspaceControlSettings = retryableLazy(() => import("./pages/WorkspaceControlSettings"));
const StudentDetailLayout = retryableLazy(() => import("./pages/StudentDetailLayout"));
const BulkAssign = retryableLazy(() => import("./pages/BulkAssign"));
const DuplicatesWorkspace = retryableLazy(() => import("./pages/DuplicatesWorkspace"));
const DataQualityDashboard = retryableLazy(() => import("./pages/DataQualityDashboard"));
const MissingCriticalFields = retryableLazy(() => import("./pages/MissingCriticalFields"));
const LandingProfileSettings = retryableLazy(() => import("./pages/LandingProfileSettings"));
const CapabilityProfilesPage = retryableLazy(() => import("./pages/CapabilityProfilesPage"));

import { initRegistryStorage } from "@/lib/header-registry";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
const dedicated = new Set(["attendance","staff","fees","library","hostel","transport","certificates","exams","reports","timetable","hr","assignments","notifications","parents","chat","live","ai","online-exams","comms","placement","leave","events","id-cards","promotion","backups","security","settings","admissions","holidays","leave-master","class-mgmt","subjects","lessons","notice-board","media","discipline","telephone","class-wall","activity-log","reception","tasks","alumni","quiz","inventory","accounts","course-information","student-information","user-management","student-search","scholarship","grievance","homework","video-rooms","administration","system","departments","curriculum","lms","research","accreditation","health","documents","procurement","monitor","scoring","trace"]);
function PageLoader() {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

const LazyRoute = ({ element }: { element: JSX.Element }) => <Suspense fallback={<PageLoader />}>{element}</Suspense>;

function CapabilityAccessSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const refreshAccessQueries = () => {
      queryClient.invalidateQueries({ queryKey: ["module-enabled"] });
    };

    const unsubscribeAppSync = subscribeAppSync(["sms.module-access.v1"], refreshAccessQueries);
    const channel = supabase
      .channel("module-access-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "permissions" },
        refreshAccessQueries,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "role_permissions" },
        refreshAccessQueries,
      )
      .subscribe();

    return () => {
      unsubscribeAppSync();
      void supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}

function MonitoringRefreshBridge() {
  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const queueRefresh = () => {
      if (typeof window === "undefined") return;
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void requestMonitoringRefresh().catch(() => {});
      }, 250);
    };

    void requestMonitoringRefresh().catch(() => {});

    const unsubscribe = subscribeAppSync(
      [
        studentRegisterSyncKey,
        registryStorageKey,
        instituteRegistryStorageKey,
        `${instituteRegistryStorageKey}.config`,
        importStorageKeys.customFields,
        importStorageKeys.profiles,
        "sms.attendance.v1",
        "sms.import-batches.v1",
        "eduflow_announcements",
        "eduflow_polls",
      ],
      () => {
        if (cancelled) return;
        queueRefresh();
      },
    );

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  return null;
}

const PATH_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/students": "Students",
  "/students/new": "Add Student",
  "/students/assign/:action": "Students: Bulk Assign",
  "/students/:id/parent": "Student: Parent",
  "/students/:id/history": "Student: History",
  "/students/:id/notes/:type": "Student: Notes",
  "/students/:id/health": "Student: Health",
  "/students/:id/document": "Student: Documents",
  "/students/duplicates": "Duplicates",
  "/students/missing-fields": "Missing Critical Fields",
  "/admissions": "Admissions",
  "/exams": "Exams",
  "/import": "Import",
  "/attendance": "Attendance",
  "/automation": "Automation",
  "/data-quality": "Data Quality",
  "/monitor": "Monitoring",
  "/scoring": "Scoring",
  "/migration": "Migration",
  "/permissions": "Permissions",
  "/settings/institute": "Settings: Institute",
  "/settings/headers": "Settings: Headers",
  "/settings/trace": "Settings: Startup & Trace",
  "/settings/messaging": "Settings: Messaging & Control Center",
  "/settings/workspace": "Settings: Workspace Controls",
  "/settings/landing": "Settings: Landing Profiles",
  "/registry": "Workspace Registry",
  "/registry/groups": "Registry: Groups",
  "/staff": "Staff",
  "/fees": "Fees",
  "/library": "Library",
  "/hostel": "Hostel",
  "/transport": "Transport",
  "/certificates": "Certificates",
  "/reports": "Reports",
  "/timetable": "Timetable",
  "/hr": "HR",
  "/assignments": "Assignments",
  "/notifications": "Notifications",
  "/parents": "Parent Portal",
  "/chat": "Chat",
  "/live": "Live",
  "/ai": "AI",
  "/online-exams": "Online Exams",
  "/comms": "Comms",
  "/placement": "Placement",
  "/leave": "Leave Management",
  "/events": "Events",
  "/id-cards": "ID Cards",
  "/promotion": "Promotion Engine",
  "/backups": "Backups",
  "/security": "Security Audit",
  "/settings": "Settings",
  "/holidays": "Holidays",
  "/leave-master": "Leave Master",
  "/class-mgmt": "Class Management",
  "/subjects": "Subjects",
  "/lessons": "Lessons",
  "/notice-board": "Notice Board",
  "/media": "Media",
  "/discipline": "Discipline",
  "/telephone": "Telephone Directory",
  "/class-wall": "Class Wall",
  "/activity-log": "Activity Log",
  "/reception": "Reception",
  "/tasks": "Tasks",
  "/alumni": "Alumni",
  "/quiz": "Quiz",
  "/inventory": "Inventory",
  "/accounts": "Accounts",
  "/course-information": "Course Information",
  "/student-information": "Student Information",
  "/user-management": "User Management",
  "/student-search": "Student Search",
  "/scholarship": "Scholarship",
  "/grievance": "Grievance",
  "/homework": "Homework",
  "/video-rooms": "Video Rooms",
  "/administration": "Administration",
  "/system": "System",
  "/departments": "Departments",
  "/curriculum": "Curriculum",
  "/lms": "LMS",
  "/research": "Research",
  "/accreditation": "Accreditation",
  "/health": "Health & Wellbeing",
  "/documents": "Documents",
  "/procurement": "Procurement",
};

function NavigationTraceRecorder() {
  const location = useLocation();
  const prevPath = useRef("");

  useEffect(() => {
    const path = location.pathname;
    if (path === prevPath.current) return;
    prevPath.current = path;
    const label = PATH_LABELS[path] || path.split("/").filter(Boolean).join(" / ") || "Unknown";
    useActivityTrace.getState().push({
      category: "navigation",
      title: label,
      section: path,
    });
  }, [location.pathname]);

  return null;
}

const App = () => {
  useEffect(() => {
    initRegistryStorage();
    ensureCanonicalStudentFields();
    initializeTraceProfiles();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <CapabilityAccessSync />
            <MonitoringRefreshBridge />
            <NavigationTraceRecorder />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/mfa" element={<Mfa />} />
              <Route element={<ErrorBoundary><ProtectedRoute><RouteAccessGuard><AppLayout /></RouteAccessGuard></ProtectedRoute></ErrorBoundary>}>
                <Route path="/" element={<LazyRoute element={<Dashboard />} />} />
                <Route path="/students" element={<LazyRoute element={<Students />} />} />
                <Route path="/students/new" element={<LazyRoute element={<AddStudent />} />} />
                <Route path="/students/:studentId/*" element={<LazyRoute element={<StudentDetailLayout />} />} />
                <Route path="/students/assign/:action" element={<LazyRoute element={<BulkAssign />} />} />
                <Route path="/students/duplicates" element={<LazyRoute element={<DuplicatesWorkspace />} />} />
                <Route path="/students/missing-fields" element={<LazyRoute element={<MissingCriticalFields />} />} />
                <Route path="/admissions" element={<LazyRoute element={<Admissions />} />} />
                <Route path="/exams" element={<LazyRoute element={<Exams />} />} />
                <Route path="/import" element={<LazyRoute element={<Import />} />} />
                <Route path="/import/history" element={<LazyRoute element={<ImportHistory />} />} />
                <Route path="/attendance" element={<LazyRoute element={<ErrorBoundary><Attendance /></ErrorBoundary>} />} />
                <Route path="/automation" element={<LazyRoute element={<Automation />} />} />
                <Route path="/data-quality" element={<LazyRoute element={<DataQualityDashboard />} />} />
                <Route path="/monitor" element={<LazyRoute element={<MonitoringDashboard />} />} />
                <Route path="/scoring" element={<LazyRoute element={<ScoringWorkspace />} />} />
                <Route path="/migration" element={<LazyRoute element={<Migration />} />} />
                <Route path="/permissions" element={<LazyRoute element={<Permissions />} />} />
                <Route path="/settings/institute" element={<LazyRoute element={<InstituteSettings />} />} />
                <Route path="/settings/headers" element={<LazyRoute element={<SettingsHeaders />} />} />
                <Route path="/settings/trace" element={<LazyRoute element={<Settings />} />} />
                <Route path="/settings/messaging" element={<LazyRoute element={<MessagingControlCenter />} />} />
                <Route path="/settings/workspace" element={<LazyRoute element={<WorkspaceControlSettings />} />} />
                <Route path="/settings/landing" element={<LazyRoute element={<LandingProfileSettings />} />} />
                <Route path="/permissions/profiles" element={<LazyRoute element={<CapabilityProfilesPage />} />} />
                <Route path="/registry" element={<LazyRoute element={<WorkspaceRegistry />} />} />
                <Route path="/registry/groups" element={<LazyRoute element={<HeaderGroupManager />} />} />
                <Route path="/staff" element={<LazyRoute element={<Staff />} />} />
                <Route path="/fees" element={<LazyRoute element={<Fees />} />} />
                <Route path="/library" element={<LazyRoute element={<Library />} />} />
                <Route path="/hostel" element={<LazyRoute element={<Hostel />} />} />
                <Route path="/transport" element={<LazyRoute element={<Transport />} />} />
                <Route path="/certificates" element={<LazyRoute element={<Certificates />} />} />
                <Route path="/reports" element={<LazyRoute element={<Reports />} />} />
                <Route path="/timetable" element={<LazyRoute element={<Timetable />} />} />
                <Route path="/hr" element={<LazyRoute element={<HR />} />} />
                <Route path="/assignments" element={<LazyRoute element={<Assignments />} />} />
                <Route path="/notifications" element={<LazyRoute element={<Notifications />} />} />
                <Route path="/parents" element={<LazyRoute element={<ParentPortal />} />} />
                <Route path="/chat" element={<LazyRoute element={<Chat />} />} />
                <Route path="/live" element={<LazyRoute element={<Live />} />} />
                <Route path="/ai" element={<LazyRoute element={<AI />} />} />
                <Route path="/online-exams" element={<LazyRoute element={<OnlineExams />} />} />
                <Route path="/comms" element={<LazyRoute element={<Comms />} />} />
                <Route path="/comms/templates" element={<LazyRoute element={<CommsTemplates />} />} />
                <Route path="/comms/campaigns" element={<LazyRoute element={<CommsCampaigns />} />} />
                <Route path="/comms/bulk" element={<LazyRoute element={<CommsBulkComposer />} />} />
                <Route path="/comms/logs" element={<LazyRoute element={<CommsLogs />} />} />
                <Route path="/comms/notices" element={<LazyRoute element={<CommsNotices />} />} />
                <Route path="/comms/emergency" element={<LazyRoute element={<CommsEmergency />} />} />
                <Route path="/comms/feedback" element={<LazyRoute element={<CommsFeedback />} />} />
                <Route path="/comms/class-wall" element={<LazyRoute element={<CommsClassWall />} />} />
                <Route path="/comms/automation" element={<LazyRoute element={<CommsAutomation />} />} />
                <Route path="/placement" element={<LazyRoute element={<PlacementCell />} />} />
                <Route path="/leave" element={<LazyRoute element={<LeaveMgmt />} />} />
                <Route path="/events" element={<LazyRoute element={<Events />} />} />
                <Route path="/id-cards" element={<LazyRoute element={<DigitalID />} />} />
                <Route path="/promotion" element={<LazyRoute element={<PromotionEngine />} />} />
                <Route path="/backups" element={<LazyRoute element={<Backups />} />} />
                <Route path="/security" element={<LazyRoute element={<SecurityAudit />} />} />
                <Route path="/settings" element={<LazyRoute element={<Settings />} />} />
                <Route path="/holidays" element={<LazyRoute element={<HolidayManagement />} />} />
                <Route path="/leave-master" element={<LazyRoute element={<LeaveMaster />} />} />
                <Route path="/class-mgmt" element={<LazyRoute element={<ClassManagement />} />} />
                <Route path="/subjects" element={<LazyRoute element={<SubjectManagement />} />} />
                <Route path="/lessons" element={<LazyRoute element={<LessonManagement />} />} />
                <Route path="/notice-board" element={<LazyRoute element={<NoticeBoard />} />} />
                <Route path="/media" element={<LazyRoute element={<MediaFileManagement />} />} />
                <Route path="/discipline" element={<LazyRoute element={<DisciplineRecord />} />} />
                <Route path="/telephone" element={<LazyRoute element={<TelephoneDirectory />} />} />
                <Route path="/class-wall" element={<LazyRoute element={<ClassWallManagement />} />} />
                <Route path="/activity-log" element={<LazyRoute element={<ActivityLog />} />} />
                <Route path="/reception" element={<LazyRoute element={<ReceptionManagement />} />} />
                <Route path="/tasks" element={<LazyRoute element={<TaskManagement />} />} />
                <Route path="/alumni" element={<LazyRoute element={<AlumniModule />} />} />
                <Route path="/quiz" element={<LazyRoute element={<QuizModule />} />} />
                <Route path="/inventory" element={<LazyRoute element={<InventoryModule />} />} />
                <Route path="/accounts" element={<LazyRoute element={<AccountManagement />} />} />
                <Route path="/course-information" element={<LazyRoute element={<CourseInformation />} />} />
                <Route path="/student-information" element={<LazyRoute element={<StudentInformation />} />} />
                <Route path="/user-management" element={<LazyRoute element={<UserManagement />} />} />
                <Route path="/student-search" element={<LazyRoute element={<StudentSearch />} />} />
                <Route path="/scholarship" element={<LazyRoute element={<Scholarship />} />} />
                <Route path="/grievance" element={<LazyRoute element={<GrievanceRedressal />} />} />
                <Route path="/homework" element={<LazyRoute element={<Homework />} />} />
                <Route path="/video-rooms" element={<LazyRoute element={<VideoRooms />} />} />
                <Route path="/administration" element={<LazyRoute element={<Administration />} />} />
                <Route path="/system" element={<LazyRoute element={<SystemPage />} />} />
                <Route path="/departments" element={<LazyRoute element={<Departments />} />} />
                <Route path="/curriculum" element={<LazyRoute element={<CurriculumOutcomes />} />} />
                <Route path="/lms" element={<LazyRoute element={<LmsElearning />} />} />
                <Route path="/research" element={<LazyRoute element={<ResearchInnovation />} />} />
                <Route path="/accreditation" element={<LazyRoute element={<AccreditationIQAC />} />} />
                <Route path="/health" element={<LazyRoute element={<HealthWellbeing />} />} />
                <Route path="/documents" element={<LazyRoute element={<DocumentDms />} />} />
                <Route path="/procurement" element={<LazyRoute element={<ProcurementAssets />} />} />
                {Object.entries(LEGACY_ROUTE_ALIASES).map(([from, to]) => (
                  <Route key={from} path={from} element={<Navigate to={to} replace />} />
                ))}
                {Object.keys(moduleConfigs)
                  .filter((s) => !dedicated.has(s))
                  .map((slug) => (
                    <Route key={slug} path={`/${slug}`} element={<LazyRoute element={<GenericModule slug={slug} />} />} />
                  ))}
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
