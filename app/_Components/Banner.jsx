import { Handshake } from "lucide-react";
import Image from "next/image";
import React from "react";

const Banner = () => {
  return (
    <div className="container">
      <div className="grid grid-cols-2">
        <div className="p-10">
          <h1 className="text-7xl font-semibold py-5">
            Search And Tour With <span>Ozalams</span>
          </h1>
          <p className="pt-5 text-lg">
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias
            dolore recusandae minus ipsam mollitia distinctio sed voluptatibus
            unde. Asperiores, voluptas.
          </p>
          <div className="flex gap-10 py-8 px-4">
            <Image
              src="/assets/icon1.png"
              alt="icons"
              width={100}
              height={50}
            />
            <Image
              src="/assets/icon1.png"
              alt="icons"
              width={100}
              height={50}
            />
            <Image
              src="/assets/icon1.png"
              alt="icons"
              width={100}
              height={50}
            />
          </div>
          <div className="">
            <div className="mt-4 flex flex-col gap-2">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Address, Schools City etc."
                  className="border rounded-l-md p-4 w-full"
                />
                <button className="bg-blue-500 text-lg text-white rounded-r-md px-8 py-3">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          {/* this for postions */}
          <div className="absolute top-5 left-5">
            <div className="bg-gray-100/50 rounded-t-full w-40 p-3 √">
              {" "}
              <div className=" bg-gray-800 shadow-md w-34 p-3 rounded-t-full">
                <div className="w-28 p-5 bg-gradient-to-r from-primary to-[#6088f4af] rounded-t-full">
                  <h1 className="text-xl pt-4 text-white font-semibold text-center">
                    Super Sale$
                  </h1>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute right-32 top-72">
            <div className="w-56 space-y-5 bg-gray-200/80 p-3 rounded-lg">
              <div className="flex gap-3 items-center p-3 bg-gray-800 text-white justify-center rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Paid Partner Ship
              </div>{" "}
              <div className="flex gap-3 items-center p-3 bg-gray-800 text-white justify-center rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Paid Partner Ship
              </div>{" "}
              <div className="flex gap-3 items-center p-3 bg-gray-800 text-white justify-center rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Paid Partner Ship
              </div>{" "}
              <div className="flex gap-3 items-center p-3 bg-gray-800 text-white justify-center rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Paid Partner Ship
              </div>
            </div>
          </div>
          {/* this for Image  */}
          <div className="">
            <Image
              src="/assets/main-home1.jpg"
              alt="home"
              width={600}
              height={600}
              className="object-cover object-center rounded-t-full px-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
