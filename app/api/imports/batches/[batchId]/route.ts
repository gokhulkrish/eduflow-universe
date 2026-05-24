import { NextRequest, NextResponse } from 'next/server';
import { getImportBatchById } from '../../../../../src/lib/import-engine/batch';

export async function GET(
  _req: NextRequest,
  { params }: { params: { batchId: string } },
) {
  const batch = await getImportBatchById(params.batchId);
  if (!batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }
  return NextResponse.json({ batch });
}
