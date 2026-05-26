import { UserCog } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { useDbList } from "@/hooks/useDbList";
import { Badge } from "@/components/ui/badge";

type Staff = {
  id: string;
  employee_no: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  department_id: string | null;
  designation: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export default function Staff() {
  const { data, loading } = useDbList<Staff>("staff", { order: { column: "created_at", ascending: false } });
  return (
    <div>
      <PageHeader title="Staff Directory" subtitle={`${data.length} staff members on roster`} icon={<UserCog className="h-6 w-6" />} />
      <DataTable rows={data} loading={loading} pageSize={10} columns={[
        { key: "employee_no", header: "Emp #", className: "font-mono text-xs" },
        { key: "full_name", header: "Name" },
        { key: "department_id", header: "Department" },
        { key: "designation", header: "Designation" },
        { key: "email", header: "Email", className: "text-xs" },
        { key: "phone", header: "Phone", className: "text-xs" },
        { key: "status", header: "Status", render: (s) => <Badge className="bg-success/15 text-success border-success/30 border">{s.status}</Badge> },
      ]} />
    </div>
  );
}
