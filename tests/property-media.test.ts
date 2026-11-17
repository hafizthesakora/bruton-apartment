import { expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { testDb } from './helpers';
import { apartmentPhotos, apartments, siteContent } from '@/lib/db/schema';
import { reconcilePropertyMedia } from '@/lib/db/review-media';
import { PROPERTY_PHOTOS } from '@/lib/property-media';

it('repairs saved photo placements while preserving uploaded photos and editable copy', async () => {
  const db = await testDb();
  const units = await db.select().from(apartments);
  const studio = units.find((u) => u.slug === 'studio')!;
  const custom = units.find((u) => u.slug === 'two-bedroom')!;
  await db.update(apartmentPhotos).set({ url: '/assets/main-home1.jpg' }).where(eq(apartmentPhotos.apartmentId, studio.id));
  await db.update(apartmentPhotos).set({ url: '/uploads/owner-bedroom.jpg' }).where(and(eq(apartmentPhotos.apartmentId, custom.id), eq(apartmentPhotos.sortOrder, 0)));
  await db.insert(siteContent).values({ key: 'content.json', data: {
    home: { about: { heading: 'Our edited heading', mainImage: '/assets/BRTN GRDN-22.JPG', cards: [{ image: '/assets/BRTN GRDN-3.JPEG' }] } },
    services: { cards: [{ title: 'Restaurant', image: '/assets/BRTN GRDN-26.JPG' }, { title: 'Event Center', image: '/uploads/our-event.jpg' }] },
    footer: { featuredItems: [{ title: 'Premium Units', image: '/assets/main-home1.jpg' }] },
  } });
  await db.insert(siteContent).values({ key: 'carousel.json', data: {
    'about-slideshow': { label: 'Our story', images: [{ src: '/assets/BRTN GRDN-22.JPG' }] },
    'home-services': { label: 'Edited photos', images: [{ src: '/uploads/our-garden.jpg' }] },
  } });
  await db.delete(siteContent).where(eq(siteContent.key, 'review-property-media-v1'));
  await reconcilePropertyMedia(db);
  const [content] = await db.select().from(siteContent).where(eq(siteContent.key, 'content.json'));
  expect(content.data).toMatchObject({
    home: { about: { heading: 'Our edited heading', mainImage: PROPERTY_PHOTOS.studio.src } },
    services: { cards: [{ title: 'Restaurant', image: '' }, { title: 'Event Center', image: '/uploads/our-event.jpg' }] },
    footer: { featuredItems: [{ title: 'Premium Units', image: PROPERTY_PHOTOS.studio.src }] },
  });
  const [carousels] = await db.select().from(siteContent).where(eq(siteContent.key, 'carousel.json'));
  expect(carousels.data).toMatchObject({ 'home-services': { images: [{ src: '/uploads/our-garden.jpg' }] } });
  const photos = await db.select().from(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, studio.id));
  expect(photos.find((p) => p.sortOrder === 0)).toMatchObject({ url: PROPERTY_PHOTOS.studio.src, alt: PROPERTY_PHOTOS.studio.alt });
  const customPhotos = await db.select().from(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, custom.id));
  expect(customPhotos.find((p) => p.sortOrder === 0)?.url).toBe('/uploads/owner-bedroom.jpg');
  await reconcilePropertyMedia(db);
  expect(await db.select().from(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, studio.id))).toEqual(photos);
});
