import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, Pencil, Printer, Download, BarChart3, RotateCcw,
  Shield, AlertTriangle, Lock, Users, GraduationCap, User,
} from "lucide-react";
import { toast } from "sonner";
import {
  loadCapabilityProfiles,
  saveCapabilityProfiles,
  resetCapabilityProfiles,
  diagnoseProfiles,
  resolveModuleLabel,
  CAPABILITY_KEYS,
  CAPABILITY_LABELS,
  type CapabilityKey,
  type ProfileCapabilities,
  type ProfileId,
} from "@/lib/capability-profiles";

const PROFILE_ICONS: Record<string, typeof Shield> = {
  admin: Shield,
  office: Users,
  teacher: GraduationCap,
  viewer: User,
};

const CAP_ICONS: Record<CapabilityKey, typeof Eye> = {
  view: Eye,
  edit: Pencil,
  print: Printer,
  export: Download,
  report: BarChart3,
};

export default function CapabilityProfilesPage() {
  const [profiles, setProfiles] = useState<ProfileCapabilities[]>(() => loadCapabilityProfiles());
  const [selectedId, setSelectedId] = useState<ProfileId>("admin");

  const selected = profiles.find((p) => p.id === selectedId);
  const warnings = useMemo(() => diagnoseProfiles(profiles), [profiles]);

  const persist = (next: ProfileCapabilities[]) => {
    setProfiles(next);
    saveCapabilityProfiles(next);
  };

  const toggleCapability = (moduleKey: string, cap: CapabilityKey) => {
    if (!selected || selected.isSystem) return;
    const next = profiles.map((p) => {
      if (p.id !== selected.id) return p;
      return {
        ...p,
        modules: p.modules.map((m) =>
          m.module === moduleKey
            ? { ...m, capabilities: { ...m.capabilities, [cap]: !m.capabilities[cap] } }
            : m,
        ),
      };
    });
    persist(next);
  };

  const setView = (moduleKey: string) => {
    if (!selected || selected.isSystem) return;
    const m = selected.modules.find((x) => x.module === moduleKey);
    if (!m) return;
    const allOn = !m.capabilities.view;
    const next = profiles.map((p) => {
      if (p.id !== selected.id) return p;
      return {
        ...p,
        modules: p.modules.map((mod) =>
          mod.module === moduleKey
            ? { ...mod, capabilities: Object.fromEntries(CAPABILITY_KEYS.map((k) => [k, k === "view" ? allOn : mod.capabilities[k]])) as typeof mod.capabilities }
            : mod,
        ),
      };
    });
    persist(next);
  };

  const handleReset = () => {
    persist(resetCapabilityProfiles());
    toast.success("Profiles reset to defaults");
  };

  const ProfileIcon = selected ? PROFILE_ICONS[selected.id] ?? Shield : Shield;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Profiles & Capability Matrix</h2>
          <p className="text-xs text-muted-foreground">
            Configure view, edit, print, export, and report permissions per profile per module
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleReset}>
          <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
        </Button>
      </div>

      {warnings.length > 0 && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-950/20">
          <CardContent className="p-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> {warnings.length} profile warning{warnings.length > 1 ? "s" : ""}
            </div>
            {warnings.map((w, i) => (
              <p key={i} className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
                <span className="font-medium">{w.profileLabel}:</span> {w.message}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-6">
        <div className="w-52 shrink-0 space-y-1">
          {profiles.map((p) => {
            const Icon = PROFILE_ICONS[p.id] ?? Shield;
            const profileWarnings = warnings.filter((w) => w.profileId === p.id);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  selectedId === p.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="truncate flex items-center gap-1.5">
                    {p.label}
                    {p.isSystem && <Lock className="h-3 w-3 text-muted-foreground/50" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{p.description}</div>
                </div>
                {profileWarnings.length > 0 && (
                  <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 min-w-0">
          {selected && (
            <Card className="border-border/40 capability-matrix-header">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ProfileIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      {selected.label}
                      {selected.isSystem ? (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight capability-system-badge is-locked">
                          <Lock className="h-2.5 w-2.5 mr-0.5" /> System
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight capability-system-badge is-custom">
                          Custom
                        </Badge>
                      )}
                    </CardTitle>
                    {selected.description && (
                      <p className="text-[10px] text-muted-foreground">{selected.description}</p>
                    )}
                    {selected.isSystem && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        System profiles use pre-configured defaults. To customize, create a derived profile.
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border/40">
                        <th className="text-left font-medium text-muted-foreground py-2 pr-4 w-48">Module</th>
                        {CAPABILITY_KEYS.map((cap) => {
                          const CapIcon = CAP_ICONS[cap];
                          return (
                            <th key={cap} className="text-center font-medium text-muted-foreground py-2 px-2 min-w-[72px]">
                              <div className="flex flex-col items-center gap-0.5">
                                <CapIcon className="h-3.5 w-3.5" />
                                <span>{CAPABILITY_LABELS[cap]}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {selected.modules.map((mod) => (
                        <tr key={mod.module} className="capability-matrix-row border-b border-border/20 hover:bg-muted/30 transition-colors">
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{resolveModuleLabel(mod.module)}</span>
                              <span className="text-[9px] text-muted-foreground/50">{mod.module}</span>
                            </div>
                          </td>
                          {CAPABILITY_KEYS.map((cap) => {
                            const enabled = mod.capabilities[cap];
                            const isView = cap === "view";
                            return (
                              <td key={cap} className="text-center py-2 px-2 capability-cell">
                                {isView ? (
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={enabled}
                                      onChange={() => selected.isSystem ? null : setView(mod.module)}
                                      className="sr-only peer"
                                      disabled={selected.isSystem}
                                    />
                                    <div className="w-8 h-4 bg-muted rounded-full peer peer-checked:bg-primary peer-disabled:opacity-40 peer-checked:peer-disabled:bg-primary/40 after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-background after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full" />
                                  </label>
                                ) : (
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={enabled}
                                      onChange={() => toggleCapability(mod.module, cap)}
                                      className="sr-only peer"
                                      disabled={selected.isSystem}
                                    />
                                    <div className="w-8 h-4 bg-muted rounded-full peer peer-checked:bg-primary peer-disabled:opacity-40 peer-checked:peer-disabled:bg-primary/40 after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-background after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-full" />
                                  </label>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
