import { Handshake, Search, MapPin, Home, DollarSign, Car } from "lucide-react";
import Image from "next/image";
import React from "react";
import { Button } from "@/components/ui/button";

const Banner = () => {
  return (
    <div className="relative min-h-[90vh] bg-gradient-to-br from-gray-50 to-white">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5"></div>

      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 items-center gap-20 justify-around py-10 md:py-24">
          <div className="p-4 md:p-10 space-y-8 z-10">
            <div className="space-y-4">
              <h1
                className="text-4xl md:text-[4.2rem] font-semibold leading-tight"
                data-aos="fade-right"
                data-aos-duration="1000"
                data-aos-easing="ease-in-out-back"
              >
                Find Your Perfect <span className="text-primary">Home</span>{" "}
                with Ozalams
              </h1>
              <p
                className="text-lg text-gray-600 max-w-lg"
                data-aos="fade-right"
                data-aos-duration="1100"
                data-aos-easing="ease-in-out-back"
              >
                Discover your dream property with our comprehensive search tools
                and expert guidance. Start your journey to finding the perfect
                place to call home.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex gap-8 md:gap-20 py-8 items-center ">
              <div
                className="flex flex-col items-center group"
                data-aos="fade-right"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                <Image
                  src="/assets/icon2.png"
                  alt="Trusted Partner"
                  width={100}
                  height={40}
                  className="w-16 md:w-20 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-sm text-gray-600 mt-2">
                  Trusted Partner
                </span>
              </div>
              <div
                className="flex flex-col items-center group"
                data-aos="fade-right"
                data-aos-duration="1300"
                data-aos-easing="ease-in-out-back"
              >
                <Image
                  src="/assets/icon3.png"
                  alt="Verified Listings"
                  width={100}
                  height={40}
                  className="w-16 md:w-20 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-sm text-gray-600 mt-2">
                  Verified Listings
                </span>
              </div>
              <div
                className="flex flex-col items-center group"
                data-aos="fade-right"
                data-aos-duration="1400"
                data-aos-easing="ease-in-out-back"
              >
                <Image
                  src="/assets/icon1.png"
                  alt="24/7 Support"
                  width={100}
                  height={40}
                  className="w-16 md:w-20 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <span className="text-sm text-gray-600 mt-2">24/7 Support</span>
              </div>
            </div>

            {/* Search Form */}
            <div
              className="max-w-2xl"
              data-aos="fade-right"
              data-aos-duration="1500"
              data-aos-easing="ease-in-out-back"
            >
              <form action="#" method="POST" className="space-y-4">
                <div className="relative flex items-center bg-white rounded-xl shadow-lg overflow-hidden px-2 py-1">
                  <div className="absolute left-4 text-gray-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter location, property type, or keyword"
                    className="w-full pl-12 pr-4 py-4 focus:outline-none text-gray-700"
                    required
                  />
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-md"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Search
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Section */}
          <div className="relative flex justify-center">
            {/* Sale Badge */}
            <div
              className="absolute top-8 md:top-5 left-5 md:left-16 z-10"
              data-aos="fade-right"
              data-aos-duration="2000"
              data-aos-easing="ease-in-out-back"
            >
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                <div className="bg-gradient-to-r from-primary to-[#3c63cda5] rounded-xl p-4 text-center">
                  <h1 className="text-xl font-semibold text-white">
                    Super Sale
                  </h1>
                  <p className="text-white/90 text-sm">Limited Time Offer</p>
                </div>
              </div>
            </div>

            {/* Partner Cards */}
            <div
              className="absolute right-3 md:right-5 top-50 md:top-[25rem] z-10"
              data-aos="fade-left"
              data-aos-duration="1800"
              data-aos-easing="ease-in-out-back"
            >
              <div className="space-y-4 bg-white/40 p-4 rounded-2xl shadow-lg gap-4 flex flex-col">
                <div
                  className="flex items-center gap-3 hover:-translate-x-1 transition-all duration-300 bg-white p-2 rounded-md"
                  data-aos="fade-left"
                  data-aos-duration="1500"
                  data-aos-easing="ease-in-out-back"
                >
                  <div className="bg-primary/90 p-2 rounded-lg">
                    <Handshake size={24} className="text-white" />
                  </div>
                  <span className="font-medium text-gray-700">
                    Paid Partner Ship
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 hover:-translate-x-1 transition-all duration-300 bg-white p-2 rounded-md"
                  data-aos="fade-left"
                  data-aos-duration="1700"
                  data-aos-easing="ease-in-out-back"
                >
                  <div className="bg-primary/90 p-2 rounded-lg">
                    <Home size={24} className="text-white" />
                  </div>
                  <span className="font-medium text-gray-700">
                    Best Tour It
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 hover:-translate-x-1 transition-all duration-300 bg-white p-2 rounded-md"
                  data-aos="fade-left"
                  data-aos-duration="1900"
                  data-aos-easing="ease-in-out-back"
                >
                  <div className="bg-primary/90 p-2 rounded-lg">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <span className="font-medium text-gray-700">
                    Get Down Payment
                  </span>
                </div>
                <div
                  className="flex items-center gap-3 hover:-translate-x-1 transition-all duration-300 bg-white p-2 rounded-md"
                  data-aos="fade-left"
                  data-aos-duration="2100"
                  data-aos-easing="ease-in-out-back"
                >
                  <div className="bg-primary/90 p-2 rounded-lg">
                    <Car size={24} className="text-white" />
                  </div>
                  <span className="font-medium text-gray-700">
                    Largest Rental
                  </span>
                </div>
              </div>
            </div>

            {/* Main Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-t-full"></div>
              <Image
                src="/assets/main-home1.jpg"
                alt="Modern Home"
                width={600}
                height={600}
                className="object-cover object-center rounded-t-full p-5 shadow-2xl"
                data-aos="fade-down"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
