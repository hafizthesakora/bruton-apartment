'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogPanel,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Popover,
  PopoverButton,
  PopoverGroup,
  PopoverPanel,
} from '@headlessui/react';
import {
  ArrowPathIcon,
  Bars3Icon,
  ChartPieIcon,
  CursorArrowRaysIcon,
  FingerPrintIcon,
  SquaresPlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import {
  ChevronDownIcon,
  PhoneIcon,
  PlayCircleIcon,
} from '@heroicons/react/20/solid';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  MapPinHouse,
  UserRoundSearch,
  Navigation,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const products = [
  {
    name: 'Analytics',
    description: 'Get a better understanding of your traffic',
    href: '#',
    icon: ChartPieIcon,
  },
  {
    name: 'Engagement',
    description: 'Speak directly to your customers',
    href: '#',
    icon: CursorArrowRaysIcon,
  },
  {
    name: 'Security',
    description: 'Your customers data will be safe and secure',
    href: '#',
    icon: FingerPrintIcon,
  },
  {
    name: 'Integrations',
    description: 'Connect with third-party tools',
    href: '#',
    icon: SquaresPlusIcon,
  },
  {
    name: 'Automations',
    description: 'Build strategic funnels that will convert',
    href: '#',
    icon: ArrowPathIcon,
  },
];
const callsToAction = [
  { name: 'Watch demo', href: '#', icon: PlayCircleIcon },
  { name: 'Contact sales', href: '#', icon: PhoneIcon },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [directionsPopupOpen, setDirectionsPopupOpen] = useState(false);

  const handleGetDirections = () => {
    // Open Google Maps with directions
    window.open(
      'https://maps.app.goo.gl/uAjiMzC2AW4HJxGJ9?g_st=com.google.maps.preview.copy',
      '_blank'
    );
    setDirectionsPopupOpen(false);
  };

  return (
    <header className="bg-white">
      <nav
        aria-label="Global"
        className="mx-auto flex container items-center justify-between p-6 lg:px-8"
      >
        <div className="flex lg:flex-1">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="logo"
              width={160}
              height={80}
              data-aos="fade-right"
              data-aos-duration="800"
              data-aos-easing="ease-in"
            />
          </Link>
        </div>
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
        <PopoverGroup className="hidden lg:flex lg:gap-x-12">
          <Link
            href="/"
            className="text-lg font-normal tracking-wide text-gray-900"
            data-aos="fade-down"
            data-aos-duration="900"
            data-aos-easing="ease-in-out-back"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-lg font-normal tracking-wide text-gray-900"
            data-aos="fade-down"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            About Us
          </Link>
          <Link
            href="/services"
            className="text-lg font-normal tracking-wide text-gray-900"
            data-aos="fade-down"
            data-aos-duration="1100"
            data-aos-easing="ease-in-out-back"
          >
            Services
          </Link>
          <Link
            href="/facilities"
            className="text-lg font-normal tracking-wide text-gray-900"
            data-aos="fade-down"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            Facilites
          </Link>{' '}
          <Link
            href="/blog"
            className="text-lg font-normal tracking-wide text-gray-900"
            data-aos="fade-down"
            data-aos-duration="1300"
            data-aos-easing="ease-in-out-back"
          >
            Gallery
          </Link>
        </PopoverGroup>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end gap-5">
          <Button
            variant="secondary"
            onClick={() => setDirectionsPopupOpen(true)}
            data-aos="fade-left"
            data-aos-duration="1400"
            data-aos-easing="ease-in-out-back"
          >
            <MapPinHouse size={30} /> Vist Now
          </Button>
          <Button
            className="bg-lime-400 hover:bg-lime-500"
            data-aos="fade-left"
            data-aos-duration="1800"
            data-aos-easing="ease-in-out-back"
          >
            <UserRoundSearch size={30} /> Contact Us
          </Button>
        </div>
      </nav>

      {/* Mobile Menu Dialog */}
      <Dialog
        open={mobileMenuOpen}
        onClose={setMobileMenuOpen}
        className="lg:hidden"
      >
        <div className="fixed inset-0 z-10" />
        <DialogPanel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Image src="/logo.png" alt="logo" width={120} height={60} />
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
              <div className="space-y-5 py-10 flex flex-col ">
                <Link
                  href="/"
                  className="text-lg font-normal tracking-wide text-gray-900"
                >
                  Home
                </Link>
                <Link
                  href="/about"
                  className="text-lg font-normal tracking-wide text-gray-900"
                >
                  About Us
                </Link>
                <Link
                  href="/services"
                  className="text-lg font-normal tracking-wide text-gray-900"
                >
                  Services
                </Link>
                <Link
                  href="/facilities"
                  className="text-lg font-normal tracking-wide text-gray-900"
                >
                  Facilites
                </Link>{' '}
                <Link
                  href="/blog"
                  className="text-lg font-normal tracking-wide text-gray-900"
                >
                  Gallery
                </Link>
              </div>
              <div className="py-6 gap-5 flex mt-5">
                <Button variant="secondary">
                  <MapPinHouse size={30} /> Vist Now
                </Button>
                <Button
                  className="bg-lime-400 hover:bg-lime-500"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setDirectionsPopupOpen(true);
                  }}
                >
                  <UserRoundSearch size={30} /> Contact Us
                </Button>
              </div>
            </div>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Directions Popup Dialog */}
      <Dialog
        open={directionsPopupOpen}
        onClose={() => setDirectionsPopupOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl">
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
              We'll open Google Maps to show you directions to Bruton Gardens
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
          </DialogPanel>
        </div>
      </Dialog>
    </header>
  );
}
