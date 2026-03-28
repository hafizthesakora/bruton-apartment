import { NextResponse } from 'next/server';
import { readJSON } from '@/lib/data';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  const content = readJSON('content.json') || {};
  const result = page ? (content[page] || {}) : content;
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
