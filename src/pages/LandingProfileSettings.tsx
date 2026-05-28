import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { APP_ACCESS_RULES } from "@/lib/global-access-registry";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RotateCcw, Navigation } from "lucide-react";
import { toast } from "sonner";
import {
  loadLandingProfiles,
  saveLandingProfiles,
  resetLandingProfiles,
  type LandingProfileEntry,
} from "@/stores/landingProfiles";

const ROUTE_OPTIONS = APP_ACCESS_RULES
  .filter((r) => r.path && r.path !== "/")
  .map((r) => r.path!)
  .sort();

const ALL_ROUTES = Array.from(new Set(["/", ...ROUTE_OPTIONS])).sort();

export default function LandingProfileSettings() {
  const { roles } = useAuth();
  const [profiles, setProfiles] = useState<LandingProfileEntry[]>(() => loadLandingProfiles());

  const currentRole = roles[0] ?? null;
  const currentProfile = profiles.find((p) => p.role === currentRole);

  const updateProfile = (role: string, targetPath: string) => {
    const next = profiles.map((p) => p.role === role ? { ...p, targetPath } : p);
    setProfiles(next);
    saveLandingProfiles(next);
    toast.success(`Landing page updated for ${role}`);
  };

  const handleReset = () => {
    setProfiles(resetLandingProfiles());
    toast.success("All landing profiles reset to defaults");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-gradient-to-br from-card via-card to-secondary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Navigation className="h-4 w-4 text-primary" /></div>
            <div>
              <CardTitle className="text-sm">Landing Profiles</CardTitle>
              <p className="text-[10px] text-muted-foreground">
                Configure which page each role lands on after login. Your role: <Badge variant="outline" className="text-[9px] ml-1">{currentRole ?? "—"}</Badge>
              </p>
            </div>
          </div>
        </CardHeader>
        {currentProfile && (
          <CardContent className="pt-0">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              <span className="font-medium text-foreground">Currently active: </span>
              <span className="text-muted-foreground">{currentProfile.targetPath}</span>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Per-Role Landing Pages</CardTitle>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={handleReset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset all
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {profiles.map((p) => (
              <div key={p.role} className="flex items-center gap-3 rounded-lg border border-border/40 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{p.label}</span>
                    <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight text-muted-foreground">{p.role}</Badge>
                    {p.role === currentRole && <Badge className="text-[9px] px-1 py-0 leading-tight">you</Badge>}
                  </div>
                </div>
                <Select value={p.targetPath} onValueChange={(v) => updateProfile(p.role, v)}>
                  <SelectTrigger className="w-52 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ALL_ROUTES.map((path) => (
                      <SelectItem key={path} value={path}>{path === "/" ? "Dashboard (Home)" : path}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
