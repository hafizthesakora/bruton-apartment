'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import {
  Wifi,
  ParkingCircle,
  Lock,
  Coffee,
  AirVent,
  Utensils,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, ScaleIn } from '../_Components/MotionWrapper';
import BookingModal from '../_Components/BookingModal';
import ContactModal from '../_Components/ContactModal';

const Facilities = () => {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const router = useRouter();
  const facilities = [
    {
      category: 'Essential Amenities',
      items: [
        {
          icon: Wifi,
          title: 'Ultrafast WiFi by Starlink',
          description:
            'Blazing fast internet powered by Starlink, perfect for work and streaming',
          isImage: false,
        },
        {
          icon: ParkingCircle,
          title: 'Free Parking',
          description: 'Complimentary parking space for all guests',
          isImage: false,
        },
        {
          icon: Lock,
          title: 'Secure Access',
          description: '24/7 security with keyless entry and CCTV monitoring',
          isImage: false,
        },
        {
          icon: Coffee,
          title: 'Café Corner',
          description: 'Coffee maker and refreshment area',
          isImage: false,
        },
      ],
    },
    {
      category: 'In-Apartment Features',
      items: [
        {
          icon: '/assets/kitchen.png',
          title: 'Fully Equipped Kitchen',
          description:
            'Complete kitchen with cookware, utensils, and appliances',
          isImage: true,
        },
        {
          icon: '/assets/Laundry.png',
          title: 'Washer & Dryer',
          description: 'In-unit laundry for your convenience',
          isImage: true,
        },
        {
          icon: AirVent,
          title: 'Climate Control',
          description: 'Individual air conditioning in every room',
          isImage: false,
        },
        {
          icon: Utensils,
          title: 'Dining Space',
          description: 'Comfortable dining area for meals and work',
          isImage: false,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-14">
      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/facilities.JPEG"
            alt="Facilities Hero"
            fill
            className="object-cover brightness-30"
            priority
          />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <FadeIn direction="down">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Our Facilities
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed">
              Everything you need for a comfortable short stay, all in one place
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Facilities Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {facilities.map((category, index) => (
          <div key={index} className="mb-20">
            <FadeIn direction="right">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                {category.category}
              </h2>
            </FadeIn>
            <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.items.map((item, idx) => (
                <StaggerItem key={idx}>
                  <ScaleIn delay={0.05 * idx}>
                    <Card className="p-6 bg-white hover:shadow-xl transition-shadow duration-300">
                      <div className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4">
                        {item.isImage ? (
                          <Image
                            src={item.icon}
                            alt={item.title}
                            width={24}
                            height={24}
                            className="w-6 h-6"
                          />
                        ) : (
                          <item.icon className="w-6 h-6 text-lime-600" />
                        )}
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {item.title}
                      </h3>
                      <p className="text-gray-600">
                        {item.description}
                      </p>
                    </Card>
                  </ScaleIn>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        ))}
      </div>

      {/* Virtual Tour Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <FadeIn direction="right">
                <h2 className="text-4xl font-bold text-gray-900">
                  Explore Our Apartments
                </h2>
              </FadeIn>
              <FadeIn direction="right" delay={0.1}>
                <p className="text-xl text-gray-600">
                  Take a virtual tour of our fully furnished apartments and see
                  all the amenities included in your stay. Get a real feel for
                  your home away from home.
                </p>
              </FadeIn>
              <FadeIn direction="right" delay={0.2}>
                <div className="flex gap-4">
                  <button onClick={() => router.push('/blog')} className="bg-lime-600 text-white px-8 py-3 rounded-full hover:bg-lime-700 transition-colors">
                    Start Tour
                  </button>
                  <button onClick={() => setBookingOpen(true)} className="border-2 border-lime-600 text-lime-600 px-8 py-3 rounded-full hover:bg-lime-50 transition-colors">
                    Book Now
                  </button>
                </div>
              </FadeIn>
            </div>
            <FadeIn direction="left" delay={0.15}>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/assets/BRTN GRDN-22.JPG"
                  alt="Bruton Gardens Apartment"
                  fill
                  className="object-cover"
                />
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <FadeIn direction="up">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            What Makes Us Special
          </h2>
        </FadeIn>
        <StaggerContainer staggerDelay={0.12} className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
          {[
            {
              title: 'Daily Housekeeping',
              description:
                'Professional daily cleaning service to keep your apartment fresh and spotless throughout your stay.',
            },
            {
              title: '24-Hour Check-In',
              description:
                'Dedicated staff available around the clock to welcome you and ensure a smooth check-in at any hour.',
            },
            {
              title: 'CCTV & Trained Security',
              description:
                'Comprehensive CCTV monitoring and highly trained security staff to ensure your safety at all times.',
            },
            {
              title: 'Tour Options',
              description:
                'Explore the country with our curated tour packages. We connect you with trusted tour operators for unforgettable experiences.',
            },
            {
              title: 'Car Rental Service',
              description:
                'Optional car rental service available for guests who want the freedom to explore at their own pace.',
            },
          ].map((feature, index) => (
            <StaggerItem key={index}>
              <div className="text-center p-8 bg-white rounded-2xl shadow-lg border-2 border-gray-200">
                <h3 className="text-2xl font-semibold mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-20 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn direction="up">
            <h2 className="text-4xl font-bold mb-6">
              Ready for Your Stay?
            </h2>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Book your apartment today and enjoy all our premium facilities
              during your short stay.
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <div className="flex gap-4 justify-center">
              <button onClick={() => setBookingOpen(true)} className="bg-lime-600 text-white px-8 py-3 rounded-full hover:bg-lime-700 transition-colors">
                Check Availability
              </button>
              <button onClick={() => setContactOpen(true)} className="border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white/10 transition-colors">
                Contact Us
              </button>
            </div>
          </FadeIn>
        </div>
      </div>

      <BookingModal isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
      <ContactModal isOpen={contactOpen} onClose={() => setContactOpen(false)} />
    </div>
  );
};

export default Facilities;
