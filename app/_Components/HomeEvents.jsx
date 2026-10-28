'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { motion, AnimatePresence, ImageReveal, FadeIn, EASE_LUXE } from './MotionWrapper';
import SectionHeading from './ui/SectionHeading';
import LuxeButton from './ui/LuxeButton';
import EventEnquiryModal from './EventEnquiryModal';

// Event Center teaser, then guest reviews from Google (only when /api/reviews returns some).
export default function HomeEvents() {
  const [eventOpen, setEventOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(null);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch('/api/reviews')
      .then((r) => r.json())
      .then((data) => {
        const good = (data?.reviews || []).filter((r) => r.rating >= 4 && r.text);
        setReviews(good);
        if (data?.rating) setRating({ value: data.rating, total: data.totalReviews });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reviews.length < 2) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % reviews.length), 7000);
    return () => clearInterval(t);
  }, [reviews.length]);

  const review = reviews[current];

  return (
    <section className="section-y bg-ivory">
      <div className="container-luxe grid items-center gap-16 lg:grid-cols-12">
        <ImageReveal className="relative aspect-[5/4] rounded-[2rem] lg:col-span-7" from="left">
          <Image src="/assets/hall.JPEG" alt="The Event Center at Bruton Gardens" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
        </ImageReveal>
        <div className="lg:col-span-4 lg:col-start-9">
          <SectionHeading
            eyebrow="Event Center"
            title="Celebrate in the garden"
            intro="Weddings, birthdays, corporate retreats: our elegant hall and grounds host gatherings of every size, with catering available."
          />
          <FadeIn direction="up" delay={0.2} className="mt-10 flex flex-wrap gap-3">
            <LuxeButton variant="garden" arrow onClick={() => setEventOpen(true)}>Plan an event</LuxeButton>
            <LuxeButton href="/services" variant="outline" className="text-garden">Learn more</LuxeButton>
          </FadeIn>
        </div>
      </div>

      {review && (
        <div className="container-luxe mt-32 text-center md:mt-44">
          <FadeIn direction="up">
            <p className="eyebrow mb-10 flex items-center justify-center gap-3 text-brass">
              <span className="h-px w-8 bg-current" />
              Guest words
              {rating && <span className="text-ink/50">· {rating.value.toFixed(1)} on Google ({rating.total})</span>}
            </p>
          </FadeIn>
          <div className="relative mx-auto min-h-[16rem] max-w-4xl">
            <AnimatePresence mode="wait">
              <motion.figure
                key={current}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.8, ease: EASE_LUXE }}
              >
                <div className="mb-8 flex justify-center gap-1 text-brass">
                  {Array.from({ length: review.rating }).map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                </div>
                <blockquote className="font-display text-3xl leading-snug text-garden md:text-5xl">
                  &ldquo;{review.text.length > 260 ? `${review.text.slice(0, 260).trim()}…` : review.text}&rdquo;
                </blockquote>
                <figcaption className="mt-8 text-sm tracking-wide text-ink/55">{review.name} · {review.time}</figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>
          {reviews.length > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {reviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Review ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-10 bg-brass' : 'w-4 bg-garden/20'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <EventEnquiryModal isOpen={eventOpen} onClose={() => setEventOpen(false)} />
    </section>
  );
}
