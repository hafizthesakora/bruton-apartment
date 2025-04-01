import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  CircleDollarSignIcon,
  Handshake,
  HomeIcon,
} from "lucide-react";
import Image from "next/image";
import React from "react";

const HomeFeatures = () => {
  return (
    <div>
      <div className="container py-16 md:py-40 mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 md:order-1">
            <div
              className="absolute top-5 -left-2 md:left-3 z-10"
              data-aos="fade-right"
              data-aos-duration="1300"
              data-aos-easing="ease-in-out-back"
            >
              <div className="bg-gray-200/90 rounded-t-full w-24 md:w-40 p-2 md:p-3 shadow-md">
                {" "}
                <div className=" bg-white shadow-md w-20 md:w-34 p-2 md:p-3 rounded-t-full">
                  <div className="w-16 md:w-28 p-4 md:p-5 bg-gradient-to-r from-primary to-[#3c63cda5] rounded-t-full">
                    <h1 className=" text-xs md:text-xl pt-2 md:pt-4 text-white font-semibold text-center">
                      Super Sale$
                    </h1>
                  </div>
                </div>
              </div>
            </div>
            <Image
              src="/assets/next-door31.png"
              alt="about"
              width={600}
              height={400}
              className=" object-center rounded-t-full md:px-10 px-2"
              data-aos="fade-down"
              data-aos-duration="1300"
              data-aos-easing="ease-in-out-back"
            />
          </div>
          <div className="order-1 md:order-2">
            <h1
              className="text-4xl md:text-7xl font-semibold py-5 capitalize"
              data-aos="fade-up"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out-back"
            >
              Sell for more than the home
              <span className="text-primary"> Next Door</span>
            </h1>
            <p
              className="pt-5 text-lg"
              data-aos="fade-up"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias
              dolore recusandae minus ipsam mollitia distinctio sed voluptatibus
              unde. Asperiores, voluptas.
            </p>
            <div className="pt-7">
              <div
                className="grid grid-cols-9 py-5 gap-5 items-center"
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                <div
                  className="md:col-span-2 col-span-3 flex justify-center"
                  data-aos="fade-left"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <CircleDollarSignIcon
                    size={90}
                    className=" bg-gray-100 hover:text-white hover:bg-primary rounded-full p-5 cursor-pointer hover:transition-all hover:animate-pulse shadow-xl hover:shadow-2xl"
                  />
                </div>
                <div
                  className="md:col-span-7 col-span-6"
                  data-aos="fade-up"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <h1 className="text-xl md:text-2xl font-semibold  py-3">
                    The Ability to Indentify Market Entry
                  </h1>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Animi obcaecati dolorum aperiam quae assumenda laboriosam
                    quis debitis quisquam itaque adipisci.
                  </p>
                </div>
              </div>
              <div
                className="grid grid-cols-9 py-5 gap-5 items-center"
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                <div
                  className="md:col-span-2 col-span-3 flex justify-center"
                  data-aos="fade-left"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <Handshake
                    size={90}
                    className=" bg-gray-100 hover:text-white hover:bg-primary rounded-full p-5 cursor-pointer hover:transition-all hover:animate-pulse shadow-xl hover:shadow-2xl"
                  />
                </div>
                <div
                  className="md:col-span-7 col-span-6"
                  data-aos="fade-left"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <h1 className="text-xl md:text-2xl font-semibold  py-3">
                    The Ability to Indentify Market Entry
                  </h1>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Animi obcaecati dolorum aperiam quae assumenda laboriosam
                    quis debitis quisquam itaque adipisci.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeFeatures;
