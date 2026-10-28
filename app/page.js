import Banner from './_Components/Banner';
import About from './_Components/About';
import HomeApartments from './_Components/HomeApartments';
import HomeFeatures from './_Components/HomeFeatures';
import GalleryStrip from './_Components/GalleryStrip';
import HomeEvents from './_Components/HomeEvents';
import Services from './_Components/Services';
import { readJSON } from '@/lib/data';
import { getDb } from '@/lib/db';
import { listShowcase } from '@/lib/apartments';

export const dynamic = 'force-dynamic';

async function showcase() {
  try {
    return await listShowcase(await getDb());
  } catch (err) {
    // The homepage must still render if the database is unreachable.
    console.error('[home] apartments showcase failed', err);
    return [];
  }
}

export default async function Home() {
  const [content, settings, apartments] = await Promise.all([
    readJSON('content.json'),
    readJSON('settings.json'),
    showcase(),
  ]);
  const home = content?.home || {};

  return (
    <>
      <Banner content={home.hero} social={settings?.social} />
      <About content={home.about} />
      <HomeApartments apartments={apartments} />
      <HomeFeatures />
      <GalleryStrip />
      <HomeEvents />
      <Services content={home.services} />
    </>
  );
}
