import { useState } from "react";
import { Mail, Copy, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface UserInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string, role: string, department: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  availableRoles: string[];
  inviterEmail: string;
}

export default function UserInviteDialog({ open, onOpenChange, onInvite, availableRoles, inviterEmail }: UserInviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [sending, setSending] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const doInvite = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Valid email required");
      return;
    }
    setSending(true);
    const result = await onInvite(email.trim(), role, department);
    setSending(false);
    if (!result.success || !result.token) {
      toast.error(result.error ?? "Failed to create invitation");
      return;
    }
    const link = `${window.location.origin}/register?invite=${result.token}`;
    setInviteLink(link);
    toast.success("Invitation created");
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const reset = () => {
    setEmail("");
    setRole("");
    setDepartment("");
    setInviteLink(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
        {!inviteLink ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Create an invitation link to share with the user. They will complete their own registration.
            </p>
            <div>
              <Label className="text-xs" htmlFor="invEmail">Email</Label>
              <Input id="invEmail" name="invEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs" htmlFor="invRole">Role</Label>
                <Select name="invRole" value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs" htmlFor="invDept">Department</Label>
                <Input id="invDept" name="invDept" value={department} onChange={(e) => setDepartment(e.target.value)} />
              </div>
            </div>
            {inviterEmail && (
              <p className="text-[10px] text-muted-foreground">Invited by: {inviterEmail}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg border">
              <CheckCircle className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm font-medium">Invitation created</p>
                <p className="text-xs text-muted-foreground">Share this link with {email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={inviteLink} className="text-xs" />
              <Button size="sm" variant="outline" className="shrink-0" onClick={copyLink}>
                {copied ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Link expires in 7 days. You can also send this link manually.</p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Close</Button>
          {!inviteLink && (
            <Button onClick={doInvite} disabled={sending || !email.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Mail className="h-4 w-4 mr-1" />}
              Generate Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
