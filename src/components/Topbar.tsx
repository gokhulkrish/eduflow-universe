import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, Moon, Sun, Command, Activity, LogOut, Maximize2, Minimize2 } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notifications } from "@/lib/mock-data";
import { useShell } from "@/stores/shell";
import { useActivityTrace } from "@/stores/activityTrace";
import { useTraceConfig } from "@/stores/traceConfig";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { getFocusRuntimeOptions, getFocusRuntimeSnapshot, summarizeFocusRuntime } from "@/lib/focus-runtime";
import { loadAccessibleModuleKeys } from "@/lib/module-access";
import { resolveAccessKeyForPathname } from "@/lib/global-access-registry";
import { subscribeAppSync } from "@/lib/app-sync";
import { toast } from "sonner";

export function Topbar() {
  const { theme, toggleTheme } = useShell();
  const focusMode = useShell((s) => s.focusMode);
  const setFocusMode = useShell((s) => s.setFocusMode);
  const dark = theme === "dark";
  const openTrace = useActivityTrace((s) => s.setOpen);
  const traceCount = useActivityTrace((s) => s.events.length);
  const traceCfg = useTraceConfig();
  const { user, roles, signOut } = useAuth();
  const nav = useNavigate();
  const primaryRole = roles[0] ?? "guest";
  const initials = (user?.email ?? "??").slice(0, 2).toUpperCase();
  const focusRuntime = getFocusRuntimeSnapshot(focusMode);
  const accessQuery = useQuery({
    queryKey: ["accessible-module-keys", "topbar"],
    queryFn: () => loadAccessibleModuleKeys(),
    staleTime: Infinity,
  });

  useEffect(() => {
    return subscribeAppSync(["sms.module-access.v1"], () => {
      void accessQuery.refetch();
    });
  }, [accessQuery.refetch]);

  const canShowShortcut = (path: string) => {
    const accessKey = resolveAccessKeyForPathname(path);
    if (!accessKey) return false;
    if (accessQuery.isLoading) return false;
    return accessQuery.data?.has(accessKey) ?? false;
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
      <SidebarTrigger className="rounded-lg md:h-6 md:w-6 md:rounded-md md:opacity-75 md:hover:opacity-100" />

      <div className="relative ml-2 hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="topbar-search"
          name="topbarSearch"
          placeholder="Search modules, pages, features…"
          className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9 pr-16 focus-visible:ring-primary/40 cursor-pointer"
          readOnly
          onClick={() => document.dispatchEvent(new CustomEvent("open-command-palette"))}
          onFocus={() => document.dispatchEvent(new CustomEvent("open-command-palette"))}
        />
        <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
          <Command className="h-3 w-3" /> K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {traceCfg.enabled && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openTrace(true)}
            className="relative rounded-xl"
            aria-label="Open activity trace"
            title="Activity Trace"
          >
            <Activity className="h-4 w-4" />
            {traceCfg.showBadge && traceCount > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">{traceCount}</span>
            )}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl"
              aria-label={`Focus mode: ${focusRuntime.label}`}
              title={`Focus mode: ${focusRuntime.label}`}
            >
              {focusRuntime.active ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="flex items-center justify-between gap-2">
              Focus mode
              <Badge variant="secondary" className="text-[10px]">{focusRuntime.label}</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {getFocusRuntimeOptions().map((runtime) => (
              <DropdownMenuItem
                key={runtime.mode}
                className="flex flex-col items-start gap-0.5 py-2.5"
                onClick={() => {
                  setFocusMode(runtime.mode);
                  toast.success(`${runtime.label} mode active`);
                }}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium">{runtime.label}</span>
                  <Badge variant="secondary" className="text-[10px]">{runtime.mode}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">{runtime.description}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <div className="px-2 py-2 text-xs text-muted-foreground">
              {summarizeFocusRuntime(focusMode)}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-xl"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl"
              aria-label="Open notifications"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2 w-2 animate-pulse-glow rounded-full bg-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications <Badge variant="secondary" className="text-[10px]">Live</Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map(n => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 py-2.5">
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-medium">{n.title}</span>
                  <span className="text-[10px] text-muted-foreground">{n.time}</span>
                </div>
                <span className="text-xs text-muted-foreground">{n.desc}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="ml-1 flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-2 py-1.5 backdrop-blur hover:bg-card">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-semibold leading-tight">{user?.email ?? "Guest"}</p>
                <p className="text-[10px] capitalize text-muted-foreground leading-tight">{primaryRole.replace("_"," ")}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Active session</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canShowShortcut("/permissions") && (
              <DropdownMenuItem onClick={() => nav("/permissions")}>Permission Matrix</DropdownMenuItem>
            )}
            {canShowShortcut("/settings/institute") && (
              <DropdownMenuItem onClick={() => nav("/settings/institute")}>Institute Settings</DropdownMenuItem>
            )}
            {(canShowShortcut("/permissions") || canShowShortcut("/settings/institute")) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={async () => { await signOut(); nav("/auth"); }} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
