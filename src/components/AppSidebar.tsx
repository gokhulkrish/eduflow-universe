import { memo, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, FileBarChart, Calendar,
  CreditCard, BookOpen, Building2, Bus, Briefcase, UserCog, NotebookPen,
  BarChart3, Bell, Heart, Settings, Award, MessagesSquare, Video, Sparkles,
  FileSignature, Megaphone, Target, CalendarClock, PartyPopper, IdCard, DatabaseBackup, ArrowUpCircle,
  Workflow, Shield, Database, CalendarDays, ListTodo, DollarSign, Package,
  ClipboardList, MessageSquare, HelpCircle, Sun, Layers, FileImage, Swords,
  Phone, LayoutPanelTop, DoorOpen, Search, Activity,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuAction, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface SidebarItem {
  title: string;
  url: string;
  icon: any;
  action?: { icon: any; label: string; href: string };
}

const SidebarItemRow = memo(function SidebarItemRow({ item, collapsed, isActive, isActionActive }: { item: SidebarItem; collapsed: boolean; isActive: boolean; isActionActive: boolean }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
        <NavLink to={item.url} className="flex items-center gap-3">
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
      {item.action && !collapsed && (
        <SidebarMenuAction asChild showOnHover>
          <NavLink to={item.action.href} title={item.action.label} className={isActionActive ? "text-foreground" : ""}>
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
  { title: "Library", url: "/library", icon: BookOpen },
  { title: "Online Exams", url: "/online-exams", icon: FileSignature },
  { title: "Course Info", url: "/course-information", icon: BookOpen },
  { title: "Class Mgmt", url: "/class-mgmt", icon: Layers },
  { title: "Subjects", url: "/subjects", icon: BookOpen },
  { title: "Lessons", url: "/lessons", icon: BookOpen },
  { title: "Quiz", url: "/quiz", icon: HelpCircle },
  { title: "Live Classes", url: "/live", icon: Video },
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "Scholarship", url: "/scholarship", icon: Award },
  { title: "Promotion Engine", url: "/promotion", icon: ArrowUpCircle },
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
];

const community: SidebarItem[] = [
  { title: "Parent Portal", url: "/parents", icon: Heart },
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
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Institute Identity", url: "/settings/institute", icon: Building2 },
  { title: "Headers & Fields", url: "/settings/headers", icon: Settings },
  { title: "Permission Matrix", url: "/permissions", icon: Shield },
  { title: "Security & Audit", url: "/security", icon: Shield },
  { title: "User Management", url: "/user-management", icon: Shield },
  { title: "Migration Center", url: "/migration", icon: ArrowUpCircle },
  { title: "Backups", url: "/backups", icon: DatabaseBackup },
];

function SidebarGroupSection({ label, items, collapsed, pathname }: { label: string; items: SidebarItem[]; collapsed: boolean; pathname: string }) {
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarItemRow
              key={item.title}
              item={item}
              collapsed={collapsed}
              isActive={pathname === "/" ? pathname === item.url : pathname.startsWith(item.url)}
              isActionActive={item.action ? pathname === item.action.href || pathname.startsWith(item.action.href + "/") : false}
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

  const groups = useMemo(() => [
    { label: "Academics", items: academics },
    { label: "Finance", items: finance },
    { label: "People", items: people },
    { label: "Campus", items: campus },
    { label: "Community", items: community },
    { label: "Platform", items: platform },
    { label: "Admin", items: admin },
  ] as const, []);

  return (
    <Sidebar collapsible="icon" style={{ willChange: "width" }} className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
          <div className="relative flex items-center gap-2 px-2 py-3 group-data-[state=collapsed]:px-0">
          {!collapsed && (
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow p-1">
              <GraduationCap className="h-5 w-5 text-primary-foreground shrink-0" />
            </div>
          )}

          {/* Single trigger that moves position via transition to match sidebar timing */}
          <div
            className={
              "absolute top-1/2 -translate-y-1/2 transition-all duration-200 ease-[cubic-bezier(.2,.8,.2,1)] " +
              (collapsed ? "left-1/2 -translate-x-1/2" : "right-2 translate-x-0")
            }
          >
            <SidebarTrigger className="text-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-display text-base font-bold tracking-tight text-sidebar-foreground">NextGen</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/60">EduERP</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarItemRow item={dashboard} collapsed={collapsed} isActive={pathname === "/"} isActionActive={false} />
        {groups.map((g) => (
          <SidebarGroupSection key={g.label} label={g.label} items={g.items} collapsed={collapsed} pathname={pathname} />
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
