import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function GET() {
  const settings = await readJSON('settings.json') || {};
  return NextResponse.json(settings);
}

export async function PUT(request) {
  try {
    const body = await request.json();
    await writeJSON('settings.json', body);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Settings save error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save settings' }, { status: 500 });
  }
}
