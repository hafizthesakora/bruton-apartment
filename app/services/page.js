import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  Home,
  Search,
  Shield,
  CreditCard,
  Building2,
  Users,
  Star,
} from 'lucide-react';

const Services = () => {
  const services = [
    {
      icon: Home,
      title: 'Apartment Management',
      description:
        'Full-service apartment management for your short-stay experience, including housekeeping, maintenance, and guest support.',
      features: ['Daily Housekeeping', '24/7 Support', 'Maintenance Service'],
    },
    {
      icon: Search,
      title: 'Easy Booking',
      description:
        'Simple and quick booking process to find your perfect short-stay apartment with flexible dates.',
      features: ['Instant Booking', 'Virtual Tours', 'Flexible Dates'],
    },
    {
      icon: Shield,
      title: 'Guest Protection',
      description:
        'Comprehensive protection coverage for your peace of mind during your stay.',
      features: [
        'Security Deposit Protection',
        '24/7 Emergency Support',
        'Quick Resolution',
      ],
    },
    {
      icon: CreditCard,
      title: 'Secure Payments',
      description:
        'Safe and convenient payment options for your short-stay booking and additional services.',
      features: [
        'Secure Checkout',
        'Multiple Payment Methods',
        'Instant Confirmation',
      ],
    },
  ];

  const testimonials = [
    {
      name: 'Sani Abatcha',
      role: 'Business Traveler',
      image: '/assets/IMG_1195 2.JPEG',
      text: 'Perfect apartment for my 2-week business trip. Clean, comfortable, and great location!',
      rating: 5,
    },
    {
      name: 'Gilbert Mwai',
      role: 'Tourist',
      image: '/assets/IMG_1195 2.JPEG',
      text: 'Amazing experience! The apartment felt like home. Will definitely book again.',
      rating: 5,
    },
    {
      name: 'Samson Wanyoike',
      role: 'Digital Nomad',
      image: '/assets/IMG_1195 2.JPEG',
      text: 'Great for extended stays. Fast WiFi, comfortable workspace, and responsive host!',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
          <h1
            className="text-5xl md:text-6xl font-bold mb-6"
            data-aos="fade-down"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            Our Services
          </h1>
          <p
            className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            Everything you need for a comfortable short-stay experience in our
            fully furnished apartments
          </p>
        </div>
      </div>

      {/* Services Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Card
              key={index}
              className="p-6 bg-white hover:shadow-xl transition-shadow duration-300"
              data-aos="fade-down"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out-back"
            >
              <div
                className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4"
                data-aos="fade-right"
                data-aos-duration="1100"
                data-aos-easing="ease-in-out-back"
              >
                <service.icon className="w-6 h-6 text-lime-600" />
              </div>
              <h3
                className="text-xl font-semibold mb-3"
                data-aos="fade-up"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                {service.title}
              </h3>
              <p
                className="text-gray-600 mb-4"
                data-aos="fade-up"
                data-aos-duration="1300"
                data-aos-easing="ease-in-out-back"
              >
                {service.description}
              </p>
              <ul className="space-y-2">
                {service.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center text-gray-600"
                    data-aos="fade-left"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    <Star className="w-4 h-4 text-lime-600 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gray-50 py-28 my-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2
                className="text-4xl font-bold text-gray-900 pb-6"
                data-aos="fade-right"
                data-aos-duration="1000"
                data-aos-easing="ease-in-out-back"
              >
                Why Choose Our Apartments?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center flex-shrink-0"
                    data-aos="fade-right"
                    data-aos-duration="1100"
                    data-aos-easing="ease-in-out-back"
                  >
                    <Building2 className="w-6 h-6 text-lime-600" />
                  </div>
                  <div
                    data-aos="fade-left"
                    data-aos-duration="1200"
                    data-aos-easing="ease-in-out-back"
                  >
                    <h3 className="text-xl font-semibold mb-2">
                      Prime Locations
                    </h3>
                    <p className="text-gray-600">
                      Conveniently located apartments near business districts,
                      tourist attractions, and transport hubs
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center flex-shrink-0"
                    data-aos="fade-right"
                    data-aos-duration="1300"
                    data-aos-easing="ease-in-out-back"
                  >
                    <Users className="w-6 h-6 text-lime-600" />
                  </div>
                  <div
                    data-aos="fade-left"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    <h3 className="text-xl font-semibold mb-2">
                      Dedicated Guest Support
                    </h3>
                    <p className="text-gray-600">
                      Round-the-clock assistance to ensure your stay is
                      comfortable and hassle-free
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div
                    className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center flex-shrink-0"
                    data-aos="fade-right"
                    data-aos-duration="1500"
                    data-aos-easing="ease-in-out-back"
                  >
                    <Shield className="w-6 h-6 text-lime-600" />
                  </div>
                  <div
                    data-aos="fade-right"
                    data-aos-duration="1600"
                    data-aos-easing="ease-in-out-back"
                  >
                    <h3 className="text-xl font-semibold mb-2">
                      Safe & Secure
                    </h3>
                    <p className="text-gray-600">
                      Verified apartments with secure access and protected
                      payment processing
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div
              className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl"
              data-aos="fade-left"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              <Image
                src="/assets/BRTN GRDN-27.JPG"
                alt="Services Feature"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 mb-32">
        <h2
          className="text-4xl font-bold text-center text-gray-900 mb-12"
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-easing="ease-in-out-back"
        >
          What Our Guests Say
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="p-6 bg-white hover:shadow-xl transition-shadow duration-300"
              data-aos="fade-down"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              <div className="flex items-center mb-4">
                <div
                  className="relative w-12 h-12 rounded-full overflow-hidden mr-4"
                  data-aos="fade-left"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3
                    className="font-semibold"
                    data-aos="fade-right"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    {testimonial.name}
                  </h3>
                  <p
                    className="text-gray-600 text-sm"
                    data-aos="fade-right"
                    data-aos-duration="1300"
                    data-aos-easing="ease-in-out-back"
                  >
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <div className="flex mb-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <p
                className="text-gray-600"
                data-aos="fade-down"
                data-aos-duration="1500"
                data-aos-easing="ease-in-out-back"
              >
                {testimonial.text}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
