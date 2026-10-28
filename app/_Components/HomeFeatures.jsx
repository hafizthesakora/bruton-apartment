'use client';
import React from 'react';
import Image from 'next/image';
import { Wifi, ShieldCheck, Car, UtensilsCrossed, Sparkles, Trees, CookingPot, WashingMachine } from 'lucide-react';
import { Marquee, StaggerContainer, StaggerItem, Parallax } from './MotionWrapper';
import SectionHeading from './ui/SectionHeading';

const AMENITIES = [
  { icon: Wifi, label: 'Starlink Wi-Fi' },
  { icon: ShieldCheck, label: '24/7 security' },
  { icon: Car, label: 'Parking for every guest' },
  { icon: UtensilsCrossed, label: 'Room service' },
  { icon: Sparkles, label: 'Housekeeping' },
  { icon: Trees, label: 'Landscaped gardens' },
  { icon: CookingPot, label: 'Full kitchen' },
  { icon: WashingMachine, label: 'Laundry' },
];

const HomeFeatures = () => {
  return (
    <section className="overflow-hidden bg-garden text-ivory">
      <Marquee duration={45} className="border-b border-ivory/10 py-8">
        {AMENITIES.map(({ icon: Icon, label }) => (
          <span key={label} className="flex items-center gap-4 pr-14">
            <Icon size={22} className="text-brass" strokeWidth={1.5} />
            <span className="font-display text-3xl italic md:text-4xl">{label}</span>
          </span>
        ))}
      </Marquee>

      <div className="section-y container-luxe grid items-center gap-16 lg:grid-cols-2">
        <div>
          <SectionHeading
            light
            eyebrow="Live better"
            title="Everything taken care of"
            intro="From the moment you arrive, our team looks after the details: clean linen, a full kitchen, fast Wi-Fi and a quiet garden to come home to."
          />
          <StaggerContainer staggerDelay={0.08} className="mt-14 grid grid-cols-2 gap-x-8 gap-y-6">
            {AMENITIES.map(({ icon: Icon, label }) => (
              <StaggerItem key={label} className="flex items-center gap-4 border-b border-ivory/10 pb-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ivory/5 text-brass">
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <span className="text-ivory/85">{label}</span>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>

        <Parallax speed={0.1} className="relative aspect-[4/5] rounded-[2rem] lg:aspect-[3/4]">
          <Image src="/assets/BRTN GRDN-24.JPEG" alt="Bruton Gardens grounds" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
        </Parallax>
      </div>
    </section>
  );
};

export default HomeFeatures;
