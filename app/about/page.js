import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  Building2,
  Users,
  Calendar,
  MapPin,
  Home,
  Heart,
  Shield,
  Star,
} from 'lucide-react';

const AboutUs = () => {
  const teamMembers = [
    {
      name: 'Mr. Bruton',
      role: 'Founder & Owner',
      image: '/assets/IMG_1195 2.JPEG',
      bio: 'Passionate about providing exceptional hospitality and comfortable stays',
    },
    {
      name: 'Property Manager',
      role: 'Operations Head',
      image: '/assets/IMG_1195 2.JPEG',
      bio: 'Ensuring every guest enjoys a seamless and memorable experience',
    },
    {
      name: 'Guest Relations',
      role: 'Customer Service',
      image: '/assets/IMG_1195 2.JPEG',
      bio: 'Dedicated to making your stay comfortable and stress-free',
    },
  ];

  const stats = [
    { icon: Users, value: '500+', label: 'Happy Guests' },
    { icon: Calendar, value: '5+', label: 'Years Experience' },
    { icon: MapPin, value: 'Prime', label: 'Location' },
    { icon: Star, value: '4.8/5', label: 'Guest Rating' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white ">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden p-5">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/BRTN GRDN-1.JPEG"
            alt="Hero Background"
            fill
            className="object-cover brightness-30"
            priority
          />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1
            className="text-3xl md:text-6xl font-bold mb-6"
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            About <span className="text-lime-400">Bruton Gardens</span>
          </h1>
          <p
            className="text-md md:text-2xl max-w-3xl mx-auto leading-relaxed"
            data-aos="fade-down"
            data-aos-duration="1400"
            data-aos-easing="ease-in-out-back"
          >
            A short stay apartment offering exceptional comfort, modern
            amenities, and warm hospitality in the heart of the city.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 -mt-20 relative z-10">
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          data-aos="fade-down"
          data-aos-duration="1200"
          data-aos-easing="ease-in-out-back"
        >
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="p-6 text-center bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300"
            >
              <stat.icon className="w-12 h-12 mx-auto mb-2 text-lime-400" />
              <h3 className="text-3xl font-bold">{stat.value}</h3>
              <p className="text-gray-600">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Our Story Section */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-40">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2
              className="text-4xl md:text-5xl font-semibold text-gray-900"
              data-aos="fade-right"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out-back"
            >
              Our Story
            </h2>
            <div className="space-y-4">
              <p
                className="text-gray-600 text-lg leading-relaxed"
                data-aos="fade-right"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                Bruton Gardens Apartment was established with a vision to
                provide travelers and visitors with a home away from home. What
                started as a family initiative has grown into a trusted short
                stay destination.
              </p>
              <p
                className="text-gray-600 text-lg leading-relaxed"
                data-aos="fade-right"
                data-aos-duration="1300"
                data-aos-easing="ease-in-out-back"
              >
                Our commitment to excellence, attention to detail, and genuine
                hospitality ensures that every guest enjoys a comfortable,
                memorable stay. Whether you're visiting for business or leisure,
                we treat you like family.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                className="bg-lime-400 text-gray-900 px-6 py-3 rounded-full hover:bg-lime-500 transition-colors font-semibold"
                data-aos="fade-right"
                data-aos-duration="1400"
                data-aos-easing="ease-in-out-back"
              >
                Book Now
              </button>
              <button
                className="border-2 border-lime-400 text-lime-600 px-6 py-3 rounded-full hover:bg-lime-50 transition-colors font-semibold"
                data-aos="fade-right"
                data-aos-duration="1600"
                data-aos-easing="ease-in-out-back"
              >
                Contact Us
              </button>
            </div>
          </div>
          <div
            className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl"
            data-aos="fade-left"
            data-aos-duration="1400"
            data-aos-easing="ease-in-out-back"
          >
            <Image
              src="/assets/BRTN GRDN-6.JPEG"
              alt="Company Story"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="bg-gray-50 px-3 py-32 mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-4xl md:text-5xl font-semibold text-center text-gray-900 mb-12"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            Meet Our <span className="text-lime-400">Team</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8 pt-10">
            {teamMembers.map((member, index) => (
              <Card
                key={index}
                className="p-6 text-center bg-white hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="rounded-full object-cover"
                    data-aos="zoom-in"
                    data-aos-duration="1200"
                    data-aos-easing="ease-in-out-back"
                  />
                </div>
                <h3
                  className="text-xl font-semibold text-gray-900 mb-2"
                  data-aos="fade-up"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  {member.name}
                </h3>
                <p
                  className="text-lime-500 font-medium mb-3"
                  data-aos="fade-down"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  {member.role}
                </p>
                <p
                  className="text-gray-600"
                  data-aos="fade-up"
                  data-aos-duration="1500"
                  data-aos-easing="ease-in-out-back"
                >
                  {member.bio}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
