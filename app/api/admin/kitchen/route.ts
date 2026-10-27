import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { guard, HttpError } from '@/lib/auth/staff';
import { BookingError } from '@/lib/booking/engine';
import { addMenuItem, inHouseStays, kitchenBoard, listMenu, placeOrder, setOrderStatus, updateMenuItem } from '@/lib/kitchen';

export const dynamic = 'force-dynamic';

async function run<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof BookingError) throw new HttpError(err.status, err.message);
    throw err;
  }
}

export const GET = guard('kitchen', 'view', async () => {
  const db = await getDb();
  const [board, stays, menu] = await Promise.all([kitchenBoard(db), inHouseStays(db), listMenu(db)]);
  return NextResponse.json({ orders: board, stays, menu });
});

const id = z.number().int().positive();
const item = z.object({
  name: z.string().max(80),
  description: z.string().max(300).optional(),
  category: z.string().max(40),
  price: z.coerce.number().positive('Enter a price above zero').transform((v) => Math.round(v * 100)),
  available: z.boolean().optional(),
});
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('order'), bookingId: id, items: z.array(z.object({ menuItemId: id, qty: z.number().int() })).max(40), notes: z.string().max(500).optional() }),
  z.object({ action: z.literal('status'), id, status: z.enum(['preparing', 'delivered', 'cancelled']), reason: z.string().max(200).optional() }),
  z.object({ action: z.literal('menu_add'), item }),
  z.object({ action: z.literal('menu_update'), id, item: item.partial() }),
]);

export const POST = guard('kitchen', 'full', async (request, staff) => {
  const a = schema.parse(await request.json());
  const db = await getDb();
  return NextResponse.json(await run(async () => {
    switch (a.action) {
      case 'order': return placeOrder(db, a, { kind: 'staff', actor: staff });
      case 'status': return setOrderStatus(db, a.id, a.status, staff, a.reason);
      case 'menu_add': return addMenuItem(db, a.item, staff);
      case 'menu_update': return updateMenuItem(db, a.id, a.item, staff);
    }
  }));
});
