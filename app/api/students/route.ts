import { NextRequest, NextResponse } from 'next/server';
import { listStudents } from '../../../src/core/students/readModel';
import { createStudent } from '../../../src/core/students/service';
import { isFeatureEnabled } from '../../../src/config/featureToggles';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
  }

  const filter = {
    tenantId,
    classId: searchParams.get('classId') || undefined,
    sectionId: searchParams.get('sectionId') || undefined,
    status: searchParams.get('status') as any || undefined,
    search: searchParams.get('search') || undefined,
  };

  const students = await listStudents(filter);
  return NextResponse.json({ students });
}

export async function POST(req: NextRequest) {
  if (!isFeatureEnabled('useNewStudentWrites')) {
    return NextResponse.json({ error: 'New student write path disabled' }, { status: 400 });
  }

  const body = await req.json();
  const id = await createStudent(body);
  return NextResponse.json({ id }, { status: 201 });
}
