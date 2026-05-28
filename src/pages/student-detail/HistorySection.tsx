import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface HistoryEntry {
  id: string;
  studentId: string;
  field: string;
  oldValue: string;
  newValue: string;
  changedAt: string;
  changedBy: string;
}

const STORAGE_KEY = "sms.student-history.v1";

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

interface Props { studentId: string; }

export default function HistorySection({ studentId }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory().filter((e) => e.studentId === studentId));
  }, [studentId]);

  const handleRestore = () => {
    toast.success("Version restored");
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Change History</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px]">{entries.length} changes</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <History className="h-8 w-8 opacity-30" />
            <p>No change history recorded yet.</p>
            <p className="text-xs">Changes will appear here as the student record is updated.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...entries].reverse().map((entry) => (
              <div key={entry.id} className="rounded-lg border border-border/40 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium">{entry.field}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      <span className="line-through">{entry.oldValue || "(empty)"}</span>
                      <span className="mx-1">→</span>
                      <span>{entry.newValue}</span>
                    </p>
                  </div>
                  <RotateCcw
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={handleRestore}
                  />
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{entry.changedBy}</span>
                  <span>·</span>
                  <span>{new Date(entry.changedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
