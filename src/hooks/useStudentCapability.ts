import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { loadCapabilityProfiles, can, type CapabilityKey } from "@/lib/capability-profiles";

const STUDENT_MODULE = "students";
const PROFILE_MAP: Record<string, string> = {
  super_admin: "admin",
  admin: "admin",
  principal: "admin",
  hod: "office",
  faculty: "teacher",
  staff: "office",
  finance: "office",
  scholarship: "office",
  certificate: "office",
  librarian: "viewer",
  hostel_warden: "office",
  transport: "office",
  student: "viewer",
  parent: "viewer",
};

export function useStudentCapability() {
  const { roles } = useAuth();
  const profileId = useMemo(() => PROFILE_MAP[roles[0] ?? ""] ?? "viewer", [roles]);
  const profiles = useMemo(() => loadCapabilityProfiles(), []);

  const check = useMemo(() => {
    const caps: Record<CapabilityKey, boolean> = {
      view: false, edit: false, print: false, export: false, report: false,
    };
    for (const key of Object.keys(caps) as CapabilityKey[]) {
      caps[key] = can(profiles, profileId as any, STUDENT_MODULE, key);
    }
    return caps;
  }, [profiles, profileId]);

  const canView = check.view;
  const canEdit = check.edit;
  const canPrint = check.print;
  const canExport = check.export;
  const canReport = check.report;

  return { canView, canEdit, canPrint, canExport, canReport, profileId, check };
}
