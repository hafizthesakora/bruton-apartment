import React from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, User, ArrowRight } from "lucide-react";

const Blog = () => {


  const featuredPosts = [
    {
      id: 1,
      title: "Top 10 Tips for Finding Your Perfect Rental Home",
      excerpt:
        "Discover essential tips and strategies to help you find the ideal rental property that meets all your needs and preferences.",
      image: "/assets/main.jpg",
      category: "Rental Tips",
      date: "March 15, 2024",
      readTime: "5 min read",
      author: "Sarah Johnson",
    },
    {
      id: 2,
      title: "Understanding Rental Agreements: A Complete Guide",
      excerpt:
        "Learn everything you need to know about rental agreements, from key terms to your rights and responsibilities as a tenant.",
      image: "/assets/ab1.png",
      category: "Legal Guide",
      date: "March 12, 2024",
      readTime: "7 min read",
      author: "Michael Chen",
    },
    {
      id: 3,
      title: "Decorating Your Rental: Making It Feel Like Home",
      excerpt:
        "Creative ideas and tips for personalizing your rental space while respecting the property's rules and regulations.",
      image: "/assets/ab2.jpg",
      category: "Interior Design",
      date: "March 10, 2024",
      readTime: "6 min read",
      author: "Emily Rodriguez",
    },
  ];

  const categories = [
    "All Posts",
    "Rental Tips",
    "Legal Guide",
    "Interior Design",
    "Property Management",
    "Market Trends",
  ];

  const recentPosts = [
    {
      id: 4,
      title: "The Future of Smart Homes in Rental Properties",
      excerpt:
        "Explore how smart home technology is transforming the rental industry and improving tenant experiences.",
      image: "/assets/ab3.jpg",
      category: "Technology",
      date: "March 8, 2024",
      readTime: "4 min read",
      author: "David Kim",
    },
    {
      id: 5,
      title: "Budget-Friendly Ways to Upgrade Your Rental Kitchen",
      excerpt:
        "Simple and affordable tips to enhance your rental kitchen without making permanent changes.",
      image: "/assets/main-home.jpg",
      category: "Interior Design",
      date: "March 5, 2024",
      readTime: "5 min read",
      author: "Lisa Wang",
    },
    {
      id: 6,
      title: "Understanding Your Rights as a Tenant",
      excerpt:
        "A comprehensive guide to tenant rights and how to protect yourself in various rental situations.",
      image: "/assets/next-door22.webp",
      category: "Legal Guide",
      date: "March 3, 2024",
      readTime: "6 min read",
      author: "James Wilson",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/main.jpg"
            alt="Blog Hero"
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
            Our Blog
          </h1>
          <p 
            className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed"
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            Insights, tips, and guides to help you make informed decisions about
            your rental journey
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div 
          className="flex flex-wrap gap-4 justify-center"
          data-aos="fade-up"
          data-aos-duration="1000"
          data-aos-easing="ease-in-out-back"
        >
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                index === 0
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
              data-aos="fade-up"
              data-aos-duration={`${1200 + index * 100}`}
              data-aos-easing="ease-in-out-back"
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 
          className="text-3xl font-bold text-gray-900 mb-8"
          data-aos="fade-right"
          data-aos-duration="1000"
          data-aos-easing="ease-in-out-back"
        >
          Featured Posts
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPosts.map((post, index) => (
            <Card
              key={post.id}
              className="overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300 py-0"
              data-aos="fade-up"
              data-aos-duration={`${1000 + index * 200}`}
              data-aos-easing="ease-in-out-back"
            >
              <div className="relative h-48">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  data-aos="zoom-in"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                />
                <div className="absolute top-4 left-4">
                  <span 
                    className="bg-primary text-white px-3 py-1 rounded-full text-sm"
                    data-aos="fade-right"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 
                  className="text-xl font-semibold mb-3"
                  data-aos="fade-up"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                >
                  {post.title}
                </h3>
                <p 
                  className="text-gray-600 mb-4"
                  data-aos="fade-up"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  {post.excerpt}
                </p>
                <div 
                  className="flex items-center justify-between text-sm text-gray-500"
                  data-aos="fade-up"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                </div>
                <button 
                  className="mt-4 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  data-aos="fade-up"
                  data-aos-duration="1500"
                  data-aos-easing="ease-in-out-back"
                >
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 
          className="text-3xl font-bold text-gray-900 mb-8"
          data-aos="fade-right"
          data-aos-duration="1000"
          data-aos-easing="ease-in-out-back"
        >
          Recent Posts
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {recentPosts.map((post, index) => (
            <Card
              key={post.id}
              className="overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300 py-0"
              data-aos="fade-up"
              data-aos-duration={`${1000 + index * 200}`}
              data-aos-easing="ease-in-out-back"
            >
              <div className="relative h-48">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className="object-cover"
                  data-aos="zoom-in"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                />
                <div className="absolute top-4 left-4">
                  <span 
                    className="bg-primary text-white px-3 py-1 rounded-full text-sm"
                    data-aos="fade-right"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 
                  className="text-xl font-semibold mb-3"
                  data-aos="fade-up"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                >
                  {post.title}
                </h3>
                <p 
                  className="text-gray-600 mb-4"
                  data-aos="fade-up"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  {post.excerpt}
                </p>
                <div 
                  className="flex items-center justify-between text-sm text-gray-500"
                  data-aos="fade-up"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                </div>
                <button 
                  className="mt-4 flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  data-aos="fade-up"
                  data-aos-duration="1500"
                  data-aos-easing="ease-in-out-back"
                >
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Newsletter Section */}
      <div 
        className="bg-gray-900 text-white py-20 mb-40 mt-20"
        data-aos="fade-up"
        data-aos-duration="1000"
        data-aos-easing="ease-in-out-back"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 
            className="text-4xl font-bold mb-6"
            data-aos="fade-down"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            Stay Updated
          </h2>
          <p 
            className="text-xl mb-8 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-duration="1300"
            data-aos-easing="ease-in-out-back"
          >
            Subscribe to our newsletter for the latest rental tips, market
            insights, and exclusive offers.
          </p>
          <div 
            className="flex gap-4 justify-center max-w-md mx-auto"
            data-aos="fade-up"
            data-aos-duration="1400"
            data-aos-easing="ease-in-out-back"
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-3 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-white border-white border-2 focus:border-0"
            />
            <button className="bg-white text-primary px-8 py-3 rounded-full hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blog; 