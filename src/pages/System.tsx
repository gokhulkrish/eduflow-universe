import { useState, useEffect } from "react";
import { Settings, Database, RefreshCw, Trash2, HardDrive, Clock, Wifi, Zap, Server, Shield } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function System() {
  const [tab, setTab] = useState("status");

  const [cacheKeys, setCacheKeys] = useState<string[]>([]);
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sms.")) keys.push(k);
    }
    setCacheKeys(keys);
  }, []);

  const clearCache = (key?: string) => {
    if (key) { localStorage.removeItem(key); toast.success(`Cleared ${key}`); } else {
      cacheKeys.forEach((k) => localStorage.removeItem(k));
      toast.success("Cleared all app cache");
    }
    setCacheKeys(key ? cacheKeys.filter((k) => k !== key) : []);
  };

  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const storageUsed = new Blob([JSON.stringify(localStorage)]).size;

  const systemInfo = [
    { label: "App Version", value: "2.0.0" },
    { label: "Build", value: import.meta.env.PROD ? "Production" : "Development" },
    { label: "Mode", value: import.meta.env.MODE },
    { label: "Base URL", value: import.meta.env.BASE_URL || "/" },
    { label: "Session Uptime", value: `${Math.floor(uptime / 60)}m ${uptime % 60}s` },
    { label: "LocalStorage Keys", value: String(localStorage.length) },
    { label: "LocalStorage Used", value: storageUsed > 1024 ? `${(storageUsed / 1024).toFixed(1)} KB` : `${storageUsed} B` },
  ];

  return (
    <div>
      <PageHeader title="System" subtitle="Status, cache & diagnostics" icon={<Settings className="h-6 w-6" />} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="status">System Status</TabsTrigger>
          <TabsTrigger value="cache">Cache Manager</TabsTrigger>
          <TabsTrigger value="diag">Diagnostics</TabsTrigger>
        </TabsList>
        <TabsContent value="status">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Server", value: "Online", icon: <Server className="h-5 w-5" />, color: "text-success" },
              { label: "Database", value: "Connected", icon: <Database className="h-5 w-5" />, color: "text-success" },
              { label: "Cache", value: `${cacheKeys.length} keys`, icon: <HardDrive className="h-5 w-5" />, color: "text-primary" },
              { label: "Uptime", value: `${Math.floor(uptime / 60)}m`, icon: <Clock className="h-5 w-5" />, color: "text-muted-foreground" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="py-6 text-center">
                  <div className={`${s.color} mb-2 flex justify-center`}>{s.icon}</div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-4">
            <CardHeader><CardTitle className="text-sm">System Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-2">
                {systemInfo.map((info) => (
                  <div key={info.label} className="flex justify-between py-1.5 border-b border-border/40 text-xs">
                    <span className="text-muted-foreground">{info.label}</span>
                    <span className="font-medium">{info.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cache">
          <div className="flex justify-end mb-4"><Button variant="destructive" size="sm" className="rounded-xl" onClick={() => clearCache()}><Trash2 className="h-4 w-4 mr-1" /> Clear All Cache</Button></div>
          <div className="space-y-1">
            {cacheKeys.length === 0 && <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No app cache entries</CardContent></Card>}
            {cacheKeys.map((k) => {
              const val = localStorage.getItem(k) || "";
              const size = new Blob([val]).size;
              return (
                <Card key={k} className="border-border/40">
                  <CardContent className="py-2 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono">{k}</code>
                        <Badge className="text-[9px] bg-muted text-muted-foreground">{size > 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{val.slice(0, 80)}{val.length > 80 ? "..." : ""}</p>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] shrink-0 ml-2" onClick={() => clearCache(k)}><Trash2 className="h-3 w-3" /></Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
        <TabsContent value="diag">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Wifi className="h-4 w-4" /> Network</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-xs">
                <p>Online: <Badge className="text-[9px] bg-success/15 text-success">{navigator.onLine ? "Yes" : "No"}</Badge></p>
                <p>User Agent: <span className="text-muted-foreground truncate block">{navigator.userAgent.slice(0, 100)}</span></p>
                <p>Language: {navigator.language}</p>
                <p>Platform: {navigator.platform}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4" /> Performance</CardTitle></CardHeader>
              <CardContent className="space-y-1 text-xs">
                <p>Memory: {"memory" in performance ? `${((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1)} MB / ${((performance as any).memory.jsHeapSizeLimit / 1048576).toFixed(1)} MB` : "N/A"}</p>
                <p>Page Load: {performance.getEntriesByType?.("navigation")?.[0] ? `${Math.round((performance.getEntriesByType("navigation")[0] as any).domContentLoadedEventEnd)} ms` : "N/A"}</p>
                <p>DOM Nodes: {document.querySelectorAll("*").length}</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
