import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, GraduationCap, ClipboardCheck, FileBarChart, Calendar,
  CreditCard, BookOpen, Building2, Bus, Briefcase, UserCog, NotebookPen,
  BarChart3, Bell, Heart, Settings, Award, MessagesSquare, Video, Sparkles,
  FileSignature, Megaphone, Target, CalendarClock, PartyPopper, IdCard, DatabaseBackup, ArrowUpCircle,
  Workflow, Shield
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const core = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Students", url: "/students", icon: Users },
  { title: "Admissions", url: "/admissions", icon: GraduationCap },
  { title: "Attendance", url: "/attendance", icon: ClipboardCheck },
  { title: "Exams & Results", url: "/exams", icon: FileBarChart },
  { title: "Timetable", url: "/timetable", icon: Calendar },
  { title: "Fees & Payments", url: "/fees", icon: CreditCard },
  { title: "Library", url: "/library", icon: BookOpen },
  { title: "Hostel", url: "/hostel", icon: Building2 },
  { title: "Transport", url: "/transport", icon: Bus },
  { title: "HR & Payroll", url: "/hr", icon: Briefcase },
  { title: "Staff", url: "/staff", icon: UserCog },
  { title: "Assignments", url: "/assignments", icon: NotebookPen },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Parent Portal", url: "/parents", icon: Heart },
];

const advanced = [
  { title: "Certificates", url: "/certificates", icon: Award },
  { title: "Chat Rooms", url: "/chat", icon: MessagesSquare },
  { title: "Live Classes", url: "/live", icon: Video },
  { title: "AI Assistant", url: "/ai", icon: Sparkles },
  { title: "Online Exams", url: "/online-exams", icon: FileSignature },
  { title: "Comms Hub", url: "/comms", icon: Megaphone },
  { title: "Placement Cell", url: "/placement", icon: Target },
  { title: "Leave Mgmt", url: "/leave", icon: CalendarClock },
  { title: "Events", url: "/events", icon: PartyPopper },
  { title: "Digital ID", url: "/id-cards", icon: IdCard },
  { title: "Promotion Engine", url: "/promotion", icon: ArrowUpCircle },
  { title: "Backups", url: "/backups", icon: DatabaseBackup },
  { title: "Automation", url: "/automation", icon: Workflow },
];

const system = [
  { title: "Migration Center", url: "/migration", icon: ArrowUpCircle },
  { title: "Security & Audit", url: "/security", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (p: string) => (p === "/" ? pathname === "/" : pathname.startsWith(p));

  const renderItem = (item: { title: string; url: string; icon: any }) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
        <NavLink to={item.url} className="flex items-center gap-3">
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="truncate">{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
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
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Core Modules</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{core.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Advanced</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{advanced.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>System</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{system.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
