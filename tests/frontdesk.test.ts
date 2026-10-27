import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { alerts, apartments, bookings, guests, housekeepingStatus, housekeepingTasks, notifications } from '@/lib/db/schema';
import { createStaffBooking, type StaffBookingInput } from '@/lib/booking/staff';
import { bookingBalance, checkIn, checkOut, frontDeskCounts, frontDeskDay } from '@/lib/booking/frontdesk';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
let suite: number;
const STAFF = { id: 1, name: 'Front Desk' };
const at = (d: string) => new Date(`${d}T10:00:00Z`);
const ID = { idType: 'Ghana Card', idNumber: 'GHA-000000000-0', keyIssued: true };

const create = (o: Partial<StaffBookingInput> = {}) => createStaffBooking(db, {
  apartmentId: studio, checkIn: '2027-05-10', checkOut: '2027-05-12', adults: 1, children: 0, source: 'walk_in',
  guest: { fullName: 'Ama Owusu', phone: '0244111111', email: 'ama@example.com' }, notify: false, ...o,
}, STAFF, at('2027-05-01'));

const hk = async (aptId: number) => (await db.select().from(housekeepingStatus).where(eq(housekeepingStatus.apartmentId, aptId)))[0];

beforeAll(async () => {
  db = await testDb();
  const rows = await db.select().from(apartments);
  studio = rows.find((a) => a.slug === 'studio')!.id;
  suite = rows.find((a) => a.slug === 'executive-suite')!.id;
});

describe('checkIn', () => {
  it('refuses without ID, before arrival day, or for a booking that is not confirmed', async () => {
    const b = await create({ checkIn: '2027-05-10', checkOut: '2027-05-11' });
    await expect(checkIn(db, b.id, { ...ID, idNumber: ' ' }, STAFF, at('2027-05-10'))).rejects.toMatchObject({ status: 400 });
    await expect(checkIn(db, b.id, ID, STAFF, at('2027-05-09'))).rejects.toThrow(/starts on 2027-05-10/);
    await checkIn(db, b.id, ID, STAFF, at('2027-05-10'));
    await expect(checkIn(db, b.id, ID, STAFF, at('2027-05-10'))).rejects.toThrow(/checked in/);
  });

  it('records ID, key, deposit and a desk payment, and sends a receipt', async () => {
    const b = await create({ checkIn: '2027-05-13', checkOut: '2027-05-15', guest: { fullName: 'Kofi Boateng', phone: '0244222222', email: 'kofi@example.com' } });
    const owed = await bookingBalance(db, b.id);
    const { booking } = await checkIn(db, b.id, { ...ID, nationality: 'Ghanaian', securityDeposit: 50_000, payment: { amount: 20_000, method: 'momo', reference: 'MM123' } }, STAFF, at('2027-05-13'));
    expect(booking).toMatchObject({ status: 'checked_in', idCaptured: true, keyIssued: true, securityDeposit: 50_000 });
    expect(await bookingBalance(db, b.id)).toBe(owed - 20_000);
    const [g] = await db.select().from(guests).where(eq(guests.id, b.guestId));
    expect(g).toMatchObject({ idType: 'Ghana Card', nationality: 'Ghanaian' });
    const sent = await db.select().from(notifications).where(eq(notifications.bookingId, b.id));
    expect(sent.some((n) => n.template === 'payment_receipt')).toBe(true);
  });

  it('blocks an out-of-order apartment and warns about a dirty one', async () => {
    const b = await create({ apartmentId: suite, checkIn: '2027-05-20', checkOut: '2027-05-21' });
    await db.insert(housekeepingStatus).values({ apartmentId: suite, status: 'out_of_order' })
      .onConflictDoUpdate({ target: housekeepingStatus.apartmentId, set: { status: 'out_of_order' } });
    await expect(checkIn(db, b.id, ID, STAFF, at('2027-05-20'))).rejects.toMatchObject({ status: 409 });
    await db.update(housekeepingStatus).set({ status: 'dirty' }).where(eq(housekeepingStatus.apartmentId, suite));
    const { warning } = await checkIn(db, b.id, ID, STAFF, at('2027-05-20'));
    expect(warning).toMatch(/dirty/);
  });
});

describe('checkOut', () => {
  it('refuses to let a guest leave owing unless allowed, then raises an alert', async () => {
    const b = await create({ checkIn: '2027-06-01', checkOut: '2027-06-02' });
    await checkIn(db, b.id, ID, STAFF, at('2027-06-01'));
    await expect(checkOut(db, b.id, { keyReturned: true }, STAFF, at('2027-06-02'))).rejects.toMatchObject({ status: 409 });
    const out = await checkOut(db, b.id, { keyReturned: true, allowBalance: true }, STAFF, at('2027-06-02'));
    expect(out.status).toBe('checked_out');
    const a = await db.select().from(alerts).where(eq(alerts.bookingId, b.id));
    expect(a).toHaveLength(1);
    expect(a[0].type).toBe('balance_owing');
  });

  it('settles at the desk, returns the deposit and marks the apartment dirty with a clean queued', async () => {
    const b = await create({ checkIn: '2027-06-03', checkOut: '2027-06-05' });
    await checkIn(db, b.id, { ...ID, securityDeposit: 30_000 }, STAFF, at('2027-06-03'));
    const owed = await bookingBalance(db, b.id);
    const out = await checkOut(db, b.id, { keyReturned: true, payment: { amount: owed, method: 'cash' } }, STAFF, at('2027-06-05'));
    expect(out).toMatchObject({ status: 'checked_out', keyReturned: true, securityDepositReturned: 30_000, checkOut: '2027-06-05' });
    expect(await bookingBalance(db, b.id)).toBe(0);
    expect((await hk(studio)).status).toBe('dirty');
    const tasks = await db.select().from(housekeepingTasks).where(eq(housekeepingTasks.apartmentId, studio));
    expect(tasks.some((t) => t.date === '2027-06-05' && t.task.includes(b.reference))).toBe(true);
  });

  it('needs a reason to keep part of the deposit, and notes it on the booking', async () => {
    const b = await create({ checkIn: '2027-06-06', checkOut: '2027-06-07' });
    await checkIn(db, b.id, { ...ID, securityDeposit: 30_000 }, STAFF, at('2027-06-06'));
    const pay = { amount: await bookingBalance(db, b.id), method: 'cash' as const };
    await expect(checkOut(db, b.id, { keyReturned: true, securityDepositReturned: 10_000, payment: pay }, STAFF, at('2027-06-07')))
      .rejects.toThrow(/why/);
    const out = await checkOut(db, b.id, { keyReturned: false, securityDepositReturned: 10_000, depositNote: 'Broken glass', payment: pay }, STAFF, at('2027-06-07'));
    expect(out.securityDepositReturned).toBe(10_000);
    expect(out.notes).toMatch(/GH₵ 200\.00 kept — Broken glass/);
  });

  it('shortens the stay on an early departure, freeing the remaining nights', async () => {
    const b = await create({ checkIn: '2027-06-10', checkOut: '2027-06-14' });
    await checkIn(db, b.id, ID, STAFF, at('2027-06-10'));
    const out = await checkOut(db, b.id, { keyReturned: true, allowBalance: true }, STAFF, at('2027-06-12'));
    expect(out.checkOut).toBe('2027-06-12');
    await expect(create({ checkIn: '2027-06-12', checkOut: '2027-06-14' })).resolves.toMatchObject({ status: 'confirmed' });
  });

  it('keeps only the first night when the guest leaves on arrival day', async () => {
    const b = await create({ checkIn: '2027-06-20', checkOut: '2027-06-23' });
    await checkIn(db, b.id, ID, STAFF, at('2027-06-20'));
    const out = await checkOut(db, b.id, { keyReturned: true, allowBalance: true }, STAFF, at('2027-06-20'));
    expect(out.checkOut).toBe('2027-06-21');
  });
});

describe('frontDeskDay', () => {
  // Fresh database: guests left checked in by the tests above would otherwise show as overdue.
  beforeAll(async () => { db = await testDb(); });

  it('sorts the day into arrivals, departures, in-house, overdue and no-shows', async () => {
    const arriving = await create({ checkIn: '2027-07-10', checkOut: '2027-07-12' });
    const staying = await create({ apartmentId: suite, checkIn: '2027-07-08', checkOut: '2027-07-11' });
    await checkIn(db, staying.id, ID, STAFF, at('2027-07-08'));
    const leaving = await create({ checkIn: '2027-07-07', checkOut: '2027-07-10' });
    await checkIn(db, leaving.id, ID, STAFF, at('2027-07-07'));
    const day = await frontDeskDay(db, '2027-07-10');
    const refs = (k: keyof typeof day) => (day[k] as { reference: string }[]).map((r) => r.reference);
    expect(refs('arrivals')).toEqual([arriving.reference]);
    expect(refs('departures')).toEqual([leaving.reference]);
    expect(refs('inHouse')).toEqual([staying.reference]);
    expect(day.arrivals[0].balance).toBe(arriving.totalAmount);

    // A day later: the departure is overdue and the unarrived guest is a no-show.
    const next = await frontDeskDay(db, '2027-07-11');
    expect(next.overdue.map((r) => r.reference)).toEqual([leaving.reference]);
    expect(next.noShows.map((r) => r.reference)).toEqual([arriving.reference]);
    expect(await frontDeskCounts(db, '2027-07-10')).toEqual({ arrivals: 1, departures: 1 });
  });

  it('leaves cancelled bookings out', async () => {
    const b = await create({ checkIn: '2027-08-01', checkOut: '2027-08-02' });
    await db.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, b.id));
    const day = await frontDeskDay(db, '2027-08-01');
    expect(day.arrivals).toHaveLength(0);
  });
});
