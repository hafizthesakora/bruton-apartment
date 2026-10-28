'use client';
import Image from 'next/image';
import React from 'react';
import { FadeIn, ImageReveal, Parallax, AnimatedCounter, StaggerContainer, StaggerItem } from './MotionWrapper';
import SectionHeading from './ui/SectionHeading';
import LuxeButton from './ui/LuxeButton';

const defaultCards = [
  { image: '/assets/main-home1.jpg' },
  { image: '/assets/BRTN GRDN-3.JPEG' },
  { image: '/assets/BRTN GRDN-25 2.JPEG' },
];

const STATS = [
  { value: '24/7', label: 'Security & support' },
  { value: '100%', label: 'Fully furnished' },
  { value: 'Starlink', label: 'Wi-Fi throughout' },
];

const About = ({ content = {} }) => {
  const {
    heading = 'Experience Luxury Living at Bruton Gardens & Apartments',
    body = 'Discover modern comfort and elegant design in our premium apartments. Each unit is thoughtfully crafted to provide you with the perfect blend of style, functionality, and convenience on the outskirts of the city.',
    premiumBadge = 'Premium Living',
    mainImage = '/assets/BRTN GRDN-22.JPG',
    cards = defaultCards,
  } = content;

  return (
    <section className="section-y bg-ivory">
      <div className="container-luxe grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        {/* Images */}
        <div className="relative lg:col-span-6">
          <ImageReveal className="relative aspect-[4/5] rounded-t-full rounded-b-[2rem] md:w-4/5">
            <Image src={mainImage} alt="Bruton Gardens" fill sizes="(min-width: 1024px) 40vw, 90vw" className="object-cover" />
          </ImageReveal>
          {cards[1] && (
            <div className="absolute -bottom-10 right-0 w-2/5 md:w-1/3">
              <ImageReveal delay={0.3} from="left" className="relative aspect-square rounded-[2rem] border-8 border-ivory">
                <Image src={cards[1].image} alt="" fill sizes="20vw" className="object-cover" />
              </ImageReveal>
            </div>
          )}
          <FadeIn direction="up" delay={0.5} className="absolute left-4 top-10 md:-left-4">
            <span className="font-display flex size-28 items-center justify-center rounded-full bg-brass p-4 text-center text-lg leading-tight text-white shadow-xl md:size-36 md:text-2xl">
              {premiumBadge}
            </span>
          </FadeIn>
        </div>

        {/* Copy */}
        <div className="lg:col-span-5 lg:col-start-8">
          <SectionHeading eyebrow="The residence" title={heading} intro={body} />

          <StaggerContainer staggerDelay={0.12} className="mt-14 grid grid-cols-3 gap-6 border-t border-garden/10 pt-10">
            {STATS.map((s) => (
              <StaggerItem key={s.label}>
                <AnimatedCounter target={s.value} className="font-display block text-4xl text-garden md:text-5xl" />
                <p className="mt-2 text-sm text-ink/55">{s.label}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeIn direction="up" delay={0.2} className="mt-12">
            <LuxeButton href="/about" variant="garden" arrow>Discover the residence</LuxeButton>
          </FadeIn>
        </div>
      </div>

      {/* Wide parallax band */}
      {cards[2] && (
        <div className="container-luxe mt-28 md:mt-40">
          <Parallax speed={0.12} className="relative h-[50vh] rounded-[2rem] md:h-[70vh]">
            <Image src={cards[2].image} alt="Bruton Gardens grounds" fill sizes="100vw" className="object-cover" />
          </Parallax>
        </div>
      )}
    </section>
  );
};

export default About;
