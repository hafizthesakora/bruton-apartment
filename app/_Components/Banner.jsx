'use client';
import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import BookingModal from './BookingModal';
import ContactModal from './ContactModal';
import { socialLinks } from '@/lib/social';

const SOCIAL_PATHS = {
  WhatsApp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  Facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  TikTok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
};

const Banner = ({ content = {}, social = {} }) => {
  const {
    tagline = 'WELCOME TO BRUTON GARDENS & APARTMENTS',
    title = 'Find Your Perfect Stay at Bruton Gardens & Apartments',
    subtitle = 'Discover luxury living on the outskirts of the city. Experience comfort, style, and convenience at Bruton Gardens & Apartments.',
    primaryCta = 'Booking',
    secondaryCta = 'Schedule Viewing',
  } = content;

  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <div
      ref={ref}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14"
    >
      {/* Video Background with Parallax */}
      <motion.div className="absolute inset-0 w-full h-full" style={{ y: videoY }}>
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src="/assets/bruton.mp4" type="video/mp4" />
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
        </video>
        <div className="absolute inset-0 bg-black/30"></div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Header */}
          <div className="space-y-6">
            <motion.p
              className="text-white/90 text-lg font-medium tracking-wide uppercase"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {tagline}
            </motion.p>
            <motion.h1
              className="text-5xl md:text-7xl font-bold text-white leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              {title}
            </motion.h1>
            <motion.p
              className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {subtitle}
            </motion.p>
          </div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <button
              onClick={() => setBookingOpen(true)}
              className="bg-lime-400 hover:bg-lime-500 text-gray-900 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2"
            >
              {primaryCta}
            </button>
            <button
              onClick={() => setContactOpen(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105"
            >
              {secondaryCta}
            </button>
          </motion.div>

          {/* Social Icons */}
          <motion.div
            className="absolute bottom-8 left-8 flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            {socialLinks(social).map(({ name, url }) => (
              <a
                key={name}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-all duration-300"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d={SOCIAL_PATHS[name]} />
                </svg>
              </a>
            ))}
          </motion.div>
        </div>
      </div>

      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
};

export default Banner;
