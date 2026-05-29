import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ImportRow {
  name: string;
  email: string;
  role: string;
  department: string;
  _valid?: boolean;
  _error?: string;
}

function parseCsv(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const nIdx = header.findIndex((h) => h === "name" || h === "full name" || h === "fullname");
  const eIdx = header.findIndex((h) => h === "email" || h === "e-mail" || h === "mail");
  const rIdx = header.findIndex((h) => h === "role" || h === "user role");
  const dIdx = header.findIndex((h) => h === "department" || h === "dept" || h === "departement");
  if (nIdx === -1 || eIdx === -1) return [];
  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    return {
      name: cols[nIdx] ?? "",
      email: cols[eIdx] ?? "",
      role: rIdx >= 0 ? (cols[rIdx] ?? "") : "",
      department: dIdx >= 0 ? (cols[dIdx] ?? "") : "",
    };
  }).filter((r) => r.name || r.email);
}

interface UserImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: ImportRow[]) => Promise<{ success: boolean; created: number; errors: string[] }>;
  availableRoles: string[];
}

export default function UserImportDialog({ open, onOpenChange, onImport, availableRoles }: UserImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [step, setStep] = useState<"upload" | "preview" | "result">("upload");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);
  const [roleMapping, setRoleMapping] = useState<string>("");

  const handleFile = (f: File) => {
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCsv(text);
      if (rows.length === 0) {
        toast.error("Could not parse CSV. Ensure first row has 'name,email' columns.");
        return;
      }
      const validated = rows.map((r) => {
        if (!r.name.trim()) return { ...r, _valid: false, _error: "Name required" };
        if (!r.email.trim()) return { ...r, _valid: false, _error: "Email required" };
        if (!r.email.includes("@")) return { ...r, _valid: false, _error: "Invalid email" };
        return { ...r, _valid: true };
      });
      setPreview(validated);
      setStep("preview");
      setResult(null);
    };
    reader.readAsText(f);
  };

  const doImport = async () => {
    setImporting(true);
    const valid = preview.filter((r) => r._valid);
    const mapped = valid.map((r) => ({
      ...r,
      role: r.role || roleMapping || "",
      department: r.department || "",
    }));
    const res = await onImport(mapped);
    setResult(res);
    setStep("result");
    setImporting(false);
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setStep("upload");
    setResult(null);
    setRoleMapping("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{step === "result" ? "Import Results" : "Import Users from CSV"}</DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 transition-colors hover:border-primary hover:bg-primary/5">
              <Upload className="h-8 w-8 text-primary" />
              <p className="text-sm font-semibold">{file ? file.name : "Drop CSV file here"}</p>
              <p className="text-xs text-muted-foreground">Requires "name, email" columns; optional "role, department"</p>
              <input ref={inputRef} type="file" className="hidden" accept=".csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </label>
            {availableRoles.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Default role for rows without a role column:</span>
                <select
                  name="importRole"
                  value={roleMapping}
                  onChange={(e) => setRoleMapping(e.target.value)}
                  className="h-8 rounded-lg border bg-background px-2 text-xs"
                >
                  <option value="">(no role)</option>
                  {availableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{preview.length} rows found. {preview.filter((r) => r._valid).length} valid.</p>
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Email</TableHead>
                    <TableHead className="text-xs">Role</TableHead>
                    <TableHead className="text-xs">Dept</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.email}</TableCell>
                      <TableCell className="text-xs">{r.role || "—"}</TableCell>
                      <TableCell className="text-xs">{r.department || "—"}</TableCell>
                      <TableCell>
                        {r._valid ? (
                          <Badge className="text-[9px] bg-success/15 text-success">Valid</Badge>
                        ) : (
                          <Badge className="text-[9px] bg-destructive/15 text-destructive">{r._error}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {step === "result" && result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              {result.errors.length === 0 ? (
                <CheckCircle className="h-8 w-8 text-success" />
              ) : (
                <AlertCircle className="h-8 w-8 text-warning" />
              )}
              <div>
                <p className="text-sm font-medium">{result.created} users created with pending status</p>
                {result.errors.length > 0 && (
                  <p className="text-xs text-destructive">{result.errors.length} errors</p>
                )}
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto text-xs text-destructive space-y-1">
                {result.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "upload" && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          )}
          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={doImport} disabled={importing || preview.filter((r) => r._valid).length === 0}>
                {importing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Import {preview.filter((r) => r._valid).length} rows
              </Button>
            </>
          )}
          {step === "result" && (
            <Button onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
