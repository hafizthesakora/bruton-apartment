'use client';
import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import ContactModal from './ContactModal';
import AvailabilityBar from './ui/AvailabilityBar';
import { RevealText, FadeIn, EASE_LUXE } from './MotionWrapper';
import { socialLinks } from '@/lib/social';

const Banner = ({ content = {}, social = {} }) => {
  const {
    tagline = 'WELCOME TO BRUTON GARDENS & APARTMENTS',
    title = 'Find Your Perfect Stay at Bruton Gardens & Apartments',
    subtitle = 'Discover luxury living on the outskirts of the city. Experience comfort, style, and convenience at Bruton Gardens & Apartments.',
    secondaryCta = 'Schedule Viewing',
  } = content;

  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const videoY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-20%']);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [contactOpen, setContactOpen] = useState(false);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col overflow-hidden bg-garden text-ivory">
      {/* Video with parallax + slow zoom */}
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y: videoY, scale: videoScale }}
      >
        <motion.video
          autoPlay
          loop
          muted
          playsInline
          poster="/assets/BRTN GRDN-22.JPG"
          className="h-full w-full object-cover"
          initial={{ scale: reduce ? 1 : 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease: EASE_LUXE }}
        >
          <source src="/assets/bruton.mp4" type="video/mp4" />
        </motion.video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-garden/90" />
      </motion.div>

      <motion.div
        className="container-luxe relative z-10 flex flex-1 flex-col justify-end pb-10 pt-36 md:pb-14"
        style={reduce ? undefined : { y: contentY, opacity: contentOpacity }}
      >
        <FadeIn direction="up" delay={0.3}>
          <p className="eyebrow mb-8 flex items-center gap-3 text-sand">
            <span className="h-px w-10 bg-current" />
            {tagline}
          </p>
        </FadeIn>

        <RevealText
          as="h1"
          text={title}
          immediate
          delay={0.45}
          stagger={0.07}
          className="font-display max-w-6xl text-[2.9rem] leading-[0.98] sm:text-6xl md:text-8xl lg:text-[7.5rem]"
        />

        <div className="mt-10 grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <FadeIn direction="up" delay={1}>
            <p className="max-w-xl text-lg leading-relaxed text-ivory/80">{subtitle}</p>
          </FadeIn>
          <FadeIn direction="up" delay={1.1} className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="text-sm tracking-wide underline decoration-ivory/40 underline-offset-8 transition-colors hover:decoration-brass"
            >
              {secondaryCta}
            </button>
            <div className="flex gap-2">
              {socialLinks(social).map(({ name, url }) => (
                <a
                  key={name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-ivory/25 px-4 py-2 text-xs tracking-wide transition-colors hover:border-brass hover:text-brass"
                >
                  {name}
                </a>
              ))}
            </div>
          </FadeIn>
        </div>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, delay: 1.3, ease: EASE_LUXE }}
        >
          <AvailabilityBar />
        </motion.div>
      </motion.div>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </section>
  );
};

export default Banner;
