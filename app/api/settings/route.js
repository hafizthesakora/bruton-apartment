import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/data';

// Public settings endpoint (non-sensitive)
export async function GET() {
  const settings = readJSON('settings.json') || {};
  const { design, siteName } = settings;
  return NextResponse.json({ design, siteName }, { headers: { 'Cache-Control': 'no-store' } });
}
