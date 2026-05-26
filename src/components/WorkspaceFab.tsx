import { Plus, Activity, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useShell } from "@/stores/shell";
import { useErpWorkspace } from "@/stores/erpWorkspace";
import { useActivityTrace } from "@/stores/activityTrace";
import { getFocusModeRuntime } from "@/lib/focus-mode";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export function WorkspaceFab() {
  const open = useShell((s) => s.fabOpen);
  const setOpen = useShell((s) => s.setFabOpen);
  const focusMode = useShell((s) => s.focusMode);
  const setFocusMode = useShell((s) => s.setFocusMode);
  const erpState = useErpWorkspace((s) => s.state);
  const setSidebarExpanded = useErpWorkspace((s) => s.setSidebarExpanded);
  const pinModule = useErpWorkspace((s) => s.pinModule);
  const unpinModule = useErpWorkspace((s) => s.unpinModule);
  const openLastWorkspace = useErpWorkspace((s) => s.openLastWorkspace);
  const returnToDashboard = useErpWorkspace((s) => s.returnToDashboard);
  const { setOpen: setTraceOpen, events } = useActivityTrace();
  const focusRuntime = getFocusModeRuntime(focusMode);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setOpen(false); }, [pathname, setOpen]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open, setOpen]);

  const items = [
    {
      label: "Activity Trace",
      meta: `${events.length} live events`,
      icon: Activity,
      onClick: () => { setTraceOpen(true); setOpen(false); },
      badge: events.length,
    },
    {
      label: focusRuntime.actionLabel,
      meta: focusRuntime.actionDescription,
      icon: focusRuntime.nextMode === "off" ? Maximize2 : Minimize2,
      onClick: () => {
        setFocusMode(focusRuntime.nextMode);
        setOpen(false);
        toast.success(
          focusRuntime.nextMode === "off" ? "Focus exited" : `${getFocusModeRuntime(focusRuntime.nextMode).label} active`,
        );
      },
      badge: focusRuntime.active ? focusRuntime.label : undefined,
    },
    {
      label: erpState.sidebarExpanded ? "Collapse sidebar" : "Expand sidebar",
      meta: erpState.sidebarExpanded ? "Reduce workspace chrome" : "Restore workspace chrome",
      icon: erpState.sidebarExpanded ? Minimize2 : Maximize2,
      onClick: () => {
        void setSidebarExpanded(!erpState.sidebarExpanded);
        setOpen(false);
      },
    },
    {
      label: erpState.pinnedModules.includes(erpState.activeModule) ? "Unpin module" : "Pin module",
      meta: erpState.activeModule ? `Current: ${erpState.activeModule}` : "Store the current ERP module",
      icon: Plus,
      onClick: () => {
        if (!erpState.activeModule) return;
        void (erpState.pinnedModules.includes(erpState.activeModule)
          ? unpinModule(erpState.activeModule)
          : pinModule(erpState.activeModule));
        setOpen(false);
      },
    },
    {
      label: "Open last workspace",
      meta: erpState.recentModules[0] ? `${erpState.recentModules[0]} was used most recently` : "Restore the last ERP entry",
      icon: Activity,
      onClick: async () => {
        const url = await openLastWorkspace();
        if (url) navigate(url);
        setOpen(false);
      },
    },
    {
      label: "Return to dashboard",
      meta: "Jump back to the command center",
      icon: X,
      onClick: async () => {
        await returnToDashboard();
        navigate("/");
        setOpen(false);
        toast.message("Returned to dashboard");
      },
    },
  ];

  return (
    <>
      <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div ref={panelRef} className="pointer-events-auto flex w-[min(17rem,calc(100vw-1rem))] flex-col gap-1.5 rounded-2xl border bg-popover/95 p-2 shadow-elegant backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 sm:w-[min(18rem,calc(100vw-1.5rem))]">
          {items.map((it) => (
            <button
              key={it.label}
              onClick={it.onClick}
              className="group flex items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-accent/10"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
                <it.icon className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{it.label}</span>
                <span className="truncate text-[11px] text-muted-foreground">{it.meta}</span>
              </span>
              {typeof it.badge === "number" && it.badge > 0 && (
                <Badge variant="secondary" className="bg-primary/15 text-primary">{it.badge}</Badge>
              )}
            </button>
          ))}
        </div>
      )}

      <Button
        ref={toggleRef}
        size="icon"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Workspace actions"
        className={cn(
          "pointer-events-auto h-14 w-14 rounded-full bg-gradient-primary shadow-glow transition-transform hover:scale-105",
          open && "rotate-45"
        )}
      >
        {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </Button>
    </div>
    </>
  );
}
