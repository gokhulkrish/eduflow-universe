import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { initialsForStudent } from "@/lib/student-records";
import { cn } from "@/lib/utils";
import { ExternalLink, Mail, MapPin, Users, GraduationCap, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudentProfileDrawerProps {
  studentId: string;
  name: string;
  admissionNo: string;
  cohort: string;
  roll: string | number;
  attendance: number;
  fees: string;
  avatar: string;
  email?: string | null;
  community?: string | null;
  district?: string | null;
  status?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StudentProfileDrawer({
  studentId,
  name,
  admissionNo,
  cohort,
  roll,
  attendance,
  fees,
  avatar,
  email,
  community,
  district,
  status,
  open,
  onOpenChange,
}: StudentProfileDrawerProps) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col overflow-hidden p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="flex items-center gap-3 font-display">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-primary text-sm text-primary-foreground">{avatar}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{admissionNo}</p>
            </div>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-[11px]">{cohort}</Badge>
            <Badge variant="secondary" className="text-[11px]">Roll {roll}</Badge>
            <Badge
              variant="secondary"
              className={cn(
                "text-[11px] capitalize",
                status === "active" && "bg-success/15 text-success",
                status === "inactive" && "bg-muted text-muted-foreground",
                status === "graduated" && "bg-primary/10 text-primary",
              )}
            >
              {status ?? "active"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border/60 bg-card/60 p-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Attendance</p>
                  <p className="mt-0.5 text-sm font-semibold">{attendance}%</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/60 p-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fee Status</p>
                  <p className="mt-0.5 text-sm font-semibold capitalize">{fees}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Contact</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{email || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{community || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{district || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/60 px-5 py-4">
          <Button className="w-full rounded-xl" onClick={() => { onOpenChange(false); navigate(`/students/${studentId}`); }}>
            View Full Profile
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
