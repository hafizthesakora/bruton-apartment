'use client';
import { useEffect, useRef, useState } from 'react';
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
  { id: '6', src: '/assets/BRTN GRDN-13.JPG', alt: 'Bruton Gardens' },
];

// Vertical scroll drives a horizontal photo strip (pinned while it plays).
export default function GalleryStrip() {
  const [images, setImages] = useState(DEFAULT_IMAGES);
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-65%']);

  useEffect(() => {
    fetch('/api/carousel?name=home-services')
      .then((r) => r.json())
      .then((data) => { if (data?.images?.length) setImages(data.images); })
      .catch(() => {});
  }, []);

  const strip = images.map((img, i) => (
    <figure
      key={img.id ?? i}
      className={`relative shrink-0 overflow-hidden rounded-[2rem] ${i % 2 ? 'h-[46vh] w-[70vw] md:w-[34vw]' : 'h-[60vh] w-[80vw] md:w-[40vw]'}`}
    >
      <Image src={img.src} alt={img.alt || 'Bruton Gardens'} fill sizes="(min-width: 768px) 40vw, 80vw" className="object-cover transition-transform duration-[1.4s] hover:scale-105" />
    </figure>
  ));

  return (
    <section ref={ref} className={`relative bg-ivory ${reduce ? '' : 'h-[300vh]'}`}>
      <div className={`${reduce ? '' : 'sticky top-0 h-screen'} flex flex-col justify-center overflow-hidden py-24`}>
        <div className="container-luxe mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading eyebrow="Gallery" title="A closer look" />
          <LuxeButton href="/blog" variant="outline" className="text-garden" arrow>View the gallery</LuxeButton>
        </div>
        {reduce ? (
          <div className="flex gap-6 overflow-x-auto px-5 md:px-10">{strip}</div>
        ) : (
          <motion.div style={{ x }} className="flex items-center gap-6 pl-5 md:pl-10">{strip}</motion.div>
        )}
      </div>
    </section>
  );
}
