"use client";
import Banner from "./_Components/Banner";
import About from "./_Components/About";
import Category from "./_Components/Category";
import HomeFeatures from "./_Components/HomeFeatures";
import Services from "./_Components/Services";
import AOS from "aos";
import "aos/dist/aos.css"; // You can also use <link> for styles
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    AOS.init({
      once: true,
    });
  }, []);
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
