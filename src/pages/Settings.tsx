import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Settings2, Bell, Palette, Globe, Lock, Database, CreditCard, Mail,
  RefreshCw, Waves, AlertTriangle, Activity, MessageSquare, SlidersHorizontal,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useShell } from "@/stores/shell";
import { getFocusModeRuntime, FOCUS_MODE_ORDER } from "@/lib/focus-mode";
import { buildFocusRuntimeBadges, buildFocusRuntimeBadgeClass, getFocusRuntimeSnapshot } from "@/lib/focus-runtime";
import { clearMobileShellRuntime, getMobileShellSnapshot, refreshMobileShellViewport } from "@/lib/mobile-shell";
import { buildMobileRuntimeBadgeClass, getMobileRuntimeSnapshot, subscribeMobileRuntime } from "@/lib/mobile-runtime";
import { toast } from "sonner";
import TraceSettings from "./TraceSettings";

const sections = [
  { title: "GCT Identity", desc: "Name, address, branding", icon: Globe, link: "/settings/institute" },
  { title: "Notifications", desc: "Email, SMS, push preferences", icon: Bell },
  { title: "Appearance", desc: "Theme, colors, logo", icon: Palette },
  { title: "Security", desc: "Password policies, 2FA", icon: Lock },
  { title: "Backups", desc: "Auto backup schedule", icon: Database },
  { title: "Payments", desc: "Fee gateway configuration", icon: CreditCard },
  { title: "Email", desc: "SMTP, templates", icon: Mail },
  { title: "Migration Controls", desc: "Feature flags and rollback gates", icon: Settings2, link: "/migration" },
];

interface TabDef { id: string; label: string; icon: typeof Activity; description: string; }

const TABS: TabDef[] = [
  { id: "general", label: "General", icon: SlidersHorizontal, description: "Focus mode, mobile stability, and quick settings" },
  { id: "trace", label: "Startup & Trace", icon: Activity, description: "Activity trace widget and event categories" },
  { id: "messaging", label: "Messaging", icon: MessageSquare, description: "Unified messaging surfaces control" },
];

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathTab = location.pathname === "/settings/trace" ? "trace" : location.pathname === "/settings/messaging" ? "messaging" : "general";
  const [tab, setTab] = useState(pathTab);

  useEffect(() => { setTab(pathTab); }, [pathTab]);

  const focusMode = useShell((s) => s.focusMode);
  const setFocusMode = useShell((s) => s.setFocusMode);
  const focusRuntime = getFocusModeRuntime(focusMode);
  const focusSystem = getFocusRuntimeSnapshot(focusMode);
  const focusBadges = buildFocusRuntimeBadges(focusMode);
  const [mobileRuntime, setMobileRuntime] = useState(() => getMobileRuntimeSnapshot(getMobileShellSnapshot()));

  useEffect(() => {
    const sync = () => setMobileRuntime(getMobileRuntimeSnapshot(getMobileShellSnapshot()));
    sync();
    return subscribeMobileRuntime(sync);
  }, []);

  const activeTab = TABS.find((t) => t.id === tab) ?? TABS[0];

  const switchTab = (id: string) => {
    setTab(id);
    if (id === "trace") navigate("/settings/trace", { replace: true });
    else if (id === "messaging") navigate("/settings/messaging", { replace: true });
    else navigate("/settings", { replace: true });
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration" icon={<Settings2 className="h-6 w-6" />} />

      <div className="flex gap-6">
        <div className="w-52 shrink-0 space-y-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  tab === t.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0">
                  <div className="truncate">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{t.description}</div>
                </div>
                {t.id === "trace" && (
                  <Badge variant="outline" className="ml-auto text-[9px] px-1 py-0 leading-tight text-muted-foreground">
                    dev
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          {tab === "trace" ? (
            <TraceSettings />
          ) : (
            <div>
              <Card className="mb-4 border-border/40 bg-gradient-to-br from-card via-card to-secondary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">Focus mode</CardTitle>
                      <p className="text-xs text-muted-foreground">Productivity presets for calmer workspaces and lower-noise sessions.</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {focusRuntime.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="max-w-2xl text-sm text-muted-foreground">{focusRuntime.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {focusBadges.map((badge) => (
                      <Badge key={badge.key} variant="secondary" className={buildFocusRuntimeBadgeClass(badge.tone)}>
                        {badge.label}: {badge.value}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {FOCUS_MODE_ORDER.map((mode) => {
                      const runtime = getFocusModeRuntime(mode);
                      const active = runtime.mode === focusMode;
                      return (
                        <Button
                          key={runtime.mode}
                          variant={active ? "default" : "outline"}
                          className="justify-between rounded-xl"
                          onClick={() => {
                            setFocusMode(runtime.mode);
                            toast.success(`${runtime.label} mode active`);
                          }}
                        >
                          <span>{runtime.label}</span>
                          <span className="text-[10px] uppercase tracking-wide opacity-80">{active ? "Active" : "Set"}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Reduced noise</p>
                      <p>{focusRuntime.reducedNoise ? "On" : "Off"}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Workspace minimization</p>
                      <p>{focusRuntime.workspaceMinimized ? "On" : "Off"}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Context compression</p>
                      <p>{focusRuntime.contextCompression ? "On" : "Off"}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{focusSystem.summary}</p>
                </CardContent>
              </Card>

              <Card className="mb-4 border-border/40 bg-gradient-to-br from-card via-card to-secondary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm">Mobile stability</CardTitle>
                      <p className="text-xs text-muted-foreground">Touch-aware viewport handling, scroll locks, and overflow protection.</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {mobileRuntime.isMobile ? "Mobile" : "Desktop"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="max-w-2xl text-sm text-muted-foreground">{mobileRuntime.summary}</p>
                  <div className="flex flex-wrap gap-2">
                    {mobileRuntime.badges.map((badge) => (
                      <Badge key={badge.key} variant="secondary" className={buildMobileRuntimeBadgeClass(badge.tone)}>
                        {badge.label}: {badge.value}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Touch capable</p>
                      <p>{mobileRuntime.touchCapable ? "Yes" : "No"}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Overflow lock</p>
                      <p>{mobileRuntime.overflowLocked ? "Active" : "Clear"}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Viewport band</p>
                      <p>{mobileRuntime.viewportBand}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        refreshMobileShellViewport();
                        setMobileRuntime(getMobileRuntimeSnapshot(getMobileShellSnapshot()));
                        toast.success("Mobile viewport refreshed");
                      }}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh viewport
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        clearMobileShellRuntime();
                        setMobileRuntime(getMobileRuntimeSnapshot(getMobileShellSnapshot()));
                        toast.success("Mobile runtime cleared");
                      }}
                    >
                      <Waves className="mr-2 h-4 w-4" />
                      Clear runtime
                    </Button>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Viewport</p>
                      <p className="font-mono text-xs">{mobileRuntime.viewportWidth} x {mobileRuntime.viewportHeight}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Scroll locks</p>
                      <p>{mobileRuntime.overlayLocks}</p>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                      <p className="font-medium text-foreground">Interaction</p>
                      <p>{mobileRuntime.interactionMode}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sections.map((s) => {
                  const Icon = s.icon;
                  return (
                    <Card key={s.title} className="border-border/40">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="h-4 w-4 text-primary" /></div>
                          <div><CardTitle className="text-sm">{s.title}</CardTitle><p className="text-[10px] text-muted-foreground">{s.desc}</p></div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {s.link ? (
                          <Button variant="outline" size="sm" className="rounded-lg w-full text-xs" asChild><Link to={s.link}>Configure</Link></Button>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Enable</span>
                            <Switch id={`setting-${s.title.toLowerCase().replace(/\s+/g, "-")}`} onCheckedChange={(v) => toast.success(`${s.title}: ${v ? "Enabled" : "Disabled"}`)} />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" />
                    <div>
                      <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
                      <p className="text-xs text-muted-foreground">
                        Permanently destroy all local student records, settings, headers, import batches, and ERP data.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => window.dispatchEvent(new CustomEvent("sms:open-destroy-modal"))}
                  >
                    Destroy Workspace
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
