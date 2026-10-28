'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import {
  Wifi,
  ParkingCircle,
  Lock,
  Coffee,
  AirVent,
  Utensils,
  CookingPot,
  WashingMachine,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, Parallax, ImageReveal } from '../_Components/MotionWrapper';
import PageHero from '../_Components/ui/PageHero';
import SectionHeading from '../_Components/ui/SectionHeading';
import LuxeButton from '../_Components/ui/LuxeButton';
import ContactModal from '../_Components/ContactModal';

const FACILITY_ICONS = [Wifi, ParkingCircle, Lock, Coffee, AirVent, Utensils];
const FACILITY_TITLE_ICONS = { 'Fully Equipped Kitchen': CookingPot, 'Washer & Dryer': WashingMachine };

const DEFAULT_FACILITIES = {
  hero: { title: 'Our Facilities', subtitle: 'Everything you need for a comfortable short stay, all in one place' },
  categories: [
    { category: 'Essential Amenities', items: [{ title: 'Ultrafast WiFi by Starlink', description: 'Blazing fast internet powered by Starlink, perfect for work and streaming' }, { title: 'Free Parking', description: 'Complimentary parking space for all guests' }, { title: 'Secure Access', description: '24/7 security with keyless entry and CCTV monitoring' }, { title: 'Café Corner', description: 'Coffee maker and refreshment area' }] },
    { category: 'In-Apartment Features', items: [{ title: 'Fully Equipped Kitchen', description: 'Complete kitchen with cookware, utensils, and appliances' }, { title: 'Washer & Dryer', description: 'In-unit laundry for your convenience' }, { title: 'Climate Control', description: 'Individual air conditioning in every room' }, { title: 'Dining Space', description: 'Comfortable dining area for meals and work' }] },
  ],
  explore: { heading: 'Explore Our Apartments', body: 'Take a virtual tour of our fully furnished apartments and see all the amenities included in your stay.', primaryCta: 'Start Tour', secondaryCta: 'Book Now' },
  special: { heading: 'What Makes Us Special', items: [{ title: 'Daily Housekeeping', description: 'Professional daily cleaning service to keep your apartment fresh and spotless.' }, { title: '24-Hour Check-In', description: 'Dedicated staff available around the clock to welcome you.' }, { title: 'CCTV & Trained Security', description: 'Comprehensive CCTV monitoring and highly trained security staff.' }] },
  cta: { heading: 'Ready for Your Stay?', body: 'Book your apartment today and enjoy all our premium facilities during your short stay.', primaryCta: 'Check Availability', secondaryCta: 'Contact Us' },
};

const CATEGORY_IMAGES = ['/assets/BRTN GRDN-24.JPEG', '/assets/BRTN GRDN-14.JPG'];

export default function FacilitiesClient({ initialData }) {
  const [contactOpen, setContactOpen] = useState(false);
  const [c] = useState(initialData && Object.keys(initialData).length ? { ...DEFAULT_FACILITIES, ...initialData } : DEFAULT_FACILITIES);

  const categories = c.categories || DEFAULT_FACILITIES.categories;
  const explore = { ...DEFAULT_FACILITIES.explore, ...c.explore };
  const special = c.special || DEFAULT_FACILITIES.special;
  const cta = { ...DEFAULT_FACILITIES.cta, ...c.cta };

  return (
    <>
      <PageHero
        eyebrow="Amenities"
        title={c.hero?.title || DEFAULT_FACILITIES.hero.title}
        intro={c.hero?.subtitle || DEFAULT_FACILITIES.hero.subtitle}
        image="/assets/facilities.JPEG"
      />

      {/* Categories */}
      {categories.map((category, index) => (
        <section key={index} className={`section-y ${index % 2 ? 'bg-sand/50' : 'bg-ivory'}`}>
          <div className="container-luxe grid gap-16 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-32">
                <SectionHeading eyebrow={`0${index + 1}`} title={category.category} />
                <ImageReveal delay={0.2} className="relative mt-12 hidden aspect-[4/3] rounded-[2rem] lg:block">
                  <Image src={CATEGORY_IMAGES[index % CATEGORY_IMAGES.length]} alt="" fill sizes="40vw" className="object-cover" />
                </ImageReveal>
              </div>
            </div>
            <StaggerContainer staggerDelay={0.1} className="grid gap-px self-start overflow-hidden rounded-[2rem] bg-garden/10 sm:grid-cols-2 lg:col-span-7">
              {(category.items || []).map((item, i) => {
                const Icon = FACILITY_TITLE_ICONS[item.title] || FACILITY_ICONS[i] || Wifi;
                return (
                  <StaggerItem key={i} className={`group p-8 transition-colors duration-500 hover:bg-garden hover:text-ivory md:p-10 ${index % 2 ? 'bg-[#EFE8DC]' : 'bg-ivory'}`}>
                    <span className="flex size-14 items-center justify-center rounded-full border border-brass/40 text-brass transition-colors duration-500 group-hover:border-brass group-hover:bg-brass group-hover:text-white">
                      <Icon size={22} strokeWidth={1.5} />
                    </span>
                    <h3 className="font-display mt-8 text-2xl text-garden transition-colors duration-500 group-hover:text-ivory md:text-3xl">{item.title}</h3>
                    <p className="mt-3 text-ink/60 transition-colors duration-500 group-hover:text-ivory/70">{item.description}</p>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      ))}

      {/* Explore */}
      <section className="section-y bg-ivory">
        <div className="container-luxe grid items-center gap-16 lg:grid-cols-2">
          <Parallax speed={0.1} className="relative aspect-[5/4] rounded-[2rem]">
            <Image src="/assets/BRTN GRDN-12.JPEG" alt="Bruton Gardens apartment" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </Parallax>
          <div>
            <SectionHeading eyebrow="Take a look" title={explore.heading} intro={explore.body} />
            <FadeIn direction="up" delay={0.2} className="mt-10 flex flex-wrap gap-3">
              <LuxeButton href="/blog" variant="garden" arrow>{explore.primaryCta}</LuxeButton>
              <LuxeButton href="/book" variant="outline" className="text-garden">{explore.secondaryCta}</LuxeButton>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* What makes us special */}
      <section className="section-y bg-garden text-ivory">
        <div className="container-luxe">
          <SectionHeading light eyebrow="The difference" title={special.heading} align="center" className="mb-20" />
          <StaggerContainer staggerDelay={0.12} className="grid gap-px overflow-hidden rounded-[2rem] bg-ivory/10 md:grid-cols-3">
            {(special.items || []).map((feature, index) => (
              <StaggerItem key={index} className="bg-garden p-10 md:p-12">
                <p className="font-display text-6xl text-brass/50">{String(index + 1).padStart(2, '0')}</p>
                <h3 className="font-display mt-6 text-3xl">{feature.title}</h3>
                <p className="mt-4 leading-relaxed text-ivory/65">{feature.description}</p>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-garden text-ivory">
        <Parallax speed={0.15} className="absolute inset-0">
          <Image src="/assets/BRTN GRDN-27.JPG" alt="" fill sizes="100vw" className="object-cover" />
        </Parallax>
        <div className="absolute inset-0 bg-garden/70" />
        <div className="container-luxe relative py-32 text-center md:py-44">
          <SectionHeading light title={cta.heading} intro={cta.body} align="center" />
          <FadeIn direction="up" delay={0.2} className="mt-10 flex flex-wrap justify-center gap-3">
            <LuxeButton href="/book" size="lg" arrow>{cta.primaryCta}</LuxeButton>
            <LuxeButton size="lg" variant="outline" onClick={() => setContactOpen(true)}>{cta.secondaryCta}</LuxeButton>
          </FadeIn>
        </div>
      </section>

      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </>
  );
}
