import { useState } from "react";
import { Bell, Send, Inbox, Loader2, CheckCheck, MailOpen, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getMyNotifications, markAsRead, markAllAsRead, sendBroadcast, getUnreadCount } from "@/lib/notifications";

export default function Notifications() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("inbox");

  const { data: notifications, isLoading } = useQuery({ queryKey: ["notif-list"], queryFn: () => getMyNotifications() });
  const { data: unreadCount } = useQuery({ queryKey: ["notif-unread"], queryFn: getUnreadCount });

  // ── Broadcast Dialog ──
  const [bcOpen, setBcOpen] = useState(false);
  const [bcTitle, setBcTitle] = useState(""); const [bcBody, setBcBody] = useState(""); const [bcType, setBcType] = useState("alert"); const [bcTarget, setBcTarget] = useState("students"); const [bcCohort, setBcCohort] = useState("");

  const bcMut = useMutation({
    mutationFn: () => sendBroadcast(bcTitle, bcBody, bcType, bcTarget, bcCohort ? { grade: bcCohort } : undefined),
    onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["notif-list"] }); setBcOpen(false); toast.success(`Broadcast sent to ${res.count} recipients`); },
    onError: (e) => toast.error(e.message),
  });

  const markMut = useMutation({
    mutationFn: (id: string) => markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif-list"] }),
  });

  const markAllMut = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif-list"] }),
  });

  const unread = (notifications ?? []).filter((n) => !n.is_read);

  return (
    <div>
      <PageHeader title="Campus Notifications" subtitle="Inbox & broadcasts" icon={<Bell className="h-6 w-6" />} />

      <div className="flex items-center gap-4 mb-4">
        <Badge variant="default" className="text-xs">{unreadCount ?? 0} unread</Badge>
        <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs" onClick={() => markAllMut.mutate()} disabled={markAllMut.isPending || unread.length === 0}>
          <CheckCheck className="h-3 w-3 mr-1" /> Mark All Read
        </Button>
        <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow ml-auto" onClick={() => { setBcTitle(""); setBcBody(""); setBcType("alert"); setBcTarget("students"); setBcCohort(""); setBcOpen(true); }}>
          <Send className="h-4 w-4 mr-1" /> Broadcast
        </Button>
      </div>

      <div className="space-y-2">
        {(notifications ?? []).length === 0 && (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground"><Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />No notifications</CardContent></Card>
        )}
        {(notifications ?? []).map((n) => (
          <Card key={n.id} className={`border ${n.is_read ? "border-border/30" : "border-primary/20 bg-primary/[0.02]"}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${n.is_read ? "text-foreground" : "text-foreground"}`}>{n.title}</p>
                    {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{n.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="text-[9px] bg-muted text-muted-foreground">{n.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="sm" className="rounded-lg h-7 w-7 shrink-0" onClick={() => markMut.mutate(n.id)} disabled={markMut.isPending}>
                    <MailOpen className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ══════ BROADCAST DIALOG ══════ */}
      <Dialog open={bcOpen} onOpenChange={setBcOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Send Broadcast</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs" htmlFor="bcTitle">Title</Label><Input id="bcTitle" name="bcTitle" value={bcTitle} onChange={(e) => setBcTitle(e.target.value)} placeholder="e.g. Holiday Notice" /></div>
            <div><Label className="text-xs" htmlFor="bcBody">Message</Label><Textarea id="bcBody" name="bcBody" value={bcBody} onChange={(e) => setBcBody(e.target.value)} rows={4} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="bcType">Type</Label>
                <Select name="bcType" value={bcType} onValueChange={setBcType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alert">Alert</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="bcTarget">Target</Label>
                <Select name="bcTarget" value={bcTarget} onValueChange={setBcTarget}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="students">All Students</SelectItem>
                    <SelectItem value="staff">All Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {bcTarget === "students" && (
              <div><Label className="text-xs" htmlFor="bcCohort">Cohort filter (optional)</Label><Input id="bcCohort" name="bcCohort" value={bcCohort} onChange={(e) => setBcCohort(e.target.value)} placeholder="e.g. B.Com Sem 4" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBcOpen(false)}>Cancel</Button>
            <Button onClick={() => bcMut.mutate()} disabled={!bcTitle || !bcBody || bcMut.isPending}>
              {bcMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
