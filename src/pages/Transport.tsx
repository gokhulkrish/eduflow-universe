import { Bus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { useDbList } from "@/hooks/useDbList";
import { Badge } from "@/components/ui/badge";

type Route = { id: string; route_no: string; name: string; driver_name: string|null; driver_phone: string|null; vehicle_no: string|null; capacity: number; fare: number };

export default function Transport() {
  const { data, loading } = useDbList<Route>("transport_routes");
  return (
    <div>
      <PageHeader title="Transport Routes" subtitle={`${data.length} active routes`} icon={<Bus className="h-6 w-6" />} />
      <DataTable rows={data} loading={loading} columns={[
        { key: "route_no", header: "Route #", className: "font-mono" },
        { key: "name", header: "Name" },
        { key: "vehicle_no", header: "Vehicle", className: "font-mono text-xs" },
        { key: "driver_name", header: "Driver" },
        { key: "driver_phone", header: "Phone", className: "text-xs" },
        { key: "capacity", header: "Capacity" },
        { key: "fare", header: "Fare", render: r => <Badge variant="secondary">₹{Number(r.fare).toLocaleString()}</Badge> },
      ]} />
    </div>
  );
}
