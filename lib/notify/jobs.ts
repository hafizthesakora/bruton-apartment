/**
 * Daily job (Vercel cron, 08:00 Accra): pre-arrival reminders, review requests, outbox retries.
 * Each booking is stamped (reminderSentAt / reviewRequestedAt) in the same transaction that
 * queues its message, so re-running the job never double-sends.
 */
import { and, eq, gte, isNull, lte } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { bookings } from '@/lib/db/schema';
import { expireHolds } from '@/lib/booking/engine';
import { addDays, todayAtProperty } from '@/lib/booking/pricing';
import { deliverQueued, queuePreArrival, queueReviewRequest, type Senders } from './index';

export async function runDailyJobs(db: DB, opts: { now?: Date; senders?: Senders } = {}) {
  const now = opts.now ?? new Date();
  const today = todayAtProperty(now);
  const expired = await expireHolds(db, now);

  // Arriving today or tomorrow, booked more than 12h ago (newer bookings just got their confirmation).
  const arriving = await db.select({ id: bookings.id }).from(bookings).where(and(
    eq(bookings.status, 'confirmed'),
    isNull(bookings.reminderSentAt),
    gte(bookings.checkIn, today),
    lte(bookings.checkIn, addDays(today, 1)),
    lte(bookings.createdAt, new Date(now.getTime() - 12 * 3_600_000)),
  ));
  for (const { id } of arriving) {
    await db.transaction(async (tx) => {
      await queuePreArrival(tx, id);
      await tx.update(bookings).set({ reminderSentAt: now }).where(eq(bookings.id, id));
    });
  }

  // Checked out in the last 3 days. Only direct guests: OTA guests get the channel's own review request.
  const departed = await db.select({ id: bookings.id, source: bookings.source }).from(bookings).where(and(
    eq(bookings.status, 'checked_out'),
    isNull(bookings.reviewRequestedAt),
    gte(bookings.checkedOutAt, new Date(now.getTime() - 3 * 86_400_000)),
  ));
  let reviews = 0;
  for (const { id, source } of departed) {
    if (!['direct', 'walk_in', 'phone'].includes(source)) continue;
    await db.transaction(async (tx) => {
      if (await queueReviewRequest(tx, id)) reviews++;
      await tx.update(bookings).set({ reviewRequestedAt: now }).where(eq(bookings.id, id));
    });
  }

  const delivered = await deliverQueued(db, { limit: 200, senders: opts.senders });
  return { expiredHolds: expired.length, preArrival: arriving.length, reviewRequests: reviews, delivered };
}
