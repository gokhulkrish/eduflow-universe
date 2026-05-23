import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { WorkspaceFab } from "./WorkspaceFab";
import { ActivityTraceDrawer } from "./ActivityTraceDrawer";
import { SchemaHealthBanner } from "./SchemaHealthBanner";
import { SupabaseSchemaGate } from "./SupabaseSchemaGate";
import { useShell } from "@/stores/shell";
import { cn } from "@/lib/utils";
import { getShellRuntimeSnapshot, subscribeShellRuntime } from "@/lib/shell-runtime";

export function AppLayout() {
  const focus = useShell((s) => s.focus);
  const layoutMode = useShell((s) => s.layoutMode);

  useEffect(() => {
    const hydrate = () => useShell.getState().syncFromRuntime(getShellRuntimeSnapshot());
    hydrate();
    return subscribeShellRuntime(hydrate);
  }, []);

  return (
    <SupabaseSchemaGate>
      <SidebarProvider>
      <div
        data-app-shell="root"
        data-shell-mode={layoutMode}
        data-focus-mode={focus ? "on" : "off"}
        className="flex min-h-screen w-full bg-background mesh-bg"
      >
        {!focus && <AppSidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          {!focus && <Topbar />}
          <main className={cn("flex-1 animate-fade-in", focus ? "p-4 md:p-8" : "p-4 md:p-6 lg:p-8")}>
            <SchemaHealthBanner />
            <Outlet />
          </main>
        </div>
        <WorkspaceFab />
        <ActivityTraceDrawer />
      </div>
      </SidebarProvider>
    </SupabaseSchemaGate>
  );
}
