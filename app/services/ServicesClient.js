'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Check } from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, Parallax, motion, AnimatePresence, EASE_LUXE } from '../_Components/MotionWrapper';
import PageHero from '../_Components/ui/PageHero';
import SectionHeading from '../_Components/ui/SectionHeading';
import LuxeButton from '../_Components/ui/LuxeButton';
import ApartmentCard from '../_Components/ui/ApartmentCard';
import EventEnquiryModal from '../_Components/EventEnquiryModal';

const DEFAULT_SERVICES = {
  hero: { title: 'Our Services', subtitle: 'Everything you need for a comfortable short-stay experience in our fully furnished apartments' },
  cards: [
    { title: 'Apartment Booking', description: "Whether it's a weekend getaway or a month-long work trip, our fully furnished apartments are available on AirBnB and direct booking.", features: ['AirBnB Integration', 'Flexible Dates', 'Instant Confirmation'] },
    { title: 'Event Center', description: 'Our versatile event center is designed to bring your vision to life. From corporate conferences to birthday celebrations.', features: ['Corporate Events', 'Private Celebrations', 'Full Setup Support'] },
    { title: 'Catering Outsourcing', description: 'Elevate any occasion with our professional catering partnerships. Bespoke menus tailored to your event.', features: ['Custom Menus', 'Professional Service', 'All Event Sizes'] },
    { title: 'Restaurant', description: 'Savour a carefully curated menu of local Ghanaian favourites and international dishes at our on-site restaurant.', features: ['Local & International Cuisine', 'Experienced Chefs', 'Dine-in & Delivery'] },
  ],
  whyChoose: { heading: 'Why Choose Our Apartments?', items: [{ title: 'Ultrafast WiFi by Starlink', description: 'High-speed internet powered by Starlink, perfect for remote work, streaming, and staying connected' }, { title: 'Daily Housekeeping', description: 'Professional daily cleaning service to keep your apartment fresh and spotless throughout your stay' }, { title: 'Satellite TV & Soundproof Rooms', description: 'Enjoy premium satellite TV channels in soundproof rooms designed for your comfort and privacy' }, { title: 'Safe & Secure', description: 'CCTV monitoring and highly trained security staff to ensure your safety around the clock' }] },
  reviews: { heading: 'What Our Guests Say' },
};

const SERVICE_IMAGES = ['/assets/main-home1.jpg', '/assets/hall.JPEG', '/assets/BRTN GRDN-26.JPG', '/assets/BRTN GRDN-27.JPG'];

export default function ServicesClient({ initialData, apartments = [] }) {
  const [c] = useState(initialData && Object.keys(initialData).length ? { ...DEFAULT_SERVICES, ...initialData } : DEFAULT_SERVICES);
  const [reviews, setReviews] = useState([]);
  const [googleRating, setGoogleRating] = useState(null);
  const [currentReview, setCurrentReview] = useState(0);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  // Only real Google reviews are shown; nothing is displayed until the Places API is configured.
  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews?.length) {
          setReviews(data.reviews.filter((r) => r.text));
          setGoogleRating({ value: data.rating, total: data.totalReviews });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reviews.length < 2) return;
    const timer = setInterval(() => setCurrentReview((prev) => (prev + 1) % reviews.length), 7000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  const services = c.cards || DEFAULT_SERVICES.cards;
  const why = c.whyChoose || DEFAULT_SERVICES.whyChoose;
  const review = reviews[currentReview];

  return (
    <>
      <PageHero
        eyebrow="Stay & celebrate"
        title={c.hero?.title || DEFAULT_SERVICES.hero.title}
        intro={c.hero?.subtitle || DEFAULT_SERVICES.hero.subtitle}
        image="/assets/BRTN GRDN-6.JPEG"
      />

      {/* Apartments */}
      {apartments.length > 0 && (
        <section className="section-y bg-ivory">
          <div className="container-luxe">
            <div className="mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <SectionHeading eyebrow="Apartments" title="Choose your apartment" intro="Live rates and availability. Pick your dates on the next step." />
              <FadeIn direction="up" delay={0.2}>
                <LuxeButton href="/book" variant="garden" arrow>Check availability</LuxeButton>
              </FadeIn>
            </div>
            <div className="grid gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
              {apartments.map((apt, i) => <ApartmentCard key={apt.id} apartment={apt} index={i % 3} />)}
            </div>
          </div>
        </section>
      )}

      {/* Services: alternating editorial rows */}
      <section className="section-y bg-sand/50">
        <div className="container-luxe">
          <SectionHeading eyebrow="What we offer" title="More than a place to sleep" className="mb-20 md:mb-28" />
          <div className="space-y-24 md:space-y-36">
            {services.map((service, index) => {
              const isBooking = /apartment|booking/i.test(service.title);
              const isEvent = /event/i.test(service.title);
              return (
                <div key={index} className="grid items-center gap-10 md:grid-cols-2 md:gap-20">
                  <Parallax speed={0.08} className={`relative aspect-[4/3] rounded-[2rem] ${index % 2 ? 'md:order-2' : ''}`}>
                    <Image src={service.image || SERVICE_IMAGES[index % SERVICE_IMAGES.length]} alt={service.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                  </Parallax>
                  <div>
                    <FadeIn direction="up">
                      <p className="font-display text-7xl text-brass/40">{String(index + 1).padStart(2, '0')}</p>
                      <h3 className="font-display mt-2 text-4xl text-garden md:text-5xl">{service.title}</h3>
                      <p className="mt-6 text-lg leading-relaxed text-ink/65">{service.description}</p>
                    </FadeIn>
                    <StaggerContainer staggerDelay={0.08} className="mt-8 space-y-3">
                      {(service.features || []).map((feature, idx) => (
                        <StaggerItem key={idx} className="flex items-center gap-3 text-ink/75">
                          <Check size={16} className="text-brass" /> {feature}
                        </StaggerItem>
                      ))}
                    </StaggerContainer>
                    {/* Card titles are editable in admin, so match on the wording rather than position. */}
                    {(isBooking || isEvent) && (
                      <FadeIn direction="up" delay={0.2} className="mt-10">
                        {isBooking && <LuxeButton href="/book" arrow>Check availability</LuxeButton>}
                        {isEvent && <LuxeButton variant="garden" arrow onClick={() => setEventModalOpen(true)}>Enquire about an event</LuxeButton>}
                      </FadeIn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="section-y bg-garden text-ivory">
        <div className="container-luxe grid items-center gap-16 lg:grid-cols-2">
          <div>
            <SectionHeading light eyebrow="The details" title={why.heading} />
            <StaggerContainer staggerDelay={0.12} className="mt-14 divide-y divide-ivory/10 border-y border-ivory/10">
              {(why.items || []).map((item, idx) => (
                <StaggerItem key={idx} className="grid grid-cols-[auto_1fr] gap-6 py-7">
                  <span className="font-display text-2xl text-brass">{String(idx + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-display text-2xl">{item.title}</h3>
                    <p className="mt-2 text-ivory/65">{item.description}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
          <Parallax speed={0.1} className="relative aspect-[4/5] rounded-[2rem]">
            <Image src="/assets/BRTN GRDN-27.JPG" alt="Bruton Gardens apartments" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </Parallax>
        </div>
      </section>

      {/* Google reviews */}
      {review && (
        <section className="section-y bg-ivory text-center">
          <div className="container-luxe">
            <SectionHeading eyebrow="Guest words" title={c.reviews?.heading || DEFAULT_SERVICES.reviews.heading} align="center" />
            {googleRating?.value && (
              <p className="mt-6 text-sm text-ink/55">{googleRating.value.toFixed(1)} out of 5 from {googleRating.total} reviews on Google</p>
            )}
            <div className="relative mx-auto mt-14 min-h-[16rem] max-w-4xl">
              <AnimatePresence mode="wait">
                <motion.figure
                  key={currentReview}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.8, ease: EASE_LUXE }}
                >
                  <div className="mb-8 flex justify-center gap-1 text-brass">
                    {Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                  </div>
                  <blockquote className="font-display text-3xl leading-snug text-garden md:text-4xl">&ldquo;{review.text}&rdquo;</blockquote>
                  <figcaption className="mt-8 flex items-center justify-center gap-3 text-sm text-ink/55">
                    {review.photo && <img src={review.photo} alt="" referrerPolicy="no-referrer" className="size-8 rounded-full" />}
                    {review.name} · {review.time}
                  </figcaption>
                </motion.figure>
              </AnimatePresence>
            </div>
            {reviews.length > 1 && (
              <div className="mt-10 flex justify-center gap-2">
                {reviews.map((_, i) => (
                  <button key={i} onClick={() => setCurrentReview(i)} aria-label={`Review ${i + 1}`} className={`h-1 rounded-full transition-all duration-500 ${i === currentReview ? 'w-10 bg-brass' : 'w-4 bg-garden/20'}`} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <EventEnquiryModal isOpen={eventModalOpen} onClose={() => setEventModalOpen(false)} />
    </>
  );
}
