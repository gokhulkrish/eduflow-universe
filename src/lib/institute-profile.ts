import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
import { emitAppSync } from "@/lib/app-sync";

const FALLBACK_KEY = "sms.institute-profile.v1";

export type InstituteProfile = {
  id?: string;
  institution_id?: string;
  identity: Record<string, string>;
  header_config?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  updated_at?: string;
};

async function getDefaultInstitutionId(): Promise<string | null> {
  if (!(await tableExists("institutions"))) return null;
  const { data } = await supabase
    .from("institutions")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

function loadFallback(): InstituteProfile | null {
  try {
    const raw = window.localStorage.getItem(FALLBACK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveFallback(profile: InstituteProfile) {
  try {
    window.localStorage.setItem(FALLBACK_KEY, JSON.stringify(profile));
  } catch {}
}

export async function getInstituteProfile(): Promise<InstituteProfile | null> {
  const institutionId = await getDefaultInstitutionId();
  if (institutionId && (await tableExists("institute_profile"))) {
    const { data, error } = await supabase
      .from("institute_profile")
      .select("*")
      .eq("institution_id", institutionId)
      .maybeSingle();
    if (!error && data) {
      return {
        id: data.id,
        institution_id: data.institution_id,
        identity: (data.identity as Record<string, string>) ?? {},
        header_config: data.header_config as Record<string, unknown> | undefined,
        settings: data.settings as Record<string, unknown> | undefined,
        updated_at: data.updated_at,
      };
    }
  }
  return loadFallback();
}

export async function saveInstituteProfile(
  identity: Record<string, string>,
  headerConfig?: Record<string, unknown>,
  settings?: Record<string, unknown>,
): Promise<void> {
  const institutionId = await getDefaultInstitutionId();
  identity._updatedAt = new Date().toISOString();

  const fallbackProfile: InstituteProfile = { identity, header_config: headerConfig, settings };
  saveFallback(fallbackProfile);
  emitAppSync(FALLBACK_KEY);

  if (institutionId && (await tableExists("institute_profile"))) {
    const { data: existing } = await supabase
      .from("institute_profile")
      .select("id")
      .eq("institution_id", institutionId)
      .maybeSingle();

    const payload = {
      institution_id: institutionId,
      identity: identity as unknown as Record<string, unknown>,
      header_config: (headerConfig ?? null) as unknown as Record<string, unknown>,
      settings: (settings ?? null) as unknown as Record<string, unknown>,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from("institute_profile").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("institute_profile").insert(payload);
    }
  }
}
