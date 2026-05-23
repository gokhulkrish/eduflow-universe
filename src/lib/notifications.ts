import { supabase } from "@/integrations/supabase/client";
import { fetchStudentRegister } from "@/lib/student-records";
import { tableExists } from "@/lib/supabase-health";

export type Notification = {
  id: string; user_id: string; title: string; body: string; type: string; is_read: boolean; meta: any; created_at: string;
};

export async function getMyNotifications(unreadOnly?: boolean): Promise<Notification[]> {
  if (!(await tableExists("notifications"))) return [];
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return [];
  let q = supabase.from("notifications").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(50);
  if (unreadOnly) q = q.eq("is_read", false);
  const { data } = await q;
  return (data ?? []) as Notification[];
}

export async function markAsRead(id: string): Promise<void> {
  if (!(await tableExists("notifications"))) return;
  await supabase.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllAsRead(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;
  if (!(await tableExists("notifications"))) return;
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", auth.user.id).eq("is_read", false);
}

export async function sendBroadcast(title: string, body: string, type: string, targets: string, targetFilter?: { grade?: string }): Promise<{ count: number }> {
  if (!(await tableExists("notifications"))) throw new Error("Notifications table not available");

  let userIds: string[] = [];

  if (targets === "students") {
    if (await tableExists("students")) {
      const { data: students } = await supabase.from("students").select("user_id");
      userIds = (students ?? []).map((s: any) => s.user_id).filter(Boolean);
      if (targetFilter?.grade) {
        const students = await fetchStudentRegister();
        const filtered = students.filter((s) => s.grade === targetFilter.grade);
        const filteredIds = new Set(filtered.map((s) => s.student_id));
        const { data: f } = await supabase.from("students").select("id,user_id").in("id", [...filteredIds]);
        userIds = (f ?? []).map((s: any) => s.user_id).filter(Boolean);
      }
    }
  } else if (targets === "staff") {
    if (await tableExists("staff")) {
      const { data: s } = await supabase.from("staff").select("user_id");
      userIds = (s ?? []).map((st: any) => st.user_id).filter(Boolean);
    }
  }

  if (userIds.length === 0) return { count: 0 };

  const inserts = userIds.map((uid) => ({ user_id: uid, title, body, type, meta: { broadcast: true } }));
  const { error } = await supabase.from("notifications").insert(inserts);
  if (error) throw error;
  return { count: userIds.length };
}

export async function getUnreadCount(): Promise<number> {
  if (!(await tableExists("notifications"))) return 0;
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return 0;
  const { count } = await supabase.from("notifications").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("is_read", false);
  return count ?? 0;
}
