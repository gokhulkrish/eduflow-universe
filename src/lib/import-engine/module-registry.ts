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

async function importWithRetry<T>(loader: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await loader();
    } catch (e) {
      if (i === retries - 1) throw e;
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error("unreachable");
}

export async function loadInitialModules(): Promise<void> {
  const adapters = await Promise.all([
    importWithRetry(() => import("./adapters/student-adapter")),
    importWithRetry(() => import("./adapters/fees-adapter")),
    importWithRetry(() => import("./adapters/attendance-adapter")),
    importWithRetry(() => import("./adapters/exam-marks-adapter")),
    importWithRetry(() => import("./adapters/transport-adapter")),
    importWithRetry(() => import("./adapters/hostel-adapter")),
    importWithRetry(() => import("./adapters/library-adapter")),
    importWithRetry(() => import("./adapters/hr-adapter")),
    importWithRetry(() => import("./adapters/admissions-adapter")),
    importWithRetry(() => import("./adapters/assignments-adapter")),
    importWithRetry(() => import("./adapters/departments-adapter")),
    importWithRetry(() => import("./adapters/leave-types-adapter")),
    importWithRetry(() => import("./adapters/holidays-adapter")),
    importWithRetry(() => import("./adapters/notices-adapter")),
    importWithRetry(() => import("./adapters/lessons-adapter")),
    importWithRetry(() => import("./adapters/curriculum-adapter")),
    importWithRetry(() => import("./adapters/accreditation-adapter")),
    importWithRetry(() => import("./adapters/class-wall-adapter")),
    importWithRetry(() => import("./adapters/course-mappings-adapter")),
    importWithRetry(() => import("./adapters/discipline-adapter")),
    importWithRetry(() => import("./adapters/tasks-adapter")),
    importWithRetry(() => import("./adapters/contacts-adapter")),
    importWithRetry(() => import("./adapters/lms-adapter")),
    importWithRetry(() => import("./adapters/procurement-adapter")),
    importWithRetry(() => import("./adapters/research-adapter")),
    importWithRetry(() => import("./adapters/dms-adapter")),
    importWithRetry(() => import("./adapters/health-adapter")),
    importWithRetry(() => import("./adapters/comms-class-wall-adapter")),
    importWithRetry(() => import("./adapters/comms-feedback-adapter")),
    importWithRetry(() => import("./adapters/comms-notices-adapter")),
    importWithRetry(() => import("./adapters/it-labs-adapter")),
    importWithRetry(() => import("./adapters/it-network-adapter")),
    importWithRetry(() => import("./adapters/iot-devices-adapter")),
    importWithRetry(() => import("./adapters/scholarship-adapter")),
  ]);

  for (const mod of adapters) {
    const key = Object.keys(mod)[0] as string;
    registerModule((mod as any)[key]);
  }
}
