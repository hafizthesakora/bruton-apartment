import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/data';

export async function GET() {
  const data = readJSON('carousel.json') || { images: [] };
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
