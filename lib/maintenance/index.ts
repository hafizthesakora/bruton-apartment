/**
 * Maintenance — repair tickets per apartment. A ticket can take the apartment out of order
 * (closing it to booking); resolving the last such ticket hands the room back to housekeeping
 * as dirty with a clean queued. A repair cost on resolve is booked as an expense.
 */
import { and, asc, desc, eq, inArray, ne, sql } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import { apartments, bookings, expenses, housekeepingStatus, housekeepingTasks, maintenanceTickets, staffUsers } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from '@/lib/booking/engine';
import { writeStatus } from '@/lib/booking/housekeeping';
import { todayAtProperty } from '@/lib/booking/pricing';

type Actor = { id: number; name: string };
export type Priority = 'low' | 'normal' | 'urgent';
export const PRIORITIES: Priority[] = ['low', 'normal', 'urgent'];
export const REPAIRS_CATEGORY = 'Repairs & maintenance';

/** Guests booked into the apartment from today on — they need moving if it goes out of order. */
async function bookedIn(tx: Tx, apartmentId: number, now: Date) {
  const rows = await tx.select({ reference: bookings.reference }).from(bookings)
    .where(and(eq(bookings.apartmentId, apartmentId), inArray(bookings.status, ['confirmed', 'checked_in']), sql`${bookings.checkOut} >= ${todayAtProperty(now)}`));
  return rows.length ? `${rows.length} booking${rows.length === 1 ? '' : 's'} need${rows.length === 1 ? 's' : ''} moving (${rows.map((r) => r.reference).join(', ')}) — use the calendar.` : null;
}

async function takeOutOfOrder(tx: Tx, apartmentId: number, title: string, actor: Actor, now: Date) {
  await writeStatus(tx, apartmentId, 'out_of_order', `Maintenance: ${title}`, actor, now);
  return bookedIn(tx, apartmentId, now);
}

export async function listTickets(db: DB, opts: { status?: 'open' | 'all'; apartmentId?: number } = {}) {
  return db.select({
    id: maintenanceTickets.id, apartmentId: maintenanceTickets.apartmentId, apartmentName: apartments.name,
    title: maintenanceTickets.title, description: maintenanceTickets.description, priority: maintenanceTickets.priority,
    status: maintenanceTickets.status, outOfOrder: maintenanceTickets.outOfOrder,
    createdAt: maintenanceTickets.createdAt, resolvedAt: maintenanceTickets.resolvedAt, createdBy: staffUsers.name,
  }).from(maintenanceTickets)
    .innerJoin(apartments, eq(apartments.id, maintenanceTickets.apartmentId))
    .leftJoin(staffUsers, eq(staffUsers.id, maintenanceTickets.createdBy))
    .where(and(
      opts.status === 'all' ? undefined : ne(maintenanceTickets.status, 'resolved'),
      opts.apartmentId ? eq(maintenanceTickets.apartmentId, opts.apartmentId) : undefined,
    ))
    .orderBy(
      asc(sql`case when ${maintenanceTickets.status} = 'resolved' then 1 else 0 end`),
      asc(sql`case ${maintenanceTickets.priority} when 'urgent' then 0 when 'normal' then 1 else 2 end`),
      desc(maintenanceTickets.createdAt),
    )
    .limit(200);
}

export type TicketInput = { apartmentId: number; title: string; description?: string; priority: Priority; outOfOrder: boolean };

export async function createTicket(db: DB, input: TicketInput, actor: Actor, now = new Date()) {
  if (!input.title.trim()) throw new BookingError(400, 'Say what needs fixing');
  return db.transaction(async (tx) => {
    const [apt] = await tx.select({ id: apartments.id }).from(apartments).where(eq(apartments.id, input.apartmentId));
    if (!apt) throw new BookingError(404, 'Apartment not found');
    const [t] = await tx.insert(maintenanceTickets).values({
      apartmentId: input.apartmentId, title: input.title.trim(), description: input.description?.trim() ?? '',
      priority: input.priority, outOfOrder: input.outOfOrder, createdBy: actor.id, createdAt: now,
    }).returning();
    const warning = input.outOfOrder ? await takeOutOfOrder(tx, t.apartmentId, t.title, actor, now) : null;
    await audit(actor, 'maintenance', t.id, 'create', { apartmentId: t.apartmentId, priority: t.priority, outOfOrder: t.outOfOrder }, tx);
    return { ticket: t, warning };
  });
}

export type TicketUpdate =
  | { action: 'start' }
  | { action: 'resolve'; cost?: number; note?: string }
  | { action: 'reopen' }
  | { action: 'edit'; title?: string; description?: string; priority?: Priority; outOfOrder?: boolean };

export async function updateTicket(db: DB, id: number, u: TicketUpdate, actor: Actor, now = new Date()) {
  return db.transaction(async (tx) => {
    const [t] = await tx.select().from(maintenanceTickets).where(eq(maintenanceTickets.id, id));
    if (!t) throw new BookingError(404, 'Ticket not found');
    let warning: string | null = null;
    let handedToHousekeeping = false;

    switch (u.action) {
      case 'start':
        if (t.status === 'resolved') throw new BookingError(400, 'This ticket is resolved — reopen it first');
        await tx.update(maintenanceTickets).set({ status: 'in_progress' }).where(eq(maintenanceTickets.id, id));
        break;

      case 'resolve': {
        if (t.status === 'resolved') throw new BookingError(400, 'Already resolved');
        const note = u.note?.trim();
        await tx.update(maintenanceTickets).set({
          status: 'resolved', resolvedAt: now,
          ...(note ? { description: [t.description, `Resolved: ${note}`].filter(Boolean).join('\n') } : {}),
        }).where(eq(maintenanceTickets.id, id));
        if (u.cost && u.cost > 0) {
          await tx.insert(expenses).values({
            apartmentId: t.apartmentId, category: REPAIRS_CATEGORY, description: `${t.title} (ticket #${t.id})`,
            amount: u.cost, date: todayAtProperty(now), createdBy: actor.id,
          });
        }
        // Last out-of-order ticket fixed: the room goes back to housekeeping, not straight to guests.
        if (t.outOfOrder) {
          const [{ others }] = await tx.select({ others: sql<number>`count(*)::int` }).from(maintenanceTickets)
            .where(and(eq(maintenanceTickets.apartmentId, t.apartmentId), eq(maintenanceTickets.outOfOrder, true), ne(maintenanceTickets.status, 'resolved'), ne(maintenanceTickets.id, id)));
          const [hk] = await tx.select().from(housekeepingStatus).where(eq(housekeepingStatus.apartmentId, t.apartmentId));
          if (Number(others) === 0 && hk?.status === 'out_of_order') {
            await writeStatus(tx, t.apartmentId, 'dirty', `Repaired: ${t.title}`, actor, now);
            await tx.insert(housekeepingTasks).values({ apartmentId: t.apartmentId, date: todayAtProperty(now), task: `Clean after repair: ${t.title}` });
            handedToHousekeeping = true;
          }
        }
        break;
      }

      case 'reopen':
        await tx.update(maintenanceTickets).set({ status: 'open', resolvedAt: null }).where(eq(maintenanceTickets.id, id));
        if (t.outOfOrder) warning = await takeOutOfOrder(tx, t.apartmentId, t.title, actor, now);
        break;

      case 'edit': {
        if (u.title !== undefined && !u.title.trim()) throw new BookingError(400, 'Say what needs fixing');
        await tx.update(maintenanceTickets).set({
          ...(u.title !== undefined ? { title: u.title.trim() } : {}),
          ...(u.description !== undefined ? { description: u.description.trim() } : {}),
          ...(u.priority ? { priority: u.priority } : {}),
          ...(u.outOfOrder !== undefined ? { outOfOrder: u.outOfOrder } : {}),
        }).where(eq(maintenanceTickets.id, id));
        if (u.outOfOrder && !t.outOfOrder && t.status !== 'resolved') warning = await takeOutOfOrder(tx, t.apartmentId, u.title?.trim() || t.title, actor, now);
        break;
      }
    }
    await audit(actor, 'maintenance', id, u.action, { ...u, ...(handedToHousekeeping ? { roomStatus: 'dirty' } : {}) }, tx);
    const [updated] = await tx.select().from(maintenanceTickets).where(eq(maintenanceTickets.id, id));
    return { ticket: updated, warning, handedToHousekeeping };
  });
}
