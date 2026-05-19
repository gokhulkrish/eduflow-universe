import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActivityTrace, type TraceCategory } from "@/stores/activityTrace";
import { Download, Trash2, Activity } from "lucide-react";

const categoryStyles: Record<TraceCategory, string> = {
  system: "bg-muted text-muted-foreground",
  navigation: "bg-info/15 text-info",
  action: "bg-primary/15 text-primary",
  field: "bg-accent/15 text-accent-foreground",
  persistence: "bg-secondary text-secondary-foreground",
  sync: "bg-success/15 text-success",
  alert: "bg-warning/15 text-warning",
};

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function ActivityTraceDrawer() {
  const { events, open, setOpen, filter, setFilter, query, setQuery, clear } = useActivityTrace();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (filter !== "all" && e.category !== filter) return false;
      if (!q) return true;
      return [e.title, e.detail, e.source, e.section].filter(Boolean).some((s) => s!.toLowerCase().includes(q));
    });
  }, [events, filter, query]);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-trace-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 font-display">
            <Activity className="h-4 w-4 text-primary" /> Activity Trace
          </SheetTitle>
          <p className="text-xs text-muted-foreground">Live system trail · {events.length} events captured</p>
        </SheetHeader>

        <div className="space-y-3 border-b px-5 py-3">
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as TraceCategory | "all")}>
              <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="navigation">Navigation</SelectItem>
                <SelectItem value="action">Actions</SelectItem>
                <SelectItem value="field">Field Changes</SelectItem>
                <SelectItem value="persistence">Persistence</SelectItem>
                <SelectItem value="sync">Sync</SelectItem>
                <SelectItem value="alert">Alerts</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={exportJson} className="h-9">
              <Download className="h-3.5 w-3.5" />
            </Button>
            <Button variant="outline" size="sm" onClick={clear} className="h-9">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, detail, section, or source"
            className="h-9"
          />
        </div>

        <ScrollArea className="flex-1">
          <ul className="divide-y">
            {filtered.length === 0 && (
              <li className="px-5 py-12 text-center text-sm text-muted-foreground">No trace events match.</li>
            )}
            {filtered.map((e) => (
              <li key={e.id} className="px-5 py-3 hover:bg-muted/40">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Badge variant="secondary" className={categoryStyles[e.category]}>{e.category}</Badge>
                  <span className="font-mono text-[10px] text-muted-foreground">{fmtTime(e.ts)}</span>
                </div>
                <p className="text-sm font-medium leading-snug">{e.title}</p>
                {e.detail && <p className="mt-0.5 text-xs text-muted-foreground">{e.detail}</p>}
                {(e.source || e.section) && (
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {e.source && <>src: {e.source}</>}{e.source && e.section && " · "}{e.section && <>at: {e.section}</>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
