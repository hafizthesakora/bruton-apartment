/**
 * Viewings — plan §1: "Slot calendar → viewing record on dashboard → SMS confirm".
 * One-hour slots, one live viewing per slot (enforced by the viewings_slot_idx partial
 * unique index). Ghana is UTC+0, so a slot's UTC time is its local time.
 */
import { and, asc, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { DB } from '@/lib/db';
import { viewings } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from '@/lib/booking/engine';
import { addDays, isISODate, nightsBetween, todayAtProperty } from '@/lib/booking/pricing';
import { queueViewingMessages } from '@/lib/notify';
import { VIEWING_TIMES } from './slots';

export { VIEWING_TIMES };

const LIVE = ['requested', 'confirmed'] as const;
const MIN_NOTICE_MS = 60 * 60_000;
const MAX_DAYS_AHEAD = 60;

export type ViewingStatus = typeof viewings.$inferSelect['status'];
type Actor = { id: number | null; name: string };

export const slotTime = (date: string, time: string) => new Date(`${date}T${time}:00Z`);

/** Postgres unique_violation — the slot was taken between showing it and booking it. */
function isSlotTaken(err: unknown): boolean {
  for (let e = err as { code?: string; cause?: unknown } | undefined; e; e = e.cause as typeof e) {
    if (e.code === '23505') return true;
  }
  return false;
}

function validateSlot(date: string, time: string, now: Date) {
  if (!isISODate(date) || !VIEWING_TIMES.includes(time)) throw new BookingError(400, 'Choose one of the available times');
  if (slotTime(date, time).getTime() < now.getTime() + MIN_NOTICE_MS) throw new BookingError(400, 'That time has passed — please pick a later slot');
  if (nightsBetween(todayAtProperty(now), date) > MAX_DAYS_AHEAD) throw new BookingError(400, `Viewings can be booked up to ${MAX_DAYS_AHEAD} days ahead`);
}

export async function listSlots(db: DB, date: string, now = new Date()) {
  if (!isISODate(date)) throw new BookingError(400, 'Choose a valid date');
  const taken = await db.select({ at: viewings.scheduledAt }).from(viewings).where(and(
    inArray(viewings.status, [...LIVE]),
    gte(viewings.scheduledAt, slotTime(date, '00:00')),
    lt(viewings.scheduledAt, slotTime(addDays(date, 1), '00:00')),
  ));
  const takenAt = new Set(taken.map((t) => t.at.getTime()));
  const tooFar = nightsBetween(todayAtProperty(now), date) > MAX_DAYS_AHEAD;
  return VIEWING_TIMES.map((time) => {
    const at = slotTime(date, time).getTime();
    return { time, available: !tooFar && at >= now.getTime() + MIN_NOTICE_MS && !takenAt.has(at) };
  });
}

export type ViewingInput = {
  name: string;
  email: string;
  phone: string;
  type: 'physical' | 'virtual';
  date: string;
  time: string;
  notes?: string;
};

export async function createViewing(db: DB, input: ViewingInput, now = new Date()) {
  validateSlot(input.date, input.time, now);
  try {
    return await db.transaction(async (tx) => {
      const [v] = await tx.insert(viewings).values({
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        type: input.type,
        scheduledAt: slotTime(input.date, input.time),
        notes: input.notes?.trim() ?? '',
      }).returning();
      await audit({ id: null, name: 'Website' }, 'viewing', v.id, 'create', { at: v.scheduledAt, type: v.type }, tx);
      await queueViewingMessages(tx, v.id, 'booked');
      return v;
    });
  } catch (err) {
    if (isSlotTaken(err)) throw new BookingError(409, 'Sorry — that time was just taken. Please pick another slot.');
    throw err;
  }
}

export type ViewingPatch = { status?: ViewingStatus; date?: string; time?: string; staffNotes?: string };

/**
 * Staff changes. Moving a live viewing or cancelling it messages the guest;
 * confirming / completing / no-show are internal bookkeeping.
 */
export async function updateViewing(db: DB, id: number, patch: ViewingPatch, actor: Actor, now = new Date()) {
  try {
    return await db.transaction(async (tx) => {
      const [current] = await tx.select().from(viewings).where(eq(viewings.id, id));
      if (!current) throw new BookingError(404, 'Viewing not found');

      const status = patch.status ?? current.status;
      const live = (LIVE as readonly string[]).includes(status);
      const wasLive = (LIVE as readonly string[]).includes(current.status);

      let scheduledAt = current.scheduledAt;
      if (patch.date || patch.time) {
        const date = patch.date ?? current.scheduledAt.toISOString().slice(0, 10);
        const time = patch.time ?? current.scheduledAt.toISOString().slice(11, 16);
        validateSlot(date, time, now);
        scheduledAt = slotTime(date, time);
      }
      const moved = scheduledAt.getTime() !== current.scheduledAt.getTime();
      if (moved && !live) throw new BookingError(400, 'Only upcoming viewings can be moved');

      const [v] = await tx.update(viewings).set({
        status,
        scheduledAt,
        ...(patch.staffNotes !== undefined ? { staffNotes: patch.staffNotes } : {}),
        updatedAt: now,
      }).where(eq(viewings.id, id)).returning();

      const change = wasLive && status === 'cancelled' ? 'cancelled' : moved ? 'rescheduled' : null;
      if (change) await queueViewingMessages(tx, id, change);
      await audit(actor, 'viewing', id, patch.status && patch.status !== current.status ? patch.status : moved ? 'reschedule' : 'update', {
        ...(patch.status && patch.status !== current.status ? { status: [current.status, status] } : {}),
        ...(moved ? { at: [current.scheduledAt, scheduledAt] } : {}),
      }, tx);
      return { viewing: v, change };
    });
  } catch (err) {
    if (isSlotTaken(err)) throw new BookingError(409, 'Another viewing is already booked at that time');
    throw err;
  }
}

export async function listViewings(db: DB, scope: 'upcoming' | 'past', now = new Date()) {
  // "Upcoming" keeps today's earlier viewings visible so staff can mark them completed / no-show.
  const startOfToday = slotTime(todayAtProperty(now), '00:00');
  return scope === 'upcoming'
    ? db.select().from(viewings).where(gte(viewings.scheduledAt, startOfToday)).orderBy(asc(viewings.scheduledAt))
    : db.select().from(viewings).where(lt(viewings.scheduledAt, startOfToday)).orderBy(desc(viewings.scheduledAt)).limit(200);
}
