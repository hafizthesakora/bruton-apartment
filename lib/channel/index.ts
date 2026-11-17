import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, asc, eq, gt, inArray, like } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { alerts, apartments, bookings, calendarFeeds, guests } from '@/lib/db/schema';
import { BookingError, expireHolds, isOverlapError, newReference } from '@/lib/booking/engine';
import { todayAtProperty } from '@/lib/booking/pricing';
import { audit } from '@/lib/audit';
import { calendarText, calendarURL, fetchCalendar, type CalendarEvent } from './ical';

export const CHANNELS = ['airbnb', 'booking_com', 'vrbo', 'expedia'] as const;
type Source = typeof CHANNELS[number];
type Actor = { id: number; name: string };

export async function channelBoard(db: DB) {
  const [units, feeds] = await Promise.all([
    db.select({ id: apartments.id, name: apartments.name }).from(apartments).where(eq(apartments.active, true)).orderBy(asc(apartments.sortOrder)),
    db.select().from(calendarFeeds).orderBy(asc(calendarFeeds.id)),
  ]);
  return { apartments: units, feeds };
}

export async function saveFeed(db: DB, input: { apartmentId: number; source: Source; url: string }, actor: Actor) {
  const url = calendarURL(input.url, input.source);
  const [unit] = await db.select().from(apartments).where(and(eq(apartments.id, input.apartmentId), eq(apartments.active, true)));
  if (!unit) throw new BookingError(404, 'Choose an active apartment');
  const [feed] = await db.insert(calendarFeeds).values({ ...input, url, exportToken: randomBytes(32).toString('hex') })
    .onConflictDoUpdate({ target: [calendarFeeds.apartmentId, calendarFeeds.source], set: { url, enabled: true, lastError: null } }).returning();
  await audit(actor, 'channel_feed', feed.id, 'save', { apartmentId: input.apartmentId, source: input.source }, db);
  return feed;
}

export async function disconnectFeed(db: DB, id: number, actor: Actor) {
  const [feed] = await db.update(calendarFeeds).set({ enabled: false, exportToken: randomBytes(32).toString('hex') }).where(eq(calendarFeeds.id, id)).returning();
  if (!feed) throw new BookingError(404, 'Calendar connection not found');
  await audit(actor, 'channel_feed', id, 'disconnect', { retainedBookings: true }, db);
}

/** Apply only a fully parsed snapshot, in a transaction. Failed downloads never release dates. */
export async function applyCalendar(db: DB, feedId: number, events: CalendarEvent[], now = new Date()) {
  return db.transaction(async (tx) => {
    const [feed] = await tx.select().from(calendarFeeds).where(eq(calendarFeeds.id, feedId)).for('update');
    if (!feed?.enabled) throw new BookingError(404, 'Calendar connection is disabled');
    await expireHolds(tx, now);
    const prefix = `ical:${feed.id}:`;
    const current = await tx.select().from(bookings).where(and(eq(bookings.source, feed.source), like(bookings.channelRef, `${prefix}%`)));
    const result = { imported: 0, updated: 0, cancelled: 0, conflicts: 0 };
    const liveRefs = new Set<string>();
    let guestId = current[0]?.guestId;
    for (const event of events) {
      // Do not reimport our own exported blocks through another channel.
      if (event.uid.endsWith('@brutongardens.local')) continue;
      const ref = prefix + createHash('sha256').update(event.uid).digest('hex');
      if (!event.cancelled) liveRefs.add(ref);
      const existing = current.find((b) => b.channelRef === ref);
      if (event.cancelled || event.checkOut <= todayAtProperty(now)) continue;
      if (existing && (existing.status !== 'confirmed' || (existing.checkIn === event.checkIn && existing.checkOut === event.checkOut))) continue;
      if (!guestId) {
        const [guest] = await tx.insert(guests).values({ fullName: `${feed.source.replace('_', '.')} calendar reservation`, notes: 'Calendar-only block. Confirm guest details and charges with the channel before check-in.' }).returning();
        guestId = guest.id;
      }
      try {
        await tx.transaction(async (sp) => {
          if (existing) {
            await sp.update(bookings).set({ checkIn: event.checkIn, checkOut: event.checkOut, updatedAt: now }).where(eq(bookings.id, existing.id));
          } else {
            await sp.insert(bookings).values({
              reference: newReference(), apartmentId: feed.apartmentId, guestId: guestId!,
              checkIn: event.checkIn, checkOut: event.checkOut, adults: 1, children: 0,
              status: 'confirmed', source: feed.source, channelRef: ref, paymentMode: 'pay_on_arrival',
              totalAmount: 0, amountDueNow: 0, notes: 'Imported calendar block. Guest details and charges must be confirmed with the booking channel.',
            });
          }
        });
        if (existing) result.updated++; else result.imported++;
      } catch (error) {
        if (!isOverlapError(error)) throw error;
        result.conflicts++;
        const message = `Channel calendar conflict: ${feed.source} connection ${feed.id}, ${event.checkIn} to ${event.checkOut}. Review both reservations before changing availability.`;
        const [seen] = await tx.select({ id: alerts.id }).from(alerts).where(and(eq(alerts.type, 'channel_conflict'), eq(alerts.message, message), eq(alerts.resolved, false)));
        if (!seen) await tx.insert(alerts).values({ type: 'channel_conflict', message });
      }
    }
    for (const booking of current) {
      if (booking.status === 'confirmed' && booking.checkIn >= todayAtProperty(now) && !liveRefs.has(booking.channelRef!)) {
        await tx.update(bookings).set({ status: 'cancelled', cancelledAt: now, updatedAt: now }).where(eq(bookings.id, booking.id));
        result.cancelled++;
      }
    }
    await tx.update(calendarFeeds).set({ lastSyncedAt: now, lastError: null, result }).where(eq(calendarFeeds.id, feed.id));
    await audit(null, 'channel_feed', feed.id, 'sync', result, tx);
    return result;
  });
}

export async function syncFeed(db: DB, id: number) {
  const [feed] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, id));
  if (!feed?.enabled) throw new BookingError(404, 'Calendar connection is disabled');
  try {
    return await applyCalendar(db, id, await fetchCalendar(feed.url, feed.source));
  } catch (error) {
    const message = error instanceof BookingError ? error.message : 'Could not download the channel calendar. Check its export URL and try again.';
    await db.update(calendarFeeds).set({ lastError: message }).where(eq(calendarFeeds.id, id));
    throw new BookingError(502, message);
  }
}

export async function syncAllFeeds(db: DB) {
  const feeds = await db.select({ id: calendarFeeds.id }).from(calendarFeeds).where(eq(calendarFeeds.enabled, true));
  const results = [];
  for (let i = 0; i < feeds.length; i += 4) {
    results.push(...await Promise.all(feeds.slice(i, i + 4).map(async (feed) => {
      try { return { id: feed.id, ok: true, ...await syncFeed(db, feed.id) }; }
      catch (error) { return { id: feed.id, ok: false, error: (error as Error).message }; }
    })));
  }
  return results;
}

export async function exportCalendar(db: DB, id: number, token: string) {
  const [feed] = await db.select().from(calendarFeeds).where(eq(calendarFeeds.id, id));
  const supplied = Buffer.from(token), expected = Buffer.from(feed?.exportToken ?? '');
  if (!feed?.enabled || !expected.length || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new BookingError(404, 'Calendar not found');
  const rows = await db.select({ id: bookings.id, checkIn: bookings.checkIn, checkOut: bookings.checkOut, channelRef: bookings.channelRef }).from(bookings)
    .where(and(eq(bookings.apartmentId, feed.apartmentId), inArray(bookings.status, ['confirmed', 'checked_in']), gt(bookings.checkOut, todayAtProperty())));
  return calendarText(rows.filter((r) => !r.channelRef?.startsWith(`ical:${feed.id}:`)));
}
