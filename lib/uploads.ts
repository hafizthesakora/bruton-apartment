/** Store an uploaded image: Vercel Blob when configured, else public/uploads (local dev). */
export const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // Vercel request bodies are capped at 4.5 MB

export async function storeImage(file: File, folder = 'uploads') {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Only JPEG, PNG, WebP or GIF images');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Image is over 4 MB — please resize it');
  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    return (await put(`${folder}/${filename}`, buffer, { access: 'public', contentType: file.type })).url;
  }
  const { writeFile, mkdir } = await import('fs/promises');
  const path = await import('path');
  const dir = path.join(process.cwd(), 'public', folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/${folder}/${filename}`;
}
