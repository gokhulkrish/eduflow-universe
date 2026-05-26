import { useEffect, useMemo, useState } from "react";
import { Search as SearchIcon, Loader2, User } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { fetchStudentRegister, studentRegisterSyncKey } from "@/lib/student-records";
import { subscribeAppSync } from "@/lib/app-sync";

export default function StudentSearch() {
  const [query, setQuery] = useState("");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const registerQuery = useQuery({
    queryKey: ["student-register"],
    queryFn: fetchStudentRegister,
  });

  useEffect(() => {
    return subscribeAppSync([studentRegisterSyncKey], () => {
      queryClient.invalidateQueries({ queryKey: ["student-register"] });
    });
  }, [queryClient]);

  const all = registerQuery.data ?? [];

  const cohortOptions = useMemo(
    () => [...new Set(all.map((student) => student.grade).filter(Boolean))].sort(),
    [all],
  );

  const students = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((student) => {
      const haystack = [student.display_name, student.admission_no, student.grade ?? "", student.section ?? "", student.status]
        .join(" ")
        .toLowerCase();
      if (q && !haystack.includes(q)) return false;
      if (cohortFilter !== "all" && student.grade !== cohortFilter) return false;
      if (statusFilter !== "all" && student.status !== statusFilter) return false;
      return true;
    });
  }, [all, cohortFilter, query, statusFilter]);

  return (
    <div>
      <PageHeader title="Student Search" subtitle="Find students across all records" icon={<SearchIcon className="h-6 w-6" />} />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="studentSearchInput"
                placeholder="Search by name, admission number, grade, section…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="rounded-xl pl-9"
              />
            </div>
            <Select name="cohortFilter" value={cohortFilter} onValueChange={setCohortFilter}>
              <SelectTrigger><SelectValue placeholder="All Cohorts" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cohorts</SelectItem>
                {cohortOptions.map((cohort) => <SelectItem key={cohort ?? ""} value={cohort ?? ""}>{cohort}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select name="statusFilter" value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {registerQuery.isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading live student register…
          </CardContent>
        </Card>
      ) : null}

      {registerQuery.isError ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">
            Failed to load the live register.
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {students.map((student) => (
          <Card key={student.id} className="hover-lift transition-all">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{student.display_name}</p>
                <p className="text-xs text-muted-foreground">
                  {student.admission_no} · {student.grade ?? "Unassigned"}{student.section ? ` · Section ${student.section}` : ""}
                </p>
              </div>
              <Badge className={`text-[10px] ${student.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>
                {student.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
        {students.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {all.length === 0 ? "No student records found in the live register." : "No students match your search criteria."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
