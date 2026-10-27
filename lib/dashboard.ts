/**
 * Staff dashboard — today at a glance, plus open alerts. Each section is only built for
 * roles that can see the module behind it (lib/auth/rbac.ts).
 */
import { and, desc, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { alerts, apartments, bookings, eventLeads, folioEntries, housekeepingStatus, maintenanceTickets, orders, viewings } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { can, type Role } from '@/lib/auth/rbac';
import { BookingError } from '@/lib/booking/engine';
import { addDays, todayAtProperty } from '@/lib/booking/pricing';
import { readJSON } from '@/lib/data';

type Actor = { id: number; name: string };

export async function dashboard(db: DB, role: Role, now = new Date()) {
  const today = todayAtProperty(now);
  const out: Record<string, unknown> = { today };

  if (can(role, 'checkin')) {
    const [r] = await db.select({
      arrivals: sql<number>`count(*) filter (where ${bookings.status} = 'confirmed' and ${bookings.checkIn} = ${today})::int`,
      arrived: sql<number>`count(*) filter (where ${bookings.status} in ('checked_in', 'checked_out') and ${bookings.checkIn} = ${today})::int`,
      departures: sql<number>`count(*) filter (where ${bookings.status} = 'checked_in' and ${bookings.checkOut} <= ${today})::int`,
      inHouse: sql<number>`count(*) filter (where ${bookings.status} = 'checked_in')::int`,
      noShows: sql<number>`count(*) filter (where ${bookings.status} = 'confirmed' and ${bookings.checkIn} < ${today})::int`,
    }).from(bookings).where(lte(bookings.checkIn, today));
    const [{ total }] = await db.select({ total: sql<number>`count(*)::int` }).from(apartments).where(eq(apartments.active, true));
    // Tonight: stays covering tonight's date.
    const [{ tonight }] = await db.select({ tonight: sql<number>`count(*)::int` }).from(bookings)
      .where(and(inArray(bookings.status, ['confirmed', 'checked_in']), lte(bookings.checkIn, today), sql`${bookings.checkOut} > ${today}`));
    out.frontDesk = { ...r, apartments: Number(total), occupiedTonight: Number(tonight) };
  }

  if (can(role, 'housekeeping')) {
    const rows = await db.select({ status: housekeepingStatus.status, n: sql<number>`count(*)::int` }).from(housekeepingStatus)
      .innerJoin(apartments, and(eq(apartments.id, housekeepingStatus.apartmentId), eq(apartments.active, true)))
      .groupBy(housekeepingStatus.status);
    out.housekeeping = Object.fromEntries(rows.map((r) => [r.status, Number(r.n)]));
  }

  if (can(role, 'maintenance')) {
    const [m] = await db.select({
      open: sql<number>`count(*)::int`,
      urgent: sql<number>`count(*) filter (where ${maintenanceTickets.priority} = 'urgent')::int`,
    }).from(maintenanceTickets).where(ne(maintenanceTickets.status, 'resolved'));
    out.maintenance = m;
  }

  if (can(role, 'kitchen')) {
    const [k] = await db.select({ open: sql<number>`count(*)::int` }).from(orders).where(inArray(orders.status, ['received', 'preparing']));
    out.kitchen = k;
  }

  if (can(role, 'payments')) {
    // What in-house and departed guests still owe.
    const [p] = await db.select({
      owing: sql<number>`coalesce(sum(b.balance) filter (where b.balance > 0), 0)::int`,
      bills: sql<number>`count(*) filter (where b.balance > 0)::int`,
    }).from(sql`(select ${bookings.id}, (select coalesce(sum(case when ${folioEntries.type} = 'payment' then -${folioEntries.amount} else ${folioEntries.amount} end), 0) from ${folioEntries} where ${folioEntries.bookingId} = ${bookings.id}) as balance from ${bookings} where ${bookings.status} in ('checked_in', 'checked_out')) b`);
    out.payments = p;
  }

  if (can(role, 'bookings')) {
    const [v] = await db.select({ n: sql<number>`count(*)::int` }).from(viewings)
      .where(and(inArray(viewings.status, ['requested', 'confirmed']), gte(viewings.scheduledAt, new Date(today + 'T00:00:00Z')), sql`${viewings.scheduledAt} < ${new Date(addDays(today, 1) + 'T00:00:00Z')}`));
    const [h] = await db.select({ n: sql<number>`count(*)::int` }).from(viewings).where(eq(viewings.status, 'requested'));
    out.viewings = { today: Number(v.n), toConfirm: Number(h.n) };
  }

  if (can(role, 'events')) {
    const upcoming = await db.select({ id: eventLeads.id, name: eventLeads.name, eventType: eventLeads.eventType, eventDate: eventLeads.eventDate, stage: eventLeads.stage })
      .from(eventLeads)
      .where(and(inArray(eventLeads.stage, ['deposit_paid', 'confirmed']), gte(eventLeads.eventDate, today), lte(eventLeads.eventDate, addDays(today, 14))))
      .orderBy(eventLeads.eventDate).limit(5);
    const [{ newLeads }] = await db.select({ newLeads: sql<number>`count(*)::int` }).from(eventLeads).where(eq(eventLeads.stage, 'lead'));
    out.events = { upcoming, newLeads: Number(newLeads) };
  }

  if (can(role, 'enquiries')) {
    const list = await readJSON('enquiries.json').catch(() => null);
    out.enquiries = { unread: Array.isArray(list) ? list.filter((e: { read?: boolean }) => !e.read).length : 0 };
  }

  // Alerts are about money and bookings: shown to whoever handles payments.
  if (can(role, 'payments')) {
    out.alerts = await db.select({
      id: alerts.id, type: alerts.type, message: alerts.message, bookingId: alerts.bookingId, createdAt: alerts.createdAt,
    }).from(alerts).where(eq(alerts.resolved, false)).orderBy(desc(alerts.createdAt)).limit(20);
  }

  return out;
}

export async function resolveAlert(db: DB, id: number, actor: Actor) {
  const [a] = await db.update(alerts).set({ resolved: true }).where(eq(alerts.id, id)).returning();
  if (!a) throw new BookingError(404, 'Alert not found');
  await audit(actor, 'alert', id, 'resolve', { type: a.type, bookingId: a.bookingId }, db);
  return a;
}
