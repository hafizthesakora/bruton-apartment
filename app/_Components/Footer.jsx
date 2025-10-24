import React from 'react';
import Image from 'next/image';
import { Facebook, Linkedin, MessageCircle, Twitter } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
  return (
    <div className="bg-[#f4f5fac8]">
      <div className="container mx-auto py-10 px-7">
        <div className="grid md:grid-cols-3 gap-10 items-start">
          <div className="">
            <div className="">
              <Image
                src="/logo.png"
                alt="logo"
                width={200}
                height={100}
                className="pb-5"
                data-aos="flip-down"
                data-aos-duration="1000"
                data-aos-easing="ease-in-out-back"
              />
              <p
                className="text-md md:text-lg md:pe-16 pt-5 text-gray-700"
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                Experience luxury living at Bruton Gardens Apartment. We offer
                modern, well-furnished apartments in a serene environment with
                world-class amenities and exceptional service. Your comfort is
                our priority.
              </p>
            </div>
          </div>
          <div className="flex gap-10 justify-around py-10 md:py-0">
            <div className="">
              <h3
                className="text-2xl font-semibold"
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                Quick Links
              </h3>
              <ul className="space-y-3 text-lg font-normal pt-8 flex flex-col">
                <Link
                  href="#"
                  className="hover:text-lime-400 hover:transition-all hover:scale-105"
                  data-aos="fade-right"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                >
                  Home
                </Link>
                <Link
                  href="#"
                  className="hover:text-lime-400 hover:transition-all hover:scale-105"
                  data-aos="fade-right"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  About
                </Link>
                <Link
                  href="#"
                  className="hover:text-lime-400 hover:transition-all hover:scale-105"
                  data-aos="fade-right"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  Gallery
                </Link>
                <Link
                  href="#"
                  className="hover:text-lime-400 hover:transition-all hover:scale-105"
                  data-aos="fade-right"
                  data-aos-duration="1500"
                  data-aos-easing="ease-in-out-back"
                >
                  Contact
                </Link>
              </ul>
            </div>
            <div className="">
              <h3
                className="text-2xl font-semibold"
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                Connect
              </h3>
              <ul className="space-y-3 text-lg font-normal pt-8">
                <li
                  className="hover:text-lime-400 cursor-pointer transition-colors"
                  data-aos="fade-right"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                >
                  Facebook
                </li>
                <li
                  className="hover:text-lime-400 cursor-pointer transition-colors"
                  data-aos="fade-right"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  Twitter
                </li>
                <li
                  className="hover:text-lime-400 cursor-pointer transition-colors"
                  data-aos="fade-right"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  Instagram
                </li>
                <li
                  className="hover:text-lime-400 cursor-pointer transition-colors"
                  data-aos="fade-right"
                  data-aos-duration="1500"
                  data-aos-easing="ease-in-out-back"
                >
                  WhatsApp
                </li>
              </ul>
            </div>
          </div>
          <div className="flex justify-around">
            <div className="space-y-4">
              <div className="flex items-center space-x-7">
                <div
                  className="w-16 h-16 rounded-lg overflow-hidden"
                  data-aos="fade-up"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                >
                  <Image
                    src="/assets/hall.JPEG"
                    alt="House Update 1"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3
                    className="text-black text-lg font-medium"
                    data-aos="fade-left"
                    data-aos-duration="1200"
                    data-aos-easing="ease-in-out-back"
                  >
                    Event Center
                  </h3>
                  <p
                    className="text-gray-700"
                    data-aos="fade-left"
                    data-aos-duration="1300"
                    data-aos-easing="ease-in-out-back"
                  >
                    Elegant & Modern Design
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-7">
                <div
                  className="w-16 h-16 rounded-lg overflow-hidden"
                  data-aos="fade-up"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <Image
                    src="/assets/main-home1.jpg"
                    alt="House Update 2"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3
                    className="text-black text-lg font-medium"
                    data-aos="fade-left"
                    data-aos-duration="1200"
                    data-aos-easing="ease-in-out-back"
                  >
                    Premium Units
                  </h3>
                  <p
                    className="text-gray-700"
                    data-aos="fade-left"
                    data-aos-duration="1300"
                    data-aos-easing="ease-in-out-back"
                  >
                    Fully Furnished Apartments
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-7">
                <div
                  className="w-16 h-16 rounded-lg overflow-hidden"
                  data-aos="fade-up"
                  data-aos-duration="1600"
                  data-aos-easing="ease-in-out-back"
                >
                  <Image
                    src="/assets/BRTN GRDN-26.JPG"
                    alt="House Update 3"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3
                    className="text-black text-lg font-medium"
                    data-aos="fade-left"
                    data-aos-duration="1200"
                    data-aos-easing="ease-in-out-back"
                  >
                    Beautiful Gardens
                  </h3>
                  <p
                    className="text-gray-700"
                    data-aos="fade-left"
                    data-aos-duration="1300"
                    data-aos-easing="ease-in-out-back"
                  >
                    Serene Environment
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t-2 border-gray-200 mt-10">
          <div className="md:flex justify-between items-center py-5 space-y-8 md:space-y-0 md:text-start text-center">
            <p className="text-gray-500">
              © 2025 Bruton Gardens Apartment. All rights reserved.
            </p>
            <div className="flex gap-5 justify-center">
              <Facebook
                size={20}
                className="cursor-pointer hover:scale-125 hover:transition-all animate-in hover:text-lime-400"
              />
              <Twitter
                size={20}
                className="cursor-pointer hover:scale-125 hover:transition-all animate-in hover:text-lime-400"
              />
              <Linkedin
                size={20}
                className="cursor-pointer hover:scale-125 hover:transition-all animate-in hover:text-lime-400"
              />
              <MessageCircle
                size={20}
                className="cursor-pointer hover:scale-125 hover:transition-all animate-in hover:text-lime-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;
