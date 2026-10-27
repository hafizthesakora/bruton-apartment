import { describe, it, expect, beforeAll } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, expenses, housekeepingStatus, housekeepingTasks } from '@/lib/db/schema';
import { createStaffBooking } from '@/lib/booking/staff';
import { createTicket, listTickets, updateTicket, REPAIRS_CATEGORY } from '@/lib/maintenance';
import type { DB } from '@/lib/db';

let db: DB;
let suite: number;
let studio: number;
const STAFF = { id: 1, name: 'Owner' };
const NOW = new Date('2028-08-01T09:00:00Z');
const status = async (id: number) => (await db.select().from(housekeepingStatus).where(eq(housekeepingStatus.apartmentId, id)))[0]?.status;

beforeAll(async () => {
  db = await testDb();
  const rows = await db.select().from(apartments);
  suite = rows.find((a) => a.slug === 'executive-suite')!.id;
  studio = rows.find((a) => a.slug === 'studio')!.id;
});

describe('maintenance tickets', () => {
  it('out-of-order tickets close the room and warn about guests booked in', async () => {
    const b = await createStaffBooking(db, { apartmentId: suite, checkIn: '2028-08-05', checkOut: '2028-08-07', adults: 1, children: 0, source: 'walk_in', guest: { fullName: 'M Guest' }, notify: false }, STAFF, NOW);
    const { ticket, warning } = await createTicket(db, { apartmentId: suite, title: 'AC leaking', priority: 'urgent', outOfOrder: true }, STAFF, NOW);
    expect(await status(suite)).toBe('out_of_order');
    expect(warning).toContain(b.reference);
    expect((await listTickets(db))[0]).toMatchObject({ id: ticket.id, apartmentName: expect.any(String), createdBy: 'Owner' });
  });

  it('room stays out of order until its last out-of-order ticket is resolved, then goes to housekeeping', async () => {
    const second = (await createTicket(db, { apartmentId: suite, title: 'Broken window', priority: 'normal', outOfOrder: true }, STAFF, NOW)).ticket;
    const [first] = (await listTickets(db, { apartmentId: suite })).filter((t) => t.title === 'AC leaking');

    const r1 = await updateTicket(db, first.id, { action: 'resolve', cost: 45_000, note: 'Replaced pump' }, STAFF, NOW);
    expect(r1.handedToHousekeeping).toBe(false);
    expect(await status(suite)).toBe('out_of_order');
    expect(r1.ticket).toMatchObject({ status: 'resolved', description: 'Resolved: Replaced pump' });

    const r2 = await updateTicket(db, second.id, { action: 'resolve' }, STAFF, NOW);
    expect(r2.handedToHousekeeping).toBe(true);
    expect(await status(suite)).toBe('dirty');
    const tasks = await db.select().from(housekeepingTasks).where(and(eq(housekeepingTasks.apartmentId, suite), eq(housekeepingTasks.date, '2028-08-01')));
    expect(tasks.map((t) => t.task)).toContain('Clean after repair: Broken window');

    const [cost] = await db.select().from(expenses).where(eq(expenses.category, REPAIRS_CATEGORY));
    expect(cost).toMatchObject({ amount: 45_000, apartmentId: suite, date: '2028-08-01' });
    expect(await listTickets(db, { apartmentId: suite })).toHaveLength(0); // open only by default
    expect(await listTickets(db, { apartmentId: suite, status: 'all' })).toHaveLength(2);
  });

  it('ordinary tickets leave the room alone; urgent ones sort first', async () => {
    await createTicket(db, { apartmentId: studio, title: 'Squeaky door', priority: 'low', outOfOrder: false }, STAFF, NOW);
    const urgent = (await createTicket(db, { apartmentId: studio, title: 'No hot water', priority: 'urgent', outOfOrder: false }, STAFF, NOW)).ticket;
    expect(await status(studio)).toBe('clean');
    expect((await listTickets(db, { apartmentId: studio }))[0].id).toBe(urgent.id);
    await updateTicket(db, urgent.id, { action: 'start' }, STAFF, NOW);
    const r = await updateTicket(db, urgent.id, { action: 'resolve' }, STAFF, NOW);
    expect(r.handedToHousekeeping).toBe(false);
    expect(await status(studio)).toBe('clean');
    await expect(updateTicket(db, urgent.id, { action: 'start' }, STAFF, NOW)).rejects.toThrow(/reopen/);
  });

  it('reopening or flagging an existing ticket takes the room out of order again', async () => {
    const t = (await createTicket(db, { apartmentId: studio, title: 'Fridge noisy', priority: 'normal', outOfOrder: false }, STAFF, NOW)).ticket;
    await updateTicket(db, t.id, { action: 'edit', outOfOrder: true }, STAFF, NOW);
    expect(await status(studio)).toBe('out_of_order');
    await updateTicket(db, t.id, { action: 'resolve' }, STAFF, NOW);
    expect(await status(studio)).toBe('dirty');
    await updateTicket(db, t.id, { action: 'reopen' }, STAFF, NOW);
    expect(await status(studio)).toBe('out_of_order');
    await expect(createTicket(db, { apartmentId: studio, title: ' ', priority: 'low', outOfOrder: false }, STAFF)).rejects.toThrow(/needs fixing/);
  });
});
