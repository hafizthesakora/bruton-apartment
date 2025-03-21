import { Handshake } from "lucide-react";
import Image from "next/image";
import React from "react";

const categories = [
  {
    src: "/assets/category1.jpg",
    alt: "Bathroom Comfortable",
    title: "Bathroom Comfortable",
    className: "",
  },
  {
    src: "/assets/category2.jpg",
    alt: "Bathroom Comfortable",
    title: "Bathroom Comfortable",
    className: "rounded-xl",
  },
  {
    src: "/assets/category33.jpg",
    alt: "Bathroom Comfortable",
    title: "Bathroom Comfortable",
    className: "rounded-xl",
  },
  {
    src: "/assets/category4.jpg",
    alt: "Bathroom Comfortable",
    title: "Bathroom Comfortable",
    className: "",
  },
  {
    src: "/assets/category5.jpg",
    alt: "Bathroom Comfortable",
    title: "Bathroom Comfortable",
    className: "rounded-xl",
  },
  {
    src: "/assets/category66.jpg",
    alt: "garden icon",
    title: "garden icon",
    className: "",
  },
];

const Category = () => {
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-2 gap-10 items-center">
        <div className="">
          <div className="grid grid-cols-3 space-y-8 ">
            {categories.map((category, index) => (
              <div
                key={index}
                className="space-y-2 text-center flex flex-col justify-center items-center"
              >
                <Image
                  src={category.src}
                  alt={category.alt}
                  width={170}
                  height={170}
                  className={category.className}
                />
                <h2 className="text-lg font-normal pt-3">{category.title}</h2>
              </div>
            ))}
            <div className="">
              <div className=" flex gap-2 pt-6 justify-center">
                <form action="#" method="POST">
                  <div className="flex item-center flex-row w-full">
                    <input
                      type="text"
                      placeholder="Address, Schools City etc."
                      className="border rounded-l-md p-4 w-[500px] "
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
        </div>
        <div className="relative">
          <div className="absolute -right-10 top-78">
            <div className="w-44 space-y-5 bg-gray-200/60 p-3 rounded-lg">
              <div className="flex gap-5 items-center p-3 bg-white  rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Facebook
              </div>{" "}
              <div className="flex gap-5 items-center p-3 bg-white  rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Twitter
              </div>{" "}
              <div className="flex gap-5 items-center p-3 bg-white  rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Instagram
              </div>{" "}
              <div className="flex gap-5 items-center p-3 bg-white  rounded-lg">
                <Handshake
                  size={35}
                  className="bg-primary p-2 rounded-sm text-white"
                />
                Telegram
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Image
              src="/assets/next-door22.webp"
              alt="bedroom"
              width={600}
              height={600}
              className="rounded-t-full object-cover object-center p-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
