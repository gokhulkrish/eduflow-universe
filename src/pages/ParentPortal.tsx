import { useState } from "react";
import { Heart, User, GraduationCap, DollarSign, Calendar, FileText, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { fetchStudentRegister } from "@/lib/student-records";
import { supabase } from "@/integrations/supabase/client";
import { isModuleEnabled } from "@/lib/module-access";
import { tableExists } from "@/lib/supabase-health";

export default function ParentPortal() {
  const [tab, setTab] = useState("overview");
  const [selectedChild, setSelectedChild] = useState("");

  const { data: students } = useQuery({ queryKey: ["student-register"], queryFn: fetchStudentRegister });
  const { data: examsEnabled } = useQuery({ queryKey: ["module-enabled", "exams"], queryFn: () => isModuleEnabled("exams"), staleTime: Infinity });

  const child = (students ?? []).find((s) => s.student_id === selectedChild) ?? null;

  const { data: attendance } = useQuery({
    queryKey: ["pp-attendance", selectedChild],
    queryFn: async () => {
      if (!selectedChild) return [];
      if (!(await tableExists("attendance"))) return [];
      const { data } = await supabase.from("attendance").select("*").eq("student_id", selectedChild).order("date", { ascending: false }).limit(30);
      return data ?? [];
    },
    enabled: !!selectedChild,
  });

  const { data: marks } = useQuery({
    queryKey: ["pp-marks", selectedChild],
    queryFn: async () => {
      if (!selectedChild) return [];
      if (!(await tableExists("exam_marks")) || !(await tableExists("exam_schedules"))) return [];
      const { data: m } = await supabase.from("exam_marks").select("*").eq("student_id", selectedChild).order("created_at", { ascending: false });
      const rows = m ?? [];
      const examIds = [...new Set(rows.map((r: any) => r.exam_id))];
      const { data: schedules } = await supabase.from("exam_schedules").select("*").in("id", examIds);
      const schedMap = new Map((schedules ?? []).map((s: any) => [s.id, s]));
      return rows.map((r: any) => ({ ...r, exam_schedules: schedMap.get(r.exam_id) }));
    },
    enabled: !!selectedChild && examsEnabled === true,
  });

  const { data: invoices } = useQuery({
    queryKey: ["pp-fees", selectedChild],
    queryFn: async () => {
      if (!selectedChild) return [];
      if (!(await tableExists("fee_invoices"))) return [];
      const { data } = await supabase.from("fee_invoices").select("*").eq("student_id", selectedChild).order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!selectedChild,
  });

  const presentCount = (attendance ?? []).filter((a: any) => a.status === "present").length;
  const totalDays = (attendance ?? []).length;
  const attPct = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;
  const totalBilled = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.amount), 0);
  const totalPaid = (invoices ?? []).reduce((s: number, i: any) => s + Number(i.amount_paid), 0);

  return (
    <div>
      <PageHeader title="Student & Guardian Portal" subtitle="Student overview, attendance, marks & fees" icon={<Heart className="h-6 w-6" />} />

      <div className="mb-6 max-w-xs">
        <Select name="selectedChild" value={selectedChild} onValueChange={setSelectedChild}>
          <SelectTrigger><SelectValue placeholder="Select your child" /></SelectTrigger>
          <SelectContent>
            {(students ?? []).map((s) => (
              <SelectItem key={s.student_id} value={s.student_id}>
                {s.display_name} ({s.grade ?? "—"}{s.section ? `-${s.section}` : ""})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedChild && (
        <Card><CardContent className="py-16 text-center text-sm text-muted-foreground"><User className="h-10 w-10 mx-auto mb-3 opacity-30" />Select a child to view their dashboard</CardContent></Card>
      )}

      {selectedChild && child && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-1 flex flex-row items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-xs text-muted-foreground">Program</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{child.grade ?? "—"}{child.section ? `-${child.section}` : ""}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 flex flex-row items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-xs text-muted-foreground">Attendance</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-bold ${attPct >= 85 ? "text-success" : attPct >= 70 ? "text-warning" : "text-destructive"}`}>{totalDays > 0 ? `${attPct}%` : "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 flex flex-row items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-xs text-muted-foreground">Roll No</CardTitle></CardHeader>
              <CardContent><p className="text-xl font-bold">{child.roll_number ?? "—"}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 flex flex-row items-center gap-2"><DollarSign className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-xs text-muted-foreground">Fee Status</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-bold ${child.fee_status === "Paid" ? "text-success" : "text-warning"}`}>{child.fee_status}</p></CardContent>
            </Card>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Profile</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="academics">Academics</TabsTrigger>
              <TabsTrigger value="fees">Fees</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader><CardTitle className="text-sm">Student Profile</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Name</span><p className="font-medium">{child.display_name}</p></div>
                    <div><span className="text-muted-foreground">Admission No</span><p className="font-medium">{child.admission_no}</p></div>
                    <div><span className="text-muted-foreground">Date of Birth</span><p>{child.dob ? new Date(child.dob).toLocaleDateString() : "—"}</p></div>
                    <div><span className="text-muted-foreground">Gender</span><p>{child.gender ?? "—"}</p></div>
                    <div><span className="text-muted-foreground">Blood Group</span><p>{child.blood_group ?? "—"}</p></div>
                    <div><span className="text-muted-foreground">Email</span><p>{child.email ?? "—"}</p></div>
                    <div><span className="text-muted-foreground">Phone</span><p>{child.phone ?? "—"}</p></div>
                    <div><span className="text-muted-foreground">Residence</span><p>{child.house ?? "—"}</p></div>
                    <div><span className="text-muted-foreground">Guardian</span><p>{child.guardian_name ?? "—"}</p></div>
                    <div><span className="text-muted-foreground">Guardian Phone</span><p>{child.guardian_phone ?? "—"}</p></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Recent Attendance (last 30 days)</CardTitle>
                  <Badge variant={attPct >= 85 ? "default" : attPct >= 70 ? "secondary" : "destructive"} className="text-xs">{attPct}%</Badge>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="">
                      <TableRow>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs">Period</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                        <TableHead className="text-xs">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(attendance ?? []).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">No records</TableCell></TableRow>}
                      {(attendance ?? []).map((a: any) => (
                        <TableRow key={a.id}>
                          <TableCell className="text-xs">{new Date(a.date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-xs">{a.period ?? "—"}</TableCell>
                          <TableCell><Badge variant={a.status === "present" ? "default" : a.status === "absent" ? "destructive" : "secondary"} className="text-[10px]">{a.status}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{a.remarks ?? "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p className="text-xs text-muted-foreground mt-2">{presentCount} present out of {totalDays} days</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academics">
              <Card>
                <CardHeader><CardTitle className="text-sm">Exam Results</CardTitle></CardHeader>
                <CardContent>
                  {examsEnabled === false && (
                    <p className="mb-4 rounded-lg border border-dashed border-border/60 bg-secondary/20 px-3 py-2 text-xs text-muted-foreground">
                      Exam data is unavailable until the exams migration is applied to the connected Supabase project.
                    </p>
                  )}
                  <Table>
                    <TableHeader className="">
                      <TableRow>
                        <TableHead className="text-xs">Exam</TableHead>
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-xs">Date</TableHead>
                        <TableHead className="text-xs text-right">Marks</TableHead>
                        <TableHead className="text-xs text-right">Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(marks ?? []).length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">No exam results</TableCell></TableRow>}
                      {(marks ?? []).map((m: any) => (
                        <TableRow key={m.id}>
                          <TableCell className="text-xs">{m.exam_schedules?.title ?? "—"}</TableCell>
                          <TableCell className="text-xs">{m.exam_schedules?.subject ?? "—"}</TableCell>
                          <TableCell className="text-xs">{m.exam_schedules?.date ? new Date(m.exam_schedules.date).toLocaleDateString() : "—"}</TableCell>
                          <TableCell className="text-right text-sm font-medium">{m.marks_obtained ?? "—"}/{m.exam_schedules?.max_marks ?? "—"}</TableCell>
                          <TableCell className="text-right"><Badge className="text-[10px]">{m.grade ?? "—"}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="fees">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm">Fee Invoices</CardTitle>
                  <div className="text-right text-xs"><span className="text-muted-foreground">Total: </span><span className="font-semibold">₹{totalBilled.toLocaleString()}</span><span className="text-muted-foreground ml-2">Paid: </span><span className="font-semibold text-success">₹{totalPaid.toLocaleString()}</span></div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="">
                      <TableRow>
                        <TableHead className="text-xs">Invoice</TableHead>
                        <TableHead className="text-xs">Amount</TableHead>
                        <TableHead className="text-xs text-right">Paid</TableHead>
                        <TableHead className="text-xs text-right">Balance</TableHead>
                        <TableHead className="text-xs">Due Date</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(invoices ?? []).length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">No invoices</TableCell></TableRow>}
                      {(invoices ?? []).map((inv: any) => {
                        const bal = Number(inv.amount) - Number(inv.amount_paid);
                        return (
                          <TableRow key={inv.id}>
                            <TableCell className="text-xs font-mono">{inv.invoice_no}</TableCell>
                            <TableCell className="text-sm">₹{Number(inv.amount).toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm text-success">₹{Number(inv.amount_paid).toLocaleString()}</TableCell>
                            <TableCell className={`text-right text-sm font-semibold ${bal > 0 ? "text-destructive" : "text-success"}`}>₹{bal.toLocaleString()}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "—"}</TableCell>
                            <TableCell><Badge variant={bal <= 0 ? "default" : "destructive"} className="text-[10px]">{bal <= 0 ? "Paid" : "Due"}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
