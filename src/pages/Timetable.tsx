import { useState } from "react";
import { Calendar, Plus, Loader2, AlertTriangle, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  getTimeSlots, getTimetableEntries, saveTimetableEntry, deleteTimetableEntry,
  detectConflicts, getTeacherWorkload,
  getSubstitutions, createSubstitution, updateSubstitutionStatus,
  getTimetableClasses, getTimetableSubjects, getTimetableStaff, getTimetableSchemaStatus,
  DAY_NAMES, type TimetableEntryJoined,
  type TimetableClass, type TimetableSubject, type TimetableStaff,
} from "@/lib/timetable";

const classLabel = (cohort: TimetableClass) =>
  `${cohort.grade ?? "Unlabelled"}${cohort.section ? `-${cohort.section}` : ""}${cohort.stream ? ` (${cohort.stream})` : ""}`;

const staffLabel = (staff: TimetableStaff) => staff.full_name?.trim() || "Unnamed staff";

export default function Timetable() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("grid");
  const [cohortFilter, setCohortFilter] = useState<string>("");

  const schemaQuery = useQuery({ queryKey: ["tt-schema"], queryFn: getTimetableSchemaStatus });
  const timetableReady = schemaQuery.data?.ready === true;
  const missingTables = schemaQuery.data?.missingTables ?? [];

  const { data: slots } = useQuery({ queryKey: ["tt-slots"], queryFn: getTimeSlots, enabled: timetableReady });
  const { data: entries } = useQuery({ queryKey: ["tt-entries", cohortFilter], queryFn: () => getTimetableEntries(cohortFilter || undefined), enabled: timetableReady });
  const { data: classes } = useQuery<TimetableClass[]>({ queryKey: ["tt-classes"], queryFn: getTimetableClasses, enabled: timetableReady });
  const { data: subjects } = useQuery<TimetableSubject[]>({ queryKey: ["tt-subjects"], queryFn: getTimetableSubjects, enabled: timetableReady });
  const { data: staffList } = useQuery<TimetableStaff[]>({ queryKey: ["tt-staff"], queryFn: getTimetableStaff, enabled: timetableReady });
  const { data: subsList } = useQuery({ queryKey: ["tt-subs"], queryFn: () => getSubstitutions(), enabled: timetableReady });

  const classOptions = classes ?? [];
  const subjectOptions = subjects ?? [];
  const staffOptions = staffList ?? [];

  // ── Entry Dialog ──
  const [entryOpen, setEntryOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<TimetableEntryJoined | null>(null);
  const [entryCohortId, setEntryCohortId] = useState("");
  const [entrySubjId, setEntrySubjId] = useState("");
  const [entryTeacherId, setEntryTeacherId] = useState("");
  const [entrySlotId, setEntrySlotId] = useState("");
  const [entryDay, setEntryDay] = useState("1");
  const [entryRoom, setEntryRoom] = useState("");

  const openEntry = (e?: TimetableEntryJoined) => {
    setEditEntry(e ?? null);
    setEntryCohortId(e?.class_id ?? cohortFilter ?? "");
    setEntrySubjId(e?.subject_id ?? "");
    setEntryTeacherId(e?.teacher_id ?? "");
    setEntrySlotId(e?.time_slot_id ?? "");
    setEntryDay(String(e?.day_of_week ?? 1));
    setEntryRoom(e?.room ?? "");
    setEntryOpen(true);
  };

  const saveEntryMut = useMutation({
    mutationFn: () => saveTimetableEntry(editEntry
      ? { ...editEntry, subject_id: entrySubjId, teacher_id: entryTeacherId, room: entryRoom || null }
      : { class_id: entryCohortId, subject_id: entrySubjId, teacher_id: entryTeacherId, time_slot_id: entrySlotId, day_of_week: Number(entryDay), academic_year_id: null, room: entryRoom || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tt-entries"] }); setEntryOpen(false); toast.success(editEntry ? "Entry updated" : "Entry added"); },
    onError: (e) => toast.error(e.message),
  });

  const delEntryMut = useMutation({
    mutationFn: (id: string) => deleteTimetableEntry(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tt-entries"] }); toast.success("Entry removed"); },
    onError: (e) => toast.error(e.message),
  });

  // ── Substitution Dialog ──
  const [subOpen, setSubOpen] = useState(false);
  const [subEntryId, setSubEntryId] = useState("");
  const [subTeacherId, setSubTeacherId] = useState("");
  const [subDate, setSubDate] = useState(new Date().toISOString().slice(0, 10));
  const [subReason, setSubReason] = useState("");

  const subMut = useMutation({
    mutationFn: () => createSubstitution({
      timetable_entry_id: subEntryId,
      original_teacher_id: entries?.find((e) => e.id === subEntryId)?.teacher_id ?? "",
      substitute_teacher_id: subTeacherId,
      date: subDate,
      reason: subReason || null,
      status: "requested",
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["tt-subs"] }); qc.invalidateQueries({ queryKey: ["tt-entries"] }); setSubOpen(false); toast.success("Substitution created"); },
    onError: (e) => toast.error(e.message),
  });

  const conflicts = entries ? detectConflicts(entries) : [];
  const workload = entries ? getTeacherWorkload(entries) : [];

  return (
    <div>
      <PageHeader title="Timetable Scheduler" subtitle="Cohort schedules, teacher workload & substitutions" icon={<Calendar className="h-6 w-6" />} />

      {schemaQuery.isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking timetable setup
          </CardContent>
        </Card>
      ) : !timetableReady ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-warning" />
            <p className="text-sm font-medium">Timetable is not available yet</p>
            <p className="mx-auto mt-2 max-w-xl text-xs text-muted-foreground">
              {schemaQuery.error
                ? "Unable to verify the timetable schema. The page has been kept read-only until the database check succeeds."
                : `Missing required table${missingTables.length === 1 ? "" : "s"}: ${missingTables.join(", ")}. Run the timetable and core academic migrations, then reopen this page.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="conflicts" className="relative">Conflicts {conflicts.length > 0 && <Badge variant="destructive" className="ml-1.5 text-[10px] h-4 px-1">{conflicts.length}</Badge>}</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
          <TabsTrigger value="substitutions">Substitutions {(subsList ?? []).filter((s) => s.status === "requested").length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1">{(subsList ?? []).filter((s) => s.status === "requested").length}</Badge>}</TabsTrigger>
        </TabsList>

        {/* ══════ GRID ══════ */}
        <TabsContent value="grid">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <div className="flex gap-2 items-center">
              <Select value={cohortFilter} onValueChange={(v) => { setCohortFilter(v === "all" ? "" : v); }}>
                <SelectTrigger className="h-8 text-xs w-48"><SelectValue placeholder="Select cohort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cohorts</SelectItem>
                  {classOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{classLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => openEntry()} disabled={!cohortFilter}>
              <Plus className="h-4 w-4 mr-1" /> Add Entry
            </Button>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-2 font-medium text-muted-foreground w-24">Period</th>
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <th key={d} className="p-2 font-medium text-center border-l">{DAY_NAMES[d]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const daySlots = (slots ?? []).filter((s) => s.day_of_week === 1);
                  return daySlots.map((slot, idx) => (
                    <tr key={slot.id} className={slot.is_break ? "bg-muted/20" : ""}>
                      <td className={`p-2 font-medium border-b ${slot.is_break ? "text-muted-foreground" : ""}`}>
                        {slot.name}<br /><span className="text-[9px] text-muted-foreground">{slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}</span>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((d) => {
                        const daySlotsForD = (slots ?? []).filter((s) => s.day_of_week === d);
                        const ds = daySlotsForD[idx];
                        const gridEntry = ds ? entries?.find((e) => e.day_of_week === d && e.time_slot_id === ds.id) : null;
                        if (!ds) return <td key={d} className="p-2 border-b border-l" />;
                        if (ds.is_break) return <td key={d} className="p-2 border-b border-l text-center text-muted-foreground text-[10px]">—</td>;
                        return (
                          <td key={d} className="p-1 border-b border-l align-top">
                            {gridEntry ? (
                              <div className="rounded-md bg-primary/10 border border-primary/20 p-1.5 cursor-pointer hover:bg-primary/15 transition-colors" onClick={() => openEntry(gridEntry)}>
                                <p className="font-medium text-[11px] leading-tight">{gridEntry.subject_name ?? "—"}</p>
                                <p className="text-[9px] text-muted-foreground leading-tight">{gridEntry.teacher_name ?? "—"}</p>
                                {gridEntry.room && <p className="text-[9px] text-muted-foreground">Rm {gridEntry.room}</p>}
                              </div>
                            ) : (
                              <button className="w-full h-full min-h-[40px] rounded border border-dashed border-border/30 text-[9px] text-muted-foreground hover:bg-muted/30 transition-colors" onClick={() => { if (cohortFilter) { setEntryCohortId(cohortFilter); setEntryDay(String(d)); setEntrySlotId(ds.id); setEntryOpen(true); } }}>+</button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ══════ CONFLICTS ══════ */}
        <TabsContent value="conflicts">
          {conflicts.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground"><CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" /> No conflicts detected</CardContent></Card>
          ) : (
            <div className="space-y-3">
              {conflicts.map((c, i) => (
                <Card key={i} className="border-destructive/30">
                  <CardHeader className="pb-2 flex flex-row items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <CardTitle className="text-sm text-destructive">{c.type === "teacher" ? "Teacher double-booking" : "Room conflict"}</CardTitle>
                      <p className="text-xs text-muted-foreground">{c.description} · {DAY_NAMES[c.day]}</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {c.entries.map((e) => (
                        <p key={e.id} className="text-xs">{e.subject_name} — {e.teacher_name} ({e.grade}{e.section})</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════ WORKLOAD ══════ */}
        <TabsContent value="workload">
          <Card>
            <CardHeader><CardTitle className="text-sm">Teacher Workload</CardTitle></CardHeader>
            <CardContent>
              <Table>
              <TableHeader className="sticky top-[7.5rem] z-20 bg-background/95 backdrop-blur">
                <TableRow>
                  <TableHead className="text-xs">Teacher</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  {[1, 2, 3, 4, 5, 6].map((d) => <TableHead key={d} className="text-xs text-right">{DAY_NAMES[d]}</TableHead>)}
                </TableRow>
              </TableHeader>
                <TableBody>
                  {workload.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No timetable data</TableCell></TableRow>}
                  {workload.map((w) => (
                    <TableRow key={w.teacher_id}>
                      <TableCell className="text-sm font-medium">{w.teacher_name}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{w.total_periods}</TableCell>
                      {w.periods_per_day.slice(1, 7).map((p, i) => (
                        <TableCell key={i} className={`text-right text-sm ${p > 6 ? "text-destructive font-semibold" : ""}`}>{p}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══════ SUBSTITUTIONS ══════ */}
        <TabsContent value="substitutions">
          <div className="flex justify-end mb-4">
            <Button size="sm" className="rounded-xl bg-gradient-primary shadow-glow" onClick={() => { setSubEntryId(""); setSubTeacherId(""); setSubDate(new Date().toISOString().slice(0, 10)); setSubReason(""); setSubOpen(true); }}>
              <RefreshCw className="h-4 w-4 mr-1" /> New Substitution
            </Button>
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader className="sticky top-[7.5rem] z-20 bg-background/95 backdrop-blur">
                <TableRow>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Cohort</TableHead>
                  <TableHead className="text-xs">Original</TableHead>
                  <TableHead className="text-xs">Substitute</TableHead>
                  <TableHead className="text-xs">Reason</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subsList ?? []).length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">No substitutions</TableCell></TableRow>}
                {(subsList ?? []).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="text-xs">{new Date(s.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs">{s.subject_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{s.class_name ?? "—"}</TableCell>
                    <TableCell className="text-xs">{s.original_teacher_name}</TableCell>
                    <TableCell className="text-xs font-medium">{s.substitute_teacher_name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.reason ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "approved" ? "default" : s.status === "declined" ? "destructive" : "secondary"} className="text-[10px]">{s.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {s.status === "requested" && (
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-success" onClick={() => updateSubstitutionStatus(s.id, "approved").then(() => { qc.invalidateQueries({ queryKey: ["tt-subs"] }); toast.success("Substitution approved"); })}><CheckCircle className="h-3 w-3 mr-1" /></Button>
                          <Button variant="outline" size="sm" className="rounded-lg h-7 text-[10px] text-destructive" onClick={() => updateSubstitutionStatus(s.id, "declined").then(() => { qc.invalidateQueries({ queryKey: ["tt-subs"] }); toast.success("Substitution declined"); })}><XCircle className="h-3 w-3 mr-1" /></Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* ══════ ENTRY DIALOG ══════ */}
      <Dialog open={entryOpen} onOpenChange={setEntryOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editEntry ? "Edit Entry" : "Add Timetable Entry"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {!editEntry && (
              <>
                <div>
                  <Label className="text-xs">Cohort</Label>
                  <Select value={entryCohortId} onValueChange={setEntryCohortId} disabled={!!cohortFilter}>
                    <SelectTrigger><SelectValue placeholder="Select cohort" /></SelectTrigger>
                    <SelectContent>{classOptions.map((c) => <SelectItem key={c.id} value={c.id}>{classLabel(c)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Day</Label>
                    <Select value={entryDay} onValueChange={setEntryDay}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{[1, 2, 3, 4, 5, 6].map((d) => <SelectItem key={d} value={String(d)}>{DAY_NAMES[d]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Period</Label>
                    <Select value={entrySlotId} onValueChange={setEntrySlotId}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{(slots ?? []).filter((s) => s.day_of_week === Number(entryDay) && !s.is_break).map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0, 5)})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
            <div>
              <Label className="text-xs">Subject</Label>
              <Select value={entrySubjId} onValueChange={setEntrySubjId}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjectOptions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code ?? "—"})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Teacher</Label>
              <Select value={entryTeacherId} onValueChange={setEntryTeacherId}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>{staffOptions.map((s) => <SelectItem key={s.id} value={s.id}>{staffLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Room (optional)</Label>
              <Input value={entryRoom} onChange={(e) => setEntryRoom(e.target.value)} placeholder="e.g. 101" />
            </div>
          </div>
          <DialogFooter>
            {editEntry && <Button variant="outline" size="sm" className="text-destructive" onClick={() => { delEntryMut.mutate(editEntry.id); setEntryOpen(false); }} disabled={delEntryMut.isPending}><XCircle className="h-3 w-3 mr-1" /> Delete</Button>}
            <Button variant="outline" onClick={() => setEntryOpen(false)}>Cancel</Button>
            <Button onClick={() => saveEntryMut.mutate()} disabled={!entrySubjId || !entryTeacherId || (!editEntry && (!entryCohortId || !entrySlotId)) || saveEntryMut.isPending}>
              {saveEntryMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {editEntry ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════ SUBSTITUTION DIALOG ══════ */}
      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create Substitution</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Timetable Entry</Label>
              <Select value={subEntryId} onValueChange={setSubEntryId}>
                <SelectTrigger><SelectValue placeholder="Select entry" /></SelectTrigger>
                <SelectContent>{(entries ?? []).filter((e) => e.teacher_name).map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.subject_name} — {e.teacher_name} ({DAY_NAMES[e.day_of_week]})</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Substitute Teacher</Label>
              <Select value={subTeacherId} onValueChange={setSubTeacherId}>
                <SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger>
                <SelectContent>{staffOptions.map((s) => <SelectItem key={s.id} value={s.id}>{staffLabel(s)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={subDate} onChange={(e) => setSubDate(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Reason (optional)</Label>
              <Input value={subReason} onChange={(e) => setSubReason(e.target.value)} placeholder="e.g. Sick leave" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubOpen(false)}>Cancel</Button>
            <Button onClick={() => subMut.mutate()} disabled={!subEntryId || !subTeacherId || !subDate || subMut.isPending}>
              {subMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
