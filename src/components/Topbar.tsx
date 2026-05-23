import { Bell, Search, Moon, Sun, Command, Activity, LogOut } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
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
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function Topbar() {
  const { theme, toggleTheme } = useShell();
  const dark = theme === "dark";
  const openTrace = useActivityTrace((s) => s.setOpen);
  const traceCount = useActivityTrace((s) => s.events.length);
  const { user, roles, signOut } = useAuth();
  const nav = useNavigate();
  const primaryRole = roles[0] ?? "guest";
  const initials = (user?.email ?? "??").slice(0, 2).toUpperCase();

  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-4 backdrop-blur-xl">
      {/* Sidebar trigger moved into sidebar for both states; Topbar no longer renders it */}

      <div className="relative ml-2 hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students, classes, fees…"
          className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9 pr-16 focus-visible:ring-primary/40"
        />
        <kbd className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-border/60 bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline-flex">
          <Command className="h-3 w-3" /> K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => openTrace(true)} className="relative rounded-xl" title="Activity Trace">
          <Activity className="h-4 w-4" />
          {traceCount > 0 && (
            <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">{traceCount}</span>
          )}
        </Button>
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative rounded-xl">
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
            <DropdownMenuItem onClick={() => nav("/permissions")}>Permission Matrix</DropdownMenuItem>
            <DropdownMenuItem onClick={() => nav("/settings/institute")}>Institute Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={async () => { await signOut(); nav("/auth"); }} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
