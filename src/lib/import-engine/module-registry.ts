import type { ImportModule, ImportModuleAdapter, ImportModuleFieldGroup } from "./types";

const modules = new Map<string, ImportModule>();

export function registerModule(module: ImportModule): void {
  modules.set(module.id, module);
}

export function getModule(id: string): ImportModule | undefined {
  return modules.get(id);
}

export function getAllModules(): ImportModule[] {
  return Array.from(modules.values());
}

export function getAllModuleDescriptors(): {
  id: string;
  name: string;
  description: string;
  icon: string;
}[] {
  return getAllModules().map((m) => ({
    id: m.id,
    name: m.name,
    description: m.description,
    icon: m.icon,
  }));
}

export function registerModuleAdapter(
  moduleId: string,
  adapter: ImportModuleAdapter,
): void {
  const mod = modules.get(moduleId);
  if (mod) {
    modules.set(moduleId, { ...mod, adapter });
  }
}

export async function loadInitialModules(): Promise<void> {
  const [{ studentsModule }, { feesModule }, { attendanceModule }, { examMarksModule }, { transportModule }] = await Promise.all([
    import("./adapters/student-adapter"),
    import("./adapters/fees-adapter"),
    import("./adapters/attendance-adapter"),
    import("./adapters/exam-marks-adapter"),
    import("./adapters/transport-adapter"),
  ]);

  registerModule(studentsModule);
  registerModule(feesModule);
  registerModule(attendanceModule);
  registerModule(examMarksModule);
  registerModule(transportModule);

  // Register remaining adapters
  const [{ hostelModule }, { libraryModule }, { hrModule }, { admissionsModule }, { assignmentsModule }] = await Promise.all([
    import("./adapters/hostel-adapter"),
    import("./adapters/library-adapter"),
    import("./adapters/hr-adapter"),
    import("./adapters/admissions-adapter"),
    import("./adapters/assignments-adapter"),
  ]);

  registerModule(hostelModule);
  registerModule(libraryModule);
  registerModule(hrModule);
  registerModule(admissionsModule);
  registerModule(assignmentsModule);
}
