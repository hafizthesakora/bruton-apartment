import { NextResponse } from 'next/server';
import { readJSON, writeJSON } from '@/lib/data';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');
  const all = await readJSON('carousel.json') || {};
  if (name) return NextResponse.json(all[name] || { label: name, images: [] });
  return NextResponse.json(all);
}

export async function PUT(request) {
  try {
    const { name, carousel } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing carousel name' }, { status: 400 });
    const all = await readJSON('carousel.json') || {};
    all[name] = carousel;
    await writeJSON('carousel.json', all);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Carousel PUT error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to save' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { name, label } = await request.json();
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    const all = await readJSON('carousel.json') || {};
    if (all[name]) return NextResponse.json({ error: 'Carousel already exists' }, { status: 409 });
    all[name] = { label: label || name, images: [] };
    await writeJSON('carousel.json', all);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Carousel POST error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { name, imageId, deleteCarousel } = await request.json();
    const all = await readJSON('carousel.json') || {};
    if (deleteCarousel) {
      delete all[name];
    } else {
      if (!all[name]) return NextResponse.json({ error: 'Carousel not found' }, { status: 404 });
      all[name].images = all[name].images.filter((img) => img.id !== imageId);
    }
    await writeJSON('carousel.json', all);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Carousel DELETE error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to delete' }, { status: 500 });
  }
}
