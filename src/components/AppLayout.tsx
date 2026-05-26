import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { WorkspaceFab } from "./WorkspaceFab";
import { ActivityTraceDrawer } from "./ActivityTraceDrawer";
import { FlashNewsBar } from "./FlashNewsBar";
import { useFlashNews } from "@/stores/flashNews";
import { SchemaHealthBanner } from "./SchemaHealthBanner";
import { CommandPalette } from "./CommandPalette";
import { SupabaseSchemaGate } from "./SupabaseSchemaGate";
import { DestroyWorkspaceDialog } from "@/components/registry/DestroyWorkspaceDialog";
import { RouteAccessGate } from "./RouteAccessGate";
import { useShell } from "@/stores/shell";
import { useErpWorkspace } from "@/stores/erpWorkspace";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { getShellRuntimeSnapshot, subscribeShellRuntime } from "@/lib/shell-runtime";
import { getFocusRuntimeSnapshot } from "@/lib/focus-runtime";

export function AppLayout() {
  const focusMode = useShell((s) => s.focusMode);
  const layoutMode = useShell((s) => s.layoutMode);
  const flashPosition = useFlashNews((s) => s.settings.position);
  const sidebarExpanded = useErpWorkspace((s) => s.state.sidebarExpanded);
  const setSidebarExpanded = useErpWorkspace((s) => s.setSidebarExpanded);
  const hydrateErpWorkspace = useErpWorkspace((s) => s.hydrate);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const focusRuntime = getFocusRuntimeSnapshot(focusMode);
  const focus = focusMode !== "off";
  const mainPadding = isMobile
    ? focusMode === "deep"
      ? "p-3 md:p-4"
      : "p-3 md:p-5"
    : focusMode === "deep"
      ? "p-3 md:p-5 lg:p-6"
      : focus
        ? "p-4 md:p-8"
        : "p-4 md:p-6 lg:p-8";

  useEffect(() => {
    const hydrate = () => useShell.getState().syncFromRuntime(getShellRuntimeSnapshot());
    hydrate();
    return subscribeShellRuntime(hydrate);
  }, []);

  useEffect(() => {
    void hydrateErpWorkspace();
  }, [hydrateErpWorkspace, user?.id]);

  return (
    <SupabaseSchemaGate>
      <SidebarProvider open={sidebarExpanded} onOpenChange={(open) => { void setSidebarExpanded(open); }}>
      <div
        data-app-shell="root"
        data-shell-mode={layoutMode}
        data-mobile-shell={isMobile ? "on" : "off"}
        data-focus-mode={focusMode}
        data-focus-density={focusMode === "deep" ? "compressed" : focus ? "balanced" : "full"}
        data-focus-noise={focusRuntime.noiseState}
        data-focus-workspace={focusRuntime.density}
        data-focus-context={focusRuntime.contextCompression ? "compressed" : "open"}
        className="flex min-h-[100dvh] w-full bg-background mesh-bg"
      >
        {!focus && <AppSidebar />}
        <div className="flex min-w-0 flex-1 flex-col">
          {!focus && <Topbar />}
          {!focus && flashPosition === "top" && <FlashNewsBar />}
          <main className={cn("mobile-collision-surface flex-1 animate-fade-in", mainPadding)}>
            <SchemaHealthBanner />
            <RouteAccessGate>
              <Outlet />
            </RouteAccessGate>
          </main>
          {!focus && flashPosition === "bottom" && <FlashNewsBar />}
        </div>
        <DestroyWorkspaceDialog />
        <CommandPalette />
        <WorkspaceFab />
        <ActivityTraceDrawer />
      </div>
      </SidebarProvider>
    </SupabaseSchemaGate>
  );
}
