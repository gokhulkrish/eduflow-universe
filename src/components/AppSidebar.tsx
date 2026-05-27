import { memo, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, FileBarChart, Calendar,
  CreditCard, BookOpen, Building2, Bus, Briefcase, UserCog, NotebookPen,
  BarChart3, Bell, Heart, Settings, Award, MessagesSquare, Video, Sparkles,
  FileSignature, Megaphone, Target, CalendarClock, PartyPopper, IdCard, DatabaseBackup, ArrowUpCircle,
  Workflow, Shield, Database, CalendarDays, ListTodo, DollarSign, Package,
  ClipboardList, MessageSquare, HelpCircle, Sun, Layers, FileImage, Swords,
  Phone, LayoutPanelTop, DoorOpen, Search, Activity, MonitorCog, House,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuAction, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { loadAccessibleModuleKeys } from "@/lib/module-access";
import { resolveAccessKeyForPathname } from "@/lib/global-access-registry";
import { subscribeAppSync } from "@/lib/app-sync";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { canOpenCommandCenter } from "@/lib/command-center-access";

interface SidebarItem {
  title: string;
  url: string;
  icon: any;
  action?: { icon: any; label: string; href: string };
}

const normalizeRoutePath = (value: string) => value.replace(/\/+$/, "") || "/";

const isSidebarItemActive = (pathname: string, url: string) =>
  normalizeRoutePath(pathname) === normalizeRoutePath(url);

const isSidebarActionActive = (pathname: string, href: string) =>
  normalizeRoutePath(pathname) === normalizeRoutePath(href) || pathname.startsWith(href + "/");

const SidebarItemRow = memo(function SidebarItemRow({
  item,
  collapsed,
  isActive,
  isActionActive,
}: {
  item: SidebarItem;
  collapsed: boolean;
  isActive: boolean;
  isActionActive: boolean;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const handleClick = () => { if (isMobile) setOpenMobile(false); };
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <NavLink to={item.url} className="flex items-center gap-3" onClick={handleClick}>
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
      {item.action && !collapsed && (
        <SidebarMenuAction asChild showOnHover>
          <NavLink to={item.action.href} title={item.action.label} className={isActionActive ? "text-foreground" : ""} onClick={handleClick}>
            <item.action.icon className="h-4 w-4" />
          </NavLink>
        </SidebarMenuAction>
      )}
    </SidebarMenuItem>
  );
});

const dashboard: SidebarItem = { title: "Command Center", url: "/", icon: LayoutDashboard };

const academics: SidebarItem[] = [
  { title: "Admissions", url: "/admissions", icon: GraduationCap },
  { title: "Students", url: "/students", icon: Users },
  { title: "Add Student", url: "/students/new", icon: GraduationCap },
  { title: "Student Info", url: "/student-information", icon: Users },
  { title: "Student Search", url: "/student-search", icon: Search },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
  { title: "Exams & Results", url: "/exams", icon: FileBarChart },
  { title: "Timetable", url: "/timetable", icon: Calendar },
  { title: "Assignments", url: "/assignments", icon: NotebookPen },
  { title: "Homework", url: "/homework", icon: NotebookPen },
  { title: "Library", url: "/library", icon: BookOpen },
  { title: "Online Exams", url: "/online-exams", icon: FileSignature },
  { title: "Course Info", url: "/course-information", icon: BookOpen },
  { title: "Class Mgmt", url: "/class-mgmt", icon: Layers },
  { title: "Subjects", url: "/subjects", icon: BookOpen },
  { title: "Lessons", url: "/lessons", icon: BookOpen },
  { title: "Quiz", url: "/quiz", icon: HelpCircle },
  { title: "Live Classes", url: "/live", icon: Video },
  { title: "Video Rooms", url: "/video-rooms", icon: Video },
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "Scholarship", url: "/scholarship", icon: Award },
  { title: "Promotion Engine", url: "/promotion", icon: ArrowUpCircle },
  { title: "Scoring Workspace", url: "/scoring", icon: BarChart3 },
  { title: "Monitoring Dashboard", url: "/monitor", icon: Activity },
  { title: "Departments", url: "/departments", icon: Building2 },
  { title: "Curriculum & Outcomes", url: "/curriculum", icon: BookOpen },
  { title: "LMS & E-Learning", url: "/lms", icon: GraduationCap },
  { title: "Research & Innovation", url: "/research", icon: Layers },
];

const finance: SidebarItem[] = [
  { title: "Fees & Payments", url: "/fees", icon: CreditCard },
  { title: "Account Mgmt", url: "/accounts", icon: DollarSign },
];

const people: SidebarItem[] = [
  { title: "HR & Payroll", url: "/hr", icon: Briefcase },
  { title: "Staff", url: "/staff", icon: UserCog },
  { title: "Leave Mgmt", url: "/leave", icon: CalendarClock },
  { title: "Leave Master", url: "/leave-master", icon: CalendarClock },
  { title: "Holidays", url: "/holidays", icon: Sun },
];

const campus: SidebarItem[] = [
  { title: "Hostel", url: "/hostel", icon: Building2 },
  { title: "Transport", url: "/transport", icon: Bus },
  { title: "Events", url: "/events", icon: PartyPopper },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Digital ID", url: "/id-cards", icon: IdCard },
  { title: "Notice Board", url: "/notice-board", icon: ClipboardList },
  { title: "Import Pipeline", url: "/import", icon: ArrowUpCircle },
  { title: "Media", url: "/media", icon: FileImage },
  { title: "Discipline", url: "/discipline", icon: Swords },
  { title: "Telephone", url: "/telephone", icon: Phone },
  { title: "Class Wall", url: "/class-wall", icon: LayoutPanelTop },
  { title: "Reception", url: "/reception", icon: DoorOpen },
  { title: "Health & Wellbeing", url: "/health", icon: Heart },
  { title: "Documents & DMS", url: "/documents", icon: FileImage },
  { title: "Procurement & Assets", url: "/procurement", icon: Package },
];

const community: SidebarItem[] = [
  { title: "Parent Portal", url: "/parents", icon: Heart },
  { title: "Messaging & Control", url: "/settings/messaging", icon: MessageSquare },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Chat Rooms", url: "/chat", icon: MessagesSquare },
  { title: "Comms Hub", url: "/comms", icon: Megaphone },
  { title: "Alumni", url: "/alumni", icon: GraduationCap },
  { title: "Grievances", url: "/grievance", icon: MessageSquare },
  { title: "Placement Cell", url: "/placement", icon: Target },
];

const platform: SidebarItem[] = [
  { title: "AI Assistant", url: "/ai", icon: Sparkles },
  { title: "Tasks", url: "/tasks", icon: ListTodo },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Automation", url: "/automation", icon: Workflow },
  { title: "Activity Log", url: "/activity-log", icon: Activity },
];

const admin: SidebarItem[] = [
  { title: "Administration", url: "/administration", icon: House },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Institute Identity", url: "/settings/institute", icon: Building2 },
  { title: "Headers & Fields", url: "/settings/headers", icon: Settings },
  { title: "Workspace Registry", url: "/registry", icon: Layers },
  { title: "Permission Matrix", url: "/permissions", icon: Shield },
  { title: "Security & Audit", url: "/security", icon: Shield },
  { title: "User Management", url: "/user-management", icon: Shield },
  { title: "Migration Center", url: "/migration", icon: ArrowUpCircle },
  { title: "Backups", url: "/backups", icon: DatabaseBackup },
  { title: "System", url: "/system", icon: MonitorCog },
  { title: "Accreditation & IQAC", url: "/accreditation", icon: ClipboardCheck },
];

function SidebarGroupSection({
  label,
  items,
  collapsed,
  pathname,
  accessibleKeys,
  isLoading,
}: {
  label: string;
  items: SidebarItem[];
  collapsed: boolean;
  pathname: string;
  accessibleKeys?: Set<string>;
  isLoading: boolean;
}) {
  const visibleItems = useMemo(() => {
    if (isLoading) return [];

    return items.filter((item) => {
      const accessKey = resolveAccessKeyForPathname(item.url);
      return !accessKey ? true : (accessibleKeys?.has(accessKey) ?? false);
    });
  }, [accessibleKeys, isLoading, items]);

  if (!visibleItems.length) return null;

  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => (
            <SidebarItemRow
              key={item.title}
              item={item}
              collapsed={collapsed}
              isActive={isSidebarItemActive(pathname, item.url)}
              isActionActive={item.action ? isSidebarActionActive(pathname, item.action.href) : false}
            />
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const { roles, loading: authLoading } = useAuth();
  const accessQuery = useQuery({
    queryKey: ["accessible-module-keys", "sidebar"],
    queryFn: () => loadAccessibleModuleKeys(),
    staleTime: Infinity,
  });

  useEffect(() => {
    return subscribeAppSync(["sms.module-access.v1"], () => {
      void accessQuery.refetch();
    });
  }, [accessQuery.refetch]);

  const groups = useMemo(() => [
    { label: "Academics", items: academics },
    { label: "Finance", items: finance },
    { label: "People", items: people },
    { label: "Campus", items: campus },
    { label: "Community", items: community },
    { label: "Platform", items: platform },
    { label: "Admin", items: admin },
  ] as const, []);
  const showDashboard = !authLoading && canOpenCommandCenter(roles);

  return (
    <Sidebar collapsible="icon" style={{ willChange: "width" }} className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3 group-data-[state=collapsed]:px-0">
          {!collapsed && (
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow p-1">
              <GraduationCap className="h-5 w-5 text-primary-foreground shrink-0" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-base font-bold tracking-tight text-sidebar-foreground">NextGen</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/60">EduERP</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {showDashboard && (
          <SidebarItemRow
            item={dashboard}
            collapsed={collapsed}
            isActive={isSidebarItemActive(pathname, "/")}
            isActionActive={false}
          />
        )}
        {groups.map((g) => (
          <SidebarGroupSection
            key={g.label}
            label={g.label}
            items={g.items}
            collapsed={collapsed}
            pathname={pathname}
            accessibleKeys={accessQuery.data}
            isLoading={accessQuery.isLoading}
          />
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
