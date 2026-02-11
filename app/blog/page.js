'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  Maximize,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Download,
  Clock,
  ArrowRight,
  User,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, motion, AnimatePresence } from '../_Components/MotionWrapper';

// ── Blog Posts Data ──────────────────────────────────────────────────────────

const blogPosts = [
  {
    id: 1,
    title: 'Why Bruton Gardens is the Perfect Short-Stay Destination in Accra',
    excerpt: 'Discover what makes Bruton Gardens Apartment the top choice for business travelers, tourists, and families looking for a premium short-stay experience in the heart of Accra.',
    image: '/assets/BRTN GRDN-26.JPG',
    category: 'Lifestyle',
    author: 'Bruton Gardens',
    date: 'January 15, 2026',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'A Guide to Our Fully Furnished Apartments',
    excerpt: 'Take a tour of our beautifully furnished apartments featuring modern amenities, premium bedding, fully equipped kitchens, and stunning views of the surrounding gardens.',
    image: '/assets/BRTN GRDN-22.JPG',
    category: 'Apartments',
    author: 'Bruton Gardens',
    date: 'January 28, 2026',
    readTime: '4 min read',
  },
  {
    id: 3,
    title: 'Host Your Next Event at Bruton Gardens Event Center',
    excerpt: 'Our elegant event center is perfect for corporate meetings, birthday celebrations, and intimate gatherings. Learn about our event packages and what we offer.',
    image: '/assets/BRTN GRDN-25 2.JPEG',
    category: 'Events',
    author: 'Bruton Gardens',
    date: 'February 5, 2026',
    readTime: '3 min read',
  },
  {
    id: 4,
    title: 'Exploring the Gardens: Nature Meets Modern Living',
    excerpt: 'Our lush gardens offer a peaceful retreat from the bustling city. From morning walks to evening relaxation, discover the green spaces that make Bruton Gardens special.',
    image: '/assets/BRTN GRDN-27.JPG',
    category: 'Lifestyle',
    author: 'Bruton Gardens',
    date: 'February 8, 2026',
    readTime: '4 min read',
  },
];

// ── Gallery Data ─────────────────────────────────────────────────────────────

const galleryCategories = [
  'All Spaces',
  'Apartments',
  'Gardens',
  'Event Center',
  'Amenities',
];

const allGalleryImages = [
  {
    id: 1,
    title: 'Beautiful Garden Entrance',
    description: 'Stunning garden entrance with lush greenery and well-maintained pathways.',
    image: '/assets/BRTN GRDN-1.JPEG',
    category: 'Gardens',
    location: 'Bruton Garden',
    details: 'Garden Entrance \u2022 Lush Greenery',
    featured: true,
  },
  {
    id: 2,
    title: 'Bruton Living Room',
    description: 'Spacious and bright living area with contemporary furnishings and city views.',
    image: '/assets/BRTN GRDN-12 2.JPEG',
    category: 'Apartments',
    location: 'Bruton Garden',
    details: 'Contemporary Furnishings \u2022 City Views',
  },
  {
    id: 3,
    title: 'Spacious Kitchen',
    description: 'Fully equipped modern kitchen with stainless steel appliances and granite countertops.',
    image: '/assets/BRTN GRDN-14.JPG',
    category: 'Apartments',
    location: 'Bruton Garden',
    details: 'Full Kitchen \u2022 Dining Area',
  },
  {
    id: 4,
    title: 'Perfect Washroom',
    description: 'Wonderful washroom with rain shower and bathtub.',
    image: '/assets/BRTN GRDN-17 2.JPG',
    category: 'Apartments',
    location: 'Bruton Garden',
    details: 'Rain Shower \u2022 Bathtub',
  },
  {
    id: 5,
    title: 'Furnished Kitchen',
    description: 'Fully equipped modern kitchen with stainless steel appliances and granite countertops.',
    image: '/assets/BRTN GRDN-18.JPG',
    category: 'Apartments',
    location: 'Bruton Garden',
    details: 'Full Kitchen \u2022 Dining Area',
  },
  {
    id: 6,
    title: 'Bruton Bedroom',
    description: 'Elegant bedroom with king-size bed, premium linens, and blackout curtains.',
    image: '/assets/BRTN GRDN-22.JPG',
    category: 'Apartments',
    location: 'Bruton Garden',
    details: 'Private Oasis \u2022 Relaxation',
  },
  {
    id: 7,
    title: 'Bruton Event Center',
    description: 'Secluded event center with comfortable lighting and natural beauty.',
    image: '/assets/BRTN GRDN-25 2.JPEG',
    category: 'Event Center',
    location: 'Bruton Garden',
    details: 'Secluded \u2022 Comfortable Seating',
  },
  {
    id: 8,
    title: 'Garden Sanctuary',
    description: 'Peaceful garden sanctuary with meditation areas and natural water features.',
    image: '/assets/BRTN GRDN-26.JPG',
    category: 'Gardens',
    location: 'Bruton Garden',
    details: 'Meditation Areas \u2022 Water Features',
    featured: true,
  },
  {
    id: 9,
    title: 'Bruton at Night',
    description: 'Beautiful garden at night with seasonal flowers and year-round beauty.',
    image: '/assets/BRTN GRDN-27 2.JPG',
    category: 'Gardens',
    location: 'Bruton Garden',
    details: 'Night View \u2022 Seasonal Flowers',
  },
  {
    id: 10,
    title: 'Garden Vista',
    description: 'Stunning garden vista with panoramic views of the entire garden space.',
    image: '/assets/BRTN GRDN-27.JPG',
    category: 'Gardens',
    location: 'Bruton Garden',
    details: 'Panoramic Views \u2022 Elevated',
  },
  {
    id: 11,
    title: 'Garden Corner',
    description: 'Intimate garden corner perfect for quiet moments and personal reflection.',
    image: '/assets/BRTN GRDN-3.JPEG',
    category: 'Gardens',
    location: 'Bruton Garden',
    details: 'Intimate Space \u2022 Private',
  },
  {
    id: 12,
    title: 'Garden Path',
    description: 'Charming garden path leading through beautiful landscaping and plant life.',
    image: '/assets/BRTN GRDN-6.JPEG',
    category: 'Gardens',
    location: 'Bruton Garden',
    details: 'Walking Path \u2022 Landscaping',
  },
];

// ── Blog Post Card ───────────────────────────────────────────────────────────

const BlogPostCard = ({ post }) => (
  <Card className="overflow-hidden bg-white hover:shadow-xl transition-all duration-300 py-0 group cursor-pointer transform hover:-translate-y-2">
    <div className="relative h-56 overflow-hidden">
      <Image
        src={post.image}
        alt={post.title}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-500"
      />
      <div className="absolute top-4 left-4">
        <span className="bg-lime-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          {post.category}
        </span>
      </div>
    </div>
    <div className="p-6">
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {post.author}
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {post.readTime}
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2 group-hover:text-lime-600 transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="text-gray-600 text-sm line-clamp-3 mb-4">
        {post.excerpt}
      </p>
      <div className="flex items-center text-lime-600 text-sm font-medium group-hover:gap-2 transition-all">
        Read More <ArrowRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  </Card>
);

// ── Main Page Component ──────────────────────────────────────────────────────

const BlogAndGallery = () => {
  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedCategory, setSelectedCategory] = useState('All Spaces');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async () => {
    if (!subscribeEmail) return;
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Newsletter Subscriber',
          email: subscribeEmail,
          phone: '',
          country: '',
          message: `New newsletter subscription from: ${subscribeEmail}`,
        }),
      });
    } catch {
      // Silent — still show subscribed
    }
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setSubscribeEmail('');
    }, 3000);
  };

  const filteredImages = useMemo(() => {
    return allGalleryImages.filter((image) => {
      const matchesCategory =
        selectedCategory === 'All Spaces' || image.category === selectedCategory;
      const matchesSearch =
        searchTerm === '' ||
        image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const closeLightbox = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const nextImage = useCallback(() => {
    const nextIndex = (currentImageIndex + 1) % filteredImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(filteredImages[nextIndex]);
  }, [currentImageIndex, filteredImages]);

  const prevImage = useCallback(() => {
    const prevIndex =
      currentImageIndex === 0 ? filteredImages.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(filteredImages[prevIndex]);
  }, [currentImageIndex, filteredImages]);

  useEffect(() => {
    if (!selectedImage) return;
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowRight': nextImage(); break;
        case 'ArrowLeft': prevImage(); break;
        case 'Escape': closeLightbox(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, nextImage, prevImage, closeLightbox]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pt-14">
      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/BRTN GRDN-26.JPG"
            alt="Gallery & Blog Hero"
            fill
            className="object-cover brightness-30"
            priority
          />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <FadeIn direction="down">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Gallery & Blog
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.15}>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-8">
              Stay updated with our latest news and explore the beauty of Bruton Gardens
            </p>
          </FadeIn>

          {/* Tab Toggle */}
          <FadeIn direction="up" delay={0.25}>
            <div className="inline-flex bg-white/20 backdrop-blur-sm rounded-full p-1">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-lime-500 text-white shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setActiveTab('blog')}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'blog'
                    ? 'bg-lime-500 text-white shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Blog Posts
              </button>
            </div>
          </FadeIn>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'blog' ? (
          <motion.div
            key="blog"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Blog Posts Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <FadeIn direction="up">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Latest Posts</h2>
                <p className="text-gray-500 mb-10">News, tips, and updates from Bruton Gardens</p>
              </FadeIn>

              <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                {blogPosts.map((post) => (
                  <StaggerItem key={post.id}>
                    <BlogPostCard post={post} />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>

            {/* Newsletter CTA */}
            <div className="bg-gray-50 py-16">
              <div className="max-w-3xl mx-auto px-4 text-center">
                <FadeIn direction="up">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay in the Loop</h2>
                  <p className="text-gray-500 mb-8">
                    Subscribe to our newsletter for the latest updates, offers, and stories from Bruton Gardens.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-500"
                    />
                    <button
                      onClick={handleSubscribe}
                      disabled={!subscribeEmail || subscribed}
                      className="bg-lime-600 text-white px-8 py-3 rounded-full hover:bg-lime-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {subscribed ? 'Subscribed!' : 'Subscribe'}
                    </button>
                  </div>
                </FadeIn>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Search and Filter Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {galleryCategories.map((category, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                        selectedCategory === category
                          ? 'bg-lime-600 text-white shadow-lg'
                          : 'bg-white text-gray-600 hover:bg-lime-50 hover:text-lime-700 border border-gray-200'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {category}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex items-center justify-between mb-8">
                <FadeIn direction="right">
                  <h2 className="text-3xl font-bold text-gray-900">
                    {selectedCategory === 'All Spaces' ? 'All Images' : selectedCategory}
                  </h2>
                </FadeIn>
                <div className="text-sm text-gray-500">
                  Showing {filteredImages.length} of {allGalleryImages.length} images
                </div>
              </div>

              <motion.div
                className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6"
                layout
              >
                <AnimatePresence>
                  {filteredImages.map((item, index) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card
                        className="break-inside-avoid overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group cursor-pointer transform hover:-translate-y-1"
                        onClick={() => openLightbox(item, index)}
                      >
                        <div className="relative overflow-hidden">
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={400}
                            height={300}
                            className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-4 left-4">
                            <span className="bg-lime-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                              {item.category}
                            </span>
                          </div>
                          <div className="absolute bottom-4 left-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4" />
                              {item.location}
                            </div>
                          </div>
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                              <Maximize className="w-4 h-4 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                          <p className="text-gray-600 mb-3 text-sm line-clamp-2">{item.description}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Maximize className="w-4 h-4 mr-1" />
                            {item.details}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {filteredImages.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-gray-400 mb-4">
                    <Search className="w-16 h-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No images found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative max-w-7xl max-h-[90vh] mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {filteredImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-white" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </>
              )}

              <div className="relative">
                <Image
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  width={1200}
                  height={800}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                  <div className="text-white">
                    <h3 className="text-2xl font-bold mb-2">{selectedImage.title}</h3>
                    <p className="text-gray-200 mb-3">{selectedImage.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {selectedImage.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Maximize className="w-4 h-4" />
                        {selectedImage.details}
                      </div>
                      <span className="bg-lime-600 px-3 py-1 rounded-full text-xs">
                        {selectedImage.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
                {currentImageIndex + 1} of {filteredImages.length}
              </div>

              <div className="absolute bottom-4 right-4 flex gap-2">
                <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                  <Heart className="w-5 h-5 text-white" />
                </button>
                <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                  <Share2 className="w-5 h-5 text-white" />
                </button>
                <button className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors">
                  <Download className="w-5 h-5 text-white" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA Section */}
      <FadeIn direction="up">
        <div className="bg-gray-900 text-white py-20 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <FadeIn direction="down">
              <h2 className="text-4xl font-bold mb-6">Love Our Space?</h2>
            </FadeIn>
            <FadeIn direction="up" delay={0.1}>
              <p className="text-xl mb-8 max-w-2xl mx-auto">
                Experience the beauty of Bruton Gardens & Apartments firsthand. Book your stay and
                immerse yourself in luxury and tranquility.
              </p>
            </FadeIn>
            <FadeIn direction="up" delay={0.2}>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/services"
                  className="bg-lime-600 text-white px-8 py-3 rounded-full hover:bg-lime-700 transition-colors"
                >
                  Check Availability
                </Link>
                <Link
                  href="/facilities"
                  className="border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white/10 transition-colors"
                >
                  View Facilities
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </FadeIn>
    </div>
  );
};

export default BlogAndGallery;
