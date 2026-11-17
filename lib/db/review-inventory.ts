import { eq, inArray } from 'drizzle-orm';
import type { DB } from './index';
import { apartments, apartmentPhotos, housekeepingStatus, ratePlans, siteContent } from './schema';
import { ROOM_TYPES } from '@/lib/room-types';

/** One-time review correction. Existing booking IDs and staff-entered prices are preserved. */
export async function reconcileInventory(db: DB) {
  await db.transaction(async (tx) => {
    const key = 'review-room-inventory-v1';
    await tx.insert(siteContent).values({ key, data: { complete: false } }).onConflictDoNothing();
    const [marker] = await tx.select().from(siteContent).where(eq(siteContent.key, key)).for('update');
    if ((marker.data as { complete: boolean }).complete) return;

    // Retire the two incorrect sample categories without deleting their history.
    await tx.update(apartments).set({ active: false }).where(inArray(apartments.slug, ['one-bedroom', 'executive-suite']));

    for (const [typeIndex, type] of ROOM_TYPES.entries()) {
      const [base] = await tx.select().from(apartments).where(eq(apartments.slug, type.slug));
      const basePlans = base ? await tx.select().from(ratePlans).where(eq(ratePlans.apartmentId, base.id)) : [];
      for (let unit = 1; unit <= type.count; unit++) {
        const slug = unit === 1 ? type.slug : `${type.slug}-${unit}`;
        const [existing] = await tx.select().from(apartments).where(eq(apartments.slug, slug));
        const values = {
          name: `${type.name} ${unit}`, roomType: type.key, unitNumber: unit,
          description: type.description, bedrooms: type.bedrooms, bathrooms: type.bathrooms,
          maxGuests: type.maxGuests, amenities: type.amenities, sortOrder: typeIndex * 10 + unit,
        };
        const [apt] = existing
          ? await tx.update(apartments).set(values).where(eq(apartments.id, existing.id)).returning()
          : await tx.insert(apartments).values({ ...values, slug }).returning();

        const photos = await tx.select().from(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, apt.id));
        // Keep uploaded/custom photos, replacing only the known exterior placeholder covers.
        const exterior = ['/assets/main-home1.jpg', '/assets/BRTN GRDN-26.JPG', '/assets/BRTN GRDN-4.JPEG'];
        if (!photos.length || exterior.includes(photos[0].url)) {
          await tx.delete(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, apt.id));
          await tx.insert(apartmentPhotos).values(type.photos.map((url, i) => ({ apartmentId: apt.id, url, alt: type.name, sortOrder: i })));
        }
        const plans = await tx.select().from(ratePlans).where(eq(ratePlans.apartmentId, apt.id));
        if (!plans.length) {
          await tx.insert(ratePlans).values(basePlans.length
            ? basePlans.map(({ id: _id, apartmentId: _apt, ...plan }) => ({ ...plan, apartmentId: apt.id }))
            : [{ apartmentId: apt.id, name: 'Standard', baseRate: type.base * 100, weekendRate: type.weekend * 100 }]);
        }
        await tx.insert(housekeepingStatus).values({ apartmentId: apt.id, status: 'clean' }).onConflictDoNothing();
      }
    }
    await tx.update(siteContent).set({ data: { complete: true }, updatedAt: new Date() }).where(eq(siteContent.key, key));
  });
}
