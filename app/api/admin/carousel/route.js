import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const all = readJSON('carousel.json') || {};
  if (name) {
    return NextResponse.json(all[name] || { label: name, images: [] });
  }
  return NextResponse.json(all);
}

export async function PUT(request) {
  try {
    const { name, carousel } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing carousel name' }, { status: 400 });
    const all = readJSON('carousel.json') || {};
    all[name] = carousel;
    writeJSON('carousel.json', all);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}

export async function POST(request) {
  // Create a new carousel
  try {
    const { name, label } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    const all = readJSON('carousel.json') || {};
    if (all[name]) return NextResponse.json({ error: 'Carousel already exists' }, { status: 409 });
    all[name] = { label: label || name, images: [] };
    writeJSON('carousel.json', all);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { name, imageId, deleteCarousel } = await request.json();
    const all = readJSON('carousel.json') || {};
    if (deleteCarousel) {
      delete all[name];
    } else {
      if (!all[name]) return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
      all[name].images = all[name].images.filter((img) => img.id !== imageId);
    }
    writeJSON('carousel.json', all);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
