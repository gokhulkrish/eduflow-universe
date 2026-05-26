import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GraduationCap, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  name: z.string().trim().min(2).max(80).optional(),
});

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parse = schema.safeParse({ email, password, name: mode === "signup" ? name : undefined });
    if (!parse.success) return toast.error(parse.error.issues[0].message);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/`, data: { display_name: name } },
        });
        if (error) throw error;
        toast.success("Account created. Check email to verify, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav("/", { replace: true });
      }
    } catch (e: any) {
      toast.error(e.message ?? "Auth failed");
    } finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background mesh-bg p-4">
      <Card className="glass w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold">GCT ERP</h1>
            <p className="text-xs text-muted-foreground">Secure campus workspace access</p>
          </div>
        </div>
        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>
          <form onSubmit={submit} className="mt-5 space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" maxLength={80} />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gct.ac.in" maxLength={255} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" maxLength={72} required />
            </div>
            <Button type="submit" disabled={busy} className="w-full bg-gradient-primary shadow-glow hover:opacity-90">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
            <TabsContent value="signin" className="mt-0">
              <p className="text-center text-[11px] text-muted-foreground">
                Sensitive roles require MFA after sign-in.
              </p>
            </TabsContent>
            <TabsContent value="signup" className="mt-0">
              <p className="text-center text-[11px] text-muted-foreground">
                New accounts start as <span className="font-semibold">Student</span>. A Super Admin can elevate roles.
              </p>
            </TabsContent>
          </form>
        </Tabs>
      </Card>
    </div>
  );
}
