import { Award } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { useDbList } from "@/hooks/useDbList";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Tpl = { id: string; code: string; name: string; body: string; active: boolean };
type Req = { id: string; template_id: string; student_id: string; status: string; purpose: string|null; qr_token: string; created_at: string };

const tone: Record<string,string> = {
  requested: "bg-muted text-foreground",
  approved: "bg-primary/15 text-primary border-primary/30",
  issued: "bg-success/15 text-success border-success/30",
  revoked: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Certificates() {
  const { data: templates, loading: lt } = useDbList<Tpl>("certificate_templates");
  const { data: requests, loading: lr } = useDbList<Req>("certificate_requests", { order: { column: "created_at", ascending: false } });

  return (
    <div>
      <PageHeader title="Certificates Engine" subtitle="Templates, requests, approval & QR verification" icon={<Award className="h-6 w-6" />} />
      <Tabs defaultValue="templates">
        <TabsList><TabsTrigger value="templates">Templates</TabsTrigger><TabsTrigger value="requests">Requests</TabsTrigger></TabsList>
        <TabsContent value="templates" className="mt-4">
          <DataTable rows={templates} loading={lt} columns={[
            { key: "code", header: "Code", className: "font-mono text-xs" },
            { key: "name", header: "Name" },
            { key: "body", header: "Body Preview", render: r => <span className="line-clamp-1 text-xs text-muted-foreground">{r.body}</span> },
            { key: "active", header: "Active", render: r => <Badge variant={r.active ? "default" : "secondary"}>{r.active ? "Yes" : "No"}</Badge> },
          ]} />
        </TabsContent>
        <TabsContent value="requests" className="mt-4">
          <DataTable rows={requests} loading={lr} empty="No certificate requests yet." columns={[
            { key: "qr_token", header: "Token", className: "font-mono text-[10px]", render: r => r.qr_token.slice(0,12)+"…" },
            { key: "template_id", header: "Template ID", className: "font-mono text-xs" },
            { key: "purpose", header: "Purpose" },
            { key: "status", header: "Status", render: r => <Badge className={`border ${tone[r.status] ?? ""}`}>{r.status}</Badge> },
            { key: "created_at", header: "Requested", render: r => new Date(r.created_at).toLocaleString() },
          ]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
