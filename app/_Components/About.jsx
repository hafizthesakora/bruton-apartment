import { Home, Building2, Key } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const About = () => {
  return (
    <>
      <div className="container pt-24 md:py-40 mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div
            className="relative order-2 md:order-1 md:block hidden"
            data-aos="fade-down"
            data-aos-duration="1300"
            data-aos-easing="ease-in-out-back"
          >
            <div
              className="absolute right-34 z-10"
              data-aos="fade-left"
              data-aos-duration="1500"
              data-aos-easing="ease-in-out-back"
            >
              <div className="bg-gray-200/90 rounded-t-full w-40 p-3 shadow-md">
                <div className="bg-white shadow-md w-34 p-3 rounded-t-full">
                  <div className="w-28 p-5 bg-gradient-to-r from-lime-400 to-lime-500 rounded-t-full">
                    <h1 className="text-lg pt-4 text-gray-900 font-semibold text-center">
                      Premium Living
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            <Image
              src="/assets/BRTN GRDN-22.JPG"
              alt="about"
              width={600}
              height={400}
              className="object-center rounded-t-full px-10"
            />
          </div>
          <div className="order-1 md:order-2">
            <h1
              className="text-4xl md:text-7xl font-semibold py-5 capitalize"
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out-back"
            >
              Experience Luxury Living at{' '}
              <span className="text-lime-400">Bruton Gardens</span>
            </h1>
            <p
              className="pt-5 text-lg text-gray-600"
              data-aos="fade-up"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              Discover modern comfort and elegant design in our premium
              apartments. Each unit is thoughtfully crafted to provide you with
              the perfect blend of style, functionality, and convenience in the
              heart of the city.
            </p>
            <div className="px-10 md:px-0">
              <div className="grid md:grid-cols-3 gap-10 pt-16">
                <div
                  className="p-6 md:p-4 bg-gray-100 rounded-t-full text-center relative"
                  data-aos="fade-left"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <Image
                    src="/assets/main-home1.jpg"
                    alt="about"
                    width={600}
                    height={600}
                    className="rounded-t-full h-40 object-cover"
                  />
                  <h1 className="py-3 text-lg font-semibold"></h1>

                  <div className="absolute top-0 right-0 bg-gray-100/50 p-[5px] rounded-xl shadow-md">
                    <div className="bg-gray-100 p-[5px] rounded-xl">
                      <div className="bg-lime-400 rounded-xl p-2 w-13">
                        <Home size={35} className="text-gray-900 p-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="p-6 md:p-4 bg-gray-100 rounded-t-full text-center relative"
                  data-aos="fade-up"
                  data-aos-duration="1600"
                  data-aos-easing="ease-in-out-back"
                >
                  <Image
                    src="/assets/BRTN GRDN-3.JPEG"
                    alt="about"
                    width={600}
                    height={600}
                    className="rounded-t-full h-40 object-cover"
                  />
                  <h1 className="py-3 text-lg font-semibold"></h1>

                  <div className="absolute top-0 right-0 bg-gray-100/50 p-[5px] rounded-xl shadow-md">
                    <div className="bg-gray-100 p-[5px] rounded-xl">
                      <div className="bg-lime-400 rounded-xl p-2 w-13">
                        <Building2 size={35} className="text-gray-900 p-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="p-6 md:p-4 bg-gray-100 rounded-t-full text-center relative"
                  data-aos="fade-down"
                  data-aos-duration="1800"
                  data-aos-easing="ease-in-out-back"
                >
                  <Image
                    src="/assets/BRTN GRDN-25 2.JPEG"
                    alt="about"
                    width={600}
                    height={600}
                    className="rounded-t-full h-40 object-cover"
                  />
                  <h1 className="py-3 text-lg font-semibold"></h1>

                  <div className="absolute top-0 right-0 bg-gray-100/50 p-[5px] rounded-xl shadow-md">
                    <div className="bg-gray-100 p-[5px] rounded-xl">
                      <div className="bg-lime-400 rounded-xl p-2 w-13">
                        <Key size={35} className="text-gray-900 p-1" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
