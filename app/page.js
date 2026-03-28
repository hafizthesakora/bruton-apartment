import Banner from './_Components/Banner';
import About from './_Components/About';
import HomeFeatures from './_Components/HomeFeatures';
import Services from './_Components/Services';
import PromoBanner from './_Components/PromoBanner';
import { readJSON } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const content = await readJSON('content.json') || {};
  const home = content.home || {};

  return (
    <div>
      <Banner content={home.hero} />
      <About content={home.about} />
      <div className="bg-[#f4f5fac8]">
        <HomeFeatures />
      </div>
      <div>
        <Services content={home.services} />
      </div>
    </div>
  );
}
