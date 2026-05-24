import { NextRequest, NextResponse } from 'next/server';
import { buildLocalSearchIndex, searchLocalWorkspace } from '../../../../src/core/search/service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';

  buildLocalSearchIndex();
  const results = searchLocalWorkspace(q);

  return NextResponse.json({ results });
}
