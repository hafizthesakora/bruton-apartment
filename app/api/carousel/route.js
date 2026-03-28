import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/data';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name') || 'home-services';
  const all = readJSON('carousel.json') || {};
  const carousel = all[name] || { label: name, images: [] };
  return NextResponse.json(carousel, { headers: { 'Cache-Control': 'no-store' } });
}
