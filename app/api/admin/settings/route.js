import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function GET() {
  const settings = readJSON('settings.json') || {};
  return NextResponse.json(settings);
}

export async function PUT(request) {
  try {
    const body = await request.json();
    writeJSON('settings.json', body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
