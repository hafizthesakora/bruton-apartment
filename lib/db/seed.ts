/**
 * Idempotent seed: only fills tables that are empty.
 * Inventory and standard room prices are owner-confirmed. Menu items remain sample data
 * until replaced with the restaurant's actual menu in the dashboard.
 */
import bcrypt from 'bcryptjs';
import { reconcileInventory } from './review-inventory';
import { reconcilePropertyMedia } from './review-media';
import { applyConfirmedRates } from './confirmed-rates';
import { count } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import type { DB } from './index';
import {
  staffUsers, policies, menuItems,
} from './schema';

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
    if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_PASSWORD) {
      throw new Error('ADMIN_PASSWORD must be set to create the initial owner in production');
    }
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

  await reconcileInventory(db);
  await reconcilePropertyMedia(db);
  await applyConfirmedRates(db);

  if (await isEmpty(db, menuItems)) {
    await db.insert(menuItems).values(
      PLACEHOLDER_MENU.map((m, i) => ({ ...m, price: Math.round(m.price * 100), sortOrder: i })),
    );
  }
}
