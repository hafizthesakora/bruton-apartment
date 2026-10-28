'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem, Parallax, motion, AnimatePresence, EASE_LUXE } from '../_Components/MotionWrapper';
import PageHero from '../_Components/ui/PageHero';
import SectionHeading from '../_Components/ui/SectionHeading';
import LuxeButton from '../_Components/ui/LuxeButton';

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
  { id: 1, title: 'Beautiful Garden Entrance', description: 'Stunning garden entrance with lush greenery and well-maintained pathways.', image: '/assets/BRTN GRDN-1.JPEG', category: 'Gardens', location: 'Bruton Garden', details: 'Garden Entrance \u2022 Lush Greenery', featured: true },
  { id: 2, title: 'Bruton Living Room', description: 'Spacious and bright living area with contemporary furnishings and city views.', image: '/assets/BRTN GRDN-12 2.JPEG', category: 'Apartments', location: 'Bruton Garden', details: 'Contemporary Furnishings \u2022 City Views' },
  { id: 3, title: 'Spacious Kitchen', description: 'Fully equipped modern kitchen with stainless steel appliances and granite countertops.', image: '/assets/BRTN GRDN-14.JPG', category: 'Apartments', location: 'Bruton Garden', details: 'Full Kitchen \u2022 Dining Area' },
  { id: 4, title: 'Perfect Washroom', description: 'Wonderful washroom with rain shower and bathtub.', image: '/assets/BRTN GRDN-17 2.JPG', category: 'Apartments', location: 'Bruton Garden', details: 'Rain Shower \u2022 Bathtub' },
  { id: 5, title: 'Furnished Kitchen', description: 'Fully equipped modern kitchen with stainless steel appliances and granite countertops.', image: '/assets/BRTN GRDN-18.JPG', category: 'Apartments', location: 'Bruton Garden', details: 'Full Kitchen \u2022 Dining Area' },
  { id: 6, title: 'Bruton Bedroom', description: 'Elegant bedroom with king-size bed, premium linens, and blackout curtains.', image: '/assets/BRTN GRDN-22.JPG', category: 'Apartments', location: 'Bruton Garden', details: 'Private Oasis \u2022 Relaxation' },
  { id: 7, title: 'Bruton Event Center', description: 'Secluded event center with comfortable lighting and natural beauty.', image: '/assets/BRTN GRDN-25 2.JPEG', category: 'Event Center', location: 'Bruton Garden', details: 'Secluded \u2022 Comfortable Seating' },
  { id: 8, title: 'Garden Sanctuary', description: 'Peaceful garden sanctuary with meditation areas and natural water features.', image: '/assets/BRTN GRDN-26.JPG', category: 'Gardens', location: 'Bruton Garden', details: 'Meditation Areas \u2022 Water Features', featured: true },
  { id: 9, title: 'Bruton at Night', description: 'Beautiful garden at night with seasonal flowers and year-round beauty.', image: '/assets/BRTN GRDN-27 2.JPG', category: 'Gardens', location: 'Bruton Garden', details: 'Night View \u2022 Seasonal Flowers' },
  { id: 10, title: 'Garden Vista', description: 'Stunning garden vista with panoramic views of the entire garden space.', image: '/assets/BRTN GRDN-27.JPG', category: 'Gardens', location: 'Bruton Garden', details: 'Panoramic Views \u2022 Elevated' },
  { id: 11, title: 'Garden Corner', description: 'Intimate garden corner perfect for quiet moments and personal reflection.', image: '/assets/BRTN GRDN-3.JPEG', category: 'Gardens', location: 'Bruton Garden', details: 'Intimate Space \u2022 Private' },
  { id: 12, title: 'Garden Path', description: 'Charming garden path leading through beautiful landscaping and plant life.', image: '/assets/BRTN GRDN-6.JPEG', category: 'Gardens', location: 'Bruton Garden', details: 'Walking Path \u2022 Landscaping' },
];

// ── Blog Post Card ───────────────────────────────────────────────────────────

const BlogPostCard = ({ post, index }) => (
  <article className="group cursor-pointer">
    <div className="relative aspect-[16/11] overflow-hidden rounded-[2rem] bg-sand">
      <Image
        src={post.image}
        alt={post.title}
        fill
        sizes="(min-width: 768px) 50vw, 100vw"
        className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-110"
      />
      <span className="absolute left-5 top-5 rounded-full bg-ivory/90 px-4 py-1.5 text-xs tracking-wide text-garden backdrop-blur">
        {post.category}
      </span>
    </div>
    <div className="mt-6 flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-ink/45">
      <span>{post.date}</span>
      <span className="flex items-center gap-1"><Clock className="size-3" />{post.readTime}</span>
    </div>
    <h3 className="font-display mt-3 text-3xl leading-tight text-garden transition-colors group-hover:text-brass md:text-4xl">
      {post.title}
    </h3>
    <p className="mt-3 line-clamp-2 text-ink/60">{post.excerpt}</p>
    <span className="mt-5 inline-flex items-center gap-2 text-sm text-garden">
      Read more <ArrowUpRight className="size-4 transition-transform duration-500 group-hover:rotate-45" />
    </span>
  </article>
);

// ── Main Component ────────────────────────────────────────────────────────────

const DEFAULT_GALLERY = {
  hero: { title: 'Gallery & Blog', subtitle: 'Explore our spaces and stay up to date with the latest from Bruton Gardens' },
  blogCta: { heading: 'Love Our Space? Come Visit Bruton Gardens & Apartments', body: 'Experience the beauty of Bruton Gardens & Apartments firsthand. Book your stay and immerse yourself in luxury and tranquility.', button: 'Book Your Stay' },
};

export default function BlogClient({ initialData }) {
  const [activeTab, setActiveTab] = useState('gallery');
  const [selectedCategory, setSelectedCategory] = useState('All Spaces');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [gc] = useState(initialData && Object.keys(initialData).length ? { ...DEFAULT_GALLERY, ...initialData } : DEFAULT_GALLERY);

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

  const tabBtn = (tab, label) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`relative rounded-full px-6 py-2.5 text-sm tracking-wide transition-colors duration-500 ${activeTab === tab ? 'text-garden' : 'text-ivory/80 hover:text-ivory'}`}
    >
      {activeTab === tab && (
        <motion.span layoutId="blogTab" className="absolute inset-0 rounded-full bg-ivory" transition={{ duration: 0.6, ease: EASE_LUXE }} />
      )}
      <span className="relative">{label}</span>
    </button>
  );

  return (
    <>
      <PageHero
        eyebrow="Gallery & journal"
        title={gc.hero?.title || DEFAULT_GALLERY.hero.title}
        intro={gc.hero?.subtitle || DEFAULT_GALLERY.hero.subtitle}
        image="/assets/BRTN GRDN-26.JPG"
      >
        <FadeIn direction="up" delay={0.9} className="mt-10">
          <div className="inline-flex rounded-full border border-ivory/20 bg-garden/40 p-1 backdrop-blur-md">
            {tabBtn('gallery', 'Gallery')}
            {tabBtn('blog', 'Journal')}
          </div>
        </FadeIn>
      </PageHero>

      <AnimatePresence mode="wait">
        {activeTab === 'blog' ? (
          <motion.div
            key="blog"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: EASE_LUXE }}
          >
            <section className="section-y bg-ivory">
              <div className="container-luxe">
                <SectionHeading eyebrow="Journal" title="Latest from the garden" intro="News, tips, and updates from Bruton Gardens" className="mb-16 md:mb-20" />
                <StaggerContainer staggerDelay={0.1} className="grid gap-x-10 gap-y-16 md:grid-cols-2">
                  {blogPosts.map((post, i) => (
                    <StaggerItem key={post.id} className={i % 2 ? 'md:mt-24' : ''}>
                      <BlogPostCard post={post} index={i} />
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </section>

            {/* Newsletter */}
            <section className="bg-sand/50 py-24 md:py-32">
              <div className="container-luxe max-w-3xl text-center">
                <SectionHeading eyebrow="Newsletter" title="Stay in the loop" intro="Subscribe for the latest updates, offers, and stories from Bruton Gardens." align="center" />
                <FadeIn direction="up" delay={0.2}>
                  <div className="mx-auto mt-10 flex max-w-lg flex-col gap-3 rounded-full sm:flex-row sm:border sm:border-garden/15 sm:bg-ivory sm:p-1.5">
                    <input
                      type="email"
                      placeholder="Your email address"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      className="flex-1 rounded-full border border-garden/15 bg-ivory px-6 py-3 outline-none sm:border-0 sm:bg-transparent"
                    />
                    <LuxeButton variant="garden" onClick={handleSubscribe} disabled={!subscribeEmail || subscribed}>
                      {subscribed ? 'Subscribed' : 'Subscribe'}
                    </LuxeButton>
                  </div>
                </FadeIn>
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.6, ease: EASE_LUXE }}
          >
            <section className="bg-ivory pb-24 pt-16 md:pb-32">
              <div className="container-luxe">
                {/* Filters */}
                <div className="mb-12 flex flex-col gap-6 border-b border-garden/10 pb-8 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {galleryCategories.map((category) => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`rounded-full border px-5 py-2 text-sm tracking-wide transition-colors duration-500 ${
                          selectedCategory === category
                            ? 'border-garden bg-garden text-ivory'
                            : 'border-garden/15 text-garden hover:border-garden/40'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full lg:max-w-xs">
                    <Search className="absolute left-0 top-1/2 size-4 -translate-y-1/2 text-garden/50" />
                    <input
                      type="text"
                      placeholder="Search images"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border-b border-garden/20 bg-transparent py-3 pl-7 outline-none transition-colors focus:border-brass"
                    />
                  </div>
                </div>

                <p className="eyebrow mb-8 text-ink/45">
                  Showing {filteredImages.length} of {allGalleryImages.length}
                </p>

                {/* Masonry */}
                <motion.div className="columns-1 gap-6 sm:columns-2 lg:columns-3" layout>
                  <AnimatePresence>
                    {filteredImages.map((item, index) => (
                      <motion.button
                        type="button"
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.7, ease: EASE_LUXE, delay: (index % 6) * 0.05 }}
                        onClick={() => openLightbox(item, index)}
                        className="group relative mb-6 block w-full break-inside-avoid overflow-hidden rounded-[1.5rem] text-left"
                      >
                        <Image
                          src={item.image}
                          alt={item.title}
                          width={800}
                          height={600}
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="h-auto w-full object-cover transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-garden/80 via-garden/0 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                        <div className="absolute inset-x-0 bottom-0 translate-y-4 p-6 text-ivory opacity-0 transition-all duration-700 ease-[var(--ease-luxe)] group-hover:translate-y-0 group-hover:opacity-100">
                          <p className="eyebrow text-sand">{item.category}</p>
                          <h3 className="font-display mt-2 text-2xl">{item.title}</h3>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </motion.div>

                {filteredImages.length === 0 && (
                  <div className="py-24 text-center">
                    <p className="font-display text-3xl text-garden">No images found</p>
                    <p className="mt-2 text-ink/55">Try another category or search.</p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-garden/95 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLightbox}
          >
            <button onClick={closeLightbox} className="absolute right-6 top-6 z-10 flex size-12 items-center justify-center rounded-full border border-ivory/25 text-ivory hover:border-brass hover:text-brass" aria-label="Close">
              <X className="size-5" />
            </button>
            {filteredImages.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-4 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/25 text-ivory hover:border-brass hover:text-brass md:left-8" aria-label="Previous">
                  <ChevronLeft className="size-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-4 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-ivory/25 text-ivory hover:border-brass hover:text-brass md:right-8" aria-label="Next">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
            <AnimatePresence mode="wait">
              <motion.figure
                key={selectedImage.id}
                className="mx-4 max-w-6xl"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.5, ease: EASE_LUXE }}
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  width={1600}
                  height={1100}
                  sizes="90vw"
                  className="max-h-[72vh] w-auto rounded-[1.5rem] object-contain"
                />
                <figcaption className="mt-6 flex flex-col justify-between gap-3 text-ivory md:flex-row md:items-end">
                  <div>
                    <p className="eyebrow text-sand">{selectedImage.category} · {selectedImage.details}</p>
                    <h3 className="font-display mt-2 text-3xl md:text-4xl">{selectedImage.title}</h3>
                    <p className="mt-2 max-w-2xl text-ivory/65">{selectedImage.description}</p>
                  </div>
                  <span className="text-sm text-ivory/50">{currentImageIndex + 1} / {filteredImages.length}</span>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-garden text-ivory">
        <Parallax speed={0.15} className="absolute inset-0">
          <Image src="/assets/BRTN GRDN-1.JPEG" alt="" fill sizes="100vw" className="object-cover" />
        </Parallax>
        <div className="absolute inset-0 bg-garden/70" />
        <div className="container-luxe relative py-32 text-center md:py-44">
          <SectionHeading light title={gc.blogCta?.heading || DEFAULT_GALLERY.blogCta.heading} intro={gc.blogCta?.body || DEFAULT_GALLERY.blogCta.body} align="center" />
          <FadeIn direction="up" delay={0.2} className="mt-10 flex flex-wrap justify-center gap-3">
            <LuxeButton href="/book" size="lg" arrow>{gc.blogCta?.button || DEFAULT_GALLERY.blogCta.button}</LuxeButton>
            <LuxeButton href="/facilities" size="lg" variant="outline">View Facilities</LuxeButton>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
