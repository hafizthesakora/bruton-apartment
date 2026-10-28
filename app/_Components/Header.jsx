'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dialog, DialogPanel } from '@headlessui/react';
import { MapPin, Navigation, X, Menu, UserRound } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import LuxeButton from './ui/LuxeButton';
import { Magnetic, EASE_LUXE } from './MotionWrapper';

const navLinks = [
  { href: '/book', label: 'Stay' },
  { href: '/services', label: 'Apartments' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/blog', label: 'Gallery' },
  { href: '/about', label: 'About' },
];

// Pages that open with a dark full-bleed hero, where the header starts transparent.
const HERO_PAGES = ['/', '/about', '/services', '/facilities', '/blog'];

const MAPS_URL = 'https://maps.app.goo.gl/uAjiMzC2AW4HJxGJ9?g_st=com.google.maps.preview.copy';

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 40);
    setHidden(y > 400 && y > prev);
  });

  useEffect(() => setMenuOpen(false), [pathname]);

  const overHero = HERO_PAGES.includes(pathname) && !scrolled;
  const isActive = (href) => pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <>
      <motion.header
        animate={{ y: hidden && !menuOpen ? '-110%' : 0 }}
        transition={{ duration: 0.6, ease: EASE_LUXE }}
        className={`w-full transition-[background-color,color,box-shadow,backdrop-filter] duration-700 ${
          overHero
            ? 'bg-transparent text-ivory'
            : 'bg-ivory/80 text-garden shadow-[0_1px_0_rgba(31,59,45,0.08)] backdrop-blur-xl'
        }`}
      >
        <nav aria-label="Main" className="container-luxe flex h-20 items-center justify-between gap-6 md:h-24">
          <Link href="/" className="relative z-10 shrink-0" aria-label="Bruton Gardens home">
            <Image
              src="/logo.png"
              alt="Bruton Gardens & Apartments"
              width={96}
              height={48}
              priority
              className={`h-10 w-auto transition-[filter] duration-700 md:h-12 ${overHero ? 'brightness-0 invert' : ''}`}
            />
          </Link>

          <ul className="hidden items-center gap-10 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="group relative py-2 text-[0.95rem] tracking-wide">
                  {link.label}
                  <span
                    className={`absolute -bottom-0.5 left-0 h-px bg-current transition-all duration-500 ease-[var(--ease-luxe)] ${
                      isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-6 lg:flex">
            <button
              type="button"
              onClick={() => setDirectionsOpen(true)}
              className="flex items-center gap-2 text-sm tracking-wide opacity-80 transition-opacity hover:opacity-100"
            >
              <MapPin size={16} /> Visit
            </button>
            <Link href="/account" className="flex items-center gap-2 text-sm tracking-wide opacity-80 transition-opacity hover:opacity-100">
              <UserRound size={16} /> My Booking
            </Link>
            <Magnetic>
              <LuxeButton href="/book" size="sm" arrow>Book now</LuxeButton>
            </Magnetic>
          </div>

          <div className="flex items-center gap-3 lg:hidden">
            <LuxeButton href="/book" size="sm">Book</LuxeButton>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="flex size-11 items-center justify-center rounded-full border border-current/25"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Full-screen mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <Dialog static open={menuOpen} onClose={setMenuOpen} className="relative z-[60] lg:hidden">
            <DialogPanel
              as={motion.div}
              initial={{ clipPath: 'inset(0 0 100% 0)' }}
              animate={{ clipPath: 'inset(0 0 0% 0)' }}
              exit={{ clipPath: 'inset(0 0 100% 0)' }}
              transition={{ duration: 0.8, ease: EASE_LUXE }}
              className="fixed inset-0 flex flex-col overflow-y-auto bg-garden px-6 pb-10 text-ivory"
            >
              <div className="flex h-20 items-center justify-between">
                <Image src="/logo.png" alt="Bruton Gardens & Apartments" width={96} height={48} className="h-10 w-auto brightness-0 invert" />
                <button type="button" onClick={() => setMenuOpen(false)} className="flex size-11 items-center justify-center rounded-full border border-ivory/25" aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>

              <ul className="mt-12 flex flex-col gap-2">
                {[{ href: '/', label: 'Home' }, ...navLinks, { href: '/account', label: 'My Booking' }, { href: '/room-service', label: 'Room Service' }].map((link, i) => (
                  <li key={link.href} className="overflow-hidden">
                    <motion.div
                      initial={{ y: '110%' }}
                      animate={{ y: 0 }}
                      transition={{ duration: 0.8, delay: 0.25 + i * 0.05, ease: EASE_LUXE }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={`font-display block py-1 text-5xl ${isActive(link.href) && link.href !== '/' ? 'text-brass' : ''}`}
                      >
                        {link.label}
                      </Link>
                    </motion.div>
                  </li>
                ))}
              </ul>

              <motion.div
                className="mt-auto flex flex-col gap-3 pt-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <LuxeButton href="/book" size="lg" arrow onClick={() => setMenuOpen(false)}>Book your stay</LuxeButton>
                <LuxeButton variant="outline" size="lg" onClick={() => { setMenuOpen(false); setDirectionsOpen(true); }}>
                  <MapPin size={16} className="inline -mt-0.5 mr-2" />Get directions
                </LuxeButton>
              </motion.div>
            </DialogPanel>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Directions dialog */}
      <AnimatePresence>
        {directionsOpen && (
          <Dialog static open={directionsOpen} onClose={() => setDirectionsOpen(false)} className="relative z-[70]">
            <motion.div
              className="fixed inset-0 bg-garden/60 backdrop-blur-sm"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel
                as={motion.div}
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.97 }}
                transition={{ duration: 0.5, ease: EASE_LUXE }}
                className="w-full max-w-md rounded-[2rem] bg-ivory p-8 text-garden shadow-2xl md:p-10"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h2 className="font-display text-4xl">Find us</h2>
                  <button onClick={() => setDirectionsOpen(false)} className="text-garden/50 hover:text-garden" aria-label="Close">
                    <X size={22} />
                  </button>
                </div>
                <p className="mb-8 text-ink/65">
                  We&apos;ll open Google Maps with directions to Bruton Gardens &amp; Apartments from where you are.
                </p>
                <div className="flex flex-col gap-3">
                  <LuxeButton
                    size="lg"
                    onClick={() => { window.open(MAPS_URL, '_blank'); setDirectionsOpen(false); }}
                  >
                    <Navigation size={16} className="inline -mt-0.5 mr-2" />Open Google Maps
                  </LuxeButton>
                  <LuxeButton variant="ghost" size="md" className="mx-auto" onClick={() => setDirectionsOpen(false)}>Cancel</LuxeButton>
                </div>
              </DialogPanel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}
