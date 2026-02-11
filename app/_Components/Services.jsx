'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CreditCard, Navigation } from 'lucide-react';
import { FadeIn, motion, AnimatePresence } from './MotionWrapper';
import ContactModal from './ContactModal';
import BookingModal from './BookingModal';

const carouselImages = [
  '/assets/BRTN GRDN-1.JPEG',
  '/assets/BRTN GRDN-22.JPG',
  '/assets/BRTN GRDN-26.JPG',
  '/assets/BRTN GRDN-6.JPEG',
  '/assets/BRTN GRDN-27.JPG',
];

// ── Image Carousel ──────────────────────────────────────────────────────────

const ImageCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={carouselImages[current]}
            alt={`Bruton Gardens ${current + 1}`}
            fill
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {carouselImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-lime-400 w-5' : 'bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
};

// ── Main Services Component ─────────────────────────────────────────────────

const Services = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <div id="services-section" className="container mx-auto py-20 p-8">
      <div className="pb-16 space-y-5">
        <FadeIn direction="up">
          <h1 className="text-4xl md:text-5xl font-semibold capitalize">
            Take The First <span className="text-lime-400">Step</span>
          </h1>
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <p className="text-lg text-gray-500">
            Discover your perfect home at Bruton Gardens Apartment. Schedule a
            viewing today and experience luxury living at its finest.
          </p>
        </FadeIn>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Left — Video */}
        <FadeIn direction="right" delay={0.1}>
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-[400px] md:h-[520px] object-cover"
            >
              <source src="/assets/bruton-vid.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-sm font-medium opacity-80">Experience</p>
              <h3 className="text-2xl font-bold">Bruton Gardens</h3>
            </div>
          </div>
        </FadeIn>

        {/* Right — Carousel + Action Buttons */}
        <FadeIn direction="left" delay={0.2}>
          <div className="space-y-6">
            <ImageCarousel />

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                onClick={() => setContactModalOpen(true)}
                className="p-6 rounded-2xl bg-gray-100 text-center flex flex-col items-center space-y-3 hover:bg-lime-400 hover:text-white cursor-pointer transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Navigation size={32} className="p-1.5 rounded-lg bg-gray-200 text-black" />
                <h3 className="font-medium text-lg">Talk to our Agent</h3>
                <p className="text-sm opacity-80">Speak to someone from our team</p>
              </motion.div>

              <motion.div
                onClick={() => setBookingModalOpen(true)}
                className="p-6 rounded-2xl bg-gray-100 text-center flex flex-col items-center space-y-3 hover:bg-lime-400 hover:text-white cursor-pointer transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <CreditCard size={32} className="p-1.5 rounded-lg bg-gray-200 text-black" />
                <h3 className="font-medium text-lg">Book a Viewing</h3>
                <p className="text-sm opacity-80">Schedule a visit on our calendar</p>
              </motion.div>
            </div>
          </div>
        </FadeIn>
      </div>

      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} />
    </div>
  );
};

export default Services;
