import { type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { loadAccessibleModuleKeys } from "@/lib/module-access";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldOff } from "lucide-react";

interface ModuleAccessBoundaryProps {
  moduleKey: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export default function ModuleAccessBoundary({ moduleKey, fallback, children }: ModuleAccessBoundaryProps) {
  const { data: accessibleKeys } = useQuery({
    queryKey: ["accessible-module-keys", "boundary"],
    queryFn: () => loadAccessibleModuleKeys(),
    staleTime: 30_000,
  });

  if (!accessibleKeys) return null;
  if (!accessibleKeys.has(moduleKey)) {
    return fallback ?? (
      <Card className="border-dashed border-border/50 mx-auto mt-16 max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <ShieldOff className="h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">Access restricted</p>
          <p className="text-xs text-muted-foreground/60">
            You don't have permission to view this module.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
