import { PUBLIC_NAV } from './navigation';
import { PROPERTY_PHOTOS, servicePhoto } from './property-media';
type Content = Partial<typeof import('../data/content.json')>;

/** Reconcile the reviewed defaults in saved CMS data as well as fresh installations. */
export function reviewedContent(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const c = structuredClone(input) as Content;
  if (c.services?.hero?.title === 'Our Services') c.services.hero.title = 'Services';
  for (const member of c.about?.team?.members ?? []) {
    if (member.name === 'Mrs. Portia Owusu Asante') member.name = 'Yaa Asante';
  }
  for (const category of c.facilities?.categories ?? []) {
    for (const item of category.items ?? []) {
      if (item.title === 'Washer & Dryer') {
        item.title = 'Laundry Services';
        item.description = 'Laundry services are available through our team.';
      }
    }
    if (category.category === 'In-Apartment Features') {
      for (const item of [
        { title: 'Iron & Ironing Board', description: 'Available on request from reception.' },
        { title: 'Satellite Smart TV', description: 'Satellite channels and smart TV entertainment.' },
      ]) if (!category.items.some((i) => i.title === item.title)) category.items.push(item);
    }
  }
  if (c.facilities?.explore?.primaryCta === 'Start Tour') {
    c.facilities.explore.primaryCta = 'View Apartment Photos';
    c.facilities.explore.body = 'Browse real photos of our furnished apartments and the amenities available during your stay.';
  }
  if (c.footer) c.footer.quickLinks = PUBLIC_NAV;
  return c;
}

/** Correct known stock placements once; retain custom uploads and CMS copy. */
export function reviewedMediaContent(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const c = structuredClone(input) as Content;
  const about = c.home?.about;
  if (about) {
    if (['/assets/BRTN GRDN-22.JPG', '/assets/main-home1.jpg'].includes(about.mainImage)) {
      about.mainImage = PROPERTY_PHOTOS.studio.src;
      about.mainImageAlt = PROPERTY_PHOTOS.studio.alt;
    }
    for (const card of about.cards ?? []) {
      if (card.image === '/assets/main-home1.jpg') { card.image = PROPERTY_PHOTOS.studio.src; card.alt = PROPERTY_PHOTOS.studio.alt; }
      else if (card.image === '/assets/BRTN GRDN-3.JPEG') { card.image = PROPERTY_PHOTOS.bedroom.src; card.alt = PROPERTY_PHOTOS.bedroom.alt; }
      else if (card.image === '/assets/BRTN GRDN-25 2.JPEG') { card.image = PROPERTY_PHOTOS.gardens.src; card.alt = PROPERTY_PHOTOS.gardens.alt; }
    }
  }
  for (const card of c.services?.cards ?? []) {
    const photo = servicePhoto(card.title);
    const old = ['/assets/living.JPEG', '/assets/brut2.jpg', '/assets/brut1.jpg', '/assets/BRTN GRDN-26.JPG', '/assets/BRTN GRDN-3.JPEG'];
    if (!card.image || old.includes(card.image)) {
      card.image = photo?.src ?? '';
      card.imageAlt = photo?.alt ?? '';
    }
  }
  for (const item of c.footer?.featuredItems ?? []) {
    if (item.title === 'Premium Units' && item.image === '/assets/main-home1.jpg') item.image = PROPERTY_PHOTOS.studio.src;
    if (item.title === 'Beautiful Gardens' && item.image === '/assets/BRTN GRDN-26.JPG') item.image = PROPERTY_PHOTOS.gardens.src;
  }
  return c;
}
