import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { listViewings, updateViewing } from '@/lib/viewings';
import { syncViewingToOutlook } from '@/lib/viewings/outlook';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export const GET = guard('bookings', 'view', async (request) => {
  const scope = new URL(request.url).searchParams.get('scope') === 'past' ? 'past' : 'upcoming';
  return NextResponse.json(await listViewings(await getDb(), scope));
});

const patch = z.object({
  id: z.number().int(),
  status: z.enum(['requested', 'confirmed', 'completed', 'cancelled', 'no_show']).optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  staffNotes: z.string().max(2000).optional(),
});

export const PATCH = guard('bookings', 'full', async (request, staff) => {
  const { id, ...changes } = patch.parse(await request.json());
  const db = await getDb();
  try {
    const { viewing, change } = await updateViewing(db, id, changes, staff);
    after(async () => {
      if (change) await deliverQueued(db, { viewingId: id });
      await syncViewingToOutlook(db, id);
    });
    return NextResponse.json({ viewing, messaged: !!change });
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
});
