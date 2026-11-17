import { guard } from '@/lib/auth/staff';
import { NextResponse } from 'next/server';
import { updateJSON } from '@/lib/data';
import { MAX_IMAGE_BYTES } from '@/lib/uploads';

const USE_BLOB = !!process.env.BLOB_READ_WRITE_TOKEN;

async function storeFile(filename, buffer, contentType) {
  if (USE_BLOB) {
    const { put } = await import('@vercel/blob');
    const blob = await put(`uploads/${filename}`, buffer, {
      access: 'public',
      contentType,
    });
    return blob.url;
  }
  // Local file system
  const { writeFile, mkdir } = await import('fs/promises');
  const path = await import('path');
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/${filename}`;
}

export const POST = guard('content', 'full', async (request) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const carouselName = formData.get('carousel') || 'home-services';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
    }

    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: 'Image is over 4 MB — please resize it' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filename = `${Date.now()}-${safeName}`;

    const src = await storeFile(filename, buffer, file.type);

    const newImage = {
      id: `${Date.now()}`,
      src,
      alt: file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9 ]/g, ' '),
      caption: '',
    };

    await updateJSON('carousel.json', (all) => {
      if (!all[carouselName]) all[carouselName] = { label: carouselName, images: [] };
      all[carouselName].images.push(newImage);
      return all;
    });

    return NextResponse.json({ success: true, image: newImage });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 });
  }
});
