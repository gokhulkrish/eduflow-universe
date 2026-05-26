import { useState } from "react";
import { Activity, Clock, Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SAMPLE = [
  { id: 1, user: "Admin", action: "Login", resource: "Auth", detail: "IP: 192.168.1.1", time: new Date().toISOString(), status: "success" },
  { id: 2, user: "Admin", action: "Create Student", resource: "Students", detail: "Added John Doe", time: new Date(Date.now() - 600000).toISOString(), status: "success" },
  { id: 3, user: "Teacher1", action: "Update Marks", resource: "Exams", detail: "Grade 10-A", time: new Date(Date.now() - 1200000).toISOString(), status: "success" },
  { id: 4, user: "Staff1", action: "Export", resource: "Reports", detail: "Fee report", time: new Date(Date.now() - 1800000).toISOString(), status: "blocked" },
  { id: 5, user: "System", action: "Backup", resource: "Database", detail: "Auto backup", time: new Date(Date.now() - 3600000).toISOString(), status: "success" },
];

export default function ActivityLog() {
  const [search, setSearch] = useState("");
  const filtered = SAMPLE.filter((a) => !search || a.user.toLowerCase().includes(search.toLowerCase()) || a.action.toLowerCase().includes(search.toLowerCase()) || a.resource.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Activity Log" subtitle="System-wide audit trail" icon={<Activity className="h-6 w-6" />} />
      <div className="relative mb-4"><Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input id="search-activity" name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search activity..." className="pl-9 h-9 text-xs" /></div>
      <Table>
        <TableHeader className=""><TableRow><TableHead className="text-xs">User</TableHead><TableHead className="text-xs">Action</TableHead><TableHead className="text-xs">Resource</TableHead><TableHead className="text-xs">Detail</TableHead><TableHead className="text-xs">Time</TableHead><TableHead className="text-xs">Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {filtered.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="text-xs">{a.user}</TableCell>
              <TableCell className="text-xs">{a.action}</TableCell>
              <TableCell className="text-xs">{a.resource}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{a.detail}</TableCell>
              <TableCell className="text-xs">{new Date(a.time).toLocaleString()}</TableCell>
              <TableCell><Badge className={`text-[9px] ${a.status === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>{a.status}</Badge></TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No matching activity</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );
}
