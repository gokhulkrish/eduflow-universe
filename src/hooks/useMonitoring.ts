import { useQuery } from "@tanstack/react-query";
import { getMonitoringOverview } from "../../core/monitoring/service";
import type { MonitoringFilter } from "../../core/monitoring/service";

export function useMonitoringOverview(filters?: MonitoringFilter) {
  return useQuery({
    queryKey: ["monitoring", "overview", filters],
    queryFn: () => getMonitoringOverview(filters),
  });
}
