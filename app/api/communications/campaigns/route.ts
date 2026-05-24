import { NextRequest, NextResponse } from 'next/server';
import { queueCampaign } from '@/core/communications/sender';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = await queueCampaign(body);
  return NextResponse.json({ id });
}
