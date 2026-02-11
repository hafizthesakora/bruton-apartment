'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogPanel, PopoverGroup } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MapPinHouse,
  UserRoundSearch,
  Navigation,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/services', label: 'Services' },
  { href: '/facilities', label: 'Facilities' },
  { href: '/blog', label: 'Gallery & Blog' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [directionsPopupOpen, setDirectionsPopupOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetDirections = () => {
    window.open(
      'https://maps.app.goo.gl/uAjiMzC2AW4HJxGJ9?g_st=com.google.maps.preview.copy',
      '_blank'
    );
    setDirectionsPopupOpen(false);
  };

  const handleContactScroll = () => {
    const servicesSection = document.querySelector('#services-section');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/services';
    }
  };

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/60 backdrop-blur-xl shadow-lg border-b border-white/20'
          : 'bg-white/90 backdrop-blur-sm'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <nav
        aria-label="Global"
        className="mx-auto flex container items-center justify-between py-2 px-4 lg:px-8"
      >
        <motion.div
          className="flex lg:flex-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link href="/">
            <Image
              src="/logo.png"
              alt="logo"
              width={80}
              height={40}
            />
          </Link>
        </motion.div>
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Bars3Icon aria-hidden="true" className="size-6" />
          </button>
        </div>
        <PopoverGroup className="hidden lg:flex lg:gap-x-10">
          {navLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
            >
              <Link
                href={link.href}
                className={`text-sm font-normal tracking-wide transition-colors duration-200 ${
                  pathname === link.href
                    ? 'text-lime-500 font-medium'
                    : 'text-gray-900 hover:text-lime-500'
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    className="h-0.5 bg-lime-400 mt-1 rounded-full"
                    layoutId="activeNav"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </PopoverGroup>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDirectionsPopupOpen(true)}
            >
              <MapPinHouse size={16} /> Visit Now
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Button
              className="bg-lime-400 hover:bg-lime-500"
              size="sm"
              onClick={handleContactScroll}
            >
              <UserRoundSearch size={16} /> Contact Us
            </Button>
          </motion.div>
        </div>
      </nav>

      {/* Mobile Menu Dialog */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <Dialog
            open={mobileMenuOpen}
            onClose={setMobileMenuOpen}
            className="lg:hidden"
          >
            <div className="fixed inset-0 z-10" />
            <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
              <div className="flex items-center justify-between">
                <Link href="/">
                  <Image src="/logo.png" alt="logo" width={80} height={40} />
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-m-2.5 rounded-md p-2.5 text-gray-700"
                >
                  <span className="sr-only">Close menu</span>
                  <XMarkIcon aria-hidden="true" className="size-6" />
                </button>
              </div>
              <div className="mt-6 flow-root">
                <div className="-my-6 divide-y divide-gray-500/10">
                  <div className="space-y-5 py-10 flex flex-col">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`text-lg font-normal tracking-wide ${
                          pathname === link.href
                            ? 'text-lime-500 font-medium'
                            : 'text-gray-900'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                  <div className="py-6 gap-3 flex mt-5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setDirectionsPopupOpen(true);
                      }}
                    >
                      <MapPinHouse size={16} /> Visit Now
                    </Button>
                    <Button
                      className="bg-lime-400 hover:bg-lime-500"
                      size="sm"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleContactScroll();
                      }}
                    >
                      <UserRoundSearch size={16} /> Contact Us
                    </Button>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Directions Popup Dialog */}
      <AnimatePresence>
        {directionsPopupOpen && (
          <Dialog
            open={directionsPopupOpen}
            onClose={() => setDirectionsPopupOpen(false)}
            className="relative z-50"
          >
            <motion.div
              className="fixed inset-0 bg-black/30"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <DialogPanel>
                <motion.div
                  className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Get Directions
                    </h2>
                    <button
                      onClick={() => setDirectionsPopupOpen(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  <p className="text-gray-600 mb-6">
                    We&apos;ll open Google Maps to show you directions to Bruton Gardens
                    Apartment from your current location.
                  </p>

                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleGetDirections}
                      className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold flex items-center justify-center gap-2"
                    >
                      <Navigation size={20} />
                      Open Google Maps
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setDirectionsPopupOpen(false)}
                      className="w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </motion.div>
              </DialogPanel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
