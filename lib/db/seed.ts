/**
 * Idempotent seed: only fills tables that are empty.
 * Apartments, rates and menu are PLACEHOLDER data (per the plan's "build on placeholder
 * data" risk mitigation) — replace them in the dashboard once Sam sends real content.
 */
import bcrypt from 'bcryptjs';
import { count, eq, inArray } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { DB } from './index';
import {
  staffUsers, apartments, apartmentPhotos, ratePlans, policies, housekeepingStatus, menuItems,
} from './schema';

const cedis = (ghs: number) => Math.round(ghs * 100);

const PLACEHOLDER_APARTMENTS = [
  {
    slug: 'studio', name: 'Garden Studio', bedrooms: 1, bathrooms: 1, maxGuests: 2,
    description: 'A bright, fully furnished studio overlooking the gardens — ideal for solo travellers and couples.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Kitchenette', 'Hot water', '24/7 security'],
    photos: ['/assets/BRTN GRDN-20.JPG', '/assets/BRTN GRDN-22.JPG', '/assets/BRTN GRDN-13.JPG'], base: 650, weekend: 750,
  },
  {
    slug: 'one-bedroom', name: 'One-Bedroom Apartment', bedrooms: 1, bathrooms: 1, maxGuests: 3,
    description: 'Separate bedroom and living area with a full kitchen, perfect for longer work stays.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Full kitchen', 'Washing machine', 'Parking', '24/7 security'],
    photos: ['/assets/BRTN GRDN-10.JPEG', '/assets/BRTN GRDN-18.JPG', '/assets/BRTN GRDN-17.JPG'], base: 900, weekend: 1000,
  },
  {
    slug: 'two-bedroom', name: 'Two-Bedroom Apartment', bedrooms: 2, bathrooms: 2, maxGuests: 5,
    description: 'Spacious two-bedroom apartment for families and small groups, with en-suite bathrooms.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Full kitchen', 'Washing machine', 'Parking', 'Balcony', '24/7 security'],
    photos: ['/assets/BRTN GRDN-12.JPEG', '/assets/bed.JPEG', '/assets/BRTN GRDN-21.JPG', '/assets/BRTN GRDN-14.JPG'], base: 1300, weekend: 1450,
  },
  {
    slug: 'executive-suite', name: 'Executive Suite', bedrooms: 3, bathrooms: 3, maxGuests: 6,
    description: 'Our largest suite: three bedrooms, generous lounge and dining space, and premium finishes.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Smart TV', 'Full kitchen', 'Washing machine', 'Parking', 'Balcony', 'Workspace', '24/7 security'],
    photos: ['/assets/living.JPEG', '/assets/furnish.JPG', '/assets/BRTN GRDN-14.JPG', '/assets/BRTN GRDN-13.JPG'], base: 1800, weekend: 2000,
  },
];

const PLACEHOLDER_MENU = [
  { category: 'Breakfast', name: 'Continental Breakfast', price: 120, description: 'Bread, eggs your way, sausage, fruit and tea or coffee.' },
  { category: 'Breakfast', name: 'Hausa Koko & Koose', price: 60, description: 'Spiced millet porridge with bean fritters.' },
  { category: 'Mains', name: 'Jollof Rice & Grilled Chicken', price: 150, description: 'Served with coleslaw and fried plantain.' },
  { category: 'Mains', name: 'Banku & Grilled Tilapia', price: 180, description: 'With fresh pepper and onions.' },
  { category: 'Mains', name: 'Waakye Special', price: 110, description: 'With egg, wele, gari, spaghetti and shito.' },
  { category: 'Mains', name: 'Fried Rice & Beef Sauce', price: 140, description: '' },
  { category: 'Light Bites', name: 'Club Sandwich & Fries', price: 100, description: '' },
  { category: 'Drinks', name: 'Fresh Fruit Juice', price: 40, description: 'Pineapple, orange or watermelon.' },
  { category: 'Drinks', name: 'Sobolo', price: 30, description: 'Chilled hibiscus drink.' },
  { category: 'Drinks', name: 'Coffee or Tea', price: 30, description: '' },
];

async function isEmpty(db: DB, table: PgTable) {
  const [{ n }] = await db.select({ n: count() }).from(table);
  return n === 0;
}

export async function seed(db: DB) {
  if (await isEmpty(db, staffUsers)) {
    const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'bruton2026';
    await db.insert(staffUsers).values({
      username, name: 'Owner', role: 'owner', passwordHash: await bcrypt.hash(password, 10),
    });
  }

  await db.insert(policies).values({
    id: 1,
    cancellationText: 'Free cancellation up to 7 days before arrival. Within 7 days, 50% of the booking total is charged.',
  }).onConflictDoNothing();

  if (await isEmpty(db, apartments)) {
    for (const [i, a] of PLACEHOLDER_APARTMENTS.entries()) {
      const [apt] = await db.insert(apartments).values({
        slug: a.slug, name: a.name, description: a.description, bedrooms: a.bedrooms,
        bathrooms: a.bathrooms, maxGuests: a.maxGuests, amenities: a.amenities, sortOrder: i,
      }).returning();
      await db.insert(apartmentPhotos).values(a.photos.map((url, j) => ({ apartmentId: apt.id, url, alt: a.name, sortOrder: j })));
      await db.insert(ratePlans).values({
        apartmentId: apt.id, name: 'Standard', baseRate: cedis(a.base), weekendRate: cedis(a.weekend),
        longStayMinNights: 7, longStayDiscountPct: 10,
      });
      await db.insert(housekeepingStatus).values({ apartmentId: apt.id, status: 'clean' });
    }
  }

  await refreshPlaceholderPhotos(db);

  if (await isEmpty(db, menuItems)) {
    await db.insert(menuItems).values(
      PLACEHOLDER_MENU.map((m, i) => ({ ...m, price: cedis(m.price), sortOrder: i })),
    );
  }
}

/** The first seed gave each placeholder apartment one exterior shot. */
const OLD_PLACEHOLDER_PHOTOS = ['/assets/main-home1.jpg', '/assets/BRTN GRDN-26.JPG'];

/**
 * Databases seeded before the interior photo sets existed: swap the single exterior shot for the
 * apartment's interior set. Only touches seeded apartments whose photos are still exactly that one
 * placeholder, so anything uploaded in Apartments & Rates is left alone.
 */
async function refreshPlaceholderPhotos(db: DB) {
  const seeded = await db.select().from(apartments)
    .where(inArray(apartments.slug, PLACEHOLDER_APARTMENTS.map((a) => a.slug)));
  for (const apt of seeded) {
    const photos = await db.select().from(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, apt.id));
    if (photos.length !== 1 || !OLD_PLACEHOLDER_PHOTOS.includes(photos[0].url)) continue;
    const set = PLACEHOLDER_APARTMENTS.find((a) => a.slug === apt.slug)!.photos;
    await db.delete(apartmentPhotos).where(eq(apartmentPhotos.apartmentId, apt.id));
    await db.insert(apartmentPhotos).values(set.map((url, j) => ({ apartmentId: apt.id, url, alt: apt.name, sortOrder: j })));
  }
}
