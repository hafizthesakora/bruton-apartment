/**
 * Kitchen & room ordering — plan §4: restaurant menu; order to apartment, charged to the guest
 * folio; kitchen order screen.
 *
 * Prices are always taken from the menu on the server. Each order posts one folio charge
 * (with orderId, so reports count it as room service); cancelling reverses it.
 */
import { and, asc, desc, eq, gte, inArray, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { apartments, bookings, folioEntries, guests, menuItems, orderItems, orders } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from '@/lib/booking/engine';

type Actor = { id: number; name: string };
export type OrderStatus = (typeof orders.$inferSelect)['status'];

const digits = (s: string | null | undefined) => (s ?? '').replace(/\D/g, '');

/* ── Menu ──────────────────────────────────────────────────────────────── */

export async function listMenu(db: DB, opts: { availableOnly?: boolean } = {}) {
  return db.select().from(menuItems)
    .where(opts.availableOnly ? eq(menuItems.available, true) : undefined)
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
}

export type MenuItemInput = { name: string; description?: string; category: string; price: number; available?: boolean };

function checkItem(i: Partial<MenuItemInput>) {
  if (i.name !== undefined && !i.name.trim()) throw new BookingError(400, 'Name the dish');
  if (i.category !== undefined && !i.category.trim()) throw new BookingError(400, 'Choose a category');
  if (i.price !== undefined && !(Number.isInteger(i.price) && i.price > 0)) throw new BookingError(400, 'Enter a price above zero');
}

export async function addMenuItem(db: DB, input: MenuItemInput, actor: Actor) {
  checkItem(input);
  const [{ last }] = await db.select({ last: sql<number | null>`max(${menuItems.sortOrder})` }).from(menuItems);
  const [m] = await db.insert(menuItems).values({
    name: input.name.trim(), description: input.description?.trim() ?? '', category: input.category.trim(),
    price: input.price, available: input.available ?? true, sortOrder: (last ?? -1) + 1,
  }).returning();
  await audit(actor, 'menu_item', m.id, 'create', { name: m.name, price: m.price }, db);
  return m;
}

export async function updateMenuItem(db: DB, id: number, patch: Partial<MenuItemInput>, actor: Actor) {
  checkItem(patch);
  const [before] = await db.select().from(menuItems).where(eq(menuItems.id, id));
  if (!before) throw new BookingError(404, 'Dish not found');
  const set = {
    ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
    ...(patch.description !== undefined ? { description: patch.description.trim() } : {}),
    ...(patch.category !== undefined ? { category: patch.category.trim() } : {}),
    ...(patch.price !== undefined ? { price: patch.price } : {}),
    ...(patch.available !== undefined ? { available: patch.available } : {}),
  };
  const [m] = await db.update(menuItems).set(set).where(eq(menuItems.id, id)).returning();
  await audit(actor, 'menu_item', id, 'update', { ...set, ...(set.price !== undefined ? { oldPrice: before.price } : {}) }, db);
  return m;
}

/* ── Guest check (no account needed) ───────────────────────────────────── */

/**
 * An in-house guest proves who they are with their booking reference plus the phone number
 * (last 7+ digits) or email on the booking. Only checked-in stays can order.
 */
export async function findInHouseBooking(db: DB, reference: string, contact: string) {
  const ref = reference.trim().toUpperCase();
  const [row] = await db.select({
    id: bookings.id, reference: bookings.reference, status: bookings.status, apartmentName: apartments.name,
    guestName: guests.fullName, phone: guests.phone, email: guests.email,
  }).from(bookings)
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .where(eq(bookings.reference, ref));

  const c = contact.trim().toLowerCase();
  const phoneOk = digits(c).length >= 7 && digits(row?.phone).endsWith(digits(c).slice(-9));
  const emailOk = c.includes('@') && row?.email?.toLowerCase() === c;
  // Same message whether the reference or the contact is wrong, so neither can be probed.
  if (!row || !(phoneOk || emailOk)) throw new BookingError(404, 'We couldn’t find a stay with those details');
  if (row.status !== 'checked_in') throw new BookingError(400, 'Room service opens once you’ve checked in');
  return { bookingId: row.id, reference: row.reference, apartmentName: row.apartmentName, firstName: row.guestName.split(' ')[0] };
}

/* ── Orders ────────────────────────────────────────────────────────────── */

export type OrderInput = { bookingId: number; items: { menuItemId: number; qty: number }[]; notes?: string };

export async function placeOrder(db: DB, input: OrderInput, by: { kind: 'guest' } | { kind: 'staff'; actor: Actor }, now = new Date()) {
  const lines = input.items.filter((i) => i.qty > 0);
  if (lines.length === 0) throw new BookingError(400, 'Add something to the order');
  if (lines.some((i) => !Number.isInteger(i.qty) || i.qty > 20)) throw new BookingError(400, 'Check the quantities');

  return db.transaction(async (tx) => {
    const [b] = await tx.select().from(bookings).where(eq(bookings.id, input.bookingId));
    if (!b) throw new BookingError(404, 'Booking not found');
    if (b.status !== 'checked_in') throw new BookingError(400, 'Orders can only be charged to a checked-in stay');

    const ids = [...new Set(lines.map((l) => l.menuItemId))];
    const menu = await tx.select().from(menuItems).where(inArray(menuItems.id, ids));
    const priced = lines.map((l) => {
      const m = menu.find((x) => x.id === l.menuItemId);
      if (!m) throw new BookingError(400, 'One of those dishes is no longer on the menu');
      if (!m.available) throw new BookingError(409, `${m.name} isn’t available right now`);
      return { menuItemId: m.id, name: m.name, unitPrice: m.price, qty: l.qty };
    });
    const total = priced.reduce((n, l) => n + l.unitPrice * l.qty, 0);

    const [order] = await tx.insert(orders).values({
      bookingId: b.id, apartmentId: b.apartmentId, total, notes: input.notes?.trim().slice(0, 500) ?? '',
      placedBy: by.kind, createdAt: now,
    }).returning();
    await tx.insert(orderItems).values(priced.map((p) => ({ orderId: order.id, ...p })));
    await tx.insert(folioEntries).values({
      bookingId: b.id, type: 'charge', amount: total, orderId: order.id, createdAt: now,
      description: `Room service #${order.id}: ${priced.map((p) => `${p.qty}× ${p.name}`).join(', ')}`,
      createdBy: by.kind === 'staff' ? by.actor.id : null,
    });
    await audit(by.kind === 'staff' ? by.actor : null, 'order', order.id, 'create', { bookingId: b.id, total, placedBy: by.kind }, tx);
    return { order, items: priced };
  });
}

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { received: 'preparing', preparing: 'delivered' };

export async function setOrderStatus(db: DB, id: number, status: OrderStatus, actor: Actor, reason = '') {
  return db.transaction(async (tx) => {
    const [o] = await tx.select().from(orders).where(eq(orders.id, id));
    if (!o) throw new BookingError(404, 'Order not found');
    if (o.status === status) return o;
    if (status === 'cancelled') {
      if (o.status === 'delivered') throw new BookingError(400, 'Already delivered — reduce the guest’s bill on their folio instead');
      await tx.insert(folioEntries).values({
        bookingId: o.bookingId, type: 'charge', amount: -o.total, orderId: o.id, createdBy: actor.id,
        description: `Room service #${o.id} cancelled${reason.trim() ? `: ${reason.trim()}` : ''}`,
      });
    } else if (NEXT[o.status] !== status) {
      throw new BookingError(400, `Can’t go from ${o.status} to ${status}`);
    }
    const [u] = await tx.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    await audit(actor, 'order', id, status, reason.trim() ? { reason: reason.trim() } : undefined, tx);
    return u;
  });
}

/** Open orders, plus everything from the last `hours` for reference. */
export async function kitchenBoard(db: DB, opts: { hours?: number; now?: Date } = {}) {
  const since = new Date((opts.now ?? new Date()).getTime() - (opts.hours ?? 24) * 3_600_000);
  const list = await db.select({
    id: orders.id, bookingId: orders.bookingId, status: orders.status, total: orders.total, notes: orders.notes,
    placedBy: orders.placedBy, createdAt: orders.createdAt, apartmentName: apartments.name, guestName: guests.fullName, reference: bookings.reference,
  }).from(orders)
    .innerJoin(bookings, eq(bookings.id, orders.bookingId))
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .innerJoin(apartments, eq(apartments.id, orders.apartmentId))
    .where(sql`${orders.status} in ('received', 'preparing') or ${orders.createdAt} >= ${since}`)
    .orderBy(desc(orders.createdAt))
    .limit(200);
  const items = list.length
    ? await db.select().from(orderItems).where(inArray(orderItems.orderId, list.map((o) => o.id))).orderBy(asc(orderItems.id))
    : [];
  return list.map((o) => ({ ...o, items: items.filter((i) => i.orderId === o.id).map(({ name, qty, unitPrice }) => ({ name, qty, unitPrice })) }));
}

/** Checked-in stays, for staff placing an order on a guest's behalf. */
export async function inHouseStays(db: DB) {
  return db.select({ bookingId: bookings.id, reference: bookings.reference, apartmentName: apartments.name, guestName: guests.fullName })
    .from(bookings)
    .innerJoin(guests, eq(guests.id, bookings.guestId))
    .innerJoin(apartments, eq(apartments.id, bookings.apartmentId))
    .where(eq(bookings.status, 'checked_in'))
    .orderBy(asc(apartments.sortOrder));
}

/** A guest's own recent orders (shown after they order). */
export async function guestOrders(db: DB, bookingId: number) {
  const list = await db.select().from(orders).where(and(eq(orders.bookingId, bookingId), gte(orders.createdAt, new Date(Date.now() - 7 * 86_400_000)))).orderBy(desc(orders.createdAt));
  const items = list.length ? await db.select().from(orderItems).where(inArray(orderItems.orderId, list.map((o) => o.id))) : [];
  return list.map((o) => ({ id: o.id, status: o.status, total: o.total, createdAt: o.createdAt, items: items.filter((i) => i.orderId === o.id).map(({ name, qty }) => ({ name, qty })) }));
}
