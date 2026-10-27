import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, bookings, folioEntries, notifications } from '@/lib/db/schema';
import { createStaffBooking, changeBooking, cancelBooking, calendarData, type StaffBookingInput } from '@/lib/booking/staff';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
let suite: number;
const STAFF = { id: 1, name: 'Front Desk' };
const NOW = new Date('2027-03-01T10:00:00Z');

const create = (o: Partial<StaffBookingInput> = {}) => createStaffBooking(db, {
  apartmentId: studio, checkIn: '2027-03-10', checkOut: '2027-03-11', adults: 1, children: 0, source: 'walk_in',
  guest: { fullName: 'Yaw Mensah', phone: '0244000000', email: 'yaw@example.com' }, ...o,
}, STAFF, NOW);

const folio = (id: number) => db.select().from(folioEntries).where(eq(folioEntries.bookingId, id));
const balance = async (id: number) => (await folio(id)).reduce((s, f) => s + (f.type === 'charge' ? f.amount : f.type === 'payment' ? -f.amount : f.amount), 0);
const templates = async (id: number) => (await db.select().from(notifications).where(eq(notifications.bookingId, id))).map((n) => `${n.template}:${n.channel}`).sort();

beforeAll(async () => {
  db = await testDb();
  const rows = await db.select().from(apartments);
  studio = rows.find((a) => a.slug === 'studio')!.id;
  suite = rows.find((a) => a.slug === 'executive-suite')!.id;
});

describe('createStaffBooking', () => {
  it('creates a confirmed walk-in at the rate-plan price and confirms to the guest', async () => {
    const b = await create(); // Wed night, studio GH₵ 650
    expect(b).toMatchObject({ status: 'confirmed', source: 'walk_in', totalAmount: 65_000, paymentMode: 'pay_on_arrival' });
    expect(await balance(b.id)).toBe(65_000);
    expect(await templates(b.id)).toEqual(['booking_confirmed:email', 'booking_confirmed:sms']);
  });

  it('records OTA bookings as paid on the channel, without messaging the guest', async () => {
    const b = await create({ checkIn: '2027-03-12', checkOut: '2027-03-14', source: 'airbnb', channelRef: 'HMXYZ123', totalAmount: 160_000 });
    expect(b).toMatchObject({ totalAmount: 160_000, channelRef: 'HMXYZ123' });
    const f = await folio(b.id);
    expect(f.map((e) => `${e.type}:${e.method ?? ''}:${e.amount}`).sort()).toEqual(['charge::160000', 'payment:ota:160000']);
    expect(await balance(b.id)).toBe(0);
    expect(await templates(b.id)).toEqual([]);
  });

  it('refuses overlapping dates', async () => {
    await expect(create({ checkIn: '2027-03-13', checkOut: '2027-03-15' })).rejects.toMatchObject({ status: 409 });
  });

  it('reuses a returning guest by id', async () => {
    const first = await create({ checkIn: '2027-03-20', checkOut: '2027-03-21' });
    const again = await create({ checkIn: '2027-03-22', checkOut: '2027-03-23', guest: { id: first.guestId, fullName: 'ignored' } });
    expect(again.guestId).toBe(first.guestId);
  });
});

describe('changeBooking', () => {
  it('extends a stay, re-prices it and posts the difference', async () => {
    const b = await create({ checkIn: '2027-04-05', checkOut: '2027-04-06' }); // Mon
    const changed = await changeBooking(db, b.id, { checkOut: '2027-04-07' }, STAFF, NOW); // 1 → 2 nights
    expect(changed.totalAmount).toBe(130_000);
    const f = await folio(b.id);
    expect(f.at(-1)).toMatchObject({ type: 'charge', amount: 65_000 });
    expect(await balance(b.id)).toBe(130_000);
    expect(await templates(b.id)).toContain('booking_changed:sms');
  });

  it('moving to a cheaper stay posts a negative adjustment; keeping the price posts none', async () => {
    const b = await create({ apartmentId: suite, checkIn: '2027-04-12', checkOut: '2027-04-14' });
    await changeBooking(db, b.id, { apartmentId: studio }, STAFF, NOW);
    expect(await balance(b.id)).toBe(130_000);
    const before = (await folio(b.id)).length;
    await changeBooking(db, b.id, { checkOut: '2027-04-15', price: 'keep' }, STAFF, NOW);
    expect((await folio(b.id)).length).toBe(before);
    await changeBooking(db, b.id, { price: 100_000 }, STAFF, NOW);
    expect(await balance(b.id)).toBe(100_000);
  });

  it('won’t move onto another booking', async () => {
    const a = await create({ checkIn: '2027-05-01', checkOut: '2027-05-03' });
    await create({ checkIn: '2027-05-03', checkOut: '2027-05-05' });
    await expect(changeBooking(db, a.id, { checkOut: '2027-05-04' }, STAFF, NOW)).rejects.toMatchObject({ status: 409 });
  });

  it('only lets checked-in guests change the check-out date', async () => {
    const b = await create({ checkIn: '2027-05-10', checkOut: '2027-05-12' });
    await db.update(bookings).set({ status: 'checked_in' }).where(eq(bookings.id, b.id));
    await expect(changeBooking(db, b.id, { checkIn: '2027-05-09' }, STAFF, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(changeBooking(db, b.id, { checkOut: '2027-05-13' }, STAFF, NOW)).resolves.toMatchObject({ checkOut: '2027-05-13' });
  });
});

describe('cancelBooking', () => {
  it('reverses the charges, keeps the fee, frees the dates and tells the guest', async () => {
    const b = await create({ checkIn: '2027-06-01', checkOut: '2027-06-03' });
    const c = await cancelBooking(db, b.id, { fee: 20_000, reason: 'Plans changed' }, STAFF, NOW);
    expect(c.status).toBe('cancelled');
    expect(c.notes).toContain('Cancelled: Plans changed');
    expect(await balance(b.id)).toBe(20_000);
    expect(await templates(b.id)).toContain('booking_cancelled:email');
    await expect(create({ checkIn: '2027-06-01', checkOut: '2027-06-03' })).resolves.toBeTruthy();
    await expect(cancelBooking(db, b.id, {}, STAFF, NOW)).rejects.toMatchObject({ status: 400 });
  });
});

describe('calendarData', () => {
  it('returns the bookings overlapping the range with balances', async () => {
    const cal = await calendarData(db, '2027-03-09', '2027-03-15');
    expect(cal.apartments.length).toBeGreaterThan(0);
    const airbnb = cal.bookings.find((b) => b.source === 'airbnb')!;
    expect(airbnb).toMatchObject({ paid: 160_000, balance: 0, guestName: 'Yaw Mensah' });
    expect(cal.bookings.every((b) => b.checkIn < '2027-03-15' && b.checkOut > '2027-03-09')).toBe(true);
    await expect(calendarData(db, '2027-03-09', '2027-12-31')).rejects.toMatchObject({ status: 400 });
  });
});
