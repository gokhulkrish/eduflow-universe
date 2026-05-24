import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { loadAccessibleModuleKeys } from "@/lib/module-access";
import { resolveAccessKeyForPathname } from "@/lib/global-access-registry";
import { tableExists } from "@/lib/supabase-health";
import { Link, useLocation } from "react-router-dom";
import { clearRuntimeDiagnostics, recordRuntimeDiagnostic, recordRuntimeError, recordRuntimeRecovery } from "@/lib/runtime-diagnostics";
import { withRuntimeRetry, recordRuntimeTelemetry, recordRuntimeAudit } from "@/lib/runtime-resilience";

const REQUIRED_TABLES = [
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

export function SupabaseSchemaGate({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const bypass = pathname.startsWith("/migration");
  const { data: accessibleKeys, isLoading: accessLoading } = useQuery({
    queryKey: ["accessible-module-keys", "schema-gate"],
    queryFn: () => loadAccessibleModuleKeys(),
    staleTime: Infinity,
  });

  const { data, error, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["schema-gate"],
    queryFn: async () => {
      const checks = await withRuntimeRetry(
        "supabase-schema-gate",
        async () => Promise.all(REQUIRED_TABLES.map(async (table) => ({ table, ok: await tableExists(table) }))),
        { maxAttempts: 2, baseDelayMs: 200 },
      );
      recordRuntimeTelemetry("supabase-schema-gate", "Schema check completed", `Checked ${checks.length} tables`);
      return checks.filter((entry) => !entry.ok).map((entry) => entry.table);
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const missing = data ?? [];
  const missingSummary = missing.join(", ");
  useEffect(() => {
    if (error) recordRuntimeError(error, "supabase-schema-gate", false);
  }, [error]);

  useEffect(() => {
    if (missing.length > 0) {
      recordRuntimeDiagnostic({
        kind: "schema",
        source: "supabase-schema-gate",
        message: "Missing required Supabase tables",
        detail: missingSummary,
        recoverable: false,
      });
    }
  }, [missingSummary, missing.length]);

  if (bypass) return <>{children}</>;
  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
        <Card className="w-full max-w-xl border-border/60 bg-card p-6 shadow-elegant">
          <div className="flex items-center gap-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Checking Supabase schema…</p>
          </div>
        </Card>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl border-red-500/30 bg-red-500/10 p-6 text-red-950 shadow-elegant dark:text-red-50">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/15">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-red-900/70 dark:text-red-100/70">
                Schema check failed
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold">Unable to verify Supabase schema</h1>
              <p className="mt-3 text-sm text-red-900/80 dark:text-red-100/80">
                The app could not complete its startup schema check. This usually means the Supabase connection is wrong, the network is unavailable, or the project credentials are out of sync.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-red-500/30 bg-transparent text-red-950 hover:bg-red-500/15 dark:text-red-50"
                  onClick={() => void refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                  Retry schema check
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    clearRuntimeDiagnostics();
                    recordRuntimeRecovery("supabase-schema-gate", "Schema error retry requested");
                    recordRuntimeAudit("supabase-schema-gate", "User retried schema check", missingSummary || "no missing tables");
                  }}
                >
                  Clear diagnostics
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  if (missing.length === 0) return <>{children}</>;
  const canShowMigration = !accessLoading && (accessibleKeys?.has(resolveAccessKeyForPathname("/migration") ?? "") ?? false);

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-amber-500/30 bg-amber-500/10 p-6 text-amber-950 shadow-elegant dark:text-amber-50">
        <div className="flex items-start gap-4">
          <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-900/70 dark:text-amber-100/70">
              Schema blocked
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold">Supabase tables are missing in project {ACTIVE_PROJECT_ID}</h1>
            <p className="mt-3 text-sm text-amber-900/80 dark:text-amber-100/80">
              The app cannot continue because the connected Supabase project does not contain the tables this build requires. This is a backend provisioning problem, not a UI issue.
            </p>
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-background/70 p-4 text-sm">
              <p className="font-semibold">Missing tables</p>
              <p className="mt-1 text-muted-foreground">
                {missing.join(", ")}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {canShowMigration && (
                <Button asChild variant="secondary" className="bg-background text-foreground hover:bg-background/90">
                  <Link to="/migration">Open migrations</Link>
                </Button>
              )}
              <Button
                variant="outline"
                className="border-amber-500/30 bg-transparent text-amber-950 hover:bg-amber-500/15 dark:text-amber-50"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                Recheck schema
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  clearRuntimeDiagnostics();
                  recordRuntimeRecovery("supabase-schema-gate", "Schema reset requested");
                  recordRuntimeAudit("supabase-schema-gate", "User cleared schema diagnostics", missingSummary || "no missing tables");
                }}
              >
                Clear diagnostics
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
