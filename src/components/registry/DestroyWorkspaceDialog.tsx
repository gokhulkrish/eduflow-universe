import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { performDestroy, type DestroySection } from "@/lib/workspace-destroy";

const DESTROY_WORD = "DESTROY";

interface ToggleItem {
  section: DestroySection;
  label: string;
  defaultChecked: boolean;
}

const TOGGLES: ToggleItem[] = [
  { section: "students", label: "Student records", defaultChecked: true },
  { section: "settings", label: "App meta / settings", defaultChecked: true },
  { section: "batches", label: "Import batches", defaultChecked: true },
  { section: "headers", label: "Headers / header meta / groups", defaultChecked: true },
  { section: "erp", label: "ERP modules, records, automations", defaultChecked: true },
  { section: "local", label: "All localStorage keys", defaultChecked: false },
];

export function DestroyWorkspaceDialog() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [toggles, setToggles] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(TOGGLES.map((t) => [t.section, t.defaultChecked]))
  );

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("sms:open-destroy-modal", handler);
    return () => window.removeEventListener("sms:open-destroy-modal", handler);
  }, []);

  const canDestroy = confirmText.toUpperCase() === DESTROY_WORD;
  const enabled = TOGGLES.filter((t) => toggles[t.section]).map((t) => t.section);

  function handleToggle(section: string, checked: boolean) {
    setToggles((prev) => ({ ...prev, [section]: checked }));
  }

  function handleDestroy() {
    if (!canDestroy || enabled.length === 0) return;
    performDestroy(enabled);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Destroy Workspace Data
          </DialogTitle>
          <DialogDescription>
            This action permanently removes the selected data from local storage. It cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {TOGGLES.map((t) => (
            <div key={t.section} className="flex items-center gap-2">
              <input
                id={`destroy-${t.section}`}
                type="checkbox"
                checked={toggles[t.section] ?? false}
                onChange={(e) => handleToggle(t.section, e.target.checked)}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor={`destroy-${t.section}`} className="text-sm cursor-pointer">
                {t.label}
              </Label>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <Label htmlFor="destroyConfirmInput" className="text-xs text-muted-foreground">
            Type <span className="font-mono font-bold text-destructive">{DESTROY_WORD}</span> to confirm
          </Label>
          <Input
            id="destroyConfirmInput"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={DESTROY_WORD}
            className="font-mono text-sm"
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => { setOpen(false); setConfirmText(""); }}>
            Cancel
          </Button>
          <Button
            id="destroyOkBtn"
            variant="destructive"
            size="sm"
            disabled={!canDestroy || enabled.length === 0}
            onClick={handleDestroy}
          >
            Destroy
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
