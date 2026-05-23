import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseClient } from '../../../../lib/supabase';
import { getModuleDefinition, getModuleTableName, toCamelCase } from '../../../../lib/module-registry';
import { moduleSchemas } from '../../../../lib/validations';

function json(data, status = 200) { return NextResponse.json(data, { status }); }

async function contextFor(moduleKey: string) {
  const definition = getModuleDefinition(moduleKey);
  if (!definition) return null;
  const schemaKey = toCamelCase(moduleKey) as keyof typeof moduleSchemas;
  const schemaSet = moduleSchemas[schemaKey];
  if (!schemaSet) return null;
  return { definition, schemaSet, tableName: getModuleTableName(moduleKey) };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ module: string; id: string }> | { module: string; id: string } }) {
  const params = await Promise.resolve(context.params);
  const resolved = await contextFor(params.module);
  if (!resolved) return json({ data: null, error: "Module not found", meta: { page: 1, limit: 0, total: 0 } }, 404);
  const client = createSupabaseClient();
  if (!client) return json({ data: null, error: "Supabase client not configured", meta: { page: 1, limit: 0, total: 0 } }, 503);
  const { data, error } = await client.from(resolved.tableName).select("*").eq("id", params.id).is("deleted_at", null).single();
  if (error) return json({ data: null, error: error.message, meta: { page: 1, limit: 1, total: 0 } }, 404);
  return json({ data, error: null, meta: { page: 1, limit: 1, total: 1 } });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ module: string; id: string }> | { module: string; id: string } }) {
  const params = await Promise.resolve(context.params);
  const resolved = await contextFor(params.module);
  if (!resolved) return json({ data: null, error: "Module not found", meta: { page: 1, limit: 0, total: 0 } }, 404);
  const client = createSupabaseClient();
  if (!client) return json({ data: null, error: "Supabase client not configured", meta: { page: 1, limit: 0, total: 0 } }, 503);
  try {
    const body = await request.json();
    const parsed = resolved.schemaSet.update.parse(body);
    const { data, error } = await client.from(resolved.tableName).update({ ...parsed, updated_at: new Date().toISOString() }).eq("id", params.id).select("*").single();
    if (error) return json({ data: null, error: error.message, meta: { page: 1, limit: 0, total: 0 } }, 400);
    return json({ data, error: null, meta: { page: 1, limit: 1, total: 1 } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ data: null, error: message, meta: { page: 1, limit: 0, total: 0 } }, 400);
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ module: string; id: string }> | { module: string; id: string } }) {
  const params = await Promise.resolve(context.params);
  const resolved = await contextFor(params.module);
  if (!resolved) return json({ data: null, error: "Module not found", meta: { page: 1, limit: 0, total: 0 } }, 404);
  const client = createSupabaseClient();
  if (!client) return json({ data: null, error: "Supabase client not configured", meta: { page: 1, limit: 0, total: 0 } }, 503);
  const { data, error } = await client.from(resolved.tableName).update({ deleted_at: new Date().toISOString() }).eq("id", params.id).select("*").single();
  if (error) return json({ data: null, error: error.message, meta: { page: 1, limit: 0, total: 0 } }, 400);
  return json({ data, error: null, meta: { page: 1, limit: 1, total: 1 } });
}
