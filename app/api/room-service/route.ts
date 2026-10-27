import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { publicRoute } from '@/lib/booking/http';
import { findInHouseBooking, guestOrders, listMenu, placeOrder } from '@/lib/kitchen';

export const dynamic = 'force-dynamic';

/** Public menu (available dishes only). */
export const GET = publicRoute(async () => {
  const menu = await listMenu(await getDb(), { availableOnly: true });
  return NextResponse.json(menu.map(({ id, name, description, category, price }) => ({ id, name, description, category, price })), {
    headers: { 'Cache-Control': 'no-store' },
  });
});

const who = { reference: z.string().trim().min(6, 'Enter your booking reference').max(16), contact: z.string().trim().min(3, 'Enter the phone number or email on your booking').max(120) };
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('lookup'), ...who }),
  z.object({
    action: z.literal('order'), ...who,
    items: z.array(z.object({ menuItemId: z.number().int().positive(), qty: z.number().int() })).min(1, 'Add something to your order').max(40),
    notes: z.string().max(500).optional(),
  }),
]);

/**
 * In-house guests: `lookup` checks their stay and returns recent orders; `order` places an
 * order charged to their bill. Both re-check the reference + contact every time.
 */
export const POST = publicRoute(async (request) => {
  const a = schema.parse(await request.json());
  const db = await getDb();
  const stay = await findInHouseBooking(db, a.reference, a.contact);
  if (a.action === 'order') {
    const { order, items } = await placeOrder(db, { bookingId: stay.bookingId, items: a.items, notes: a.notes }, { kind: 'guest' });
    return NextResponse.json({ stay, order: { id: order.id, total: order.total, status: order.status, items } }, { status: 201 });
  }
  return NextResponse.json({ stay, orders: await guestOrders(db, stay.bookingId) });
});
