import { Plus, Activity, Maximize2, Minimize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useShell } from "@/stores/shell";
import { useActivityTrace } from "@/stores/activityTrace";
import { getFocusModeRuntime } from "@/lib/focus-mode";
import { toast } from "sonner";

export function WorkspaceFab() {
  const open = useShell((s) => s.fabOpen);
  const setOpen = useShell((s) => s.setFabOpen);
  const focusMode = useShell((s) => s.focusMode);
  const setFocusMode = useShell((s) => s.setFocusMode);
  const { setOpen: setTraceOpen, events } = useActivityTrace();
  const focusRuntime = getFocusModeRuntime(focusMode);

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
  ];

  return (
      <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="pointer-events-auto flex w-[min(18rem,calc(100vw-1.5rem))] flex-col gap-1.5 rounded-2xl border bg-popover/95 p-2 shadow-elegant backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
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
  );
}
