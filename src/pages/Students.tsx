import { Users, Search, Plus, Filter, Download, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/PageHeader";
import { students } from "@/lib/mock-data";

const feeColor: Record<string, string> = {
  Paid: "bg-success/15 text-success border-success/30",
  Pending: "bg-warning/15 text-warning border-warning/30",
  Overdue: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Students() {
  return (
    <div>
      <PageHeader
        title="Student Management"
        subtitle="2,847 active learners · live sync · RBAC controlled"
        icon={<Users className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl"><Download className="mr-2 h-4 w-4" />Export</Button>
            <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90"><Plus className="mr-2 h-4 w-4" />New Student</Button>
          </>
        }
      />

      <Card className="glass p-4">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name, ID, grade…" className="h-10 rounded-xl border-border/60 bg-secondary/60 pl-9" />
          </div>
          <Button variant="outline" className="rounded-xl"><Filter className="mr-2 h-4 w-4" />Filters</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3 pl-2">Student</th>
                <th className="py-3">ID</th>
                <th className="py-3">Grade</th>
                <th className="py-3">Roll</th>
                <th className="py-3">Attendance</th>
                <th className="py-3">Fees</th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => (
                <tr key={s.id} className="border-b border-border/40 transition-colors hover:bg-secondary/40 animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="py-3 pl-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">{s.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                  <td className="py-3"><Badge variant="secondary">{s.grade}</Badge></td>
                  <td className="py-3">{s.roll}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${s.attendance}%` }} />
                      </div>
                      <span className="text-xs font-medium">{s.attendance}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-medium ${feeColor[s.fees]}`}>{s.fees}</span>
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
