import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function GET() {
  const content = await readJSON('content.json');
  return NextResponse.json(content || {});
}

export async function PUT(request) {
  try {
    const body = await request.json();
    await writeJSON('content.json', body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Save content error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save content' }, { status: 500 });
  }
}
