import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isModuleEnabled } from "@/lib/module-access";
import { resolveAccessKeyForPathname } from "@/lib/global-access-registry";
import { subscribeAppSync } from "@/lib/app-sync";

function AccessDenied({ path, accessKey }: { path: string; accessKey: string }) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center">
      <Card className="max-w-xl border-border/60 bg-card/80 p-6 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold">Access restricted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This route is governed by the global permission registry and your current role does not have access.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">{path}</Badge>
          <Badge variant="secondary" className="bg-muted text-muted-foreground">{accessKey}</Badge>
        </div>
        <div className="mt-5 flex justify-center">
          <Button asChild className="rounded-xl bg-gradient-primary shadow-glow hover:opacity-90">
            <Link to="/">Return to dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function RouteAccessGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const accessKey = location.pathname === "/" ? null : resolveAccessKeyForPathname(location.pathname);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["module-enabled", accessKey ?? location.pathname],
    queryFn: () => (accessKey ? isModuleEnabled(accessKey) : Promise.resolve(true)),
    enabled: Boolean(accessKey),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!accessKey) return;
    return subscribeAppSync(["sms.module-access.v1"], () => {
      void refetch();
    });
  }, [accessKey, refetch]);

  if (!accessKey) return <>{children}</>;
  if (isLoading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (data === false) {
    return <AccessDenied path={location.pathname} accessKey={accessKey} />;
  }

  return <>{children}</>;
}
