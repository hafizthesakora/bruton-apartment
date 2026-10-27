/**
 * Housekeeping — plan §4: room status clean · dirty · in_progress · out_of_order; set to dirty
 * on checkout (lib/booking/frontdesk.ts); daily task list per cleaner.
 *
 * Starting a task puts the apartment in progress; finishing its last open task marks it clean.
 * Out of order also closes the apartment to online booking (lib/booking/engine.ts).
 */
import { and, asc, eq, gte, inArray, lt, lte, ne, or, sql } from 'drizzle-orm';
import type { DB, Tx } from '@/lib/db';
import { apartments, bookings, guests, housekeepingStatus, housekeepingTasks, staffUsers } from '@/lib/db/schema';
import { audit } from '@/lib/audit';
import { BookingError } from './engine';
import { isISODate, todayAtProperty } from './pricing';

type Actor = { id: number; name: string };
export type HkStatus = (typeof housekeepingStatus.$inferSelect)['status'];
export const HK_STATUSES: HkStatus[] = ['clean', 'dirty', 'in_progress', 'out_of_order'];

export async function writeStatus(tx: Tx, apartmentId: number, status: HkStatus, note: string, actor: Actor, now: Date) {
  const values = { status, note, updatedBy: actor.id, updatedAt: now };
  await tx.insert(housekeepingStatus).values({ apartmentId, ...values })
    .onConflictDoUpdate({ target: housekeepingStatus.apartmentId, set: values });
}

/* ── Board ─────────────────────────────────────────────────────────────── */

export async function housekeepingBoard(db: DB, date: string) {
  if (!isISODate(date)) throw new BookingError(400, 'Choose a valid date');

  const [apts, stays, tasks, cleaners] = await Promise.all([
    db.select({
      id: apartments.id, name: apartments.name, status: housekeepingStatus.status, note: housekeepingStatus.note,
      updatedAt: housekeepingStatus.updatedAt, updatedBy: staffUsers.name,
    }).from(apartments)
      .leftJoin(housekeepingStatus, eq(housekeepingStatus.apartmentId, apartments.id))
      .leftJoin(staffUsers, eq(staffUsers.id, housekeepingStatus.updatedBy))
      .where(eq(apartments.active, true))
      .orderBy(asc(apartments.sortOrder), asc(apartments.id)),
    db.select({
      apartmentId: bookings.apartmentId, status: bookings.status, checkIn: bookings.checkIn, checkOut: bookings.checkOut,
      reference: bookings.reference, guestName: guests.fullName, adults: bookings.adults, children: bookings.children,
    }).from(bookings)
      .innerJoin(guests, eq(guests.id, bookings.guestId))
      .where(and(
        inArray(bookings.status, ['confirmed', 'checked_in', 'checked_out']),
        lte(bookings.checkIn, date), gte(bookings.checkOut, date),
      )),
    db.select({
      id: housekeepingTasks.id, apartmentId: housekeepingTasks.apartmentId, date: housekeepingTasks.date, task: housekeepingTasks.task,
      assignedTo: housekeepingTasks.assignedTo, done: housekeepingTasks.done, doneAt: housekeepingTasks.doneAt,
    }).from(housekeepingTasks)
      // The day's tasks, plus anything left undone from earlier days.
      .where(or(eq(housekeepingTasks.date, date), and(lt(housekeepingTasks.date, date), eq(housekeepingTasks.done, false))))
      .orderBy(asc(housekeepingTasks.date), asc(housekeepingTasks.id)),
    db.select({ id: staffUsers.id, name: staffUsers.name, role: staffUsers.role }).from(staffUsers)
      .where(and(eq(staffUsers.active, true), inArray(staffUsers.role, ['housekeeping', 'manager'])))
      .orderBy(asc(staffUsers.name)),
  ]);

  const board = apts.map((a) => {
    const here = stays.filter((s) => s.apartmentId === a.id);
    const departure = here.find((s) => s.checkOut === date && s.status !== 'confirmed') ?? null;
    const arrival = here.find((s) => s.checkIn === date && s.status !== 'checked_out') ?? null;
    const stayover = here.find((s) => s.status === 'checked_in' && s.checkIn < date && s.checkOut > date) ?? null;
    const status: HkStatus = a.status ?? 'clean';
    return {
      ...a, status,
      departure, arrival, stayover,
      // Someone is arriving and the room isn't ready.
      urgent: !!arrival && status !== 'clean',
      openTasks: tasks.filter((t) => t.apartmentId === a.id && !t.done).length,
    };
  });

  const aptName = new Map(apts.map((a) => [a.id, a.name]));
  return {
    date,
    apartments: board,
    tasks: tasks.map((t) => ({ ...t, apartmentName: aptName.get(t.apartmentId) ?? '', overdue: t.date < date })),
    cleaners,
    counts: Object.fromEntries(HK_STATUSES.map((s) => [s, board.filter((a) => a.status === s).length])) as Record<HkStatus, number>,
  };
}

/* ── Room status ───────────────────────────────────────────────────────── */

export async function setRoomStatus(db: DB, apartmentId: number, status: HkStatus, note: string, actor: Actor, now = new Date()) {
  if (status === 'out_of_order' && !note.trim()) throw new BookingError(400, 'Say why the apartment is out of order');
  return db.transaction(async (tx) => {
    const [apt] = await tx.select({ id: apartments.id, name: apartments.name }).from(apartments).where(eq(apartments.id, apartmentId));
    if (!apt) throw new BookingError(404, 'Apartment not found');
    const [before] = await tx.select().from(housekeepingStatus).where(eq(housekeepingStatus.apartmentId, apartmentId));
    await writeStatus(tx, apartmentId, status, note.trim(), actor, now);
    await audit(actor, 'apartment', apartmentId, 'hk_status', { from: before?.status ?? null, to: status, note: note.trim() || undefined }, tx);

    // Out of order: tell staff who is already booked in, so they can be moved.
    let warning: string | null = null;
    if (status === 'out_of_order') {
      const affected = await tx.select({ reference: bookings.reference }).from(bookings)
        .where(and(eq(bookings.apartmentId, apartmentId), inArray(bookings.status, ['confirmed', 'checked_in']), gte(bookings.checkOut, todayAtProperty(now))));
      if (affected.length) {
        warning = `${apt.name} has ${affected.length} upcoming booking${affected.length === 1 ? '' : 's'} (${affected.map((b) => b.reference).join(', ')}) — move ${affected.length === 1 ? 'it' : 'them'} on the calendar.`;
      }
    }
    return { apartmentId, status, warning };
  });
}

/* ── Tasks ─────────────────────────────────────────────────────────────── */

export async function addTask(db: DB, input: { apartmentId: number; date: string; task: string; assignedTo?: number | null }, actor: Actor) {
  if (!isISODate(input.date)) throw new BookingError(400, 'Choose a valid date');
  if (!input.task.trim()) throw new BookingError(400, 'Describe the task');
  const [apt] = await db.select({ id: apartments.id }).from(apartments).where(eq(apartments.id, input.apartmentId));
  if (!apt) throw new BookingError(404, 'Apartment not found');
  const [t] = await db.insert(housekeepingTasks).values({
    apartmentId: input.apartmentId, date: input.date, task: input.task.trim(), assignedTo: input.assignedTo ?? null,
  }).returning();
  await audit(actor, 'hk_task', t.id, 'create', { apartmentId: t.apartmentId, date: t.date, assignedTo: t.assignedTo }, db);
  return t;
}

export type TaskAction = { action: 'assign'; assignedTo: number | null } | { action: 'start' } | { action: 'done' } | { action: 'reopen' };

export async function updateTask(db: DB, id: number, a: TaskAction, actor: Actor, now = new Date()) {
  return db.transaction(async (tx) => {
    const [t] = await tx.select().from(housekeepingTasks).where(eq(housekeepingTasks.id, id));
    if (!t) throw new BookingError(404, 'Task not found');
    const [hk] = await tx.select().from(housekeepingStatus).where(eq(housekeepingStatus.apartmentId, t.apartmentId));
    const status = hk?.status ?? 'clean';
    let roomStatus: HkStatus | null = null;

    switch (a.action) {
      case 'assign': {
        if (a.assignedTo != null) {
          const [s] = await tx.select({ id: staffUsers.id }).from(staffUsers).where(and(eq(staffUsers.id, a.assignedTo), eq(staffUsers.active, true)));
          if (!s) throw new BookingError(400, 'That staff member is not active');
        }
        await tx.update(housekeepingTasks).set({ assignedTo: a.assignedTo }).where(eq(housekeepingTasks.id, id));
        break;
      }
      case 'start': {
        if (t.done) throw new BookingError(400, 'This task is already done');
        // Claim an unassigned task for whoever starts it.
        if (t.assignedTo == null) await tx.update(housekeepingTasks).set({ assignedTo: actor.id }).where(eq(housekeepingTasks.id, id));
        if (status === 'dirty' || status === 'clean') {
          await writeStatus(tx, t.apartmentId, 'in_progress', t.task, actor, now);
          roomStatus = 'in_progress';
        }
        break;
      }
      case 'done': {
        if (t.done) return { task: t, roomStatus: null };
        await tx.update(housekeepingTasks).set({ done: true, doneAt: now, assignedTo: t.assignedTo ?? actor.id }).where(eq(housekeepingTasks.id, id));
        const [{ open }] = await tx.select({ open: sql<number>`count(*)::int` }).from(housekeepingTasks)
          .where(and(eq(housekeepingTasks.apartmentId, t.apartmentId), eq(housekeepingTasks.done, false), ne(housekeepingTasks.id, id), lte(housekeepingTasks.date, t.date)));
        // Out of order is left alone: that's lifted deliberately, not by a clean.
        if (Number(open) === 0 && (status === 'dirty' || status === 'in_progress')) {
          await writeStatus(tx, t.apartmentId, 'clean', `Cleaned: ${t.task}`, actor, now);
          roomStatus = 'clean';
        }
        break;
      }
      case 'reopen': {
        await tx.update(housekeepingTasks).set({ done: false, doneAt: null }).where(eq(housekeepingTasks.id, id));
        break;
      }
    }
    await audit(actor, 'hk_task', id, a.action, { apartmentId: t.apartmentId, ...(a.action === 'assign' ? { assignedTo: a.assignedTo } : {}), ...(roomStatus ? { roomStatus } : {}) }, tx);
    const [updated] = await tx.select().from(housekeepingTasks).where(eq(housekeepingTasks.id, id));
    return { task: updated, roomStatus };
  });
}

export async function deleteTask(db: DB, id: number, actor: Actor) {
  const [t] = await db.select().from(housekeepingTasks).where(eq(housekeepingTasks.id, id));
  if (!t) throw new BookingError(404, 'Task not found');
  if (t.done) throw new BookingError(400, 'Finished tasks stay on the record');
  await db.delete(housekeepingTasks).where(eq(housekeepingTasks.id, id));
  await audit(actor, 'hk_task', id, 'delete', { apartmentId: t.apartmentId, task: t.task, date: t.date }, db);
}
