'use client';
import React from 'react';
import Image from 'next/image';
import { Facebook, MessageCircle, Twitter } from 'lucide-react';
import Link from 'next/link';
import { FadeIn, StaggerContainer, StaggerItem, motion } from './MotionWrapper';

const quickLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/services', label: 'Services' },
];

const TikTokIcon = ({ size = 24, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

const socialIcons = [
  { Icon: Facebook, label: 'Facebook' },
  { Icon: Twitter, label: 'Twitter' },
  { Icon: TikTokIcon, label: 'TikTok' },
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
                  Experience luxury living at Bruton Gardens & Apartments. We offer
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
                {['Facebook', 'Twitter', 'TikTok', 'WhatsApp'].map((name) => (
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
                &copy; 2026 Bruton Gardens & Apartments. All rights reserved.
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
