import { NextRequest, NextResponse } from 'next/server';
import { sendMessage } from '@/core/communications/sender';

export async function POST(req: NextRequest) {
  const body = await req.json();
  await sendMessage(body);
  return NextResponse.json({ ok: true });
}
