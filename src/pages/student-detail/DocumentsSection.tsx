import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Upload, Trash2, Download } from "lucide-react";
import { generateId } from "@/lib/utils";
import { toast } from "sonner";

interface Document {
  id: string;
  studentId: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

const STORAGE_KEY = "sms.student-documents.v1";

function loadDocs(): Document[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveDocs(docs: Document[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

interface Props { studentId: string; }

export default function DocumentsSection({ studentId }: Props) {
  const [docs, setDocs] = useState<Document[]>([]);

  useEffect(() => {
    setDocs(loadDocs().filter((d) => d.studentId === studentId));
  }, [studentId]);

  const handleUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const doc: Document = {
        id: generateId(),
        studentId,
        name: file.name,
        type: file.type || "application/octet-stream",
        uploadedAt: new Date().toISOString(),
        size: `${(file.size / 1024).toFixed(1)} KB`,
      };
      const all = loadDocs();
      all.push(doc);
      saveDocs(all);
      setDocs(all.filter((d) => d.studentId === studentId));
      toast.success(`"${file.name}" uploaded`);
    };
    input.click();
  };

  const handleDelete = (id: string) => {
    const all = loadDocs().filter((d) => d.id !== id);
    saveDocs(all);
    setDocs(all.filter((d) => d.studentId === studentId));
    toast.success("Document removed");
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Documents</CardTitle>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-xs rounded-xl" onClick={handleUpload}>
            <Upload className="mr-1.5 h-3.5 w-3.5" /> Upload
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {docs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <FileText className="h-8 w-8 opacity-30" />
            <p>No documents uploaded yet.</p>
            <p className="text-xs">Upload student documents like ID proofs, mark sheets, or photos.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {[...docs].reverse().map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm">{doc.name}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span>{doc.size}</span>
                      <span>·</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="outline" className="text-[9px] px-1 py-0 leading-tight text-muted-foreground">{doc.type.split("/").pop()}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info("Download in production would serve the file")} title="Download">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(doc.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
