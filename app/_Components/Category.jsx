'use client';
import { Facebook, Twitter, Instagram, Send } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { FadeIn, StaggerContainer, StaggerItem, motion } from './MotionWrapper';

const categories = [
  {
    src: '/assets/furnish.JPG',
    alt: 'Furnished Kitchen',
    title: 'Furnished Kitchen',
  },
  {
    src: '/assets/BRTN GRDN-27.JPG',
    alt: 'Car Park',
    title: 'Car Park',
  },
  {
    src: '/assets/BRTN GRDN-6.JPEG',
    alt: 'Serene Environment',
    title: 'Serene Environment',
  },
  {
    src: '/assets/living.JPEG',
    alt: 'Adequate Living Space',
    title: 'Adequate Living Space',
  },
  {
    src: '/assets/category5.jpg',
    alt: 'Comfortable Bathroom',
    title: 'Comfortable Bathroom',
  },
  {
    src: '/assets/bed.JPEG',
    alt: 'Comfortable Bedspace',
    title: 'Comfortable Bedspace',
  },
];

const socialLinks = [
  { icon: Facebook, label: 'Facebook', delay: 0 },
  { icon: Twitter, label: 'Twitter', delay: 0.1 },
  { icon: Instagram, label: 'Instagram', delay: 0.2 },
  { icon: Send, label: 'Telegram', delay: 0.3 },
];

const Category = () => {
  return (
    <div className="container mx-auto py-10 md:py-20">
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-2 md:grid-cols-3 space-y-8 p-10 md:p-0 md:gap-5 gap-6">
            {categories.map((category, index) => (
              <StaggerItem key={index}>
                <motion.div
                  className="space-y-2 text-center flex flex-col md:justify-center items-center"
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  transition={{ duration: 0.2 }}
                >
                  <Image
                    src={category.src}
                    alt={category.alt}
                    width={170}
                    height={170}
                    className="rounded-xl w-30 md:w-44 object-cover"
                  />
                  <h2 className="text-lg font-normal pt-3">
                    {category.title}
                  </h2>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        <div className="relative">
          <FadeIn direction="left" delay={0.3}>
            <div className="absolute right-4 md:-right-10 md:top-78 top-42 z-10">
              <div className="w-44 space-y-5 bg-gray-200/60 p-2 md:p-3 rounded-lg">
                {socialLinks.map((social, index) => (
                  <FadeIn key={index} direction="left" delay={0.4 + social.delay}>
                    <div className="flex gap-5 items-center p-1 md:p-3 bg-white rounded-lg hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                      <social.icon
                        size={35}
                        className="bg-lime-400 p-2 rounded-sm text-gray-900"
                      />
                      <span className="font-medium">{social.label}</span>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </FadeIn>
          <FadeIn direction="left" delay={0.2}>
            <div className="flex justify-end">
              <Image
                src="/assets/BRTN GRDN-17 2.JPG"
                alt="bedroom"
                width={600}
                height={600}
                className="rounded-t-full object-cover object-center p-10"
              />
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default Category;
