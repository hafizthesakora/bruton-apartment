import { asc, eq } from 'drizzle-orm';
import type { DB } from './index';
import { apartmentPhotos, apartments, siteContent } from './schema';
import { reviewedMediaContent } from '@/lib/site-content';
import { ABOUT_PHOTOS, HOME_GALLERY_PHOTOS, PROPERTY_PHOTOS, ROOM_PHOTOS, photoCarousel } from '@/lib/property-media';

/** Existing databases keep CMS and room photographs, so bundled defaults alone are insufficient. */
export async function reconcilePropertyMedia(db: DB) {
  await db.transaction(async (tx) => {
    const key = 'review-property-media-v1';
    await tx.insert(siteContent).values({ key, data: { complete: false } }).onConflictDoNothing();
    const [marker] = await tx.select().from(siteContent).where(eq(siteContent.key, key)).for('update');
    if ((marker.data as { complete: boolean }).complete) return;

    const [content] = await tx.select().from(siteContent).where(eq(siteContent.key, 'content.json')).for('update');
    if (content) await tx.update(siteContent).set({ data: reviewedMediaContent(content.data), updatedAt: new Date() }).where(eq(siteContent.key, content.key));

    const [row] = await tx.select().from(siteContent).where(eq(siteContent.key, 'carousel.json')).for('update');
    if (row) {
      const carousels = structuredClone(row.data) as Record<string, { label: string; images: { src: string; alt?: string }[] }>;
      for (const [name, photos] of [['home-services', HOME_GALLERY_PHOTOS], ['about-slideshow', ABOUT_PHOTOS]] as const) {
        const carousel = carousels[name];
        if (carousel && carousel.images.every((p) => p.src.startsWith('/assets/'))) carousel.images = photoCarousel(photos);
      }
      await tx.update(siteContent).set({ data: carousels, updatedAt: new Date() }).where(eq(siteContent.key, row.key));
    }

    const reviewedSources = new Set<string>([
      ...Object.values(PROPERTY_PHOTOS).map((p) => p.src), '/assets/bed.JPEG', '/assets/living.JPEG',
      '/assets/furnish.JPG', '/assets/hall.JPEG', '/assets/facilities.JPEG',
    ]);
    const units = await tx.select().from(apartments);
    for (const unit of units) {
      if (unit.roomType !== 'garden_studio' && unit.roomType !== 'two_bedroom') continue;
      const photos = await tx.select().from(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, unit.id)).orderBy(asc(apartmentPhotos.sortOrder));
      // Preserve staff uploads and deliberate custom photo sets.
      if (photos.some((p) => !reviewedSources.has(p.url))) continue;
      await tx.delete(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, unit.id));
      await tx.insert(apartmentPhotos).values(ROOM_PHOTOS[unit.roomType].map((photo, i) => ({ apartmentId: unit.id, url: photo.src, alt: photo.alt, sortOrder: i })));
    }
    await tx.update(siteContent).set({ data: { complete: true }, updatedAt: new Date() }).where(eq(siteContent.key, key));
  });
}
