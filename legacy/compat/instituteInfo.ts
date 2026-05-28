import { loadHeaderRegistrySettings, loadCustomImportFields } from "@/lib/header-registry";

export type LegacyInstituteInfo = {
  settings: Record<string, unknown>;
  customFields: unknown[];
  syncedAt: string;
};

export async function bridgeLegacyInstituteInfo(_filters?: Record<string, unknown>): Promise<LegacyInstituteInfo> {
  const settings = loadHeaderRegistrySettings();
  const customFields = loadCustomImportFields();
  return {
    settings: settings as unknown as Record<string, unknown>,
    customFields,
    syncedAt: new Date().toISOString(),
  };
}
