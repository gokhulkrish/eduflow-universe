import { NextRequest, NextResponse } from 'next/server';
import { applyBatch } from '../../../../../../src/core/imports/engine';
import { studentsImportConfig } from '../../../../../../src/core/imports/config/studentsImportConfig';

export async function POST(
  req: NextRequest,
  { params }: { params: { batchId: string } },
) {
  const body = await req.json();
  const entityType = (body.entityType as string) || 'students';

  const ctx = {
    tenantId: body.tenantId || 'default',
    batchId: params.batchId,
    entityType: entityType as any,
    templateVersion: body.templateVersion || 'umis-legacy-v1',
    schemaVersion: body.schemaVersion || 'core-v1',
  };

  const configMap: Record<string, any> = {
    students: studentsImportConfig,
  };

  const config = configMap[entityType];
  if (!config) {
    return NextResponse.json({ error: `No config for entity type: ${entityType}` }, { status: 400 });
  }

  await applyBatch(ctx, config);
  return NextResponse.json({ success: true, batchId: params.batchId });
}
