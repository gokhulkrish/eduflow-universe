import { NextRequest, NextResponse } from 'next/server';
import { deletePreset } from '../../../../../src/core/registered-students/service';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  await deletePreset(params.id);
  return NextResponse.json({ ok: true });
}
