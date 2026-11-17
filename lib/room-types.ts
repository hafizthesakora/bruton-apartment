import { ROOM_PHOTOS } from './property-media';

export const ROOM_TYPES = [
  {
    key: 'garden_studio', slug: 'studio', name: 'Garden Studio', count: 5,
    bedrooms: 1, bathrooms: 1, maxGuests: 2,
    description: 'A bright, fully furnished studio for solo travellers and couples, with space to relax and a kitchenette.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Satellite Smart TV', 'Kitchenette', 'Hot water', 'Laundry services', 'Iron & ironing board on request', '24/7 security'],
    photos: ROOM_PHOTOS.garden_studio.map((p) => p.src),
    base: 600, weekend: 600,
  },
  {
    key: 'two_bedroom', slug: 'two-bedroom', name: 'Two-Bedroom Apartment', count: 6,
    bedrooms: 2, bathrooms: 2, maxGuests: 5,
    description: 'A spacious two-bedroom apartment for families and small groups, with a living area, kitchen and en-suite bathrooms.',
    amenities: ['Wi-Fi', 'Air conditioning', 'Satellite Smart TV', 'Full kitchen', 'Laundry services', 'Iron & ironing board on request', 'Parking', '24/7 security'],
    photos: ROOM_PHOTOS.two_bedroom.map((p) => p.src),
    base: 1300, weekend: 1300,
  },
];

export function roomTypeName(key: string | null | undefined, fallback: string) {
  return ROOM_TYPES.find((t) => t.key === key)?.name ?? fallback;
}

/** Present one card per room type while booking a specific available physical unit. */
export function groupAvailableRooms<T extends { roomType?: string | null; name: string; id: number; available: boolean; quote?: { total: number } }>(rooms: T[]) {
  const groups = new Map<string, T[]>();
  for (const room of rooms) {
    const key = room.roomType || String(room.id);
    groups.set(key, [...(groups.get(key) ?? []), room]);
  }
  return [...groups.values()].map((units) => {
    const available = units.filter((u) => u.available).sort((a, b) => (a.quote?.total ?? Infinity) - (b.quote?.total ?? Infinity));
    const unit = available[0] ?? units[0];
    return { ...unit, name: roomTypeName(unit.roomType, unit.name), availableUnits: available.length, totalUnits: units.length };
  });
}
