import { supabase } from "../../src/integrations/supabase/client";
import { tableExists } from "../../src/lib/supabase-health";

export interface RemarkTemplate {
  id?: string;
  name: string;
  category: string;
  minScore: number | null;
  maxScore: number | null;
  template: string;
  variables: string[];
  isDefault: boolean;
}

function rowToTemplate(row: any): RemarkTemplate {
  return {
    id: row.id,
    name: row.name ?? "",
    category: row.category ?? "",
    minScore: row.min_score ?? row.minScore ?? null,
    maxScore: row.max_score ?? row.maxScore ?? null,
    template: row.template ?? row.template_text ?? "",
    variables: typeof row.variables === "string" ? JSON.parse(row.variables) : (row.variables ?? []),
    isDefault: row.is_default ?? row.isDefault ?? false,
  };
}

function templateToRow(t: RemarkTemplate): Record<string, unknown> {
  return {
    name: t.name,
    category: t.category,
    min_score: t.minScore,
    max_score: t.maxScore,
    template: t.template,
    variables: t.variables,
    is_default: t.isDefault,
  };
}

export async function getRemarkTemplates(category?: string): Promise<RemarkTemplate[]> {
  if (!(await tableExists("remarks_templates"))) return [];
  let query = supabase.from("remarks_templates").select("*").order("name");
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToTemplate);
}

export async function saveRemarkTemplate(template: RemarkTemplate): Promise<RemarkTemplate> {
  const exists = await tableExists("remarks_templates");
  if (!exists) throw new Error("Run remarks migration first");

  const payload: any = templateToRow(template);

  if (template.id) {
    const { data, error } = await supabase
      .from("remarks_templates")
      .update(payload)
      .eq("id", template.id)
      .select()
      .single();
    if (error) throw error;
    return rowToTemplate(data);
  }

  const { data, error } = await supabase
    .from("remarks_templates")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return rowToTemplate(data);
}

export async function deleteRemarkTemplate(id: string): Promise<void> {
  if (!(await tableExists("remarks_templates"))) return;
  await supabase.from("remarks_templates").delete().eq("id", id);
}

export function generateRemark(
  template: RemarkTemplate,
  context: Record<string, string | number>,
): string {
  let result = template.template;
  for (const [key, value] of Object.entries(context)) {
    result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi"), String(value));
  }
  return result;
}

export function findMatchingTemplate(
  templates: RemarkTemplate[],
  score: number,
  category?: string,
): RemarkTemplate | null {
  const candidates = category
    ? templates.filter((t) => t.category === category)
    : templates;

  const exact = candidates.find(
    (t) =>
      (t.minScore === null || score >= t.minScore) &&
      (t.maxScore === null || score <= t.maxScore),
  );
  if (exact) return exact;

  const default_ = candidates.find((t) => t.isDefault);
  if (default_) return default_;

  return null;
}

export const DEFAULT_REMARK_TEMPLATES: Omit<RemarkTemplate, "id">[] = [
  { name: "Excellent", category: "academic", minScore: 90, maxScore: 100, template: "Excellent performance with {{score}}%. {{student_name}} shows outstanding understanding.", variables: ["score", "student_name"], isDefault: false },
  { name: "Good", category: "academic", minScore: 75, maxScore: 89, template: "Good performance with {{score}}%. {{student_name}} should maintain consistency.", variables: ["score", "student_name"], isDefault: false },
  { name: "Average", category: "academic", minScore: 50, maxScore: 74, template: "Average performance with {{score}}%. {{student_name}} needs more practice.", variables: ["score", "student_name"], isDefault: true },
  { name: "Needs Improvement", category: "academic", minScore: 35, maxScore: 49, template: "Needs improvement with {{score}}%. {{student_name}} requires additional support.", variables: ["score", "student_name"], isDefault: false },
  { name: "Concern", category: "academic", minScore: 0, maxScore: 34, template: "Significant concern with {{score}}%. Remedial intervention required.", variables: ["score", "student_name"], isDefault: false },
];
