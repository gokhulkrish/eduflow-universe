import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { tableExists } from "@/lib/supabase-health";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Demo MFA: 6-digit code, accepts 123456 in dev; in prod swap for TOTP/email OTP via edge function.
const DEMO_CODE = "123456";

export default function Mfa() {
  const nav = useNavigate();
  const { user, setMfaPassed, signOut } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const verify = async () => {
    if (code.length !== 6) return;
    setBusy(true);
    if (code === DEMO_CODE) {
      setMfaPassed(true);
      if (user) {
        if (await tableExists("audit_log")) {
          await supabase.from("audit_log").insert({
            actor: user.id, action: "mfa.verify", entity: "auth_session", metadata: { method: "demo_otp" },
          });
        }
        if (await tableExists("profiles")) {
          await supabase.from("profiles").update({ mfa_enrolled: true }).eq("id", user.id);
        }
      }
      toast.success("MFA verified");
      nav("/", { replace: true });
    } else {
      toast.error("Invalid code");
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background mesh-bg p-4">
      <Card className="glass w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">Two-factor verification</h1>
            <p className="text-xs text-muted-foreground">Your role requires step-up authentication.</p>
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs">
            Demo environment — use code <span className="font-mono font-bold">123456</span>. Wire to TOTP/email OTP in production.
          </div>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map((i) => <InputOTPSlot key={i} index={i} />)}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button onClick={verify} disabled={busy || code.length !== 6} className="w-full bg-gradient-primary shadow-glow hover:opacity-90">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & continue"}
          </Button>
          <Button variant="ghost" onClick={async () => { await signOut(); nav("/auth"); }} className="w-full">
            Cancel & sign out
          </Button>
        </div>
      </Card>
    </div>
  );
}
