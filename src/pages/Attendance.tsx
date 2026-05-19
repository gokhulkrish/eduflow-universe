import { useState } from "react";
import { ClipboardCheck, Users, Check, X, Clock, CalendarDays, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/PageHeader";
import { students } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Status = "present" | "absent" | "late";
const next: Record<Status, Status> = { present: "absent", absent: "late", late: "present" };

const styles: Record<Status, string> = {
  present: "bg-success/15 text-success border-success/30",
  absent: "bg-destructive/15 text-destructive border-destructive/30",
  late: "bg-warning/15 text-warning border-warning/30",
};

export default function Attendance() {
  const [grade, setGrade] = useState("10-A");
  const [period, setPeriod] = useState("P1 · 09:00–09:45");
  const [marks, setMarks] = useState<Record<string, Status>>(() =>
    Object.fromEntries(students.map((s) => [s.id, "present"]))
  );

  const counts = {
    present: Object.values(marks).filter((s) => s === "present").length,
    absent: Object.values(marks).filter((s) => s === "absent").length,
    late: Object.values(marks).filter((s) => s === "late").length,
  };
  const total = students.length;
  const rate = Math.round((counts.present / total) * 100);

  const cycle = (id: string) => setMarks({ ...marks, [id]: next[marks[id]] });
  const setAll = (s: Status) => setMarks(Object.fromEntries(students.map((st) => [st.id, s])));

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Class-wise roll call · biometric sync · parent auto-notify"
        icon={<ClipboardCheck className="h-6 w-6" />}
        actions={
          <>
            <Button variant="outline" className="rounded-xl" onClick={() => toast.success("Attendance exported")}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90" onClick={() => toast.success("Attendance submitted · parents notified")}>
              Submit Attendance
            </Button>
          </>
        }
      />

      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[
          { l: "Present", v: counts.present, c: "text-success", icon: Check },
          { l: "Absent", v: counts.absent, c: "text-destructive", icon: X },
          { l: "Late", v: counts.late, c: "text-warning", icon: Clock },
          { l: "Attendance Rate", v: `${rate}%`, c: "text-primary", icon: Users },
        ].map((s) => (
          <Card key={s.l} className="glass hover-lift p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
                <p className={`mt-1 font-display text-2xl font-bold ${s.c}`}>{s.v}</p>
              </div>
              <s.icon className={`h-5 w-5 ${s.c}`} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="glass mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short", year: "numeric" })}</span>
          </div>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["8-A", "8-B", "9-A", "9-B", "10-A", "10-B", "11-C", "12-A"].map((g) => (
                <SelectItem key={g} value={g}>Class {g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              {["P1 · 09:00–09:45", "P2 · 09:45–10:30", "P3 · 10:45–11:30", "P4 · 11:30–12:15"].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-1.5">
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAll("present")}>Mark all present</Button>
            <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setAll("absent")}>All absent</Button>
          </div>
        </div>
        <div className="mt-3">
          <Progress value={rate} className="h-1.5" />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {students.map((s) => {
          const st = marks[s.id];
          return (
            <button
              key={s.id}
              onClick={() => cycle(s.id)}
              className={cn(
                "glass flex items-center gap-3 rounded-2xl border bg-card/60 p-3 text-left transition-all hover:shadow-glow",
                st === "present" && "border-success/30",
                st === "absent" && "border-destructive/30",
                st === "late" && "border-warning/30",
              )}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-primary text-xs text-primary-foreground">{s.avatar}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{s.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{s.id} · Roll {s.roll}</p>
              </div>
              <Badge variant="secondary" className={cn("capitalize", styles[st])}>{st}</Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}
