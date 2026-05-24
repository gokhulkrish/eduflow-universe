import { NextRequest, NextResponse } from 'next/server';
import { createImportBatch, listBatches } from '../../../../src/core/imports/engine';
import { isFeatureEnabled } from '../../../../src/config/featureToggles';

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('useNewImportEngine')) {
    return NextResponse.json({ error: 'New import engine disabled' }, { status: 400 });
  }

  const body = await req.json();
  const { tenantId, entityType, name, matchKey, templateVersion, schemaVersion, options } = body;

  const batch = await createImportBatch({
    tenantId: tenantId || 'default',
    entityType: entityType || 'students',
    name: name || 'Untitled Batch',
    matchKey,
    templateVersion: templateVersion || 'umis-legacy-v1',
    schemaVersion: schemaVersion || 'core-v1',
    options: options || {},
  });

  return NextResponse.json({ batch });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId') || undefined;
  const batches = await listBatches(tenantId);
  return NextResponse.json({ batches });
}
