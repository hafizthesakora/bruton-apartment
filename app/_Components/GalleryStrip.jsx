'use client';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import SectionHeading from './ui/SectionHeading';
import LuxeButton from './ui/LuxeButton';

const DEFAULT_IMAGES = [
  { id: '1', src: '/assets/BRTN GRDN-1.JPEG', alt: 'Bruton Gardens' },
  { id: '2', src: '/assets/BRTN GRDN-22.JPG', alt: 'Bruton Gardens' },
  { id: '3', src: '/assets/BRTN GRDN-26.JPG', alt: 'Bruton Gardens' },
  { id: '4', src: '/assets/BRTN GRDN-6.JPEG', alt: 'Bruton Gardens' },
  { id: '5', src: '/assets/BRTN GRDN-27.JPG', alt: 'Bruton Gardens' },
  { id: '6', src: '/assets/BRTN GRDN-10.JPEG', alt: 'Bedroom and lounge' },
  { id: '7', src: '/assets/brut2.jpg', alt: 'Banquet in the hall' },
];

// Vertical scroll drives a horizontal photo strip (pinned while it plays).
export default function GalleryStrip() {
  const [images, setImages] = useState(DEFAULT_IMAGES);
  const ref = useRef(null);
  const track = useRef(null);
  const [distance, setDistance] = useState(0);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  // Slide exactly far enough for the last photo to end at the right edge.
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);

  useLayoutEffect(() => {
    const measure = () => {
      if (track.current) setDistance(Math.max(0, track.current.scrollWidth - window.innerWidth + 40));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [images]);

  useEffect(() => {
    fetch('/api/carousel?name=home-services')
      .then((r) => r.json())
      .then((data) => { if (data?.images?.length) setImages(data.images); })
      .catch(() => {});
  }, []);

  const strip = images.map((img, i) => (
    <figure
      key={img.id ?? i}
      className={`relative shrink-0 overflow-hidden rounded-[1.5rem] md:rounded-[2rem] ${i % 2 ? 'h-[38vh] w-[70vw] md:h-[46vh] md:w-[34vw]' : 'h-[48vh] w-[80vw] md:h-[60vh] md:w-[40vw]'}`}
    >
      <Image src={img.src} alt={img.alt || 'Bruton Gardens'} fill sizes="(min-width: 768px) 40vw, 80vw" className="object-cover transition-transform duration-[1.4s] hover:scale-105" />
    </figure>
  ));

  return (
    <section ref={ref} className={`relative bg-ivory ${reduce ? '' : 'h-[260vh] md:h-[300vh]'}`}>
      <div className={`${reduce ? '' : 'sticky top-0 h-screen'} flex flex-col justify-center overflow-hidden py-24`}>
        <div className="container-luxe mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="Gallery" title="A closer look" />
          <LuxeButton href="/blog" variant="outline" className="text-garden" arrow>View the gallery</LuxeButton>
        </div>
        {reduce ? (
          <div className="flex gap-6 overflow-x-auto px-5 md:px-10">{strip}</div>
        ) : (
          <motion.div ref={track} style={{ x }} className="flex w-max items-center gap-4 pl-5 md:gap-6 md:pl-10">{strip}</motion.div>
        )}
      </div>
    </section>
  );
}
