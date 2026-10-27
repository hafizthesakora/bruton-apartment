import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { apartments } from '@/lib/db/schema';
import { guard, HttpError } from '@/lib/auth/staff';
import { addPhoto } from '@/lib/apartments';
import { storeImage } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

/** multipart/form-data: apartmentId, file, alt? */
export const POST = guard('rates', 'full', async (request, staff) => {
  const form = await request.formData();
  const apartmentId = Number(form.get('apartmentId'));
  const file = form.get('file');
  if (!(file instanceof File)) throw new HttpError(400, 'Choose an image');
  const db = await getDb();
  const [apt] = await db.select({ id: apartments.id, name: apartments.name }).from(apartments).where(eq(apartments.id, apartmentId));
  if (!apt) throw new HttpError(404, 'Apartment not found');
  let url: string;
  try {
    url = await storeImage(file, 'uploads/apartments');
  } catch (err) {
    throw new HttpError(400, (err as Error).message);
  }
  const alt = String(form.get('alt') ?? '').trim() || apt.name;
  return NextResponse.json(await addPhoto(db, apartmentId, url, alt, staff), { status: 201 });
});
