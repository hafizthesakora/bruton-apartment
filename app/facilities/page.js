import React from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  Wifi,
  ParkingCircle,
  Lock,
  Building,
  Tv,
  Coffee,
  AirVent,
  Utensils,
} from 'lucide-react';

const Facilities = () => {
  const facilities = [
    {
      category: 'Essential Amenities',
      items: [
        {
          icon: Wifi,
          title: 'High-Speed WiFi',
          description:
            'Fast and reliable internet access perfect for work and streaming',
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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
          <h1
            className="text-5xl md:text-6xl font-bold mb-6"
            data-aos="fade-down"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            Our Facilities
          </h1>
          <p
            className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            Everything you need for a comfortable short stay, all in one place
          </p>
        </div>
      </div>

      {/* Facilities Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {facilities.map((category, index) => (
          <div key={index} className="mb-20">
            <h2
              className="text-3xl font-bold text-gray-900 mb-8"
              data-aos="fade-right"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out-back"
            >
              {category.category}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.items.map((item, idx) => (
                <Card
                  key={idx}
                  className="p-6 bg-white hover:shadow-xl transition-shadow duration-300"
                  data-aos="zoom-in"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                >
                  <div
                    className="w-12 h-12 bg-lime-100 rounded-lg flex items-center justify-center mb-4"
                    data-aos="fade-up"
                    data-aos-duration="1300"
                    data-aos-easing="ease-in-out-back"
                  >
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
                  <h3
                    className="text-xl font-semibold mb-2"
                    data-aos="fade-down"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-gray-600"
                    data-aos="fade-left"
                    data-aos-duration="1500"
                    data-aos-easing="ease-in-out-back"
                  >
                    {item.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Virtual Tour Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2
                className="text-4xl font-bold text-gray-900"
                data-aos="fade-right"
                data-aos-duration="1000"
                data-aos-easing="ease-in-out-back"
              >
                Explore Our Apartments
              </h2>
              <p
                className="text-xl text-gray-600"
                data-aos="fade-right"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                Take a virtual tour of our fully furnished apartments and see
                all the amenities included in your stay. Get a real feel for
                your home away from home.
              </p>
              <div className="flex gap-4">
                <button
                  className="bg-lime-600 text-white px-8 py-3 rounded-full hover:bg-lime-700 transition-colors"
                  data-aos="fade-right"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  Start Tour
                </button>
                <button
                  className="border-2 border-lime-600 text-lime-600 px-8 py-3 rounded-full hover:bg-lime-50 transition-colors"
                  data-aos="fade-right"
                  data-aos-duration="1700"
                  data-aos-easing="ease-in-out-back"
                >
                  Book Now
                </button>
              </div>
            </div>
            <div
              className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl"
              data-aos="fade-left"
              data-aos-duration="1000"
              data-aos-easing="ease-in-out-back"
            >
              <Image
                src="/assets/BRTN GRDN-26.JPG"
                alt="Virtual Tour Preview"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28">
        <h2
          className="text-4xl font-bold text-center text-gray-900 mb-12"
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-easing="ease-in-out-back"
        >
          What Makes Us Special
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
            <h3
              className="text-2xl font-semibold mb-4"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              Flexible Check-In
            </h3>
            <p
              className="text-gray-600"
              data-aos="fade-left"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            >
              Self check-in available 24/7 with our smart lock system for your
              convenience.
            </p>
          </div>
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
            <h3
              className="text-2xl font-semibold mb-4"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              Weekly Housekeeping
            </h3>
            <p
              className="text-gray-600"
              data-aos="fade-left"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            >
              Professional cleaning service included for stays longer than a
              week.
            </p>
          </div>
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
            <h3
              className="text-2xl font-semibold mb-4"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              Local Support
            </h3>
            <p
              className="text-gray-600"
              data-aos="fade-left"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            >
              On-site management team ready to assist with recommendations and
              support.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-20 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-4xl font-bold mb-6"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            Ready for Your Stay?
          </h2>
          <p
            className="text-xl mb-8 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            Book your apartment today and enjoy all our premium facilities
            during your short stay.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              className="bg-lime-600 text-white px-8 py-3 rounded-full hover:bg-lime-700 transition-colors"
              data-aos="fade-right"
              data-aos-duration="1300"
              data-aos-easing="ease-in-out-back"
            >
              Check Availability
            </button>
            <button
              className="border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
              data-aos="fade-left"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Facilities;
