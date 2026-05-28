import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Pin, History, Sidebar, RotateCcw, ChevronRight,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useErpWorkspace } from "@/stores/erpWorkspace";
import {
  buildErpModuleDefinitions,
  resolveErpModuleRoute,
  type ErpModuleDefinition,
} from "@/lib/erp-workspace";

export default function WorkspaceControlSettings() {
  const navigate = useNavigate();
  const store = useErpWorkspace();
  const { state, setSidebarExpanded, syncState, clearLocalState } = store;
  const [defs, setDefs] = useState<ErpModuleDefinition[]>(() => buildErpModuleDefinitions());

  useEffect(() => {
    setDefs(buildErpModuleDefinitions());
  }, []);

  const activeDef = defs.find((d) => d.key === state.activeModule);

  const handleNavigateModule = (key: string) => {
    const route = resolveErpModuleRoute(key);
    if (route) navigate(route);
  };

  const handleUnpin = (key: string) => {
    const next = state.pinnedModules.filter((k) => k !== key);
    syncState({ pinnedModules: next });
    toast.success(`"${key}" unpinned`);
  };

  const handleClearRecent = () => {
    syncState({ recentModules: [] });
    toast.success("Recent workspace history cleared");
  };

  const handleReset = () => {
    clearLocalState();
    toast.success("Workspace state reset to defaults");
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/40 bg-gradient-to-br from-card via-card to-secondary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><LayoutDashboard className="h-4 w-4 text-primary" /></div>
            <div>
              <CardTitle className="text-sm">Workspace Controls</CardTitle>
              <p className="text-[10px] text-muted-foreground">Sidebar, pinned modules, recent workspace history</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sidebar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Sidebar</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sidebar expanded</p>
              <p className="text-xs text-muted-foreground">Show the navigation sidebar by default</p>
            </div>
            <Switch
              checked={state.sidebarExpanded}
              onCheckedChange={(v) => {
                setSidebarExpanded(v);
                toast.success(`Sidebar ${v ? "expanded" : "collapsed"}`);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Pinned Modules</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {state.pinnedModules.length === 0 ? (
            <p className="text-xs text-muted-foreground">No modules pinned. Use the FAB to pin modules for quick access.</p>
          ) : (
            <div className="space-y-1">
              {state.pinnedModules.map((key) => {
                const def = defs.find((d) => d.key === key);
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{def?.label ?? key}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight text-muted-foreground">{key}</Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleNavigateModule(key)} title="Open module">
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleUnpin(key)} title="Unpin">
                        <Pin className="h-3 w-3 rotate-45" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <p className="mt-2 text-[10px] text-muted-foreground">{state.pinnedModules.length} / unlimited pinned</p>
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm">Recent Workspaces</CardTitle>
            </div>
            {state.recentModules.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={handleClearRecent}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {state.recentModules.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent workspace history.</p>
          ) : (
            <div className="space-y-1">
              {state.recentModules.map((key) => {
                const def = defs.find((d) => d.key === key);
                return (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{def?.label ?? key}</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight text-muted-foreground">{key}</Badge>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleNavigateModule(key)} title="Open">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Active Module</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{activeDef?.label ?? state.activeModule}</span>
              <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight text-muted-foreground">{state.activeWorkspaceKey}</Badge>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleNavigateModule(state.activeModule)}>
              Open
            </Button>
          </div>
          {state.lastOpenedAt && (
            <p className="mt-1 text-[10px] text-muted-foreground">Last opened: {new Date(state.lastOpenedAt).toLocaleString()}</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div>
              <h3 className="text-sm font-semibold text-destructive">Reset Workspace</h3>
              <p className="text-xs text-muted-foreground">Clear all workspace state (pins, history, active module) and restore defaults.</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="shrink-0" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
