import { NextRequest, NextResponse } from 'next/server';
import { getStudentById } from '../../../../src/core/students/readModel';
import { updateStudent, deactivateStudent } from '../../../../src/core/students/service';
import { isFeatureEnabled } from '../../../../src/config/featureToggles';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const student = await getStudentById(tenantId, params.id);
  if (!student) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ student });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isFeatureEnabled('useNewStudentWrites')) {
    return NextResponse.json({ error: 'New student write path disabled' }, { status: 400 });
  }

  const body = await req.json();
  await updateStudent({ ...body, id: params.id });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!isFeatureEnabled('useNewStudentWrites')) {
    return NextResponse.json({ error: 'New student write path disabled' }, { status: 400 });
  }

  const body = await req.json();
  await deactivateStudent({ tenantId: body.tenantId, id: params.id, leftOn: body.leftOn });
  return NextResponse.json({ ok: true });
}
