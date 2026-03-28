import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { readJSON, writeJSON } from '@/lib/data';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const carouselName = formData.get('carousel') || 'home-services';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = path.extname(file.name) || '.jpg';
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filename = `${Date.now()}-${safeName}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    const src = `/uploads/${filename}`;
    const all = readJSON('carousel.json') || {};

    if (!all[carouselName]) {
      all[carouselName] = { label: carouselName, images: [] };
    }

    const newImage = {
      id: `${Date.now()}`,
      src,
      alt: file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 ]/g, ' '),
      caption: '',
    };

    all[carouselName].images.push(newImage);
    writeJSON('carousel.json', all);

    return NextResponse.json({ success: true, image: newImage });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
