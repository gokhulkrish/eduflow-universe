import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loadAccessibleModuleKeys } from "@/lib/module-access";
import { resolveAccessKeyForPathname } from "@/lib/global-access-registry";
import { tableExists } from "@/lib/supabase-health";
import { Link } from "react-router-dom";

const SCHEMA_TABLES = [
  "students",
  "classes",
  "enrollments",
  "attendance",
  "fee_invoices",
  "fee_payments",
  "audit_log",
  "permissions",
  "role_permissions",
] as const;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const ACTIVE_PROJECT_ID = (() => {
  try {
    const host = new URL(SUPABASE_URL).host;
    return host.split(".")[0] || "unknown";
  } catch {
    return "unknown";
  }
})();

export function SchemaHealthBanner() {
  const { data: accessibleKeys, isLoading: accessLoading } = useQuery({
    queryKey: ["accessible-module-keys", "schema-banner"],
    queryFn: () => loadAccessibleModuleKeys(),
    staleTime: Infinity,
  });
  const { data: missing = [], isLoading } = useQuery({
    queryKey: ["schema-health"],
    queryFn: async () => {
      const checks = await Promise.all(
        SCHEMA_TABLES.map(async (table) => ({ table, ok: await tableExists(table) })),
      );
      return checks.filter((entry) => !entry.ok).map((entry) => entry.table);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (isLoading || missing.length === 0) return null;
  const canShowMigration = !accessLoading && (accessibleKeys?.has(resolveAccessKeyForPathname("/migration") ?? "") ?? false);
  const instituteAccessKey = resolveAccessKeyForPathname("/settings/institute");
  const canShowSettings = !accessLoading && (accessibleKeys?.has(instituteAccessKey ?? "") ?? false);

  return (
    <Card className="mb-4 border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-950 shadow-sm dark:text-amber-50">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-300" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Supabase schema looks incomplete</p>
            <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/80">
              The app is reaching Supabase project <span className="font-semibold">{ACTIVE_PROJECT_ID}</span>, but several expected tables are missing. This usually means the migrations have not been applied to that project, or the frontend is pointed at the wrong Supabase target.
            </p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wider text-amber-900/70 dark:text-amber-100/70">
              Missing: {missing.slice(0, 5).join(", ")}{missing.length > 5 ? ` +${missing.length - 5} more` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {canShowMigration && (
            <Button asChild size="sm" variant="secondary" className="bg-background/80 text-foreground hover:bg-background">
              <Link to="/migration">Open migrations</Link>
            </Button>
          )}
          {canShowSettings && (
            <Button asChild size="sm" variant="outline" className="border-amber-500/30 bg-transparent text-amber-950 hover:bg-amber-500/15 dark:text-amber-50">
              <Link to="/settings/institute">Check GCT settings</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
