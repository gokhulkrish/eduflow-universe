import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    // For now, server-side PDF generation is a placeholder.
    // Return 501 to indicate not implemented, so callers fallback to client-side.
    return NextResponse.json({ success: false, message: 'Server-side PDF generation not implemented on this deployment.' }, { status: 501 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
