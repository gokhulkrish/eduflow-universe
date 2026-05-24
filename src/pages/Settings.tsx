import { useEffect, useState } from "react";
import { Settings2, Bell, Palette, Globe, Lock, Database, CreditCard, Mail, RefreshCw, Waves } from "lucide-react";
import { Link } from "react-router-dom";
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

export default function Settings() {
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

  return (
    <div>
      <PageHeader title="Settings" subtitle="System configuration" icon={<Settings2 className="h-6 w-6" />} />
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
                    <Switch onCheckedChange={(v) => toast.success(`${s.title}: ${v ? "Enabled" : "Disabled"}`)} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
