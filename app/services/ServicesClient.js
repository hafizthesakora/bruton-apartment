'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  Home,
  Shield,
  CreditCard,
  Building2,
  Star,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, motion, AnimatePresence } from '../_Components/MotionWrapper';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const CARD_ICONS = [Home, Building2, CreditCard, Shield];

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

const fallbackReviews = [
  { name: 'Sani Abatcha', text: 'Perfect apartment for my 2-week business trip. Clean, comfortable, and great location!', rating: 5, time: '2 months ago' },
  { name: 'Gilbert Mwai', text: 'Amazing experience! The apartment felt like home. Will definitely book again.', rating: 5, time: '3 months ago' },
  { name: 'Samson Wanyoike', text: 'Great for extended stays. Fast WiFi, comfortable workspace, and responsive host!', rating: 5, time: '1 month ago' },
  { name: 'Ama Owusu', text: 'The event center was stunning for our wedding reception. Everything was handled beautifully by the team.', rating: 5, time: '3 weeks ago' },
  { name: 'Kwame Mensah', text: 'Loved the restaurant! Authentic Ghanaian dishes with a modern twist. The jollof was exceptional.', rating: 5, time: '1 month ago' },
  { name: 'Linda Addo', text: 'Stayed for a week and felt completely at home. The daily housekeeping and Starlink WiFi made all the difference.', rating: 5, time: '2 weeks ago' },
];

export default function ServicesClient({ initialData }) {
  const [googleReviews, setGoogleReviews] = useState(null);
  const [googleRating, setGoogleRating] = useState(null);
  const [totalReviews, setTotalReviews] = useState(null);
  const [c] = useState(initialData && Object.keys(initialData).length ? { ...DEFAULT_SERVICES, ...initialData } : DEFAULT_SERVICES);
  const [currentReview, setCurrentReview] = useState(0);

  useEffect(() => {
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        if (data.reviews && data.reviews.length > 0) {
          setGoogleReviews(data.reviews);
          setGoogleRating(data.rating);
          setTotalReviews(data.totalReviews);
        }
      })
      .catch(() => {});
  }, []);

  const reviews = googleReviews || fallbackReviews;

  useEffect(() => {
    if (reviews.length <= 3) return;
    const timer = setInterval(() => {
      setCurrentReview((prev) => (prev + 1) % reviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  const services = (c.cards || DEFAULT_SERVICES.cards).map((card, i) => ({
    ...card,
    icon: CARD_ICONS[i] || Home,
  }));

  const getVisibleReviews = () => {
    const visible = [];
    for (let i = 0; i < 3; i++) {
      visible.push(reviews[(currentReview + i) % reviews.length]);
    }
    return visible;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-14">
      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/BRTN GRDN-6.JPEG"
            alt="Services Hero"
            fill
            className="object-cover brightness-30"
            priority
          />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <FadeIn direction="down">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {c.hero?.title || DEFAULT_SERVICES.hero.title}
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              {c.hero?.subtitle || DEFAULT_SERVICES.hero.subtitle}
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <StaggerItem key={index}>
              <Card className="p-6 bg-white hover:shadow-xl transition-shadow duration-300">
                <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-lime-600" />
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-gray-600">
                      <Star className="w-4 h-4 text-lime-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-28 my-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <FadeIn direction="right">
                <h2 className="text-4xl font-bold text-gray-900 pb-6">
                  {c.whyChoose?.heading || DEFAULT_SERVICES.whyChoose.heading}
                </h2>
              </FadeIn>
              <StaggerContainer staggerDelay={0.12} className="space-y-4">
                {(c.whyChoose?.items || DEFAULT_SERVICES.whyChoose.items).map((item, idx) => (
                  <StaggerItem key={idx}>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-lime-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                        <p className="text-gray-600">{item.description}</p>
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
            <FadeIn direction="left" delay={0.2}>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/assets/BRTN GRDN-27.JPG"
                  alt="Services Feature"
                  fill
                  className="object-cover"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Google Reviews Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mb-32">
        <FadeIn direction="up">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {c.reviews?.heading || DEFAULT_SERVICES.reviews.heading}
            </h2>
            {googleRating && (
              <div className="flex items-center justify-center gap-3">
                <GoogleIcon />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${i < Math.round(googleRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold">{googleRating}</span>
                <span className="text-gray-500">({totalReviews} reviews on Google)</span>
              </div>
            )}
          </div>
        </FadeIn>
        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentReview}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -60 }}
              transition={{ duration: 0.4 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {getVisibleReviews().map((review, index) => (
                <Card key={index} className="p-6 bg-white hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center mb-4">
                    {review.photo ? (
                      <img
                        src={review.photo}
                        alt={review.name}
                        className="w-12 h-12 rounded-full object-cover mr-4"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-lime-100 flex items-center justify-center mr-4">
                        <span className="text-lime-600 font-bold text-lg">
                          {review.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">{review.name}</h3>
                      <p className="text-gray-400 text-sm">{review.time}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 line-clamp-4">&ldquo;{review.text}&rdquo;</p>
                </Card>
              ))}
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentReview(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === currentReview ? 'bg-lime-400 w-5' : 'bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
        {googleReviews && (
          <FadeIn direction="up" delay={0.3}>
            <p className="text-center text-gray-400 text-sm mt-6 flex items-center justify-center gap-2">
              <GoogleIcon /> Reviews sourced from Google
            </p>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
