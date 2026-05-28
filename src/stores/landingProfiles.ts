import type { AppRole } from "@/hooks/useAuth";

export interface LandingProfileEntry {
  role: AppRole;
  label: string;
  targetPath: string;
}

const STORAGE_KEY = "sms.landingProfiles.v1";

const DEFAULT_PROFILES: LandingProfileEntry[] = [
  { role: "super_admin", label: "Super Admin", targetPath: "/students" },
  { role: "admin", label: "Admin", targetPath: "/students" },
  { role: "principal", label: "Principal", targetPath: "/students" },
  { role: "hod", label: "HOD", targetPath: "/attendance" },
  { role: "faculty", label: "Faculty", targetPath: "/attendance" },
  { role: "staff", label: "Staff", targetPath: "/tasks" },
  { role: "finance", label: "Finance", targetPath: "/fees" },
  { role: "scholarship", label: "Scholarship", targetPath: "/scholarship" },
  { role: "certificate", label: "Certificate", targetPath: "/certificates" },
  { role: "librarian", label: "Librarian", targetPath: "/library" },
  { role: "hostel_warden", label: "Hostel Warden", targetPath: "/hostel" },
  { role: "transport", label: "Transport", targetPath: "/transport" },
  { role: "student", label: "Student", targetPath: "/" },
  { role: "parent", label: "Parent", targetPath: "/parents" },
];

export function loadLandingProfiles(): LandingProfileEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILES;
    const parsed = JSON.parse(raw) as LandingProfileEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_PROFILES;
    const merged = new Map<string, LandingProfileEntry>();
    for (const d of DEFAULT_PROFILES) merged.set(d.role, d);
    for (const p of parsed) {
      if (p.role && p.targetPath) merged.set(p.role, p);
    }
    return Array.from(merged.values());
  } catch {
    return DEFAULT_PROFILES;
  }
}

export function saveLandingProfiles(profiles: LandingProfileEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function resetLandingProfiles(): LandingProfileEntry[] {
  saveLandingProfiles(DEFAULT_PROFILES);
  return DEFAULT_PROFILES;
}

export function getLandingForRole(roles: AppRole[]): string | null {
  if (!roles.length) return null;
  const profiles = loadLandingProfiles();
  const profileMap = new Map(profiles.map((p) => [p.role, p]));
  for (const role of roles) {
    const entry = profileMap.get(role);
    if (entry) return entry.targetPath;
  }
  return null;
}

export function setLandingForRole(role: AppRole, targetPath: string) {
  const profiles = loadLandingProfiles();
  const idx = profiles.findIndex((p) => p.role === role);
  if (idx >= 0) {
    profiles[idx] = { ...profiles[idx], targetPath };
  } else {
    profiles.push({ role, label: role, targetPath });
  }
  saveLandingProfiles(profiles);
}
