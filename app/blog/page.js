'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import {
  MapPin,
  Bed,
  Bath,
  Maximize,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Download,
} from 'lucide-react';

const Gallery = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Spaces');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const galleryCategories = [
    'All Spaces',
    'Garden Views',
    'Garden Paths',
    'Garden Corners',
    'Garden Landscapes',
  ];

  const allGalleryImages = [
    // BRTN GRDN Garden Images
    {
      id: 1,
      title: 'Beautiful Garden Entrance',
      description:
        'Stunning garden entrance with lush greenery and well-maintained pathways.',
      image: '/assets/BRTN GRDN-1.JPEG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Garden Entrance • Lush Greenery',
      featured: true,
    },
    {
      id: 2,
      title: 'Bruton Living Room',
      description:
        'Spacious and bright living area with contemporary furnishings and city views.',
      image: '/assets/BRTN GRDN-12 2.JPEG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Contemporary Furnishings • City Views',
    },
    {
      id: 3,
      title: 'Spacious Kitchen',
      description:
        'Fully equipped modern kitchen with stainless steel appliances and granite countertops.',
      image: '/assets/BRTN GRDN-14.JPG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Full Kitchen • Dining Area',
    },
    {
      id: 4,
      title: 'Perfect Washroom',
      description: 'Wonderful Washroom with rain shower and bathtub',
      image: '/assets/BRTN GRDN-17 2.JPG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Rain Shower • Bathtub',
    },
    {
      id: 5,
      title: 'Furnished Kitchen',
      description:
        'Fully equipped modern kitchen with stainless steel appliances and granite countertops.',
      image: '/assets/BRTN GRDN-18.JPG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Full Kitchen • Dining Area',
    },

    {
      id: 7,
      title: 'Bruton Bedroom',
      description:
        'Elegant bedroom with king-size bed, premium linens, and blackout curtains.',
      image: '/assets/BRTN GRDN-22.JPG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Private Oasis • Relaxation',
    },
    {
      id: 8,
      title: 'Bruton Event Center',
      description:
        'Secluded event center with comfortable lighting and natural beauty.',
      image: '/assets/BRTN GRDN-25 2.JPEG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Secluded • Comfortable Seating',
    },
    {
      id: 9,
      title: 'Garden Sanctuary',
      description:
        'Peaceful garden sanctuary with meditation areas and natural water features.',
      image: '/assets/BRTN GRDN-26.JPG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Meditation Areas • Water Features',
      featured: true,
    },
    {
      id: 10,
      title: 'Bruton at Night',
      description:
        'Beautiful garden at night with seasonal flowers and year-round beauty.',
      image: '/assets/BRTN GRDN-27 2.JPG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Night View • Seasonal Flowers',
    },
    {
      id: 11,
      title: 'Garden Vista',
      description:
        'Stunning garden vista with panoramic views of the entire garden space.',
      image: '/assets/BRTN GRDN-27.JPG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Panoramic Views • Elevated',
    },
    {
      id: 12,
      title: 'Garden Corner',
      description:
        'Intimate garden corner perfect for quiet moments and personal reflection.',
      image: '/assets/BRTN GRDN-3.JPEG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Intimate Space • Private',
    },
    {
      id: 13,
      title: 'Garden Path',
      description:
        'Charming garden path leading through beautiful landscaping and plant life.',
      image: '/assets/BRTN GRDN-6.JPEG',
      category: 'Garden Views',
      location: 'Bruton Garden',
      details: 'Walking Path • Landscaping',
    },
  ];

  const filteredImages = useMemo(() => {
    return allGalleryImages.filter((image) => {
      const matchesCategory =
        selectedCategory === 'All Spaces' ||
        image.category === selectedCategory;
      const matchesSearch =
        searchTerm === '' ||
        image.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.location.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const featuredImages = allGalleryImages.filter((image) => image.featured);

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    const nextIndex = (currentImageIndex + 1) % filteredImages.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(filteredImages[nextIndex]);
  };

  const prevImage = () => {
    const prevIndex =
      currentImageIndex === 0
        ? filteredImages.length - 1
        : currentImageIndex - 1;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(filteredImages[prevIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/BRTN GRDN-26.JPG"
            alt="Gallery Hero"
            fill
            className="object-cover brightness-30"
            priority
          />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1
            className="text-5xl md:text-7xl font-bold mb-6"
            data-aos="fade-down"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            Our Gallery
          </h1>
          <p
            className="text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed mb-8"
            data-aos="fade-up"
            data-aos-duration="1200"
            data-aos-easing="ease-in-out-back"
          >
            Discover the beauty of Bruton Garden through our stunning collection
            of garden views and landscapes
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
          {/* Search Bar */}
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

          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {galleryCategories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-lime-600 text-white shadow-lg'
                    : 'bg-white text-gray-600 hover:bg-lime-50 hover:text-lime-700 border border-gray-200'
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
      </div>

      {/* Featured Images Section */}
      {featuredImages.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2
            className="text-3xl font-bold text-gray-900 mb-8"
            data-aos="fade-right"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            Featured Spaces
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredImages.map((item, index) => (
              <Card
                key={item.id}
                className="overflow-hidden bg-white hover:shadow-xl transition-all duration-300 py-0 group cursor-pointer transform hover:-translate-y-2"
                data-aos="fade-up"
                data-aos-duration={`${1000 + index * 200}`}
                data-aos-easing="ease-in-out-back"
                onClick={() =>
                  openLightbox(
                    item,
                    allGalleryImages.findIndex((img) => img.id === item.id)
                  )
                }
              >
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    data-aos="zoom-in"
                    data-aos-duration="1200"
                    data-aos-easing="ease-in-out-back"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute top-4 left-4">
                    <span
                      className="bg-lime-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                      data-aos="fade-right"
                      data-aos-duration="1400"
                      data-aos-easing="ease-in-out-back"
                    >
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
                <div className="p-6">
                  <h3
                    className="text-xl font-semibold mb-2"
                    data-aos="fade-up"
                    data-aos-duration="1200"
                    data-aos-easing="ease-in-out-back"
                  >
                    {item.title}
                  </h3>
                  <p
                    className="text-gray-600 mb-3 text-sm"
                    data-aos="fade-up"
                    data-aos-duration="1300"
                    data-aos-easing="ease-in-out-back"
                  >
                    {item.description}
                  </p>
                  <div
                    className="flex items-center text-sm text-gray-500"
                    data-aos="fade-up"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
                    <Maximize className="w-4 h-4 mr-1" />
                    {item.details}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Main Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-3xl font-bold text-gray-900"
            data-aos="fade-right"
            data-aos-duration="1000"
            data-aos-easing="ease-in-out-back"
          >
            {selectedCategory === 'All Spaces'
              ? 'All Images'
              : selectedCategory}
          </h2>
          <div className="text-sm text-gray-500">
            Showing {filteredImages.length} of {allGalleryImages.length} images
          </div>
        </div>

        {/* Masonry Grid Layout */}
        <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
          {filteredImages.map((item, index) => (
            <Card
              key={item.id}
              className="break-inside-avoid overflow-hidden bg-white hover:shadow-xl transition-all duration-300 group cursor-pointer transform hover:-translate-y-1"
              data-aos="fade-up"
              data-aos-duration={`${1000 + index * 100}`}
              data-aos-easing="ease-in-out-back"
              onClick={() => openLightbox(item, index)}
            >
              <div className="relative overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  width={400}
                  height={300}
                  className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-500"
                  data-aos="zoom-in"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 left-4">
                  <span
                    className="bg-lime-600 text-white px-3 py-1 rounded-full text-sm font-medium"
                    data-aos="fade-right"
                    data-aos-duration="1400"
                    data-aos-easing="ease-in-out-back"
                  >
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
                <h3
                  className="text-lg font-semibold mb-2"
                  data-aos="fade-up"
                  data-aos-duration="1200"
                  data-aos-easing="ease-in-out-back"
                >
                  {item.title}
                </h3>
                <p
                  className="text-gray-600 mb-3 text-sm line-clamp-2"
                  data-aos="fade-up"
                  data-aos-duration="1300"
                  data-aos-easing="ease-in-out-back"
                >
                  {item.description}
                </p>
                <div
                  className="flex items-center text-sm text-gray-500"
                  data-aos="fade-up"
                  data-aos-duration="1400"
                  data-aos-easing="ease-in-out-back"
                >
                  <Maximize className="w-4 h-4 mr-1" />
                  {item.details}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results Message */}
        {filteredImages.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No images found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative max-w-7xl max-h-[90vh] mx-4">
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Navigation Buttons */}
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

            {/* Image */}
            <div className="relative">
              <Image
                src={selectedImage.image}
                alt={selectedImage.title}
                width={1200}
                height={800}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />

              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2">
                    {selectedImage.title}
                  </h3>
                  <p className="text-gray-200 mb-3">
                    {selectedImage.description}
                  </p>
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

            {/* Image Counter */}
            <div className="absolute bottom-4 left-4 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 text-white text-sm">
              {currentImageIndex + 1} of {filteredImages.length}
            </div>

            {/* Action Buttons */}
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
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div
        className="bg-gray-900 text-white py-20 mt-20"
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
            Love Our Garden?
          </h2>
          <p
            className="text-xl mb-8 max-w-2xl mx-auto"
            data-aos="fade-up"
            data-aos-duration="1300"
            data-aos-easing="ease-in-out-back"
          >
            Experience the beauty of Bruton Garden firsthand. Book your stay and
            immerse yourself in nature's tranquility.
          </p>
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            data-aos="fade-up"
            data-aos-duration="1400"
            data-aos-easing="ease-in-out-back"
          >
            <button className="bg-lime-600 text-white px-8 py-3 rounded-full hover:bg-lime-700 transition-colors">
              Check Availability
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white/10 transition-colors">
              Schedule a Tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Gallery;
