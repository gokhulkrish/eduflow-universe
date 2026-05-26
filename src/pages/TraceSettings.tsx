import { useState } from "react";
import { Activity, Clock, Save, RotateCcw, Eye, ChevronsUpDown, User } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTraceConfig, type TraceConfig } from "@/stores/traceConfig";
import type { TraceCategory } from "@/stores/activityTrace";
import {
  getTraceProfiles,
  getActiveProfile,
  setActiveProfile,
  updateProfile,
  resetProfileToDefaults,
  profileToTraceConfig,
  type TraceProfileConfig,
} from "@/stores/traceProfiles";

const CATEGORY_LABELS: Record<TraceCategory, string> = {
  system: "System events",
  navigation: "Navigation events",
  action: "Action clicks",
  field: "Field changes",
  persistence: "Persistence writes",
  sync: "Sync pipeline",
  alert: "Alerts and failures",
};

const CATEGORY_DESCRIPTIONS: Record<TraceCategory, string> = {
  system: "Shell and core lifecycle events (startup, theme/viewport mode changes, major state transitions)",
  navigation: "Route changes, workspace and registry view switches, tab transitions",
  action: "Button/command triggers (Save, Import, Export, Run Diagnostics)",
  field: "Form edits, filter changes, important registry configuration edits",
  persistence: "Local DB writes (IndexedDB), column settings updates, header field changes",
  sync: "Sync queue enqueue/dequeue, background sync runs, conflicts in sync",
  alert: "Errors, warnings, failed syncs, failed saves, validation failures",
};

export default function TraceSettings() {
  const config = useTraceConfig();
  const [draft, setDraft] = useState<TraceConfig>({ ...config });

  const profiles = getTraceProfiles();
  const activeProfile = getActiveProfile();
  const [selectedProfileId, setSelectedProfileId] = useState(activeProfile?.id ?? "admin");

  const patch = (partial: Partial<TraceConfig>) => setDraft((prev) => ({ ...prev, ...partial }));

  const toggleCategory = (cat: TraceCategory, checked: boolean) => {
    patch({
      captureCategories: checked
        ? [...draft.captureCategories, cat]
        : draft.captureCategories.filter((c) => c !== cat),
    });
  };

  const loadProfile = (profileId: string) => {
    setSelectedProfileId(profileId);
    const profile = profiles.find((p) => p.id === profileId);
    if (profile) {
      setDraft({
        enabled: profile.enabled,
        startExpanded: profile.startExpanded,
        autoCollapse: profile.autoCollapse,
        showBadge: profile.showUnreadBadge,
        autoCollapseDelay: profile.autoCollapseDelayMs,
        maxEvents: profile.retainMaxEvents,
        captureCategories: [...profile.categories],
      });
    }
  };

  const handleSave = () => {
    updateProfile(selectedProfileId, {
      enabled: draft.enabled,
      startExpanded: draft.startExpanded,
      autoCollapse: draft.autoCollapse,
      showUnreadBadge: draft.showBadge,
      autoCollapseDelayMs: draft.autoCollapseDelay,
      retainMaxEvents: draft.maxEvents,
      categories: draft.captureCategories,
    });
    setActiveProfile(selectedProfileId);
    config.update(draft);
    toast.success("Startup & Trace settings saved");
  };

  const handleReset = () => {
    resetProfileToDefaults(selectedProfileId);
    const freshProfiles = getTraceProfiles();
    const freshProfile = freshProfiles.find((p) => p.id === selectedProfileId) ?? freshProfiles[0];
    setSelectedProfileId(freshProfile.id);
    setDraft({
      enabled: freshProfile.enabled,
      startExpanded: freshProfile.startExpanded,
      autoCollapse: freshProfile.autoCollapse,
      showBadge: freshProfile.showUnreadBadge,
      autoCollapseDelay: freshProfile.autoCollapseDelayMs,
      maxEvents: freshProfile.retainMaxEvents,
      captureCategories: [...freshProfile.categories],
    });
    config.update(profileToTraceConfig(freshProfile));
    toast.success(`"${freshProfile.label}" reset to defaults`);
  };

  return (
    <div>
      <PageHeader
        title="Startup & Trace"
        subtitle="Activity trace widget behavior, retention, and captured event categories"
        icon={<Activity className="h-6 w-6" />}
      />

      <div className="space-y-6">
        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Trace Profile</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Select a trace profile to pre-fill the settings below. Each role has a tuned level of detail.
              Changes are saved to the selected profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedProfileId} onValueChange={loadProfile}>
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Select a profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <div className="flex flex-col">
                      <span>{p.label}</span>
                      {p.description && (
                        <span className="text-xs text-muted-foreground">{p.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Activity Trace Widget Controls</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Customize how the live trace widget behaves
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trace-enabled" className="text-sm font-medium">Enable activity trace widget</Label>
                <p className="text-xs text-muted-foreground">Master toggle; when off, no events are recorded and the top-bar widget is hidden</p>
              </div>
              <Switch id="trace-enabled" checked={draft.enabled} onCheckedChange={(v) => patch({ enabled: v })} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trace-expanded" className="text-sm font-medium">Start expanded before collapsing</Label>
                <p className="text-xs text-muted-foreground">On first page load, the widget opens expanded, then auto-collapses after a delay</p>
              </div>
              <Switch id="trace-expanded" checked={draft.startExpanded} onCheckedChange={(v) => patch({ startExpanded: v })} disabled={!draft.enabled} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trace-auto-collapse" className="text-sm font-medium">Auto-collapse widget</Label>
                <p className="text-xs text-muted-foreground">Controls whether the widget auto-hides after the delay</p>
              </div>
              <Switch id="trace-auto-collapse" checked={draft.autoCollapse} onCheckedChange={(v) => patch({ autoCollapse: v })} disabled={!draft.enabled} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="trace-badge" className="text-sm font-medium">Show unread/count badge</Label>
                <p className="text-xs text-muted-foreground">When collapsed, shows a badge with the number of unseen events</p>
              </div>
              <Switch id="trace-badge" checked={draft.showBadge} onCheckedChange={(v) => patch({ showBadge: v })} disabled={!draft.enabled} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Timing & Retention</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Numeric settings for auto-collapse timing and maximum trace events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="trace-delay" className="text-sm font-medium">Auto-Collapse Delay (ms)</Label>
                <p className="text-xs text-muted-foreground">
                  Time before the widget collapses after startup or when reopened automatically.<br />
                  Example: 6000 ms = 6 seconds
                </p>
                <Input
                  id="trace-delay"
                  name="traceDelay"
                  type="number"
                  min={1000}
                  max={30000}
                  step={500}
                  value={draft.autoCollapseDelay}
                  onChange={(e) => patch({ autoCollapseDelay: Math.max(1000, Number(e.target.value)) })}
                  disabled={!draft.enabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trace-max" className="text-sm font-medium">Retain Max Trace Events</Label>
                <p className="text-xs text-muted-foreground">
                  Maximum events kept in the in-memory trace log.<br />
                  When the limit is reached, oldest events are dropped.
                </p>
                <Input
                  id="trace-max"
                  name="traceMax"
                  type="number"
                  min={50}
                  max={5000}
                  step={10}
                  value={draft.maxEvents}
                  onChange={(e) => patch({ maxEvents: Math.max(50, Number(e.target.value)) })}
                  disabled={!draft.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ChevronsUpDown className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm">Capture Categories</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Select which event categories the activity trace should capture
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["system", "navigation", "action", "field", "persistence", "sync", "alert"] as TraceCategory[]).map((cat) => (
                <label key={cat} className="flex items-start gap-3 rounded-lg border border-border/40 p-3 hover:bg-muted/40 cursor-pointer transition-colors">
                  <Checkbox
                    checked={draft.captureCategories.includes(cat)}
                    onCheckedChange={(v) => toggleCategory(cat, !!v)}
                    disabled={!draft.enabled}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{CATEGORY_LABELS[cat]}</p>
                    <p className="text-xs text-muted-foreground">{CATEGORY_DESCRIPTIONS[cat]}</p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/40 bg-card p-4">
          <Button onClick={handleSave} className="rounded-xl gap-2">
            <Save className="h-4 w-4" />
            Save Startup & Trace Settings
          </Button>
          <Button onClick={handleReset} variant="outline" className="rounded-xl gap-2">
            <RotateCcw className="h-4 w-4" />
            Reset Profile to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
