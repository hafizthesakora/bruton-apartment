import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { calendarData, cancelBooking, changeBooking, createStaffBooking } from '@/lib/booking/staff';
import { deliverQueued } from '@/lib/notify';

export const dynamic = 'force-dynamic';

const cedis = z.coerce.number().min(0).transform((v) => Math.round(v * 100));
const SOURCES = ['direct', 'airbnb', 'booking_com', 'vrbo', 'expedia', 'walk_in', 'phone'] as const;

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

export const GET = guard('bookings', 'view', async (request) => {
  const q = new URL(request.url).searchParams;
  return NextResponse.json(await run(async () => calendarData(await getDb(), q.get('from') ?? '', q.get('to') ?? '')));
});

const createSchema = z.object({
  apartmentId: z.number().int(),
  checkIn: z.string(),
  checkOut: z.string(),
  adults: z.coerce.number().int().min(1).max(20),
  children: z.coerce.number().int().min(0).max(20).default(0),
  source: z.enum(SOURCES),
  channelRef: z.string().max(80).optional(),
  guest: z.object({
    id: z.number().int().optional(),
    fullName: z.string().trim().min(2, 'Enter the guest’s name'),
    phone: z.string().trim().max(32).optional(),
    email: z.union([z.email('Enter a valid email'), z.literal('')]).optional(),
  }),
  totalAmount: cedis.optional(),
  notes: z.string().max(2000).optional(),
  notify: z.boolean().optional(),
});

export const POST = guard('bookings', 'full', async (request, staff) => {
  const input = createSchema.parse(await request.json());
  const db = await getDb();
  const booking = await run(() => createStaffBooking(db, input, staff));
  after(() => deliverQueued(db, { bookingId: booking.id }));
  return NextResponse.json(booking, { status: 201 });
});

const patchSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('change'),
    id: z.number().int(),
    apartmentId: z.number().int().optional(),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    adults: z.coerce.number().int().min(1).max(20).optional(),
    children: z.coerce.number().int().min(0).max(20).optional(),
    notes: z.string().max(2000).optional(),
    price: z.union([z.enum(['rates', 'keep']), z.object({ manual: cedis })]).optional(),
    notify: z.boolean().optional(),
  }),
  z.object({
    action: z.literal('cancel'),
    id: z.number().int(),
    fee: cedis.optional(),
    reason: z.string().max(500).optional(),
    notify: z.boolean().optional(),
  }),
]);

export const PATCH = guard('bookings', 'full', async (request, staff) => {
  const a = patchSchema.parse(await request.json());
  const db = await getDb();
  const booking = await run(() => a.action === 'change'
    ? changeBooking(db, a.id, { ...a, price: typeof a.price === 'object' ? a.price.manual : a.price }, staff)
    : cancelBooking(db, a.id, a, staff));
  after(() => deliverQueued(db, { bookingId: a.id }));
  return NextResponse.json(booking);
});
