import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartments, bookings, folioEntries, ratePlans, siteContent } from '@/lib/db/schema';
import { applyConfirmedRates } from '@/lib/db/confirmed-rates';
import { searchAvailability } from '@/lib/booking/engine';
import { createStaffBooking } from '@/lib/booking/staff';

it('applies confirmed rates to all units and weekends without repricing existing bookings', async () => {
  const db = await testDb();
  const [unit] = await db.select().from(apartments).where(eq(apartments.slug, 'studio'));
  const booking = await createStaffBooking(db, {
    apartmentId: unit.id, checkIn: '2029-05-01', checkOut: '2029-05-02', adults: 1, children: 0,
    source: 'phone', guest: { fullName: 'Existing Guest' }, totalAmount: 65000, notify: false,
  }, { id: 1, name: 'Owner' }, new Date('2029-01-01T00:00:00Z'));
  await db.update(ratePlans).set({ baseRate: 65000, weekendRate: 75000, longStayMinNights: 7, longStayDiscountPct: 10 }).where(eq(ratePlans.apartmentId, unit.id));
  await db.delete(siteContent).where(eq(siteContent.key, 'confirmed-room-rates-v1'));
  await applyConfirmedRates(db);

  const rows = await searchAvailability(db, { checkIn: '2029-06-01', checkOut: '2029-06-08', guests: 1 }, new Date('2029-01-01T00:00:00Z'));
  expect(rows).toHaveLength(11);
  for (const row of rows) {
    const nightly = row.roomType === 'garden_studio' ? 60000 : 130000;
    expect(row.quote?.lines.every((line) => line.rate === nightly)).toBe(true);
    expect(row.quote?.total).toBe(nightly * 7);
  }
  expect((await db.select().from(bookings).where(eq(bookings.id, booking.id)))[0].totalAmount).toBe(65000);
  expect((await db.select().from(folioEntries).where(eq(folioEntries.bookingId, booking.id)))[0].amount).toBe(65000);
  // Later deliberate rate edits must survive subsequent app startups.
  await db.update(ratePlans).set({ baseRate: 61000 }).where(eq(ratePlans.apartmentId, unit.id));
  await applyConfirmedRates(db);
  expect((await db.select().from(ratePlans).where(eq(ratePlans.apartmentId, unit.id)))[0].baseRate).toBe(61000);
});
