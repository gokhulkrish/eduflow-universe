import { loadHeaderRegistrySettings, loadCustomImportFields, normalizeHeaderKey, instituteRegistryStorageKey } from "@/lib/header-registry";
import { emitAppSync } from "@/lib/app-sync";

const LEGACY_DB_NAME = "gctStudentPortalDB";
const LEGACY_DB_VERSION = 7;
const APP_META_STORE = "appMeta";
const INSTITUTE_RECORD_KEY = "instituteRecord";
const CONFIG_KEY = `${instituteRegistryStorageKey}.config`;

export type LegacyInstituteInfo = {
  settings: Record<string, unknown>;
  customFields: unknown[];
  syncedAt: string;
};

export interface InstituteProfileContract {
  identity: {
    name: string;
    nickname: string;
    code: string;
    type: string;
    estd: string;
    affiliation: string;
    motto: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    website: string;
  };
  headOfInstitution: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  nodalOfficer: {
    name: string;
    role: string;
    email: string;
    phone: string;
  };
  accreditation?: {
    body: string;
    grade: string;
    validity: string;
    certificates: string[];
  };
}

function openLegacyDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(LEGACY_DB_NAME, LEGACY_DB_VERSION);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
}

export async function readLegacyInstituteFromIndexedDB(): Promise<Record<string, unknown> | null> {
  const db = await openLegacyDb();
  if (!db) return null;
  try {
    const tx = db.transaction(APP_META_STORE, "readonly");
    const store = tx.objectStore(APP_META_STORE);
    const record = await new Promise<{ key: string; value: Record<string, unknown>; updatedAt: string } | null>((resolve) => {
      const req = store.get(INSTITUTE_RECORD_KEY);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
    db.close();
    return record?.value ?? null;
  } catch {
    db.close();
    return null;
  }
}

function legacyFieldToConfigKey(legacyField: string): string {
  const map: Record<string, string> = {
    "Institution Name": "institute_name",
    "College Nick Name": "institute_nickname",
    "Institute Code": "institute_code",
    "Institute Type": "institute_type",
    "Year of Establishment": "established_year",
    "Affiliation": "affiliation",
    "Motto": "motto",
    "Email": "institute_email",
    "Phone": "institute_phone",
    "Address": "institute_address",
    "Website": "website",
    "Principal Name": "principal_name",
    "Principal Role": "principal_role",
    "Principal Email": "principal_email",
    "Principal Phone": "principal_phone",
    "Nodal Officer Name": "nodal_officer_name",
    "Nodal Officer Role": "nodal_officer_role",
    "Nodal Officer Email": "nodal_officer_email",
    "Nodal Officer Phone": "nodal_officer_phone",
  };
  return map[legacyField] ?? normalizeHeaderKey(legacyField);
}

async function readLocalConfig(): Promise<Record<string, string>> {
  try {
    return JSON.parse(window.localStorage.getItem(CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalConfig(config: Record<string, string>) {
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  emitAppSync(CONFIG_KEY);
}

export async function bridgeLegacyInstituteInfo(_filters?: Record<string, unknown>): Promise<LegacyInstituteInfo> {
  const settings = loadHeaderRegistrySettings();
  const customFields = loadCustomImportFields();
  return {
    settings: settings as unknown as Record<string, unknown>,
    customFields,
    syncedAt: new Date().toISOString(),
  };
}

export async function bridgeInstituteProfileData(): Promise<Record<string, string> | null> {
  const existing = await readLocalConfig();
  if (existing.institute_name && existing._updatedAt) return null;

  const legacyRecord = await readLegacyInstituteFromIndexedDB();
  if (!legacyRecord) return null;

  const config: Record<string, string> = { ...existing };
  for (const [legacyKey, value] of Object.entries(legacyRecord)) {
    if (value && typeof value === "string") {
      const configKey = legacyFieldToConfigKey(legacyKey);
      config[configKey] = value;
    }
  }
  if (!config._updatedAt) config._updatedAt = new Date().toISOString();
  writeLocalConfig(config);
  return config;
}

export function parseInstituteProfile(settings: Record<string, unknown>): Partial<InstituteProfileContract> {
  return {
    identity: {
      name: (settings.institute_name as string) || "",
      nickname: (settings.institute_nickname as string) || "",
      code: (settings.institute_code as string) || "",
      type: (settings.institute_type as string) || "",
      estd: (settings.established_year as string) || "",
      affiliation: (settings.affiliation as string) || "",
      motto: (settings.motto as string) || "",
    },
    contact: {
      email: (settings.institute_email as string) || "",
      phone: (settings.institute_phone as string) || "",
      address: (settings.institute_address as string) || "",
      website: (settings.website as string) || "",
    },
    headOfInstitution: {
      name: (settings.principal_name as string) || "",
      role: (settings.principal_role as string) || "Principal",
      email: (settings.principal_email as string) || "",
      phone: (settings.principal_phone as string) || "",
    },
    nodalOfficer: {
      name: (settings.nodal_officer_name as string) || "",
      role: (settings.nodal_officer_role as string) || "ERP Nodal Officer",
      email: (settings.nodal_officer_email as string) || "",
      phone: (settings.nodal_officer_phone as string) || "",
    },
  };
}

let institutePatcherActive = false;

export function patchLegacyInstituteFunctions() {
  if (institutePatcherActive || typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;

  const origRender = w.renderInstituteInformationPage;
  if (typeof origRender === "function") {
    w.renderInstituteInformationPage = function (...args: unknown[]) {
      const target = "/settings/institute";
      const router = (w as any).navigate || (w as any).openErpModuleWorkspace;
      if (typeof router === "function") {
        router("collegeInfo", "overview");
      } else if ((w as any).location) {
        (w as any).location.assign(target);
      }
      return origRender.apply(w, args);
    };
  }

  const origSave = w.saveInstituteInformation;
  if (typeof origSave === "function") {
    w.saveInstituteInformation = async function (...args: unknown[]) {
      const result = await origSave.apply(w, args);
      try {
        const record = (w as any).AppState?.institute?.record;
        if (record) {
          const config: Record<string, string> = {};
          for (const [legacyKey, value] of Object.entries(record)) {
            if (value && typeof value === "string") {
              const configKey = legacyFieldToConfigKey(legacyKey);
              config[configKey] = value;
            }
          }
          config._updatedAt = new Date().toISOString();
          writeLocalConfig(config);
        }
      } catch {
        /* storage mirror best-effort */
      }
      return result;
    };
  }

  institutePatcherActive = true;
}

export function isInstitutePatcherActive() {
  return institutePatcherActive;
}

export function validateInstituteProfile(profile: Partial<InstituteProfileContract>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!profile.identity?.name?.trim()) errors.push("Institute name is required");
  if (!profile.contact?.email?.trim()) errors.push("Contact email is required");
  if (!profile.contact?.phone?.trim()) errors.push("Contact phone is required");
  if (!profile.headOfInstitution?.name?.trim()) errors.push("Head of Institution name is required");

  if (profile.contact?.email && !profile.contact.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors.push("Invalid email format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
