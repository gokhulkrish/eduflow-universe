import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseClient } from '../../../lib/supabase';
import { getModuleDefinition, getModuleTableName, moduleLookup, toCamelCase } from '../../../lib/module-registry';
import { moduleSchemas } from '../../../lib/validations';

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

async function resolveModuleContext(moduleKey: string) {
  const definition = getModuleDefinition(moduleKey);
  if (!definition) return null;
  const schemaKey = toCamelCase(moduleKey) as keyof typeof moduleSchemas;
  const schemaSet = moduleSchemas[schemaKey];
  if (!schemaSet) return null;
  return { definition, schemaSet, tableName: getModuleTableName(moduleKey) };
}

async function ensureRegistryRow(moduleKey: string) {
  const client = createSupabaseClient();
  if (!client) throw new Error("Missing Supabase configuration");
  const definition = getModuleDefinition(moduleKey);
  if (!definition) throw new Error(`Unknown module: ${moduleKey}`);
  const existing = await client.from("module_registry").select("id").eq("module_key", moduleKey).maybeSingle();
  if (existing.data?.id) return existing.data.id as string;
  const insert = await client.from("module_registry").insert({
    module_key: definition.key,
    label: definition.label,
    kind: definition.kind,
    status: definition.status || null,
    category: definition.category || null,
    domain_key: definition.domainKey || null,
    domain_label: definition.domainLabel || null,
    description: definition.description || null,
    launch_type: definition.launchType || null,
    section_id: definition.sectionId || null,
    tab_key: definition.tabKey || null,
    step: definition.step || null,
    tab_id: definition.tabId || null,
    module_ref: definition.moduleKey || null,
    workspace_key: definition.workspaceKey || null,
    route: definition.route || null,
    renderer: definition.renderer || null,
    source_line: definition.sourceLine || null,
    submodules: definition.submodules,
    fields: definition.fields,
  }).select("id").single();
  if (insert.error) throw insert.error;
  return insert.data.id as string;
}

export async function GET(request: NextRequest, context: { params: Promise<{ module: string }> | { module: string } }) {
  const params = await Promise.resolve(context.params);
  const moduleKey = params.module;
  const resolved = await resolveModuleContext(moduleKey);
  if (!resolved) return json({ data: null, error: "Module not found", meta: { page: 1, limit: 0, total: 0 } }, 404);
  const client = createSupabaseClient();
  if (!client) return json({ data: null, error: "Supabase client not configured", meta: { page: 1, limit: 0, total: 0 } }, 503);
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
  const search = searchParams.get("search")?.trim() || "";
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const query = client.from(resolved.tableName).select("*", { count: "exact" }).is("deleted_at", null).order("updated_at", { ascending: false }).range(from, to);
  if (search) query.ilike("record_title", `%${search}%`);
  const { data, error, count } = await query;
  if (error) return json({ data: null, error: error.message, meta: { page, limit, total: 0 } }, 500);
  return json({ data, error: null, meta: { page, limit, total: count || 0 } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ module: string }> | { module: string } }) {
  const params = await Promise.resolve(context.params);
  const moduleKey = params.module;
  const resolved = await resolveModuleContext(moduleKey);
  if (!resolved) return json({ data: null, error: "Module not found", meta: { page: 1, limit: 0, total: 0 } }, 404);
  const client = createSupabaseClient();
  if (!client) return json({ data: null, error: "Supabase client not configured", meta: { page: 1, limit: 0, total: 0 } }, 503);
  try {
    const body = await request.json();
    const moduleRegistryId = await ensureRegistryRow(moduleKey);
    const parsed = resolved.schemaSet.insert.parse({ ...body, module_registry_id: moduleRegistryId, module_key: moduleKey });
    const insert = await client.from(resolved.tableName).insert(parsed).select("*").single();
    if (insert.error) return json({ data: null, error: insert.error.message, meta: { page: 1, limit: 0, total: 0 } }, 400);
    return json({ data: insert.data, error: null, meta: { page: 1, limit: 1, total: 1 } }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ data: null, error: message, meta: { page: 1, limit: 0, total: 0 } }, 400);
  }
}
