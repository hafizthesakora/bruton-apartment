import { describe, it, expect, beforeAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, notifications } from '@/lib/db/schema';
import { createStaffBooking, cancelBooking, type StaffBookingInput } from '@/lib/booking/staff';
import { addFolioEntry, bookingBalance, folioDetail, folioList } from '@/lib/booking/folios';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
const STAFF = { id: 1, name: 'Front Desk' };
const NOW = new Date('2027-09-01T10:00:00Z');

const create = (o: Partial<StaffBookingInput> = {}) => createStaffBooking(db, {
  apartmentId: studio, checkIn: '2027-09-10', checkOut: '2027-09-11', adults: 1, children: 0, source: 'walk_in',
  guest: { fullName: 'Esi Asante', phone: '0244333333', email: 'esi@example.com' }, notify: false, ...o,
}, STAFF, NOW);

beforeAll(async () => {
  db = await testDb();
  studio = (await db.select().from(apartments)).find((a) => a.slug === 'studio')!.id;
});

describe('addFolioEntry', () => {
  it('posts extra charges and desk payments, and sends a receipt for the payment', async () => {
    const b = await create();
    await addFolioEntry(db, b.id, { kind: 'charge', description: 'Airport pickup', amount: 15_000 }, STAFF);
    expect(await bookingBalance(db, b.id)).toBe(b.totalAmount + 15_000);
    await addFolioEntry(db, b.id, { kind: 'payment', amount: 15_000, method: 'momo', reference: 'MM9' }, STAFF);
    expect(await bookingBalance(db, b.id)).toBe(b.totalAmount);
    const sent = await db.select().from(notifications).where(eq(notifications.bookingId, b.id));
    expect(sent.filter((n) => n.template === 'payment_receipt').length).toBeGreaterThan(0);
  });

  it('refuses a payment above the balance, and charges without a description', async () => {
    const b = await create({ checkIn: '2027-09-12', checkOut: '2027-09-13' });
    await expect(addFolioEntry(db, b.id, { kind: 'payment', amount: b.totalAmount + 1, method: 'cash' }, STAFF)).rejects.toThrow(/more than/);
    await expect(addFolioEntry(db, b.id, { kind: 'charge', description: ' ', amount: 100 }, STAFF)).rejects.toThrow(/what the charge/);
    await expect(addFolioEntry(db, b.id, { kind: 'charge', description: 'x', amount: 0 }, STAFF)).rejects.toThrow(/above zero/);
  });

  it('refunds only what was paid, with a reason', async () => {
    const b = await create({ checkIn: '2027-09-14', checkOut: '2027-09-15' });
    await addFolioEntry(db, b.id, { kind: 'payment', amount: 20_000, method: 'cash' }, STAFF);
    await expect(addFolioEntry(db, b.id, { kind: 'refund', amount: 20_000, method: 'cash', reason: '' }, STAFF)).rejects.toThrow(/reason/);
    await expect(addFolioEntry(db, b.id, { kind: 'refund', amount: 20_001, method: 'cash', reason: 'x' }, STAFF)).rejects.toThrow(/only paid/);
    await addFolioEntry(db, b.id, { kind: 'refund', amount: 5_000, method: 'momo', reason: 'Goodwill' }, STAFF);
    expect(await bookingBalance(db, b.id)).toBe(b.totalAmount - 15_000);
  });

  it('adjusts the bill down with a negative charge, never below zero', async () => {
    const b = await create({ checkIn: '2027-09-16', checkOut: '2027-09-17' });
    await expect(addFolioEntry(db, b.id, { kind: 'adjustment', amount: b.totalAmount + 1, reason: 'x' }, STAFF)).rejects.toThrow(/only comes to/);
    const e = await addFolioEntry(db, b.id, { kind: 'adjustment', amount: 10_000, reason: 'Hot water out' }, STAFF);
    expect(e).toMatchObject({ type: 'charge', amount: -10_000, description: 'Adjustment: Hot water out' });
    expect(await bookingBalance(db, b.id)).toBe(b.totalAmount - 10_000);
  });

  it('takes a cancellation fee payment but no new charges on a cancelled booking', async () => {
    const b = await create({ checkIn: '2027-09-18', checkOut: '2027-09-19' });
    await cancelBooking(db, b.id, { fee: 5_000, notify: false }, STAFF, NOW);
    expect(await bookingBalance(db, b.id)).toBe(5_000);
    await expect(addFolioEntry(db, b.id, { kind: 'charge', description: 'Minibar', amount: 100 }, STAFF)).rejects.toThrow(/cancelled/);
    await addFolioEntry(db, b.id, { kind: 'payment', amount: 5_000, method: 'cash' }, STAFF);
    expect(await bookingBalance(db, b.id)).toBe(0);
  });
});

describe('folioList / folioDetail', () => {
  it('finds bills by guest, filters to those owing, and totals the ledger', async () => {
    const owing = await create({ checkIn: '2027-10-01', checkOut: '2027-10-02', guest: { fullName: 'Nana Yeboah', phone: '0200000001' } });
    const settled = await create({ checkIn: '2027-10-03', checkOut: '2027-10-04', guest: { fullName: 'Nana Yeboah', phone: '0200000001' } });
    await addFolioEntry(db, settled.id, { kind: 'payment', amount: settled.totalAmount, method: 'transfer' }, STAFF);

    const all = await folioList(db, { q: 'yeboah' });
    expect(all.map((r) => r.reference).sort()).toEqual([owing.reference, settled.reference].sort());
    const due = await folioList(db, { q: 'yeboah', owing: true });
    expect(due.map((r) => r.reference)).toEqual([owing.reference]);
    expect(due[0]).toMatchObject({ charges: owing.totalAmount, paid: 0, balance: owing.totalAmount });

    const d = await folioDetail(db, settled.id);
    expect(d.totals).toMatchObject({ charges: settled.totalAmount, paid: settled.totalAmount, balance: 0 });
    expect(d.entries.map((e) => e.type)).toEqual(['charge', 'payment']);
    expect(d.entries[1].staffName).toBeTruthy();
    expect(d.booking.nights).toBe(1);
  });
});
