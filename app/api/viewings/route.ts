import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { createViewing } from '@/lib/viewings';
import { syncViewingToOutlook } from '@/lib/viewings/outlook';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const body = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(120),
  email: z.email('Enter a valid email').max(200),
  phone: z.string().trim().min(7, 'Enter a valid phone number').max(32),
  type: z.enum(['physical', 'virtual']),
  date: z.string(),
  time: z.string(),
  notes: z.string().max(1000).optional(),
});

export const POST = publicRoute(async (request) => {
  const db = await getDb();
  const viewing = await createViewing(db, body.parse(await request.json()));
  after(async () => {
    await deliverQueued(db, { viewingId: viewing.id });
    await syncViewingToOutlook(db, viewing.id);
  });
  return NextResponse.json({ id: viewing.id, scheduledAt: viewing.scheduledAt, type: viewing.type }, { status: 201 });
});
