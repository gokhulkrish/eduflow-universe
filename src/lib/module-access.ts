import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";

const MODULE_CACHE = new Map<string, Promise<boolean>>();

export function isModuleEnabled(moduleKey: string): Promise<boolean> {
  const cached = MODULE_CACHE.get(moduleKey);
  if (cached) return cached;

  const promise = (async () => {
    if (!(await tableExists("permissions"))) return false;

    const { count, error } = await supabase
      .from("permissions")
      .select("id", { count: "exact", head: true })
      .eq("module_key", moduleKey);

    return !error && (count ?? 0) > 0;
  })();

  MODULE_CACHE.set(moduleKey, promise);
  return promise;
}
