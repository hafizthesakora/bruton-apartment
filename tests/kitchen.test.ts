import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, menuItems } from '@/lib/db/schema';
import { createStaffBooking } from '@/lib/booking/staff';
import { checkIn } from '@/lib/booking/frontdesk';
import { bookingBalance } from '@/lib/booking/folios';
import { report } from '@/lib/reports';
import { addMenuItem, findInHouseBooking, kitchenBoard, placeOrder, setOrderStatus, updateMenuItem } from '@/lib/kitchen';
import type { DB } from '@/lib/db';

let db: DB;
let bookingId: number;
let reference: string;
let jollof: { id: number; price: number };
let juice: { id: number; price: number };
const STAFF = { id: 1, name: 'Kitchen' };
const at = (d: string) => new Date(`${d}T10:00:00Z`);

beforeAll(async () => {
  db = await testDb();
  const studio = (await db.select().from(apartments)).find((a) => a.slug === 'studio')!.id;
  const b = await createStaffBooking(db, {
    apartmentId: studio, checkIn: '2028-10-01', checkOut: '2028-10-04', adults: 1, children: 0, source: 'walk_in',
    guest: { fullName: 'Kojo Antwi', phone: '0244 123 456', email: 'kojo@example.com' }, notify: false,
  }, STAFF, at('2028-09-20'));
  bookingId = b.id;
  reference = b.reference;
  const menu = await db.select().from(menuItems);
  jollof = menu.find((m) => m.name.startsWith('Jollof'))!;
  juice = menu.find((m) => m.name === 'Fresh Fruit Juice')!;
});

describe('guest identity', () => {
  it('needs the reference plus matching phone or email, and a checked-in stay', async () => {
    await expect(findInHouseBooking(db, reference, '0244123456')).rejects.toThrow(/once you’ve checked in/);
    await checkIn(db, bookingId, { idType: 'Ghana Card', idNumber: 'X1', keyIssued: true }, STAFF, at('2028-10-01'));
    expect(await findInHouseBooking(db, reference.toLowerCase(), '+233 24 412 3456')).toMatchObject({ bookingId, firstName: 'Kojo' });
    expect(await findInHouseBooking(db, reference, 'KOJO@example.com')).toMatchObject({ bookingId });
    await expect(findInHouseBooking(db, reference, '0200000000')).rejects.toThrow(/couldn’t find/);
    await expect(findInHouseBooking(db, 'BGNOPE00', '0244123456')).rejects.toThrow(/couldn’t find/);
    await expect(findInHouseBooking(db, reference, '456')).rejects.toThrow(/couldn’t find/); // too few digits
  });
});

describe('orders', () => {
  it('prices from the menu, charges the folio once, and shows on the kitchen board', async () => {
    const before = await bookingBalance(db, bookingId);
    const { order, items } = await placeOrder(db, { bookingId, items: [{ menuItemId: jollof.id, qty: 2 }, { menuItemId: juice.id, qty: 1 }], notes: 'No pepper' }, { kind: 'guest' }, at('2028-10-02'));
    expect(order.total).toBe(jollof.price * 2 + juice.price);
    expect(items[0]).toMatchObject({ qty: 2, unitPrice: jollof.price });
    expect(await bookingBalance(db, bookingId)).toBe(before + order.total);

    const board = await kitchenBoard(db, { now: at('2028-10-02') });
    expect(board[0]).toMatchObject({ id: order.id, status: 'received', notes: 'No pepper', guestName: 'Kojo Antwi', placedBy: 'guest' });
    expect(board[0].items).toHaveLength(2);

    await setOrderStatus(db, order.id, 'preparing', STAFF);
    await expect(setOrderStatus(db, order.id, 'received', STAFF)).rejects.toThrow(/Can’t go/);
    await setOrderStatus(db, order.id, 'delivered', STAFF);
    await expect(setOrderStatus(db, order.id, 'cancelled', STAFF)).rejects.toThrow(/Already delivered/);
  });

  it('cancelling an undelivered order reverses the charge', async () => {
    const before = await bookingBalance(db, bookingId);
    const { order } = await placeOrder(db, { bookingId, items: [{ menuItemId: juice.id, qty: 3 }] }, { kind: 'staff', actor: STAFF });
    await setOrderStatus(db, order.id, 'cancelled', STAFF, 'Guest went out');
    expect(await bookingBalance(db, bookingId)).toBe(before);
  });

  it('refuses unavailable dishes, empty orders and silly quantities', async () => {
    await updateMenuItem(db, juice.id, { available: false }, STAFF);
    await expect(placeOrder(db, { bookingId, items: [{ menuItemId: juice.id, qty: 1 }] }, { kind: 'guest' })).rejects.toMatchObject({ status: 409 });
    await updateMenuItem(db, juice.id, { available: true }, STAFF);
    await expect(placeOrder(db, { bookingId, items: [] }, { kind: 'guest' })).rejects.toThrow(/Add something/);
    await expect(placeOrder(db, { bookingId, items: [{ menuItemId: juice.id, qty: 50 }] }, { kind: 'guest' })).rejects.toThrow(/quantities/);
    await expect(placeOrder(db, { bookingId, items: [{ menuItemId: 99_999, qty: 1 }] }, { kind: 'guest' })).rejects.toThrow(/no longer on the menu/);
  });

  it('uses the price at the time of ordering, and reports count it as room service', async () => {
    const dish = await addMenuItem(db, { name: 'Kelewele', category: 'Light Bites', price: 2_500 }, STAFF);
    const { order } = await placeOrder(db, { bookingId, items: [{ menuItemId: dish.id, qty: 2 }] }, { kind: 'guest' }, at('2028-10-03'));
    await updateMenuItem(db, dish.id, { price: 9_900 }, STAFF);
    expect(order.total).toBe(5_000);
    const r = await report(db, '2028-10-01', '2028-10-31');
    expect(r.other.orders).toBe(jollof.price * 2 + juice.price + 5_000);
    const [m] = await db.select().from(menuItems).where(eq(menuItems.id, dish.id));
    expect(m.price).toBe(9_900);
  });
});
