import React from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Wifi,
  ParkingCircle,
  Lock,
  Building,
  Tv,
  Coffee,
  AirVent,
  Utensils,
} from "lucide-react";

const Facilities = () => {
  const facilities = [
    {
      category: "Basic Amenities",
      items: [
        {
          icon: Wifi,
          title: "High-Speed WiFi",
          description:
            "24/7 high-speed internet access throughout the property",
          isImage: false,
        },
        {
          icon: ParkingCircle,
          title: "Parking Space",
          description: "Dedicated parking spots for residents and guests",
          isImage: false,
        },
        {
          icon: Lock,
          title: "24/7 Security",
          description: "Round-the-clock security with CCTV surveillance",
          isImage: false,
        },
        {
          icon: Building,
          title: "Elevator Access",
          description: "Modern elevators for easy building access",
          isImage: false,
        },
      ],
    },
    {
      category: "Recreational Facilities",
      items: [
        {
          icon: "/assets/swimgpool.png",
          title: "Swimming Pool",
          description: "Infinity pool with panoramic city views",
          isImage: true,
        },
        {
          icon: "/assets/gym.png",
          title: "Fitness Center",
          description: "Fully equipped gym with modern equipment",
          isImage: true,
        },
        {
          icon: Tv,
          title: "Entertainment Room",
          description: "Common area with large TV and gaming consoles",
          isImage: false,
        },
        {
          icon: Coffee,
          title: "Café Lounge",
          description: "Cozy café area for social gatherings",
          isImage: false,
        },
      ],
    },
    {
      category: "Home Comforts",
      items: [
        {
          icon: "/assets/kitchen.png",
          title: "Modern Kitchen",
          description: "Fully equipped kitchen with premium appliances",
          isImage: true,
        },
        {
          icon: "/assets/Laundry.png",
          title: "Laundry Room",
          description: "In-unit laundry facilities",
          isImage: true,
        },
        {
          icon: AirVent,
          title: "Air Conditioning",
          description: "Central air conditioning system",
          isImage: false,
        },
        {
          icon: Utensils,
          title: "Dining Area",
          description: "Spacious dining area for family gatherings",
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
            src="/assets/facilities.png"
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
            Discover the premium amenities and features that make our properties
            stand out
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
                    className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4"
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
                      <item.icon className="w-6 h-6 text-primary" />
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
                Take a Virtual Tour
              </h2>
              <p
                className="text-xl text-gray-600"
                data-aos="fade-right"
                data-aos-duration="1200"
                data-aos-easing="ease-in-out-back"
              >
                Experience our facilities firsthand with our interactive virtual
                tour. Explore every corner of our properties and discover the
                premium amenities we offer.
              </p>
              <div className="flex gap-4">
                <button
                  className="bg-primary text-white px-8 py-3 rounded-full hover:bg-primary/90 transition-colors"
                  data-aos="fade-right"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  Start Tour
                </button>
                <button
                  className="border-2 border-primary text-primary px-8 py-3 rounded-full hover:bg-primary/10 transition-colors"
                  data-aos="fade-right"
                  data-aos-duration="1700"
                  data-aos-easing="ease-in-out-back"
                >
                  Schedule Visit
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
                src="/assets/facilities1.jpg"
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
          Additional Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
            <h3
              className="text-2xl font-semibold mb-4"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              Pet Friendly
            </h3>
            <p
              className="text-gray-600"
              data-aos="fade-left"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            >
              We welcome your furry friends with dedicated pet areas and
              amenities.
            </p>
          </div>
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
            <h3
              className="text-2xl font-semibold mb-4"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              Green Spaces
            </h3>
            <p
              className="text-gray-600"
              data-aos="fade-left"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            >
              Beautifully landscaped gardens and outdoor seating areas for
              relaxation.
            </p>
          </div>
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
            <h3
              className="text-2xl font-semibold mb-4"
              data-aos="fade-right"
              data-aos-duration="1200"
              data-aos-easing="ease-in-out-back"
            >
              Community Events
            </h3>
            <p
              className="text-gray-600"
              data-aos="fade-left"
              data-aos-duration="1400"
              data-aos-easing="ease-in-out-back"
            >
              Regular social events and activities to foster community spirit.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-900 text-white py-20 mb-40 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2
            className="text-4xl font-bold mb-6"
            data-aos="fade-up"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            Experience Our Premium Facilities
          </h2>
          <p
            className="text-xl mb-8 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            Book a viewing today and discover why our properties are the perfect
            place to call home.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              className="bg-white text-primary px-8 py-3 rounded-full hover:bg-gray-100 transition-colors"
              data-aos="fade-right"
              data-aos-duration="1300"
              data-aos-easing="ease-in-out-back"
            >
              Book Viewing
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
