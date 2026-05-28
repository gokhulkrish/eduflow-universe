import { useEffect, useState, useCallback } from "react";
import { ClipboardList, RefreshCw, Filter } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getMessageLogs } from "../../core/comms/service";
import type { MessageLog, MessageType } from "../../core/comms/service";

const STATUS_BADGE: Record<string, string> = {
  queued: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  sent: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-destructive/15 text-destructive",
  bounced: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  processing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  acknowledged: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
};

const CHANNEL_BADGE = {
  sms: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  email: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  push: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  notice: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

export default function CommsLogs() {
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<MessageType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMessageLogs({
        channel: channelFilter !== "all" ? channelFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [channelFilter, statusFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  return (
    <div>
      <PageHeader title="Message Logs" subtitle="View sent & queued message delivery status" icon={<ClipboardList className="h-6 w-6" />} />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={channelFilter} onValueChange={(v) => setChannelFilter(v as any)}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="push">Push</SelectItem>
              <SelectItem value="notice">Notice</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="bounced">Bounced</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="acknowledged">Acknowledged</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" className="rounded-xl h-8" onClick={loadLogs}><RefreshCw className="h-3 w-3 mr-1" /> Refresh</Button>
        <span className="text-xs text-muted-foreground ml-auto">{logs.length} log entries</span>
      </div>

      <Card className="border-border/40">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No log entries found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30">
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">Channel</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">To</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">Status</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">Error</th>
                    <th className="text-left font-medium text-muted-foreground px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/20 hover:bg-muted/20">
                      <td className="px-3 py-2">
                        <Badge className={`text-[9px] ${CHANNEL_BADGE[log.channel] ?? ""}`}>{log.channel}</Badge>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] max-w-[200px] truncate">{log.to_address}</td>
                      <td className="px-3 py-2">
                        <Badge className={`text-[9px] ${STATUS_BADGE[log.status] ?? "bg-muted text-muted-foreground"}`}>{log.status}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{log.error_message ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
