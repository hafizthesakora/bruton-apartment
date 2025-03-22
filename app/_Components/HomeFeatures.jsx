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
      <div className="container py-40 mx-auto">
        <div className="grid grid-cols-2 gap-20 items-center">
          <div className="relative">
            <div className="absolute  right-34">
              <div className="bg-gray-200/90 rounded-t-full w-40 p-3 shadow-md">
                {" "}
                <div className=" bg-white shadow-md w-34 p-3 rounded-t-full">
                  <div className="w-28 p-5 bg-gradient-to-r from-primary to-[#3c63cda5] rounded-t-full">
                    <h1 className="text-xl pt-4 text-white font-semibold text-center">
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
              className=" object-center rounded-t-full px-10"
            />
          </div>
          <div className="">
            <h1 className="text-7xl font-semibold py-5 capitalize">
              Sell for more than the home
              <span className="text-primary"> Next Door</span>
            </h1>
            <p className="pt-5 text-lg">
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias
              dolore recusandae minus ipsam mollitia distinctio sed voluptatibus
              unde. Asperiores, voluptas.
            </p>
            <div className="pt-7">
              <div className="grid grid-cols-9 py-5 gap-5 items-center">
                <div className="col-span-2 flex justify-center">
                  <CircleDollarSignIcon
                    size={90}
                    className=" bg-gray-100 hover:text-white hover:bg-primary rounded-full p-5 cursor-pointer hover:transition-all hover:animate-pulse shadow-xl hover:shadow-2xl"
                  />
                </div>
                <div className="col-span-7">
                  <h1 className="text-2xl font-semibold  py-3">
                    The Ability to Indentify Market Entry
                  </h1>
                  <p>
                    Lorem ipsum dolor sit amet consectetur adipisicing elit.
                    Animi obcaecati dolorum aperiam quae assumenda laboriosam
                    quis debitis quisquam itaque adipisci.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-9 py-5 gap-5 items-center">
                <div className="col-span-2 flex justify-center">
                  <Handshake
                    size={90}
                    className=" bg-gray-100 hover:text-white hover:bg-primary rounded-full p-5 cursor-pointer hover:transition-all hover:animate-pulse shadow-xl hover:shadow-2xl"
                  />
                </div>
                <div className="col-span-7">
                  <h1 className="text-2xl font-semibold  py-3">
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
