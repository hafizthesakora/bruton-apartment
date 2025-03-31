import { Handshake } from "lucide-react";
import Image from "next/image";
import React from "react";

const Banner = () => {
  return (
    <div className="container mx-auto">
      <div className="grid md:grid-cols-2 items-center gap-20 justify-around py-10 md:py-24">
        <div className="p-10">
          <h1
            className="text-4xl md:text-7xl font-semibold py-2 md:py-5"
            data-aos="fade-right"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            Search And Tour With <span className="text-primary">Ozalams</span>
          </h1>
          <p
            className="pt-5 text-lg"
            data-aos="fade-right"
            data-aos-duration="1100"
            data-aos-easing="ease-in-out-back"
          >
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias
            dolore recusandae minus ipsam mollitia distinctio sed voluptatibus
            unde. Asperiores, voluptas.
          </p>
          <div className="flex gap-12 md:gap-20 py-14 px-4">
            <Image
              src="/assets/icon2.png"
              alt="icons"
              width={100}
              height={50}
              className="w-16 md:w-22 object-cover"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            />
            <Image
              src="/assets/icon3.png"
              alt="icons"
              width={100}
              height={50}
              className="w-16 md:w-22 object-cover"
              data-aos="fade-right"
              data-aos-duration="1300"
              data-aos-easing="ease-in-out-back"
            />
            <Image
              src="/assets/icon1.png"
              alt="icons"
              width={100}
              height={50}
              className="w-16 md:w-22 object-cover"
              data-aos="fade-right"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            />
          </div>
          <div
            className=""
            data-aos="fade-right"
            data-aos-duration="1500"
            data-aos-easing="ease-in-out-back"
          >
            <div className=" flex flex-col gap-2">
              <form action="#" method="POST">
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Address, Schools City etc."
                    className="border rounded-l-md p-4 w-full"
                    required
                  />
                  <button
                    className="bg-primary cursor-pointer text-lg text-white rounded-r-md px-8 py-3"
                    type="submit"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        <div className="relative flex justify-center">
          {/* this for postions */}
          <div
            className="absolute top-8 md:top-5 left-5 md:left-16 z-10"
            data-aos="fade-right"
            data-aos-duration="2000"
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
          <div
            className="absolute right-3 md:right-5 top-50 md:top-78 z-10"
            data-aos="fade-left"
            data-aos-duration="1800"
            data-aos-easing="ease-in-out-back"
          >
            <div className="w-56 space-y-5 bg-gray-200/60 p-4 md:p-3 rounded-lg">
              <div className="flex gap-3 items-center p-1 md:p-3 bg-white justify-center rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Paid Partner Ship
              </div>{" "}
              <div className="flex gap-3 items-center p-1 md:p-3 bg-white justify-center rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Paid Partner Ship
              </div>{" "}
              <div className="flex gap-3 items-center p-1 md:p-3 bg-white justify-center rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Paid Partner Ship
              </div>{" "}
              <div className="flex gap-3 items-center p-1 md:p-3 bg-white justify-center rounded-lg">
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
              className="object-cover object-center rounded-t-full px-10 -z-10"
              data-aos="fade-down"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
