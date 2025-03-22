import { Button } from "@/components/ui/button";
import Banner from "./_Components/Banner";
import About from "./_Components/About";
import Category from "./_Components/Category";
import HomeFeatures from "./_Components/HomeFeatures";
import Services from "./_Components/Services";

export default function Home() {
  return (
    <div className="">
      <Banner />
      <About />
      <div className="bg-[#f4f5fac8] my-20 py-20">
        <Category />
      </div>
      <HomeFeatures />
      <div className="bg-[#f4f5fac8] my-20 py-20">
        <Services />
      </div>
    </div>
  );
}
