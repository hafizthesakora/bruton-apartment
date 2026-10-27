import { describe, it, expect, beforeAll } from 'vitest';
import { unzipSync, strFromU8 } from 'fflate';
import { testDb } from './helpers';
import { apartments, eventLeads, expenses, folioEntries } from '@/lib/db/schema';
import { createStaffBooking, cancelBooking, type StaffBookingInput } from '@/lib/booking/staff';
import { report, reportSheets } from '@/lib/reports';
import { buildXlsx } from '@/lib/xlsx';
import type { DB } from '@/lib/db';

let db: DB;
let studio: number;
let suite: number;
let aptCount: number;
const STAFF = { id: 1, name: 'Owner' };
const NOW = new Date('2028-06-01T10:00:00Z');
const ts = (d: string) => new Date(`${d}T12:00:00Z`);

const create = (o: Partial<StaffBookingInput>) => createStaffBooking(db, {
  apartmentId: studio, checkIn: '2028-06-10', checkOut: '2028-06-12', adults: 1, children: 0, source: 'walk_in',
  guest: { fullName: 'Report Guest' }, notify: false, ...o,
}, STAFF, NOW);

beforeAll(async () => {
  db = await testDb();
  const rows = await db.select().from(apartments);
  aptCount = rows.filter((a) => a.active).length;
  studio = rows.find((a) => a.slug === 'studio')!.id;
  suite = rows.find((a) => a.slug === 'executive-suite')!.id;

  // Inside June 10–19: 2 nights (studio), 4 of 6 nights (suite, runs past the end), an Airbnb stay.
  const a = await create({ totalAmount: 100_000 });
  await create({ apartmentId: suite, checkIn: '2028-06-16', checkOut: '2028-06-22', totalAmount: 600_000 });
  await create({ checkIn: '2028-06-14', checkOut: '2028-06-15', source: 'airbnb', channelRef: 'HMREP', totalAmount: 70_000 });
  // Cancelled: no room revenue, but its fee counts.
  const c = await create({ checkIn: '2028-06-17', checkOut: '2028-06-18', totalAmount: 80_000 });
  await cancelBooking(db, c.id, { fee: 20_000, notify: false }, STAFF, NOW);
  // Outside the range entirely.
  await create({ checkIn: '2028-07-01', checkOut: '2028-07-03', totalAmount: 999_000 });

  await db.insert(folioEntries).values([
    { bookingId: a.id, type: 'charge', amount: 15_000, description: 'Airport pickup', createdAt: ts('2028-06-11') },
    { bookingId: a.id, type: 'charge', amount: -5_000, description: 'Adjustment: noisy AC', createdAt: ts('2028-06-11') },
    { bookingId: a.id, type: 'payment', amount: 60_000, method: 'momo', description: 'MoMo', createdAt: ts('2028-06-10') },
    { bookingId: a.id, type: 'payment', amount: 40_000, method: 'cash', description: 'Cash', createdAt: ts('2028-06-12') },
    { bookingId: a.id, type: 'refund', amount: 10_000, method: 'cash', description: 'Refund', createdAt: ts('2028-06-12') },
    { bookingId: a.id, type: 'payment', amount: 1_000, method: 'cash', description: 'Too late', createdAt: ts('2028-06-25') },
  ]);
  // The cancellation fee was posted with the real clock; move it into the range.
  const { eq, and } = await import('drizzle-orm');
  await db.update(folioEntries).set({ createdAt: ts('2028-06-17') }).where(and(eq(folioEntries.bookingId, c.id), eq(folioEntries.description, 'Cancellation fee')));

  await db.insert(eventLeads).values([
    { reference: 'EVREP1', name: 'Wedding', phone: '0200000000', eventDate: '2028-06-15', eventType: 'Wedding', headcount: 100, stage: 'confirmed', quoteAmount: 500_000, depositPaidAmount: 250_000, depositPaidAt: ts('2028-06-05') },
    { reference: 'EVREP2', name: 'Party', phone: '0200000001', eventDate: '2028-06-18', eventType: 'Birthday', headcount: 30, stage: 'quoted', quoteAmount: 120_000, depositPaidAmount: 0 },
    { reference: 'EVREP3', name: 'Later', phone: '0200000002', eventDate: '2028-08-01', eventType: 'Party', headcount: 30, stage: 'deposit_paid', quoteAmount: 90_000, depositPaidAmount: 40_000, depositPaidAt: ts('2028-06-15') },
  ]);
  await db.insert(expenses).values([
    { category: 'Utilities', amount: 30_000, date: '2028-06-12' },
    { category: 'Utilities', amount: 10_000, date: '2028-06-19' },
    { category: 'Repairs', amount: 25_000, date: '2028-06-20' }, // outside
  ]);
});

describe('report', () => {
  it('works out occupancy, ADR and room revenue, cutting stays at the range edges', async () => {
    const r = await report(db, '2028-06-10', '2028-06-19');
    expect(r.days).toBe(10);
    // studio 2 + 1 (airbnb) nights; suite 16,17,18,19 = 4 nights. Suite at 100k/night.
    expect(r.summary).toMatchObject({ available: aptCount * 10, nightsSold: 7, roomRevenue: 100_000 + 70_000 + 400_000 });
    expect(r.summary.adr).toBe(Math.round(570_000 / 7));
    expect(r.summary.occupancy).toBeCloseTo(7 / (aptCount * 10));
    expect(r.byApartment.find((a) => a.apartmentId === suite)).toMatchObject({ nights: 4, revenue: 400_000, adr: 100_000 });
    const sources = Object.fromEntries(r.bySource.map((s) => [s.source, s]));
    expect(sources.walk_in).toMatchObject({ bookings: 2, nights: 6, revenue: 500_000 });
    expect(sources.airbnb).toMatchObject({ bookings: 1, nights: 1, revenue: 70_000 });
    expect(r.daily.find((d) => d.day === '2028-06-17')).toMatchObject({ nights: 1, revenue: 100_000 });
  });

  it('splits other charges, nets payments by method and leaves channel money out of cash', async () => {
    const r = await report(db, '2028-06-10', '2028-06-19');
    expect(r.other).toEqual({ orders: 0, extras: 15_000, cancellations: 20_000, adjustments: -5_000 });
    const pay = Object.fromEntries(r.payments.map((p) => [p.method, p]));
    expect(pay.momo.net).toBe(60_000);
    expect(pay.cash).toMatchObject({ received: 40_000, refunded: 10_000, net: 30_000 });
    // Airbnb booking was recorded as paid to the channel at creation (real clock) — not in this range.
    expect(r.summary.cashIn).toBe(60_000 + 30_000 + 40_000); // + event deposit received on 15 June
  });

  it('counts events by event date and deposits by the day they came in', async () => {
    const r = await report(db, '2028-06-10', '2028-06-19');
    expect(r.events.won).toBe(1);
    expect(r.events.wonValue).toBe(500_000);
    expect(r.events.stages.find((s) => s.stage === 'quoted')).toMatchObject({ count: 1, value: 120_000 });
    expect(r.events.depositsReceived).toBe(40_000); // EVREP3's deposit; EVREP1 paid before the range
    expect(r.expenses).toEqual([{ category: 'Utilities', count: 2, amount: 40_000 }]);
    expect(r.summary.net).toBe(r.summary.cashIn - 40_000);
  });

  it('rejects bad ranges', async () => {
    await expect(report(db, '2028-06-10', '2028-06-01')).rejects.toMatchObject({ status: 400 });
    await expect(report(db, '2020-01-01', '2028-01-01')).rejects.toThrow(/two years/);
  });
});

describe('Excel export', () => {
  it('builds a valid workbook with one sheet per section', async () => {
    const r = await report(db, '2028-06-10', '2028-06-19');
    const files = unzipSync(buildXlsx(reportSheets(r, 'Bruton Gardens & Apartments')));
    const wb = strFromU8(files['xl/workbook.xml']);
    expect(wb.match(/<sheet /g)).toHaveLength(7);
    expect(wb).toContain('name="By apartment"');
    const summary = strFromU8(files['xl/worksheets/sheet1.xml']);
    expect(summary).toContain('Bruton Gardens &amp; Apartments');
    expect(summary).toContain('<v>5700</v>'); // room revenue in cedis
    expect(files['[Content_Types].xml']).toBeTruthy();
  });
});
