import { NextRequest, NextResponse } from 'next/server';
import { attachFileToBatch, parseAndStageRows } from '../../../../../../src/core/imports/engine';

export async function POST(
  req: NextRequest,
  { params }: { params: { batchId: string } },
) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const ctx = {
    tenantId: formData.get('tenantId') as string || 'default',
    batchId: params.batchId,
    entityType: (formData.get('entityType') as any) || 'students',
    templateVersion: (formData.get('templateVersion') as string) || 'umis-legacy-v1',
    schemaVersion: (formData.get('schemaVersion') as string) || 'core-v1',
  };

  await attachFileToBatch(ctx, {
    storagePath: '',
    originalFilename: file.name,
    mimeType: file.type,
  });

  await parseAndStageRows(ctx, file);

  return NextResponse.json({ success: true, batchId: params.batchId, fileName: file.name });
}
