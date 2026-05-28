import { type ReactNode, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { resolveAccessKeyForPathname } from "@/lib/global-access-registry";
import ModuleAccessBoundary from "./ModuleAccessBoundary";

interface RouteAccessGuardProps {
  children: ReactNode;
}

export default function RouteAccessGuard({ children }: RouteAccessGuardProps) {
  const location = useLocation();
  const moduleKey = useMemo(() => resolveAccessKeyForPathname(location.pathname), [location.pathname]);

  if (!moduleKey) return <>{children}</>;

  return <ModuleAccessBoundary moduleKey={moduleKey}>{children}</ModuleAccessBoundary>;
}
