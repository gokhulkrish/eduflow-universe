import { Suspense, lazy } from "react";
import { Routes, Route, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  User, Heart, FileText, MessageSquare, History, Users,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbSeparator, BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import AddStudent from "./AddStudent";
import ParentSection from "./student-detail/ParentSection";
import NotesSection from "./student-detail/NotesSection";
import HistorySection from "./student-detail/HistorySection";
import HealthSection from "./student-detail/HealthSection";
import DocumentsSection from "./student-detail/DocumentsSection";

interface TabDef {
  id: string;
  label: string;
  icon: typeof User;
  path: string;
  color: string;
}

const TABS: TabDef[] = [
  { id: "profile", label: "Profile", icon: User, path: "", color: "bg-primary/10 text-primary" },
  { id: "parent", label: "Parent", icon: Users, path: "/parent", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { id: "notes", label: "Notes", icon: MessageSquare, path: "/notes/internal-note", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { id: "history", label: "History", icon: History, path: "/history", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  { id: "health", label: "Health", icon: Heart, path: "/health", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" },
  { id: "documents", label: "Documents", icon: FileText, path: "/document", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
];

function useActiveTab(pathname: string): string {
  if (pathname.includes("/notes/")) return "notes";
  for (const t of TABS) {
    if (t.path && pathname.endsWith(t.path)) return t.id;
  }
  return "profile";
}

export default function StudentDetailLayout() {
  const { studentId } = useParams<{ studentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = useActiveTab(location.pathname);

  return (
    <div>
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/students">Students</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Student #{studentId?.slice(0, 8) ?? "—"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <PageHeader
        title={`Student #${studentId?.slice(0, 8) ?? "—"}`}
        subtitle="Detailed student record with sub-sections"
        icon={<User className="h-6 w-6" />}
      />

      <div className="mb-6 flex flex-wrap gap-1.5 border-b border-border/40 pb-3">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => navigate(`/students/${studentId}${t.path}`)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive ? `${t.color} shadow-sm` : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading section...</div>}>
        {activeTab === "profile" && <AddStudent />}
        {activeTab === "parent" && studentId && <ParentSection studentId={studentId} />}
        {activeTab === "notes" && studentId && <NotesSection studentId={studentId} />}
        {activeTab === "history" && studentId && <HistorySection studentId={studentId} />}
        {activeTab === "health" && studentId && <HealthSection studentId={studentId} />}
        {activeTab === "documents" && studentId && <DocumentsSection studentId={studentId} />}
      </Suspense>
    </div>
  );
}
