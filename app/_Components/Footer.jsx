'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUp } from 'lucide-react';
import { FadeIn, RevealText, Marquee } from './MotionWrapper';
import LuxeButton from './ui/LuxeButton';
import { socialLinks } from '@/lib/social';

const DEFAULT_FOOTER = {
  description: 'Experience luxury living at Bruton Gardens & Apartments. We offer modern, well-furnished apartments in a serene environment with world-class amenities and exceptional service. Your comfort is our priority.',
  quickLinksHeading: 'Explore',
  quickLinks: [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Apartments' },
    { href: '/facilities', label: 'Facilities' },
    { href: '/blog', label: 'Gallery & Blog' },
  ],
  connectHeading: 'Connect',
  socialLinks: [],
  featuredItems: [
    { image: '/assets/hall.JPEG', title: 'Event Center', subtitle: 'Elegant & Modern Design' },
    { image: '/assets/main-home1.jpg', title: 'Premium Units', subtitle: 'Fully Furnished Apartments' },
    { image: '/assets/BRTN GRDN-26.JPG', title: 'Beautiful Gardens', subtitle: 'Serene Environment' },
  ],
  copyright: '© 2026 Bruton Gardens & Apartments. All rights reserved.',
};

// Always offered, whatever the CMS quick links say.
const GUEST_LINKS = [
  { href: '/book', label: 'Book a Stay' },
  { href: '/account', label: 'My Booking' },
  { href: '/room-service', label: 'Room Service' },
];

const scrollTop = () => {
  if (window.__lenis) window.__lenis.scrollTo(0);
  else window.scrollTo({ top: 0, behavior: 'smooth' });
};

const Footer = () => {
  const [f, setF] = useState(DEFAULT_FOOTER);
  const [settingsSocial, setSettingsSocial] = useState([]);

  useEffect(() => {
    fetch('/api/content?page=footer')
      .then(r => r.json())
      .then(data => { if (data && Object.keys(data).length) setF(prev => ({ ...prev, ...data })); })
      .catch(() => {});
    fetch('/api/settings')
      .then(r => r.json())
      // Social links are managed in Admin → Settings; they replace the CMS placeholders.
      .then(data => setSettingsSocial(socialLinks(data?.social)))
      .catch(() => {});
  }, []);

  const links = (settingsSocial.length ? settingsSocial : f.socialLinks || [])
    .filter((s) => s.url && s.url !== '#');
  const explore = (f.quickLinks || []).filter((l) => !GUEST_LINKS.some((g) => g.href === l.href));

  const heading = 'eyebrow mb-6 text-sand/60';
  const link = 'text-ivory/80 transition-colors duration-300 hover:text-brass';

  return (
    <footer className="relative overflow-hidden bg-garden text-ivory">
      {/* Closing call to action */}
      <div className="container-luxe border-b border-ivory/10 pb-20 pt-24 md:pb-28 md:pt-36">
        <div className="grid items-end gap-12 md:grid-cols-[1fr_auto]">
          <div>
            <FadeIn direction="up">
              <p className="eyebrow mb-6 flex items-center gap-3 text-brass"><span className="h-px w-8 bg-current" />Your stay awaits</p>
            </FadeIn>
            <RevealText as="p" text="Stay in the garden." className="font-display text-6xl leading-[0.95] md:text-[9rem]" />
          </div>
          <FadeIn direction="up" delay={0.3} className="flex flex-wrap gap-3">
            <LuxeButton href="/book" size="lg" arrow>Book your stay</LuxeButton>
            <LuxeButton href="/account" size="lg" variant="outline">My Booking</LuxeButton>
          </FadeIn>
        </div>
      </div>

      <div className="container-luxe grid gap-14 py-20 md:grid-cols-12">
        <div className="md:col-span-4">
          <Image src="/logo.png" alt="Bruton Gardens & Apartments" width={160} height={80} className="h-14 w-auto brightness-0 invert" />
          <p className="mt-8 max-w-sm leading-relaxed text-ivory/60">{f.description}</p>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>{f.quickLinksHeading}</p>
          <ul className="space-y-3">
            {explore.map((l) => <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>)}
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className={heading}>Guests</p>
          <ul className="space-y-3">
            {GUEST_LINKS.map((l) => <li key={l.href}><Link href={l.href} className={link}>{l.label}</Link></li>)}
          </ul>
        </div>

        <div className="md:col-span-4">
          <p className={heading}>Around the property</p>
          <ul className="space-y-5">
            {f.featuredItems.map((item) => (
              <li key={item.title}>
                <Link href="/blog" className="group flex items-center gap-5">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl">
                    <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                  </span>
                  <span>
                    <span className="font-display block text-2xl transition-colors group-hover:text-brass">{item.title}</span>
                    <span className="text-sm text-ivory/55">{item.subtitle}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Marquee duration={50} className="border-y border-ivory/10 py-6 text-ivory/15">
        {['Bruton Gardens', 'Apartments', 'Event Center', 'Gardens', 'Room Service'].map((w) => (
          <span key={w} className="font-display flex items-center gap-10 pr-10 text-6xl italic md:text-8xl">
            {w}<span className="text-brass/40">✦</span>
          </span>
        ))}
      </Marquee>

      <div className="container-luxe flex flex-col items-center justify-between gap-6 py-8 text-sm text-ivory/50 md:flex-row">
        <p>{f.copyright}</p>
        <div className="flex items-center gap-6">
          {links.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brass">{s.name}</a>
          ))}
          <button onClick={scrollTop} className="flex size-10 items-center justify-center rounded-full border border-ivory/20 transition-colors hover:border-brass hover:text-brass" aria-label="Back to top">
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
