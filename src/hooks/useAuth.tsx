import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin" | "admin" | "principal" | "hod" | "faculty" | "staff"
  | "finance" | "scholarship" | "certificate" | "librarian"
  | "hostel_warden" | "transport" | "student" | "parent"
  | "it_admin" | "it_technician" | "it_lab_incharge" | "iot_operator";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  mfaRequired: boolean;
  mfaPassed: boolean;
  loading: boolean;
  setMfaPassed: (v: boolean) => void;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

const MFA_ROLES: AppRole[] = ["super_admin", "admin", "principal", "finance", "scholarship", "certificate"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [mfaPassed, setMfaPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRoles = async (uid: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    setRoles((data ?? []).map((r) => r.role as AppRole));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => loadRoles(s.user.id), 0);
      else { setRoles([]); setMfaPassed(false); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadRoles(data.session.user.id);
      setLoading(false);
    });
    const passed = sessionStorage.getItem("nge-mfa-passed");
    if (passed === "1") setMfaPassed(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    sessionStorage.setItem("nge-mfa-passed", mfaPassed ? "1" : "0");
  }, [mfaPassed]);

  const mfaRequired = roles.some((r) => MFA_ROLES.includes(r));

  return (
    <Ctx.Provider value={{
      user, session, roles, mfaRequired, mfaPassed, loading,
      setMfaPassed,
      signOut: async () => { await supabase.auth.signOut(); setMfaPassed(false); },
      refreshRoles: async () => user && loadRoles(user.id),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside provider");
  return v;
};
