import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { WorkspaceFab } from "./WorkspaceFab";
import { ActivityTraceDrawer } from "./ActivityTraceDrawer";
import { useShell } from "@/stores/shell";
import { cn } from "@/lib/utils";

export function AppLayout() {
  const focus = useShell((s) => s.focus);
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background mesh-bg">
        {!focus && <AppSidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          {!focus && <Topbar />}
          <main className={cn("flex-1 animate-fade-in", focus ? "p-4 md:p-8" : "p-4 md:p-6 lg:p-8")}>
            <Outlet />
          </main>
        </div>
        <WorkspaceFab />
        <ActivityTraceDrawer />
      </div>
    </SidebarProvider>
  );
}
