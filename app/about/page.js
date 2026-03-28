'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  Users,
  Calendar,
  MapPin,
  Star,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn, AnimatedCounter, motion, AnimatePresence } from '../_Components/MotionWrapper';
import BookingModal from '../_Components/BookingModal';
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

const statIcons = [Users, Calendar, MapPin, Star];

const AboutUs = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [c, setC] = useState(DEFAULT_ABOUT);

  const [slideImages, setSlideImages] = useState(defaultSlideImages);

  useEffect(() => {
    fetch('/api/content?page=about')
      .then(r => r.json())
      .then(data => { if (data && Object.keys(data).length) setC(prev => ({ ...prev, ...data })); })
      .catch(() => {});
    fetch('/api/carousel?name=about-slideshow')
      .then(r => r.json())
      .then(data => { if (data?.images?.length) setSlideImages(data.images.map(img => img.src)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const teamMembers = c.team?.members || DEFAULT_ABOUT.team.members;
  const stats = (c.stats || DEFAULT_ABOUT.stats).map((s, i) => ({ ...s, icon: statIcons[i] || Star }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-14">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden p-5">
        <div className="absolute inset-0 z-0">
          <Image
            src={c.hero?.heroImage || '/assets/BRTN GRDN-1.JPEG'}
            alt="Hero Background"
            fill
            className="object-cover brightness-30"
            priority
          />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <FadeIn direction="up">
            <h1 className="text-3xl md:text-6xl font-bold mb-6">{c.hero?.title || DEFAULT_ABOUT.hero.title}</h1>
          </FadeIn>
          <FadeIn direction="down" delay={0.2}>
            <p className="text-md md:text-2xl max-w-3xl mx-auto leading-relaxed">
              {c.hero?.subtitle || DEFAULT_ABOUT.hero.subtitle}
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-20 relative z-10">
        <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StaggerItem key={index}>
              <Card className="p-6 text-center bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <stat.icon className="w-12 h-12 mx-auto mb-2 text-lime-400" />
                <h3 className="text-3xl font-bold">
                  <AnimatedCounter target={stat.value} />
                </h3>
                <p className="text-gray-600">{stat.label}</p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Our Story Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-40">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <FadeIn direction="right">
              <h2 className="text-4xl md:text-5xl font-semibold text-gray-900">
                {c.story?.heading || DEFAULT_ABOUT.story.heading}
              </h2>
            </FadeIn>
            <div className="space-y-4">
              <FadeIn direction="right" delay={0.1}>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {c.story?.paragraph1 || DEFAULT_ABOUT.story.paragraph1}
                </p>
              </FadeIn>
              <FadeIn direction="right" delay={0.2}>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {c.story?.paragraph2 || DEFAULT_ABOUT.story.paragraph2}
                </p>
              </FadeIn>
            </div>
            <FadeIn direction="right" delay={0.3}>
              <div className="flex gap-4">
                <button onClick={() => setBookingOpen(true)} className="bg-lime-400 text-gray-900 px-6 py-3 rounded-full hover:bg-lime-500 transition-colors font-semibold">
                  {c.story?.primaryCta || DEFAULT_ABOUT.story.primaryCta}
                </button>
                <button onClick={() => setContactOpen(true)} className="border-2 border-lime-400 text-lime-600 px-6 py-3 rounded-full hover:bg-lime-50 transition-colors font-semibold">
                  {c.story?.secondaryCta || DEFAULT_ABOUT.story.secondaryCta}
                </button>
              </div>
            </FadeIn>
          </div>
          <FadeIn direction="left" delay={0.2}>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={slideImages[currentSlide]}
                    alt={`Bruton Gardens ${currentSlide + 1}`}
                    fill
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              {/* Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {slideImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-lime-400 w-5' : 'bg-white/60'}`}
                  />
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 px-3 py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up">
            <h2 className="text-4xl md:text-5xl font-semibold text-center text-gray-900 mb-12">
              {c.team?.heading || DEFAULT_ABOUT.team.heading}
            </h2>
          </FadeIn>
          <StaggerContainer staggerDelay={0.15} className="grid md:grid-cols-3 gap-8 pt-10">
            {teamMembers.map((member, index) => (
              <StaggerItem key={index}>
                <Card className="p-6 text-center bg-white hover:shadow-xl transition-shadow duration-300">
                  <ScaleIn delay={0.1}>
                    <div className="relative w-48 h-48 mx-auto mb-6">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                  </ScaleIn>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {member.name}
                  </h3>
                  <p className="text-lime-500 font-medium mb-3">
                    {member.role}
                  </p>
                  <p className="text-gray-600">
                    {member.bio}
                  </p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>

      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
};

export default AboutUs;
