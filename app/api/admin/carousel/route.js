import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function GET() {
  const data = readJSON('carousel.json');
  return NextResponse.json(data || { images: [] });
}

export async function PUT(request) {
  try {
    const body = await request.json();
    writeJSON('carousel.json', body);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save carousel' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { id } = await request.json();
    const data = readJSON('carousel.json') || { images: [] };
    data.images = data.images.filter((img) => img.id !== id);
    writeJSON('carousel.json', data);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
