export type LegacyTransportRoute = {
  id: string;
  routeNo: string;
  name: string;
  driverName: string | null;
  driverPhone: string | null;
  vehicleNo: string | null;
  capacity: number;
  fare: number;
};

export type LegacyTransportFilter = {
  routeNo?: string;
};

export async function listTransportRoutesLegacy(filter: LegacyTransportFilter = {}): Promise<LegacyTransportRoute[]> {
  const { supabase } = await import("../../src/integrations/supabase/client");
  let q = supabase.from("transport_routes" as never).select("*");
  if (filter.routeNo) q = (q as any).eq("route_no", filter.routeNo);
  q = (q as any).order("route_no", { ascending: true });

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id ?? ""),
    routeNo: String(r.route_no ?? ""),
    name: String(r.name ?? ""),
    driverName: r.driver_name ? String(r.driver_name) : null,
    driverPhone: r.driver_phone ? String(r.driver_phone) : null,
    vehicleNo: r.vehicle_no ? String(r.vehicle_no) : null,
    capacity: Number(r.capacity ?? 0),
    fare: Number(r.fare ?? 0),
  }));
}
