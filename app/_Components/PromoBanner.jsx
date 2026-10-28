'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';

export default function PromoBanner() {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 40));

  useEffect(() => {
    fetch('/api/content?page=promoBanner')
      .then(r => r.json())
      .then(data => { if (data?.enabled) setBanner(data); })
      .catch(() => {});
  }, []);

  const show = banner && !dismissed && !scrolled;
  // The old lime default predates the editorial palette; treat it as "not set".
  const legacy = banner?.bgColor?.toLowerCase() === '#a3e635';

  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          key="promo"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-50 overflow-hidden"
          style={legacy ? { backgroundColor: '#1F3B2D', color: '#F7F3EC' } : { backgroundColor: banner.bgColor || '#1F3B2D', color: banner.textColor || '#F7F3EC' }}
        >
          <div className="px-12 py-2 text-center text-xs tracking-[0.18em] uppercase">
            <span>{banner.text}</span>
            {banner.link && (
              <Link href={banner.link} className="ml-3 underline underline-offset-4 hover:opacity-75 transition-opacity">
                {banner.linkLabel || 'Learn more'}
              </Link>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
