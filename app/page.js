import Banner from './_Components/Banner';
import About from './_Components/About';
import HomeFeatures from './_Components/HomeFeatures';
import Services from './_Components/Services';

export default function Home() {
  return (
    <div>
      <Banner />
      <About />
      <div className="bg-[#f4f5fac8]">
        <HomeFeatures />
      </div>
      <div>
        <Services />
      </div>
    </div>
  );
}
