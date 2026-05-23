import { Shield, Search, Clock, Ban, UserCheck } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const auditLog = [
  { id: 1, user: "Admin", action: "Login", resource: "Auth", ip: "192.168.1.1", time: new Date().toISOString(), status: "success" },
  { id: 2, user: "Admin", action: "Create Student", resource: "Students", ip: "192.168.1.1", time: new Date(Date.now() - 3600000).toISOString(), status: "success" },
  { id: 3, user: "Teacher1", action: "Update Marks", resource: "Exams", ip: "192.168.1.2", time: new Date(Date.now() - 7200000).toISOString(), status: "blocked" },
  { id: 4, user: "Staff1", action: "Export Report", resource: "Reports", ip: "192.168.1.3", time: new Date(Date.now() - 10800000).toISOString(), status: "success" },
  { id: 5, user: "Unknown", action: "Failed Login", resource: "Auth", ip: "10.0.0.99", time: new Date(Date.now() - 14400000).toISOString(), status: "blocked" },
];

export default function SecurityAudit() {
  return (
    <div>
      <PageHeader title="Security & Audit" subtitle="Access logs & security monitoring" icon={<Shield className="h-6 w-6" />} />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Total Actions</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{auditLog.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Blocked Attempts</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-destructive">{auditLog.filter((a) => a.status === "blocked").length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Unique Users</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{new Set(auditLog.map((a) => a.user)).size}</p></CardContent></Card>
      </div>
      <Table>
      <TableHeader className="">
        <TableRow>
          <TableHead className="text-xs">User</TableHead>
          <TableHead className="text-xs">Action</TableHead>
          <TableHead className="text-xs">Resource</TableHead>
          <TableHead className="text-xs">IP</TableHead>
          <TableHead className="text-xs">Time</TableHead>
          <TableHead className="text-xs">Status</TableHead>
        </TableRow>
      </TableHeader>
        <TableBody>
          {auditLog.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="text-xs">{a.user}</TableCell>
              <TableCell className="text-xs">{a.action}</TableCell>
              <TableCell className="text-xs">{a.resource}</TableCell>
              <TableCell className="text-xs font-mono">{a.ip}</TableCell>
              <TableCell className="text-xs">{new Date(a.time).toLocaleString()}</TableCell>
              <TableCell>
                <Badge className={`text-[9px] ${a.status === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{a.status}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Card className="mt-6">
        <CardHeader><CardTitle className="text-sm">Security Actions</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => toast.success("Session audit complete")}><Search className="h-4 w-4 mr-2" /> Active Sessions</Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => toast.success("2FA policy updated")}><UserCheck className="h-4 w-4 mr-2" /> 2FA Policy</Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => toast.success("IPs blocked")}><Ban className="h-4 w-4 mr-2" /> Block IPs</Button>
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => toast.success("Logs rotated")}><Clock className="h-4 w-4 mr-2" /> Rotate Logs</Button>
        </CardContent>
      </Card>
    </div>
  );
}
