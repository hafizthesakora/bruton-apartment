import { Facebook, Twitter, Instagram, Send } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

const categories = [
  {
    src: '/assets/furnish.JPG',
    alt: 'Bathroom Comfortable',
    title: 'Furnished Kitchen',
    className: '',
  },
  {
    src: '/assets/BRTN GRDN-27.JPG',
    alt: 'Bathroom Comfortable',
    title: 'Car Park',
    className: 'rounded-xl',
  },
  {
    src: '/assets/BRTN GRDN-6.JPEG',
    alt: 'Bathroom Comfortable',
    title: 'Serene Environment',
    className: 'rounded-xl',
  },
  {
    src: '/assets/living.JPEG',
    alt: 'Bathroom Comfortable',
    title: 'Adequate Living Space',
    className: '',
  },
  {
    src: '/assets/category5.jpg',
    alt: 'Bathroom Comfortable',
    title: 'Comfortable Bathroom',
    className: 'rounded-xl',
  },
  {
    src: '/assets/bed.JPEG',
    alt: 'garden icon',
    title: 'Comfortable Bedspace',
    className: '',
  },
];

const Category = () => {
  return (
    <div className="container mx-auto py-10 md:py-20">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div className="">
          <div className="grid grid-cols-2 md:grid-cols-3 space-y-8 p-10 md:p-0 md:gap-5 gap-6">
            {categories.map((category, index) => (
              <div
                key={index}
                className="space-y-2 text-center flex flex-col md:justify-center items-center"
              >
                <Image
                  src={category.src}
                  alt={category.alt}
                  width={170}
                  height={170}
                  className="rounded-xl w-30 md:w-44 object-cover"
                  data-aos="fade-up"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                />
                <h2
                  className="text-lg font-normal pt-3"
                  data-aos="fade-down"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  {category.title}
                </h2>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute right-4 md:-right-10 md:top-78 top-42 z-10">
            <div
              className="w-44 space-y-5 bg-gray-200/60 p-2 md:p-3 rounded-lg"
              data-aos="fade-left"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              <div
                className="flex gap-5 items-center p-1 md:p-3 bg-white rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                data-aos="fade-left"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                <Facebook
                  size={35}
                  className="bg-lime-400 p-2 rounded-sm text-gray-900"
                />
                <span className="font-medium">Facebook</span>
              </div>
              <div
                className="flex gap-5 items-center p-1 md:p-3 bg-white rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                data-aos="fade-left"
                data-aos-duration="1300"
                data-aos-easing="ease-in-out-back"
              >
                <Twitter
                  size={35}
                  className="bg-lime-400 p-2 rounded-sm text-gray-900"
                />
                <span className="font-medium">Twitter</span>
              </div>
              <div
                className="flex gap-5 items-center p-1 md:p-3 bg-white rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                data-aos="fade-left"
                data-aos-duration="1400"
                data-aos-easing="ease-in-out-back"
              >
                <Instagram
                  size={35}
                  className="bg-lime-400 p-2 rounded-sm text-gray-900"
                />
                <span className="font-medium">Instagram</span>
              </div>
              <div
                className="flex gap-5 items-center p-1 md:p-3 bg-white rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                data-aos="fade-left"
                data-aos-duration="1500"
                data-aos-easing="ease-in-out-back"
              >
                <Send
                  size={35}
                  className="bg-lime-400 p-2 rounded-sm text-gray-900"
                />
                <span className="font-medium">Telegram</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Image
              src="/assets/BRTN GRDN-17 2.JPG"
              alt="bedroom"
              width={600}
              height={600}
              className="rounded-t-full object-cover object-center p-10"
              data-aos="fade-left"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
