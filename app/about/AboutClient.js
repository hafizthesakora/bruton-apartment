'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FadeIn, StaggerContainer, StaggerItem, AnimatedCounter, ImageReveal, motion, AnimatePresence, EASE_LUXE } from '../_Components/MotionWrapper';
import PageHero from '../_Components/ui/PageHero';
import SectionHeading from '../_Components/ui/SectionHeading';
import LuxeButton from '../_Components/ui/LuxeButton';
import ContactModal from '../_Components/ContactModal';

const defaultSlideImages = [
  '/assets/brut1.jpg',
  '/assets/brut2.jpg',
  '/assets/BRTN GRDN-6.JPEG',
  '/assets/BRTN GRDN-1.JPEG',
  '/assets/BRTN GRDN-22.JPG',
  '/assets/BRTN GRDN-27.JPG',
];

const DEFAULT_ABOUT = {
  hero: { title: 'About Bruton Gardens & Apartments', subtitle: 'A short stay apartment offering exceptional comfort, modern amenities, and warm hospitality on the outskirts of the city.' },
  stats: [{ value: '100+', label: 'Happy Guests' }, { value: '1+', label: 'Years Experience' }, { value: 'Prime', label: 'Location' }, { value: '4.8/5', label: 'Guest Rating' }],
  story: { heading: 'Our Story', paragraph1: 'Bruton Gardens & Apartments was established with a vision to provide travelers and visitors with a home away from home. What started as a family initiative has grown into a trusted short stay destination.', paragraph2: "Our commitment to excellence, attention to detail, and genuine hospitality ensures that every guest enjoys a comfortable, memorable stay. Whether you're visiting for business or leisure, we treat you like family.", primaryCta: 'Book Now', secondaryCta: 'Contact Us' },
  team: { heading: 'Meet Our Team', members: [{ name: 'Mrs. Portia Owusu Asante', role: 'Director', image: '/assets/team-portia.jpeg', bio: 'Passionate about providing exceptional hospitality and comfortable stays' }, { name: 'Nana Afia Nketia Danquah', role: 'Facilities Manager', image: '/assets/team-nana.jpeg', bio: 'Ensuring every guest enjoys a seamless and memorable experience' }, { name: 'Tetteh Ebenezer', role: 'Front of House', image: '/assets/team-tetteh.jpeg', bio: 'Dedicated to making your stay comfortable and stress-free' }] },
};

export default function AboutClient({ initialData, initialSlideImages }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);
  const [c] = useState(initialData && Object.keys(initialData).length ? { ...DEFAULT_ABOUT, ...initialData } : DEFAULT_ABOUT);
  const [slideImages] = useState(initialSlideImages?.length ? initialSlideImages : defaultSlideImages);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slideImages.length]);

  const teamMembers = c.team?.members || DEFAULT_ABOUT.team.members;
  const stats = c.stats || DEFAULT_ABOUT.stats;
  const story = { ...DEFAULT_ABOUT.story, ...c.story };

  return (
    <>
      <PageHero
        eyebrow="Our story"
        title={c.hero?.title || DEFAULT_ABOUT.hero.title}
        intro={c.hero?.subtitle || DEFAULT_ABOUT.hero.subtitle}
        image={c.hero?.heroImage || '/assets/BRTN GRDN-1.JPEG'}
      />

      {/* Stats */}
      <section className="border-b border-garden/10 bg-ivory">
        <StaggerContainer staggerDelay={0.1} className="container-luxe grid grid-cols-2 divide-garden/10 md:grid-cols-4 md:divide-x">
          {stats.map((stat, index) => (
            <StaggerItem key={index} className="px-2 py-12 text-center md:py-16">
              <AnimatedCounter target={stat.value} className="font-display block text-5xl text-garden md:text-6xl" />
              <p className="eyebrow mt-3 text-ink/50">{stat.label}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Story */}
      <section className="section-y bg-ivory">
        <div className="container-luxe grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Since day one" title={story.heading} />
            <FadeIn direction="up" delay={0.15}>
              <p className="mt-8 text-lg leading-relaxed text-ink/65">{story.paragraph1}</p>
            </FadeIn>
            <FadeIn direction="up" delay={0.25}>
              <p className="mt-5 text-lg leading-relaxed text-ink/65">{story.paragraph2}</p>
            </FadeIn>
            <FadeIn direction="up" delay={0.35} className="mt-10 flex flex-wrap gap-3">
              <LuxeButton href="/book" arrow>{story.primaryCta}</LuxeButton>
              <LuxeButton variant="outline" className="text-garden" onClick={() => setContactOpen(true)}>{story.secondaryCta}</LuxeButton>
            </FadeIn>
          </div>

          <ImageReveal className="relative aspect-[4/5] rounded-[2rem] bg-sand">
            <AnimatePresence initial={false}>
              <motion.div
                key={currentSlide}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: EASE_LUXE }}
              >
                <Image src={slideImages[currentSlide]} alt={`Bruton Gardens ${currentSlide + 1}`} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 gap-2">
              {slideImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-10 bg-ivory' : 'w-4 bg-ivory/50'}`}
                />
              ))}
            </div>
          </ImageReveal>
        </div>
      </section>

      {/* Team */}
      <section className="section-y bg-sand/50">
        <div className="container-luxe">
          <SectionHeading eyebrow="The people" title={c.team?.heading || DEFAULT_ABOUT.team.heading} align="center" className="mb-20" />
          <div className="grid gap-12 md:grid-cols-3">
            {teamMembers.map((member, index) => (
              <div key={index} className="group text-center">
                <ImageReveal delay={index * 0.12} className="relative mx-auto aspect-[3/4] w-full max-w-xs rounded-t-full rounded-b-[2rem] bg-sand">
                  <Image src={member.image} alt={member.name} fill sizes="(min-width: 768px) 30vw, 80vw" className="object-cover grayscale-[30%] transition-all duration-1000 group-hover:scale-105 group-hover:grayscale-0" />
                </ImageReveal>
                <FadeIn direction="up" delay={0.2 + index * 0.1}>
                  <p className="eyebrow mt-8 text-brass">{member.role}</p>
                  <h3 className="font-display mt-3 text-3xl text-garden">{member.name}</h3>
                  <p className="mx-auto mt-3 max-w-xs text-ink/60">{member.bio}</p>
                </FadeIn>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
