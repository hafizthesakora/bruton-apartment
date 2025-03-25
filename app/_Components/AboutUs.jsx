import React from "react";
import Image from "next/image";
import { Building2, Users, Award, Home } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="container mx-auto py-16">
      {/* Hero Section */}
      <div className="flex items-center justify-between gap-10 mb-20">
        <div className="flex-1">
          <h1 className="text-5xl font-bold mb-6">About Our Company</h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            We are dedicated to providing exceptional real estate services with a focus on customer satisfaction and professional excellence. Our team of experts is committed to helping you find the perfect property that meets your needs and exceeds your expectations.
          </p>
        </div>
        <div className="flex-1">
          <Image
            src="/assets/about-hero.jpg"
            alt="About Us Hero"
            width={600}
            height={400}
            className="rounded-2xl shadow-xl"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-4 gap-8 mb-20">
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-3xl font-bold mb-2">500+</h3>
          <p className="text-gray-600">Properties Listed</p>
        </div>
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-3xl font-bold mb-2">1000+</h3>
          <p className="text-gray-600">Happy Clients</p>
        </div>
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <Award className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-3xl font-bold mb-2">15+</h3>
          <p className="text-gray-600">Years Experience</p>
        </div>
        <div className="text-center p-6 bg-white rounded-xl shadow-lg">
          <Home className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h3 className="text-3xl font-bold mb-2">50+</h3>
          <p className="text-gray-600">Cities Covered</p>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="grid grid-cols-2 gap-10 mb-20">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-600">
            To provide exceptional real estate services that help our clients make informed decisions about their property investments, while maintaining the highest standards of professionalism and integrity.
          </p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
          <p className="text-gray-600">
            To be the leading real estate company known for innovation, customer satisfaction, and sustainable growth in the property market.
          </p>
        </div>
      </div>

      {/* Team Section */}
      <div className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">Our Team</h2>
        <div className="grid grid-cols-4 gap-8">
          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
              <Image
                src="/assets/team1.jpg"
                alt="Team Member 1"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold">John Doe</h3>
            <p className="text-gray-600">CEO & Founder</p>
          </div>
          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
              <Image
                src="/assets/team2.jpg"
                alt="Team Member 2"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold">Jane Smith</h3>
            <p className="text-gray-600">Property Manager</p>
          </div>
          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
              <Image
                src="/assets/team3.jpg"
                alt="Team Member 3"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold">Mike Johnson</h3>
            <p className="text-gray-600">Sales Director</p>
          </div>
          <div className="text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
              <Image
                src="/assets/team4.jpg"
                alt="Team Member 4"
                fill
                className="rounded-full object-cover"
              />
            </div>
            <h3 className="text-xl font-semibold">Sarah Williams</h3>
            <p className="text-gray-600">Marketing Head</p>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="bg-gray-50 p-12 rounded-2xl">
        <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Integrity</h3>
            <p className="text-gray-600">
              We maintain the highest standards of honesty and transparency in all our dealings.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Excellence</h3>
            <p className="text-gray-600">
              We strive for excellence in every aspect of our service delivery.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">Innovation</h3>
            <p className="text-gray-600">
              We continuously innovate to provide better solutions for our clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs; 