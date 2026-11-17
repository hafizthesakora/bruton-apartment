/** Visually reviewed property photographs. Illustrations and portraits stay out of room galleries. */
export const PROPERTY_PHOTOS = {
  entrance: { src: '/assets/BRTN GRDN-1.JPEG', alt: 'Entrance to Bruton Gardens and Nhyira Hall' },
  gardens: { src: '/assets/BRTN GRDN-6.JPEG', alt: 'Landscaped lawn and paved paths between the apartments and event hall' },
  palms: { src: '/assets/BRTN GRDN-2.JPEG', alt: 'Palm trees and landscaped courtyard at Bruton Gardens' },
  terrace: { src: '/assets/BRTN GRDN-3.JPEG', alt: 'Covered terrace looking across the landscaped courtyard' },
  aerial: { src: '/assets/main-home1.jpg', alt: 'Aerial view of the event hall, lawns and apartment courtyard' },
  courtyard: { src: '/assets/BRTN GRDN-24.JPEG', alt: 'Apartment building and paved parking courtyard in daylight' },
  apartmentsNight: { src: '/assets/BRTN GRDN-27.JPG', alt: 'Apartment building and courtyard illuminated at night' },
  studio: { src: '/assets/BRTN GRDN-10.JPEG', alt: 'Open-plan studio with a bed, grey sofa and blue curtains' },
  studioAngle: { src: '/assets/BRTN GRDN-11 2.JPEG', alt: 'Bed and sofa in a bright open-plan studio' },
  studioReverse: { src: '/assets/BRTN GRDN-12.JPEG', alt: 'Studio seating area, wall-mounted television and desk' },
  bedroom: { src: '/assets/BRTN GRDN-20.JPG', alt: 'Bedroom with white bedding, fitted wardrobe and a work desk' },
  warmBedroom: { src: '/assets/BRTN GRDN-15 2.JPEG', alt: 'Bedroom with warm lighting, fitted wardrobe and wall-mounted television' },
  linen: { src: '/assets/BRTN GRDN-22.JPG', alt: 'Bruton Gardens branded pillows and fresh white bed linen' },
  kitchen: { src: '/assets/BRTN GRDN-14.JPG', alt: 'Apartment kitchen with fitted cabinets, microwave and cooking appliances' },
  kitchenette: { src: '/assets/BRTN GRDN-18.JPG', alt: 'Compact kitchenette with microwave and sink beside the bedroom' },
  bathroom: { src: '/assets/BRTN GRDN-17.JPG', alt: 'En-suite bathroom with a glass shower and vanity' },
  shower: { src: '/assets/BRTN GRDN-13.JPG', alt: 'Glass shower enclosure and bathroom vanity' },
  showerDetail: { src: '/assets/BRTN GRDN-21.JPG', alt: 'En-suite shower room with glass enclosure and white fittings' },
  hall: { src: '/assets/BRTN GRDN-4.JPEG', alt: 'Nhyira Hall entrance and exterior in daylight' },
  hallDay: { src: '/assets/BRTN GRDN-9.JPEG', alt: 'Nhyira Hall interior with chandeliers and daylight through draped windows' },
  hallDoors: { src: '/assets/BRTN GRDN-5.JPEG', alt: 'Event hall interior with glass entrance doors and chandeliers' },
  hallEvening: { src: '/assets/BRTN GRDN-25 2.JPEG', alt: 'Event hall with warm ceiling lights and white drapes' },
  hallDusk: { src: '/assets/BRTN GRDN-23.JPG', alt: 'Nhyira Hall and its lawn at dusk' },
  hallNight: { src: '/assets/BRTN GRDN-26.JPG', alt: 'Nhyira Hall exterior lit up at night' },
  banquet: { src: '/assets/brut2.jpg', alt: 'Event dining setup with laid tables, gold chairs and floral centrepieces' },
  celebration: { src: '/assets/brut1.jpg', alt: 'Decorated celebration stage with floral arrangements and seating' },
} as const;

export type PropertyPhoto = { src: string; alt: string };
export const ABOUT_PHOTOS = [
  PROPERTY_PHOTOS.entrance, PROPERTY_PHOTOS.gardens, PROPERTY_PHOTOS.terrace,
  PROPERTY_PHOTOS.studio, PROPERTY_PHOTOS.hallDay, PROPERTY_PHOTOS.courtyard,
];
export const HOME_GALLERY_PHOTOS = [
  PROPERTY_PHOTOS.studio, PROPERTY_PHOTOS.bedroom, PROPERTY_PHOTOS.gardens,
  PROPERTY_PHOTOS.terrace, PROPERTY_PHOTOS.hallEvening, PROPERTY_PHOTOS.kitchen,
  PROPERTY_PHOTOS.banquet, PROPERTY_PHOTOS.apartmentsNight,
];
export const ROOM_PHOTOS = {
  garden_studio: [PROPERTY_PHOTOS.studio, PROPERTY_PHOTOS.studioReverse, PROPERTY_PHOTOS.kitchen, PROPERTY_PHOTOS.bathroom],
  two_bedroom: [PROPERTY_PHOTOS.bedroom, PROPERTY_PHOTOS.warmBedroom, PROPERTY_PHOTOS.kitchenette, PROPERTY_PHOTOS.showerDetail],
};

/** A service keeps its subject photo even when cards are reordered in the editor. */
export function servicePhoto(title: string): PropertyPhoto | null {
  if (/apartment|booking|stay/i.test(title)) return PROPERTY_PHOTOS.studio;
  if (/event|conference|celebrat/i.test(title)) return PROPERTY_PHOTOS.hallEvening;
  if (/cater/i.test(title)) return PROPERTY_PHOTOS.banquet;
  // No dedicated restaurant photograph exists in the supplied assets.
  if (/restaurant|dining/i.test(title)) return null;
  return PROPERTY_PHOTOS.terrace;
}

export const GALLERY_CATEGORIES = ['All Spaces', 'Apartments', 'Gardens', 'Event Center', 'Amenities'];
const galleryPhoto = (key: keyof typeof PROPERTY_PHOTOS, title: string, category: string, details: string) => ({
  id: key, title, category, details, image: PROPERTY_PHOTOS[key].src, description: PROPERTY_PHOTOS[key].alt,
});
export const GALLERY_PHOTOS = [
  galleryPhoto('studio', 'Garden Studio', 'Apartments', 'Open-plan bedroom & seating'),
  galleryPhoto('bedroom', 'Apartment Bedroom', 'Apartments', 'White linen & workspace'),
  galleryPhoto('studioAngle', 'Studio Interior', 'Apartments', 'Bed & sofa'),
  galleryPhoto('studioReverse', 'Studio Seating Area', 'Apartments', 'Sofa, TV & desk'),
  galleryPhoto('warmBedroom', 'Bedroom at Night', 'Apartments', 'Warm lighting & fitted storage'),
  galleryPhoto('linen', 'Fresh Linen', 'Apartments', 'Bruton Gardens bedding'),
  galleryPhoto('kitchen', 'Apartment Kitchen', 'Apartments', 'Fitted cabinets & cooking appliances'),
  galleryPhoto('kitchenette', 'Compact Kitchenette', 'Apartments', 'Microwave & sink'),
  galleryPhoto('bathroom', 'En-Suite Bathroom', 'Apartments', 'Glass shower & vanity'),
  galleryPhoto('shower', 'Walk-In Shower', 'Apartments', 'Glass enclosure & vanity'),
  galleryPhoto('showerDetail', 'Shower Room', 'Apartments', 'En-suite fittings'),
  galleryPhoto('entrance', 'Welcome to Bruton Gardens', 'Gardens', 'Property entrance'),
  galleryPhoto('gardens', 'The Gardens', 'Gardens', 'Lawn & landscaped paths'),
  galleryPhoto('palms', 'Palm Courtyard', 'Gardens', 'Palms & planting'),
  galleryPhoto('aerial', 'Bruton Gardens from Above', 'Gardens', 'Property overview'),
  galleryPhoto('terrace', 'Covered Terrace', 'Amenities', 'Shaded outdoor space'),
  galleryPhoto('courtyard', 'Apartment Courtyard', 'Amenities', 'Access & parking'),
  galleryPhoto('apartmentsNight', 'Apartments at Night', 'Amenities', 'Illuminated courtyard'),
  galleryPhoto('hall', 'Nhyira Hall', 'Event Center', 'Event hall exterior'),
  galleryPhoto('hallDay', 'Hall in Daylight', 'Event Center', 'Chandeliers & draped windows'),
  galleryPhoto('hallDoors', 'Hall Entrance', 'Event Center', 'Glass doors & natural light'),
  galleryPhoto('hallEvening', 'Hall with Evening Lighting', 'Event Center', 'Warm lights & drapes'),
  galleryPhoto('hallDusk', 'Hall at Dusk', 'Event Center', 'Event hall & lawn'),
  galleryPhoto('hallNight', 'Hall at Night', 'Event Center', 'Illuminated event venue'),
  galleryPhoto('banquet', 'Event Dining Setup', 'Event Center', 'Laid tables & floral centrepieces'),
  galleryPhoto('celebration', 'Celebration Stage', 'Event Center', 'Event décor & seating'),
];

export const photoCarousel = (photos: readonly PropertyPhoto[]) => photos.map((photo, i) => ({ id: String(i + 1), ...photo, caption: '' }));
