import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function GET() {
  const content = readJSON('content.json');
  return NextResponse.json(content || {});
}

export async function PUT(request) {
  try {
    const body = await request.json();
    writeJSON('content.json', body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save content' }, { status: 500 });
  }
}
