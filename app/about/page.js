export const dynamic = 'force-dynamic';

import { readJSON } from '@/lib/data';
import AboutClient from './AboutClient';

export default async function AboutPage() {
  const content = await readJSON('content.json') || {};
  const aboutData = content.about || {};

  const carousel = await readJSON('carousel.json') || {};
  const slideshowEntry = carousel['about-slideshow'];
  const slideImages = slideshowEntry?.images?.length
    ? slideshowEntry.images.map(img => ({ src: img.src, alt: img.alt || 'Bruton Gardens property' }))
    : null;

  return <AboutClient initialData={aboutData} initialSlideImages={slideImages} />;
}
