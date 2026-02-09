'use client';
import React from 'react';
import Image from 'next/image';
import { Facebook, Linkedin, MessageCircle, Twitter } from 'lucide-react';
import Link from 'next/link';
import { FadeIn, StaggerContainer, StaggerItem, motion } from './MotionWrapper';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/services', label: 'Services' },
];

const socialIcons = [
  { Icon: Facebook, label: 'Facebook' },
  { Icon: Twitter, label: 'Twitter' },
  { Icon: Linkedin, label: 'LinkedIn' },
  { Icon: MessageCircle, label: 'WhatsApp' },
];

const Footer = () => {
  return (
    <div className="bg-[#f4f5fac8]">
      <div className="container mx-auto py-10 px-7">
        <div className="grid md:grid-cols-3 gap-10 items-start">
          <div>
            <div>
              <FadeIn direction="up">
                <Image
                  src="/logo.png"
                  alt="logo"
                  width={200}
                  height={100}
                  className="pb-5"
                />
              </FadeIn>
              <FadeIn direction="up" delay={0.1}>
                <p className="text-md md:text-lg md:pe-16 pt-5 text-gray-700">
                  Experience luxury living at Bruton Gardens Apartment. We offer
                  modern, well-furnished apartments in a serene environment with
                  world-class amenities and exceptional service. Your comfort is
                  our priority.
                </p>
              </FadeIn>
            </div>
          </div>
          <div className="flex gap-10 justify-around py-10 md:py-0">
            <div>
              <FadeIn direction="up">
                <h3 className="text-2xl font-semibold">Quick Links</h3>
              </FadeIn>
              <StaggerContainer staggerDelay={0.1} className="space-y-3 text-lg font-normal pt-8 flex flex-col">
                {quickLinks.map((link) => (
                  <StaggerItem key={link.href} direction="right">
                    <Link
                      href={link.href}
                      className="hover:text-lime-400 transition-all hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
            <div>
              <FadeIn direction="up">
                <h3 className="text-2xl font-semibold">Connect</h3>
              </FadeIn>
              <StaggerContainer staggerDelay={0.1} className="space-y-3 text-lg font-normal pt-8">
                {['Facebook', 'Twitter', 'Instagram', 'WhatsApp'].map((name) => (
                  <StaggerItem key={name} direction="right">
                    <li className="hover:text-lime-400 cursor-pointer transition-colors list-none">
                      {name}
                    </li>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
          <div className="flex justify-around">
            <StaggerContainer staggerDelay={0.15} className="space-y-4">
              {[
                {
                  image: '/assets/hall.JPEG',
                  title: 'Event Center',
                  subtitle: 'Elegant & Modern Design',
                },
                {
                  image: '/assets/main-home1.jpg',
                  title: 'Premium Units',
                  subtitle: 'Fully Furnished Apartments',
                },
                {
                  image: '/assets/BRTN GRDN-26.JPG',
                  title: 'Beautiful Gardens',
                  subtitle: 'Serene Environment',
                },
              ].map((item, index) => (
                <StaggerItem key={index}>
                  <Link href="/blog" className="flex items-center space-x-7 group">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h3 className="text-black text-lg font-medium group-hover:text-lime-500 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-gray-700">{item.subtitle}</p>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
        <div className="border-t-2 border-gray-200 mt-10">
          <FadeIn direction="up" delay={0.1}>
            <div className="md:flex justify-between items-center py-5 space-y-8 md:space-y-0 md:text-start text-center">
              <p className="text-gray-500">
                &copy; 2026 Bruton Gardens Apartment. All rights reserved.
              </p>
              <div className="flex gap-5 justify-center">
                {socialIcons.map(({ Icon, label }) => (
                  <motion.div
                    key={label}
                    whileHover={{ scale: 1.25, color: '#a3e635' }}
                    transition={{ duration: 0.2 }}
                    className="cursor-pointer"
                  >
                    <Icon size={20} className="hover:text-lime-400 transition-colors" />
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
};

export default Footer;
