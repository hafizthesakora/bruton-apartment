import { and, eq, isNull } from 'drizzle-orm';
import type { DB } from './index';
import { apartments, ratePlans, siteContent } from './schema';
import { ROOM_TYPES } from '@/lib/room-types';

/** Apply the owner's confirmed standard nightly prices once, including existing installations. */
export async function applyConfirmedRates(db: DB) {
  await db.transaction(async (tx) => {
    const key = 'confirmed-room-rates-v1';
    await tx.insert(siteContent).values({ key, data: { complete: false } }).onConflictDoNothing();
    const [marker] = await tx.select().from(siteContent).where(eq(siteContent.key, key)).for('update');
    if ((marker.data as { complete: boolean }).complete) return;

    for (const type of ROOM_TYPES) {
      const units = await tx.select({ id: apartments.id }).from(apartments).where(eq(apartments.roomType, type.key));
      for (const unit of units) {
        const values = {
          baseRate: type.base * 100, weekendRate: type.base * 100,
          // The former 7-night / 10% discount was sample pricing, never owner-confirmed.
          longStayMinNights: null, longStayDiscountPct: null,
        };
        const updated = await tx.update(ratePlans).set(values).where(and(
          eq(ratePlans.apartmentId, unit.id), isNull(ratePlans.validFrom), isNull(ratePlans.validTo),
        )).returning({ id: ratePlans.id });
        if (!updated.length) await tx.insert(ratePlans).values({ apartmentId: unit.id, name: 'Standard', ...values });
      }
    }
    // Booking totals, payment records, and explicitly configured seasonal rates are untouched.
    await tx.update(siteContent).set({ data: { complete: true }, updatedAt: new Date() }).where(eq(siteContent.key, key));
  });
}
