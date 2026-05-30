import { supabase } from "@/integrations/supabase/client";
import { emitAppSync } from "@/lib/app-sync";
import { tableExists } from "@/lib/supabase-health";
import { generateId } from "@/lib/utils";

export type Quiz = { id: string; title: string; questions: { q: string; options: string[]; correct: number }[]; class_id: string; time_limit: number; created_at: string; };

export const quizzesKey = "eduflow_quizzes";

function ls(): Quiz[] { try { return JSON.parse(localStorage.getItem(quizzesKey) ?? "[]"); } catch { return []; } }
function ss(v: Quiz[]) { localStorage.setItem(quizzesKey, JSON.stringify(v)); emitAppSync(quizzesKey); }

export async function getQuizzes(): Promise<Quiz[]> {
  const local = ls();
  try {
    if (!(await tableExists("quizzes"))) return local;
    const { data } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      const mapped: Quiz[] = data.map((r: any) => ({
        id: r.id, title: r.title, questions: r.questions ?? [],
        class_id: r.class_id ?? "", time_limit: r.time_limit ?? 5,
        created_at: r.created_at,
      }));
      ss(mapped);
      return mapped;
    }
  } catch { /* fall through */ }
  return local;
}

export async function createQuiz(q: Omit<Quiz, "id" | "created_at">): Promise<Quiz> {
  const n: Quiz = { ...q, id: generateId(), created_at: new Date().toISOString() };
  try {
    if (await tableExists("quizzes")) {
      const { data } = await supabase.from("quizzes").insert({
        title: q.title, questions: q.questions,
        class_id: q.class_id, time_limit: q.time_limit,
      }).select().single();
      if (data) n.id = data.id;
    }
  } catch { /* fall through */ }
  const items = ls();
  items.unshift(n); ss(items); return n;
}

export async function deleteQuiz(id: string) {
  try {
    if (await tableExists("quizzes")) {
      await supabase.from("quizzes").delete().eq("id", id);
    }
  } catch { /* fall through */ }
  ss(ls().filter((x) => x.id !== id));
}
