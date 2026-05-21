import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { useDbList } from "@/hooks/useDbList";
import { Badge } from "@/components/ui/badge";

type Staff = { id: string; employee_no: string; first_name: string; last_name: string|null; email: string|null; phone: string|null; department: string|null; designation: string|null; status: string; date_of_joining: string|null };

export default function Staff() {
  const { data, loading } = useDbList<Staff>("staff", { order: { column: "created_at", ascending: false } });
  return (
    <div>
      <PageHeader title="Staff Directory" subtitle={`${data.length} staff members on roster`} icon={<UserCog className="h-6 w-6" />} />
      <DataTable rows={data} loading={loading} columns={[
        { key: "employee_no", header: "Emp #", className: "font-mono text-xs" },
        { key: "name", header: "Name", render: (s) => `${s.first_name} ${s.last_name ?? ""}`.trim() },
        { key: "department", header: "Department" },
        { key: "designation", header: "Designation" },
        { key: "email", header: "Email", className: "text-xs" },
        { key: "phone", header: "Phone", className: "text-xs" },
        { key: "status", header: "Status", render: (s) => <Badge className="bg-success/15 text-success border-success/30 border">{s.status}</Badge> },
      ]} />
    </div>
  );
}
