'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

export default function PromoBanner() {
  const [banner, setBanner] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/content?page=promoBanner')
      .then(r => r.json())
      .then(data => { if (data?.enabled) setBanner(data); })
      .catch(() => {});
  }, []);

  if (!banner || dismissed) return null;

  return (
    <div
      className="relative z-50 text-center py-2.5 px-10 text-sm font-medium"
      style={{ backgroundColor: banner.bgColor || '#a3e635', color: banner.textColor || '#1e293b' }}
    >
      <span>{banner.text}</span>
      {banner.link && (
        <Link
          href={banner.link}
          className="ml-3 underline underline-offset-2 font-semibold hover:opacity-75 transition-opacity"
        >
          {banner.linkLabel || 'Learn more'}
        </Link>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
