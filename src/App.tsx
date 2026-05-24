import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import { LEGACY_ROUTE_ALIASES } from "@/lib/legacy-adapter";
import { supabase } from "@/integrations/supabase/client";
import { subscribeAppSync } from "@/lib/app-sync";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Students = lazy(() => import("./pages/Students"));
const AddStudent = lazy(() => import("./pages/AddStudent"));
const Import = lazy(() => import("./pages/Import"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Admissions = lazy(() => import("./pages/Admissions"));
const Exams = lazy(() => import("./pages/Exams"));
const InstituteSettings = lazy(() => import("./pages/InstituteSettings"));
const SettingsHeaders = lazy(() => import("./pages/SettingsHeaders"));
const Automation = lazy(() => import("./pages/Automation"));
const Migration = lazy(() => import("./pages/Migration"));
const Permissions = lazy(() => import("./pages/Permissions"));
const Staff = lazy(() => import("./pages/Staff"));
const Fees = lazy(() => import("./pages/Fees"));
const Library = lazy(() => import("./pages/Library"));
const Hostel = lazy(() => import("./pages/Hostel"));
const Transport = lazy(() => import("./pages/Transport"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Reports = lazy(() => import("./pages/Reports"));
const Timetable = lazy(() => import("./pages/Timetable"));
const HR = lazy(() => import("./pages/HR"));
const Assignments = lazy(() => import("./pages/Assignments"));
const Notifications = lazy(() => import("./pages/Notifications"));
const ParentPortal = lazy(() => import("./pages/ParentPortal"));
const Chat = lazy(() => import("./pages/Chat"));
const Live = lazy(() => import("./pages/Live"));
const AI = lazy(() => import("./pages/AI"));
const OnlineExams = lazy(() => import("./pages/OnlineExams"));
const Comms = lazy(() => import("./pages/Comms"));
const PlacementCell = lazy(() => import("./pages/PlacementCell"));
const LeaveMgmt = lazy(() => import("./pages/LeaveMgmt"));
const Events = lazy(() => import("./pages/Events"));
const DigitalID = lazy(() => import("./pages/DigitalID"));
const PromotionEngine = lazy(() => import("./pages/PromotionEngine"));
const Backups = lazy(() => import("./pages/Backups"));
const SecurityAudit = lazy(() => import("./pages/SecurityAudit"));
const Settings = lazy(() => import("./pages/Settings"));
const HolidayManagement = lazy(() => import("./pages/HolidayManagement"));
const LeaveMaster = lazy(() => import("./pages/LeaveMaster"));
const ClassManagement = lazy(() => import("./pages/ClassManagement"));
const SubjectManagement = lazy(() => import("./pages/SubjectManagement"));
const LessonManagement = lazy(() => import("./pages/LessonManagement"));
const NoticeBoard = lazy(() => import("./pages/NoticeBoard"));
const MediaFileManagement = lazy(() => import("./pages/MediaFileManagement"));
const DisciplineRecord = lazy(() => import("./pages/DisciplineRecord"));
const TelephoneDirectory = lazy(() => import("./pages/TelephoneDirectory"));
const ClassWallManagement = lazy(() => import("./pages/ClassWallManagement"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const ReceptionManagement = lazy(() => import("./pages/ReceptionManagement"));
const TaskManagement = lazy(() => import("./pages/TaskManagement"));
const AlumniModule = lazy(() => import("./pages/AlumniModule"));
const QuizModule = lazy(() => import("./pages/QuizModule"));
const InventoryModule = lazy(() => import("./pages/InventoryModule"));
const AccountManagement = lazy(() => import("./pages/AccountManagement"));
const CourseInformation = lazy(() => import("./pages/CourseInformation"));
const StudentInformation = lazy(() => import("./pages/StudentInformation"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const StudentSearch = lazy(() => import("./pages/StudentSearch"));
const Scholarship = lazy(() => import("./pages/Scholarship"));
const GrievanceRedressal = lazy(() => import("./pages/GrievanceRedressal"));
const Homework = lazy(() => import("./pages/Homework"));
const VideoRooms = lazy(() => import("./pages/VideoRooms"));
const Administration = lazy(() => import("./pages/Administration"));
const SystemPage = lazy(() => import("./pages/System"));
const Departments = lazy(() => import("./pages/Departments"));
const CurriculumOutcomes = lazy(() => import("./pages/CurriculumOutcomes"));
const LmsElearning = lazy(() => import("./pages/LmsElearning"));
const ResearchInnovation = lazy(() => import("./pages/ResearchInnovation"));
const AccreditationIQAC = lazy(() => import("./pages/AccreditationIQAC"));
const HealthWellbeing = lazy(() => import("./pages/HealthWellbeing"));
const DocumentDms = lazy(() => import("./pages/DocumentDms"));
const ProcurementAssets = lazy(() => import("./pages/ProcurementAssets"));
const MonitoringDashboard = lazy(() => import("./pages/MonitoringDashboard"));
const ScoringWorkspace = lazy(() => import("./pages/ScoringWorkspace"));
const GenericModule = lazy(() => import("./pages/GenericModule"));

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
const dedicated = new Set(["attendance","staff","fees","library","hostel","transport","certificates","exams","reports","timetable","hr","assignments","notifications","parents","chat","live","ai","online-exams","comms","placement","leave","events","id-cards","promotion","backups","security","settings","admissions","holidays","leave-master","class-mgmt","subjects","lessons","notice-board","media","discipline","telephone","class-wall","activity-log","reception","tasks","alumni","quiz","inventory","accounts","course-information","student-information","user-management","student-search","scholarship","grievance","homework","video-rooms","administration","system","departments","curriculum","lms","research","accreditation","health","documents","procurement","monitor","scoring"]);
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

const App = () => {
  useEffect(() => { initRegistryStorage(); }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <CapabilityAccessSync />
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/mfa" element={<Mfa />} />
              <Route element={<ErrorBoundary><ProtectedRoute><AppLayout /></ProtectedRoute></ErrorBoundary>}>
                <Route path="/" element={<LazyRoute element={<Dashboard />} />} />
                <Route path="/students" element={<LazyRoute element={<Students />} />} />
                <Route path="/students/new" element={<LazyRoute element={<AddStudent />} />} />
                <Route path="/students/:studentId" element={<LazyRoute element={<AddStudent />} />} />
                <Route path="/admissions" element={<LazyRoute element={<Admissions />} />} />
                <Route path="/exams" element={<LazyRoute element={<Exams />} />} />
                <Route path="/import" element={<LazyRoute element={<Import />} />} />
                <Route path="/attendance" element={<LazyRoute element={<ErrorBoundary><Attendance /></ErrorBoundary>} />} />
                <Route path="/automation" element={<LazyRoute element={<Automation />} />} />
                <Route path="/monitor" element={<LazyRoute element={<MonitoringDashboard />} />} />
                <Route path="/scoring" element={<LazyRoute element={<ScoringWorkspace />} />} />
                <Route path="/migration" element={<LazyRoute element={<Migration />} />} />
                <Route path="/permissions" element={<LazyRoute element={<Permissions />} />} />
                <Route path="/settings/institute" element={<LazyRoute element={<InstituteSettings />} />} />
                <Route path="/settings/headers" element={<LazyRoute element={<SettingsHeaders />} />} />
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
