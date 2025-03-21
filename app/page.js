import { Button } from "@/components/ui/button";
import Banner from "./_Components/Banner";
import About from "./_Components/About";
import Category from "./_Components/Category";

export default function Home() {
  return (
    <div className="">
      <Banner />
      <About />
      <div className="bg-[#f4f5fac8] my-20 py-20">
        <Category />
      </div>
    </div>
  );
}
