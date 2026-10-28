'use client';
import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, Users, ArrowUpRight } from 'lucide-react';
import { ImageReveal } from '../MotionWrapper';
import { formatGHS } from '@/lib/money';

// Showcase card (see listShowcase in lib/apartments): tall photo that zooms on hover, price from.
export default function ApartmentCard({ apartment, index = 0 }) {
  const { slug, name, description, bedrooms, maxGuests, photo, fromRate } = apartment;
  return (
    <Link href={`/book?apartment=${encodeURIComponent(slug)}`} className="group block">
      <ImageReveal delay={index * 0.12} className="relative aspect-[4/5] rounded-[2rem] bg-sand">
        <Image
          src={photo?.url || '/assets/main-home1.jpg'}
          alt={photo?.alt || name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-[1.4s] ease-[var(--ease-luxe)] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-80 transition-opacity duration-700 group-hover:opacity-100" />
        {fromRate != null && (
          <span className="absolute left-5 top-5 rounded-full bg-ivory/90 px-4 py-2 text-xs font-medium tracking-wide text-garden backdrop-blur">
            From {formatGHS(fromRate).replace('.00', '')} / night
          </span>
        )}
        <span className="absolute bottom-5 right-5 flex size-12 items-center justify-center rounded-full bg-brass text-white transition-transform duration-700 ease-[var(--ease-luxe)] group-hover:rotate-45">
          <ArrowUpRight size={20} />
        </span>
      </ImageReveal>
      <div className="mt-6 flex items-start justify-between gap-6">
        <div>
          <h3 className="font-display text-3xl text-garden">{name}</h3>
          {description && <p className="mt-2 line-clamp-2 text-ink/60">{description}</p>}
        </div>
      </div>
      <div className="mt-4 flex gap-5 text-sm text-ink/60">
        <span className="flex items-center gap-2"><BedDouble size={16} className="text-brass" /> {bedrooms} {bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
        <span className="flex items-center gap-2"><Users size={16} className="text-brass" /> Up to {maxGuests}</span>
      </div>
    </Link>
  );
}
