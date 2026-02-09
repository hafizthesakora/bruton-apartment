'use client';
import { Home, Building2, Key } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import { FadeIn, StaggerContainer, StaggerItem } from './MotionWrapper';

const aboutCards = [
  { image: '/assets/main-home1.jpg', icon: Home },
  { image: '/assets/BRTN GRDN-3.JPEG', icon: Building2 },
  { image: '/assets/BRTN GRDN-25 2.JPEG', icon: Key },
];

const About = () => {
  return (
    <>
      <div className="container pt-24 md:py-40 mx-auto p-6">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 md:order-1 md:block hidden">
            <FadeIn direction="left" delay={0.2}>
              <div className="absolute right-34 z-10">
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
            </FadeIn>
            <FadeIn direction="down" delay={0.1}>
              <Image
                src="/assets/BRTN GRDN-22.JPG"
                alt="about"
                width={600}
                height={400}
                className="object-center rounded-t-full px-10"
              />
            </FadeIn>
          </div>
          <div className="order-1 md:order-2">
            <FadeIn direction="up" delay={0}>
              <h1 className="text-4xl md:text-7xl font-semibold py-5 capitalize">
                Experience Luxury Living at{' '}
                <span className="text-lime-400">Bruton Gardens</span>
              </h1>
            </FadeIn>
            <FadeIn direction="up" delay={0.15}>
              <p className="pt-5 text-lg text-gray-600">
                Discover modern comfort and elegant design in our premium
                apartments. Each unit is thoughtfully crafted to provide you with
                the perfect blend of style, functionality, and convenience in the
                heart of the city.
              </p>
            </FadeIn>
            <div className="px-10 md:px-0">
              <StaggerContainer staggerDelay={0.15} className="grid md:grid-cols-3 gap-10 pt-16">
                {aboutCards.map((card, index) => (
                  <StaggerItem key={index}>
                    <div className="p-6 md:p-4 bg-gray-100 rounded-t-full text-center relative">
                      <Image
                        src={card.image}
                        alt="about"
                        width={600}
                        height={600}
                        className="rounded-t-full h-40 object-cover"
                      />
                      <h1 className="py-3 text-lg font-semibold"></h1>
                      <div className="absolute top-0 right-0 bg-gray-100/50 p-[5px] rounded-xl shadow-md">
                        <div className="bg-gray-100 p-[5px] rounded-xl">
                          <div className="bg-lime-400 rounded-xl p-2 w-13">
                            <card.icon size={35} className="text-gray-900 p-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
