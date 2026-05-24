import { useQuery } from "@tanstack/react-query";
import { queryAuditLog } from "../../core/audit/service";

export function useAuditLog(params: {
  entity?: string;
  entityId?: string;
  action?: string;
  actorId?: string;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["audit", "log", params],
    queryFn: () => queryAuditLog(params),
  });
}
