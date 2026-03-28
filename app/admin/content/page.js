'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Save, RefreshCw, CheckCircle, Plus, Trash2, ChevronDown, ChevronUp,
  Eye, EyeOff, ExternalLink, AlertCircle, GripVertical,
} from 'lucide-react';

// ─── Default content (mirrors data/content.json) ───────────────────────────
const DEFAULTS = {
  home: {
    hero: { tagline: 'WELCOME TO BRUTON GARDENS & APARTMENTS', title: 'Find Your Perfect Stay at Bruton Gardens & Apartments', subtitle: 'Discover luxury living on the outskirts of the city.', primaryCta: 'Booking', secondaryCta: 'Schedule Viewing' },
    about: { heading: 'Experience Luxury Living at Bruton Gardens & Apartments', body: 'Discover modern comfort and elegant design in our premium apartments.', premiumBadge: 'Premium Living', mainImage: '/assets/BRTN GRDN-22.JPG', cards: [{ image: '/assets/main-home1.jpg' }, { image: '/assets/BRTN GRDN-3.JPEG' }, { image: '/assets/BRTN GRDN-25 2.JPEG' }] },
    services: { heading: 'Take The First Step', body: 'Discover your perfect home at Bruton Gardens Apartment.' },
  },
  about: {
    hero: { title: 'About Bruton Gardens & Apartments', subtitle: 'A short stay apartment offering exceptional comfort and warm hospitality.' },
    stats: [{ value: '100+', label: 'Happy Guests' }, { value: '1+', label: 'Years Experience' }, { value: 'Prime', label: 'Location' }, { value: '4.8/5', label: 'Guest Rating' }],
    story: { heading: 'Our Story', paragraph1: 'Bruton Gardens & Apartments was established with a vision to provide travelers with a home away from home.', paragraph2: 'Our commitment to excellence ensures that every guest enjoys a comfortable, memorable stay.', primaryCta: 'Book Now', secondaryCta: 'Contact Us' },
    team: { heading: 'Meet Our Team', members: [{ name: 'Mrs. Portia Owusu Asante', role: 'Director', image: '/assets/team-portia.jpeg', bio: 'Passionate about providing exceptional hospitality and comfortable stays' }, { name: 'Nana Afia Nketia Danquah', role: 'Facilities Manager', image: '/assets/team-nana.jpeg', bio: 'Ensuring every guest enjoys a seamless and memorable experience' }, { name: 'Tetteh Ebenezer', role: 'Front of House', image: '/assets/team-tetteh.jpeg', bio: 'Dedicated to making your stay comfortable and stress-free' }] },
  },
  footer: {
    description: 'Experience luxury living at Bruton Gardens & Apartments. We offer modern, well-furnished apartments in a serene environment with world-class amenities and exceptional service.',
    quickLinksHeading: 'Quick Links',
    quickLinks: [{ href: '/', label: 'Home' }, { href: '/about', label: 'About' }, { href: '/blog', label: 'Gallery & Blog' }, { href: '/services', label: 'Services' }, { href: '/facilities', label: 'Facilities' }],
    connectHeading: 'Connect',
    socialLinks: [{ name: 'Facebook', url: '#' }, { name: 'Twitter', url: '#' }, { name: 'TikTok', url: '#' }, { name: 'WhatsApp', url: '#' }],
    featuredItems: [{ image: '/assets/hall.JPEG', title: 'Event Center', subtitle: 'Elegant & Modern Design' }, { image: '/assets/main-home1.jpg', title: 'Premium Units', subtitle: 'Fully Furnished Apartments' }, { image: '/assets/BRTN GRDN-26.JPG', title: 'Beautiful Gardens', subtitle: 'Serene Environment' }],
    copyright: '© 2026 Bruton Gardens & Apartments. All rights reserved.',
  },
  services: {
    hero: { title: 'Our Services', subtitle: 'Everything you need for a comfortable short-stay experience.' },
    cards: [
      { title: 'Apartment Booking', description: 'Fully furnished apartments available on AirBnB and direct booking.', features: ['AirBnB Integration', 'Flexible Dates', 'Instant Confirmation'] },
      { title: 'Event Center', description: 'Versatile event center for corporate and private events.', features: ['Corporate Events', 'Private Celebrations', 'Full Setup Support'] },
      { title: 'Catering Outsourcing', description: 'Professional catering partnerships for any occasion.', features: ['Custom Menus', 'Professional Service', 'All Event Sizes'] },
      { title: 'Restaurant', description: 'Local Ghanaian favourites and international dishes.', features: ['Local & International Cuisine', 'Experienced Chefs', 'Dine-in & Delivery'] },
    ],
    whyChoose: { heading: 'Why Choose Our Apartments?', items: [{ title: 'Ultrafast WiFi by Starlink', description: 'High-speed internet powered by Starlink.' }, { title: 'Daily Housekeeping', description: 'Professional daily cleaning service.' }, { title: 'Satellite TV & Soundproof Rooms', description: 'Premium satellite TV channels in soundproof rooms.' }, { title: 'Safe & Secure', description: 'CCTV monitoring and trained security staff.' }] },
    reviews: { heading: 'What Our Guests Say' },
  },
  facilities: {
    hero: { title: 'Our Facilities', subtitle: 'Everything you need for a comfortable short stay, all in one place' },
    categories: [
      { category: 'Essential Amenities', items: [{ title: 'Ultrafast WiFi by Starlink', description: 'Blazing fast internet powered by Starlink.' }, { title: 'Free Parking', description: 'Complimentary parking for all guests.' }, { title: 'Secure Access', description: '24/7 security with keyless entry and CCTV.' }, { title: 'Café Corner', description: 'Coffee maker and refreshment area.' }] },
      { category: 'In-Apartment Features', items: [{ title: 'Fully Equipped Kitchen', description: 'Complete kitchen with all appliances.' }, { title: 'Washer & Dryer', description: 'In-unit laundry for your convenience.' }, { title: 'Climate Control', description: 'Individual air conditioning in every room.' }, { title: 'Dining Space', description: 'Comfortable dining area.' }] },
    ],
    explore: { heading: 'Explore Our Apartments', body: 'Take a virtual tour of our fully furnished apartments.', primaryCta: 'Start Tour', secondaryCta: 'Book Now' },
    special: { heading: 'What Makes Us Special', items: [{ title: 'Daily Housekeeping', description: 'Professional daily cleaning service.' }, { title: '24-Hour Check-In', description: 'Staff available around the clock.' }, { title: 'CCTV & Trained Security', description: 'Comprehensive monitoring and trained security.' }] },
    cta: { heading: 'Ready for Your Stay?', body: 'Book your apartment today and enjoy all our premium facilities.', primaryCta: 'Check Availability', secondaryCta: 'Contact Us' },
  },
  gallery: {
    hero: { title: 'Gallery & Blog', subtitle: 'Explore our spaces and stay up to date with the latest from Bruton Gardens' },
    blogCta: { heading: 'Love Our Space? Come Visit Bruton Gardens & Apartments', body: 'Experience the perfect blend of luxury and comfort.', button: 'Book Your Stay' },
  },
  promoBanner: {
    enabled: false,
    text: '🎉 Special offer — Book now and get 10% off your first stay!',
    link: '',
    linkLabel: 'Book Now',
    bgColor: '#a3e635',
    textColor: '#1e293b',
  },
};

const PAGES = [
  { key: 'home', label: 'Home', path: '/', color: 'blue' },
  { key: 'about', label: 'About', path: '/about', color: 'purple' },
  { key: 'services', label: 'Services', path: '/services', color: 'green' },
  { key: 'facilities', label: 'Facilities', path: '/facilities', color: 'amber' },
  { key: 'gallery', label: 'Gallery & Blog', path: '/blog', color: 'pink' },
  { key: 'footer', label: 'Footer', path: '/', color: 'lime' },
  { key: 'promoBanner', label: 'Promo Banner', path: '/', color: 'amber' },
];

// Pages whose data is a single flat object (not { section: {...} })
const FLAT_PAGES = ['footer', 'promoBanner'];

// ─── Tiny UI helpers ────────────────────────────────────────────────────────
function F({ label, value = '', onChange, multiline, hint, mono }) {
  const cls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 ' + (mono ? 'font-mono' : '');
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
        {hint && <span className="normal-case font-normal text-gray-400">— {hint}</span>}
      </label>
      {multiline
        ? <textarea className={cls + ' resize-none'} rows={3} value={value} onChange={e => onChange(e.target.value)} />
        : <input type="text" className={cls} value={value} onChange={e => onChange(e.target.value)} />}
    </div>
  );
}

function Section({ title, badge, children, open, onToggle, accent }) {
  const colors = { blue: 'bg-blue-500', purple: 'bg-purple-500', green: 'bg-green-500', amber: 'bg-amber-500', pink: 'bg-pink-500', lime: 'bg-lime-400' };
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${open ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-1 h-5 rounded-full ${colors[accent] || 'bg-lime-400'}`} />
          <span className="font-semibold text-gray-900 text-sm">{title}</span>
          {badge && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{badge}</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {open && <div className="px-5 pb-5 pt-4 space-y-4 bg-white">{children}</div>}
    </div>
  );
}

// ─── Live Preview components ────────────────────────────────────────────────
function PreviewFrame({ children, label }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
        <div className="flex gap-1.5"><div className="w-3 h-3 rounded-full bg-red-400" /><div className="w-3 h-3 rounded-full bg-yellow-400" /><div className="w-3 h-3 rounded-full bg-green-400" /></div>
        <span className="text-xs text-gray-500 ml-2 font-medium">{label}</span>
      </div>
      <div className="overflow-auto max-h-[520px]">{children}</div>
    </div>
  );
}

function HeroPreview({ d }) {
  return (
    <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }} className="p-8 text-center">
      <p className="text-lime-400 text-xs font-semibold tracking-widest mb-3 uppercase">{d?.tagline}</p>
      <h1 className="text-white font-bold text-xl mb-3 leading-tight">{d?.title}</h1>
      <p className="text-gray-300 text-sm mb-5 max-w-sm mx-auto leading-relaxed">{d?.subtitle}</p>
      <div className="flex justify-center gap-3">
        <span className="bg-lime-400 text-slate-900 px-4 py-2 rounded-lg text-xs font-bold">{d?.primaryCta}</span>
        <span className="border border-white text-white px-4 py-2 rounded-lg text-xs font-medium">{d?.secondaryCta}</span>
      </div>
    </div>
  );
}

function TwoColPreview({ heading, body, imageLabel, ctaLeft, ctaRight }) {
  return (
    <div className="p-6 grid grid-cols-2 gap-6 items-center">
      <div>
        <h2 className="font-bold text-gray-900 text-base mb-3 leading-tight">{heading}</h2>
        <p className="text-gray-500 text-xs leading-relaxed mb-4">{body}</p>
        {(ctaLeft || ctaRight) && (
          <div className="flex gap-2">
            {ctaLeft && <span className="bg-lime-400 text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold">{ctaLeft}</span>}
            {ctaRight && <span className="border-2 border-lime-400 text-lime-600 px-3 py-1.5 rounded-full text-xs font-medium">{ctaRight}</span>}
          </div>
        )}
      </div>
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-32 flex items-center justify-center">
        <span className="text-xs text-gray-400">{imageLabel || 'Image'}</span>
      </div>
    </div>
  );
}

function StatsPreview({ stats }) {
  return (
    <div className="p-4 grid grid-cols-4 gap-3">
      {(stats || []).map((s, i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-3 text-center">
          <p className="font-bold text-gray-900 text-lg">{s.value}</p>
          <p className="text-xs text-gray-500">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function TeamPreview({ heading, members }) {
  return (
    <div className="p-5 bg-gray-50">
      <h2 className="font-bold text-gray-900 text-base text-center mb-4">{heading}</h2>
      <div className="grid grid-cols-3 gap-3">
        {(members || []).map((m, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-200 mx-auto mb-2 overflow-hidden">
              <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
            </div>
            <p className="font-semibold text-gray-900 text-xs leading-tight">{m.name}</p>
            <p className="text-lime-500 text-xs mt-0.5">{m.role}</p>
            <p className="text-gray-500 text-xs mt-1 leading-tight">{m.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardsPreview({ cards }) {
  return (
    <div className="p-4 grid grid-cols-2 gap-3">
      {(cards || []).map((c, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-3 bg-white">
          <div className="w-8 h-8 bg-lime-100 rounded-lg mb-2" />
          <p className="font-semibold text-gray-900 text-xs mb-1">{c.title}</p>
          <p className="text-gray-500 text-xs line-clamp-2">{c.description}</p>
          <div className="mt-2 space-y-1">
            {(c.features || []).map((f, j) => (
              <div key={j} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                <span className="text-xs text-gray-500">{f}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ListPreview({ heading, items, dark }) {
  const bg = dark ? 'bg-slate-900' : 'bg-white';
  const headingColor = dark ? 'text-white' : 'text-gray-900';
  const textColor = dark ? 'text-gray-300' : 'text-gray-500';
  return (
    <div className={`p-5 ${bg}`}>
      <h2 className={`font-bold text-sm mb-4 text-center ${headingColor}`}>{heading}</h2>
      <div className="space-y-2">
        {(items || []).map((item, i) => (
          <div key={i} className={`p-3 rounded-lg border ${dark ? 'border-slate-700' : 'border-gray-100 bg-gray-50'}`}>
            <p className={`font-medium text-xs ${headingColor}`}>{item.title}</p>
            <p className={`text-xs mt-0.5 ${textColor}`}>{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CtaPreview({ heading, body, primaryCta, secondaryCta }) {
  return (
    <div className="bg-slate-900 p-8 text-center">
      <h2 className="text-white font-bold text-base mb-2">{heading}</h2>
      <p className="text-gray-400 text-xs mb-4 max-w-xs mx-auto">{body}</p>
      <div className="flex justify-center gap-3">
        {primaryCta && <span className="bg-lime-600 text-white px-4 py-2 rounded-full text-xs font-medium">{primaryCta}</span>}
        {secondaryCta && <span className="border border-white text-white px-4 py-2 rounded-full text-xs">{secondaryCta}</span>}
      </div>
    </div>
  );
}

function GridPreview({ heading, items, cols = 3 }) {
  return (
    <div className="p-5">
      <h2 className="font-bold text-gray-900 text-sm text-center mb-4">{heading}</h2>
      <div className={`grid gap-3 ${cols === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {(items || []).map((item, i) => (
          <div key={i} className="border-2 border-gray-200 rounded-xl p-3 text-center bg-white">
            <p className="font-semibold text-gray-900 text-xs mb-1">{item.title}</p>
            <p className="text-gray-500 text-xs leading-tight">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryGridPreview({ categories }) {
  return (
    <div className="p-4 space-y-4">
      {(categories || []).map((cat, i) => (
        <div key={i}>
          <p className="font-bold text-gray-900 text-xs mb-2">{cat.category}</p>
          <div className="grid grid-cols-4 gap-2">
            {(cat.items || []).map((item, j) => (
              <div key={j} className="border border-gray-200 rounded-lg p-2 bg-white">
                <div className="w-6 h-6 bg-lime-100 rounded mb-1" />
                <p className="font-medium text-gray-900 text-xs leading-tight">{item.title}</p>
                <p className="text-gray-400 text-xs leading-tight mt-0.5">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PageHeroPreview({ title, subtitle }) {
  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-8 text-center">
      <h1 className="text-white font-bold text-xl mb-2">{title}</h1>
      <p className="text-gray-300 text-sm max-w-sm mx-auto">{subtitle}</p>
    </div>
  );
}

function HomeAboutPreview({ d }) {
  return (
    <div className="p-5 grid grid-cols-2 gap-4 items-start">
      <div className="space-y-3">
        <div className="inline-block bg-lime-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-t-full">{d?.premiumBadge}</div>
        <h2 className="font-bold text-gray-900 text-sm leading-tight">{d?.heading}</h2>
        <p className="text-gray-500 text-xs leading-relaxed">{d?.body}</p>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {(d?.cards || []).map((card, i) => (
            <div key={i} className="bg-gray-100 rounded-t-full h-16 flex items-center justify-center">
              <span className="text-xs text-gray-400 text-center px-1 break-all">{card.image?.split('/').pop()}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-full h-36 flex items-center justify-center">
        <span className="text-xs text-gray-400 text-center px-2">{d?.mainImage?.split('/').pop() || 'Main image'}</span>
      </div>
    </div>
  );
}

function FooterPreview({ d, section }) {
  if (section === 'brand') return (
    <div className="p-5 bg-gray-50">
      <div className="w-20 h-8 bg-gray-300 rounded mb-3" />
      <p className="text-gray-600 text-xs leading-relaxed max-w-xs">{d?.description}</p>
      <p className="text-gray-400 text-xs mt-4 pt-3 border-t border-gray-200">{d?.copyright}</p>
    </div>
  );
  if (section === 'quickLinks') return (
    <div className="p-5">
      <h3 className="font-bold text-gray-900 text-sm mb-3">{d?.quickLinksHeading}</h3>
      <div className="space-y-2">
        {(d?.quickLinks || []).map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-lime-400" />
            <span className="text-xs text-gray-600">{link.label}</span>
            <span className="text-xs text-gray-400 font-mono">{link.href}</span>
          </div>
        ))}
      </div>
    </div>
  );
  if (section === 'socialLinks') return (
    <div className="p-5">
      <h3 className="font-bold text-gray-900 text-sm mb-3">{d?.connectHeading}</h3>
      <div className="space-y-2">
        {(d?.socialLinks || []).map((s, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-700">{s.name}</span>
            <span className="text-xs text-gray-400 font-mono truncate max-w-[150px]">{s.url || '#'}</span>
          </div>
        ))}
      </div>
    </div>
  );
  if (section === 'featuredItems') return (
    <div className="p-5 space-y-3">
      {(d?.featuredItems || []).map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center">
            <span className="text-xs text-gray-400 text-center">{item.image?.split('/').pop()}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-xs">{item.title}</p>
            <p className="text-gray-500 text-xs">{item.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
  return null;
}

// ─── Section renderers ──────────────────────────────────────────────────────
function renderPreview(page, section, d) {
  if (!d) return <div className="p-8 text-center text-gray-400 text-sm">Select a section to preview</div>;

  if (page === 'footer') return <FooterPreview d={d} section={section} />;
  if (page === 'promoBanner') return (
    <div
      className="py-3 px-10 text-sm font-medium text-center relative"
      style={{ backgroundColor: d?.bgColor || '#a3e635', color: d?.textColor || '#1e293b' }}
    >
      {d?.text || 'Banner text preview'}
      {d?.link && <span className="ml-3 underline font-semibold">{d?.linkLabel || 'Learn more'}</span>}
      {!d?.enabled && <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center rounded"><span className="text-white text-xs font-medium bg-gray-900/60 px-2 py-1 rounded">Disabled</span></div>}
    </div>
  );

  if (page === 'home') {
    if (section === 'hero') return <HeroPreview d={d} />;
    if (section === 'about') return <HomeAboutPreview d={d} />;
    if (section === 'services') return (
      <div className="p-5">
        <h2 className="font-bold text-gray-900 text-base mb-2">{d.heading}</h2>
        <p className="text-gray-500 text-sm">{d.body}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[1,2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (page === 'about') {
    if (section === 'hero') return (
      <div>
        <PageHeroPreview title={d.title} subtitle={d.subtitle} />
        {d?.heroImage && <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">Hero image: <span className="font-mono">{d.heroImage}</span></div>}
      </div>
    );
    if (section === 'stats') return <StatsPreview stats={d} />;
    if (section === 'story') return <TwoColPreview heading={d.heading} body={d.paragraph1 + ' ' + d.paragraph2} ctaLeft={d.primaryCta} ctaRight={d.secondaryCta} imageLabel="Story slideshow" />;
    if (section === 'team') return <TeamPreview heading={d.heading} members={d.members} />;
  }

  if (page === 'services') {
    if (section === 'hero') return <PageHeroPreview title={d.title} subtitle={d.subtitle} />;
    if (section === 'cards') return <CardsPreview cards={d} />;
    if (section === 'whyChoose') return <ListPreview heading={d.heading} items={d.items} />;
    if (section === 'reviews') return (
      <div className="p-5 text-center">
        <h2 className="font-bold text-gray-900 text-sm mb-4">{d.heading}</h2>
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="border border-gray-200 rounded-xl p-3 bg-white h-20 flex items-center justify-center"><span className="text-xs text-gray-400">Review {i}</span></div>)}
        </div>
      </div>
    );
  }

  if (page === 'facilities') {
    if (section === 'hero') return <PageHeroPreview title={d.title} subtitle={d.subtitle} />;
    if (section === 'categories') return <CategoryGridPreview categories={d} />;
    if (section === 'explore') return <TwoColPreview heading={d.heading} body={d.body} ctaLeft={d.primaryCta} ctaRight={d.secondaryCta} imageLabel="Apartment photo" />;
    if (section === 'special') return <GridPreview heading={d.heading} items={d.items} cols={3} />;
    if (section === 'cta') return <CtaPreview heading={d.heading} body={d.body} primaryCta={d.primaryCta} secondaryCta={d.secondaryCta} />;
  }

  if (page === 'gallery') {
    if (section === 'hero') return <PageHeroPreview title={d.title} subtitle={d.subtitle} />;
    if (section === 'blogCta') return <CtaPreview heading={d.heading} body={d.body} primaryCta={d.button} />;
  }

  return <div className="p-8 text-center text-gray-400 text-sm">Preview not available</div>;
}

// ─── Section editors ────────────────────────────────────────────────────────
function HomeHeroEditor({ d, set }) {
  return <>
    <F label="Tagline" value={d?.tagline} onChange={v => set('tagline', v)} hint="uppercase text above heading" />
    <F label="Main Heading" value={d?.title} onChange={v => set('title', v)} />
    <F label="Subtitle" value={d?.subtitle} onChange={v => set('subtitle', v)} multiline />
    <div className="grid grid-cols-2 gap-3">
      <F label="Primary Button" value={d?.primaryCta} onChange={v => set('primaryCta', v)} hint="lime" />
      <F label="Secondary Button" value={d?.secondaryCta} onChange={v => set('secondaryCta', v)} hint="outline" />
    </div>
  </>;
}

function SimpleTwoFieldEditor({ d, set }) {
  return <>
    <F label="Heading" value={d?.heading} onChange={v => set('heading', v)} />
    <F label="Body Text" value={d?.body} onChange={v => set('body', v)} multiline />
  </>;
}

function PageHeroEditor({ d, set }) {
  return <>
    <F label="Page Title" value={d?.title} onChange={v => set('title', v)} />
    <F label="Subtitle" value={d?.subtitle} onChange={v => set('subtitle', v)} multiline />
  </>;
}

function StatsEditor({ d, setFull }) {
  function updateStat(i, key, val) {
    const next = [...d];
    next[i] = { ...next[i], [key]: val };
    setFull(next);
  }
  function addStat() { setFull([...d, { value: '', label: '' }]); }
  function removeStat(i) { setFull(d.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-3">
      {(d || []).map((stat, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <F label={i === 0 ? 'Value' : ''} value={stat.value} onChange={v => updateStat(i, 'value', v)} />
            <F label={i === 0 ? 'Label' : ''} value={stat.label} onChange={v => updateStat(i, 'label', v)} />
          </div>
          <button onClick={() => removeStat(i)} className="mt-auto p-1.5 text-gray-300 hover:text-red-400 transition-colors">
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button onClick={addStat} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
        <Plus size={14} /> Add Stat
      </button>
    </div>
  );
}

function StoryEditor({ d, set }) {
  return <>
    <F label="Heading" value={d?.heading} onChange={v => set('heading', v)} />
    <F label="First Paragraph" value={d?.paragraph1} onChange={v => set('paragraph1', v)} multiline />
    <F label="Second Paragraph" value={d?.paragraph2} onChange={v => set('paragraph2', v)} multiline />
    <div className="grid grid-cols-2 gap-3">
      <F label="Primary Button" value={d?.primaryCta} onChange={v => set('primaryCta', v)} />
      <F label="Secondary Button" value={d?.secondaryCta} onChange={v => set('secondaryCta', v)} />
    </div>
  </>;
}

function TeamEditor({ d, setFull }) {
  function updateMember(i, key, val) {
    const next = { ...d, members: [...d.members] };
    next.members[i] = { ...next.members[i], [key]: val };
    setFull(next);
  }
  function addMember() {
    setFull({ ...d, members: [...(d.members || []), { name: '', role: '', image: '', bio: '' }] });
  }
  function removeMember(i) {
    setFull({ ...d, members: d.members.filter((_, idx) => idx !== i) });
  }
  return (
    <div className="space-y-4">
      <F label="Section Heading" value={d?.heading} onChange={v => setFull({ ...d, heading: v })} />
      <div className="border-t border-gray-100 pt-4 space-y-4">
        {(d?.members || []).map((m, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase">Member {i + 1}</span>
              <button onClick={() => removeMember(i)} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="Name" value={m.name} onChange={v => updateMember(i, 'name', v)} />
              <F label="Role / Title" value={m.role} onChange={v => updateMember(i, 'role', v)} />
            </div>
            <F label="Bio" value={m.bio} onChange={v => updateMember(i, 'bio', v)} multiline />
            <F label="Photo Path" value={m.image} onChange={v => updateMember(i, 'image', v)} hint="e.g. /assets/team-portia.jpeg" mono />
          </div>
        ))}
        <button onClick={addMember} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
          <Plus size={14} /> Add Team Member
        </button>
      </div>
    </div>
  );
}

function ServiceCardsEditor({ d, setFull }) {
  function updateCard(i, key, val) {
    const next = [...d];
    next[i] = { ...next[i], [key]: val };
    setFull(next);
  }
  function updateFeature(ci, fi, val) {
    const next = [...d];
    const features = [...next[ci].features];
    features[fi] = val;
    next[ci] = { ...next[ci], features };
    setFull(next);
  }
  function addFeature(ci) {
    const next = [...d];
    next[ci] = { ...next[ci], features: [...next[ci].features, ''] };
    setFull(next);
  }
  function removeFeature(ci, fi) {
    const next = [...d];
    next[ci] = { ...next[ci], features: next[ci].features.filter((_, idx) => idx !== fi) };
    setFull(next);
  }
  function addCard() {
    setFull([...d, { title: '', description: '', features: [] }]);
  }
  function removeCard(i) { setFull(d.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-4">
      {(d || []).map((card, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase">Card {i + 1}</span>
            <button onClick={() => removeCard(i)} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
          <F label="Title" value={card.title} onChange={v => updateCard(i, 'title', v)} />
          <F label="Description" value={card.description} onChange={v => updateCard(i, 'description', v)} multiline />
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Feature Bullets</p>
            <div className="space-y-2">
              {(card.features || []).map((f, fi) => (
                <div key={fi} className="flex gap-2">
                  <input
                    type="text"
                    value={f}
                    onChange={e => updateFeature(i, fi, e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-lime-400"
                  />
                  <button onClick={() => removeFeature(i, fi)} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => addFeature(i)} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
                <Plus size={13} /> Add feature
              </button>
            </div>
          </div>
        </div>
      ))}
      <button onClick={addCard} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
        <Plus size={14} /> Add Service Card
      </button>
    </div>
  );
}

function WhyChooseEditor({ d, setFull }) {
  function updateItem(i, key, val) {
    const items = [...d.items];
    items[i] = { ...items[i], [key]: val };
    setFull({ ...d, items });
  }
  function addItem() { setFull({ ...d, items: [...(d.items || []), { title: '', description: '' }] }); }
  function removeItem(i) { setFull({ ...d, items: d.items.filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-4">
      <F label="Section Heading" value={d?.heading} onChange={v => setFull({ ...d, heading: v })} />
      <div className="border-t border-gray-100 pt-4 space-y-3">
        {(d?.items || []).map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-400">Item {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <F label="Title" value={item.title} onChange={v => updateItem(i, 'title', v)} />
            <F label="Description" value={item.description} onChange={v => updateItem(i, 'description', v)} multiline />
          </div>
        ))}
        <button onClick={addItem} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
          <Plus size={14} /> Add Item
        </button>
      </div>
    </div>
  );
}

function CategoriesEditor({ d, setFull }) {
  function updateCat(ci, key, val) {
    const next = [...d];
    next[ci] = { ...next[ci], [key]: val };
    setFull(next);
  }
  function updateItem(ci, ii, key, val) {
    const next = [...d];
    const items = [...next[ci].items];
    items[ii] = { ...items[ii], [key]: val };
    next[ci] = { ...next[ci], items };
    setFull(next);
  }
  function addItem(ci) {
    const next = [...d];
    next[ci] = { ...next[ci], items: [...next[ci].items, { title: '', description: '' }] };
    setFull(next);
  }
  function removeItem(ci, ii) {
    const next = [...d];
    next[ci] = { ...next[ci], items: next[ci].items.filter((_, idx) => idx !== ii) };
    setFull(next);
  }
  function addCategory() { setFull([...d, { category: '', items: [] }]); }
  function removeCategory(ci) { setFull(d.filter((_, idx) => idx !== ci)); }

  return (
    <div className="space-y-5">
      {(d || []).map((cat, ci) => (
        <div key={ci} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <F label="Category Name" value={cat.category} onChange={v => updateCat(ci, 'category', v)} />
            <button onClick={() => removeCategory(ci)} className="mt-5 ml-2 text-gray-300 hover:text-red-400"><Trash2 size={15} /></button>
          </div>
          <div className="space-y-2 pl-2 border-l-2 border-gray-200">
            {(cat.items || []).map((item, ii) => (
              <div key={ii} className="bg-white rounded-lg p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Facility {ii + 1}</span>
                  <button onClick={() => removeItem(ci, ii)} className="text-gray-300 hover:text-red-400"><Trash2 size={13} /></button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <F label="Title" value={item.title} onChange={v => updateItem(ci, ii, 'title', v)} />
                  <F label="Description" value={item.description} onChange={v => updateItem(ci, ii, 'description', v)} />
                </div>
              </div>
            ))}
            <button onClick={() => addItem(ci)} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
              <Plus size={13} /> Add facility
            </button>
          </div>
        </div>
      ))}
      <button onClick={addCategory} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
        <Plus size={14} /> Add Category
      </button>
    </div>
  );
}

function SpecialItemsEditor({ d, setFull }) {
  function updateItem(i, key, val) {
    const items = [...d.items];
    items[i] = { ...items[i], [key]: val };
    setFull({ ...d, items });
  }
  function addItem() { setFull({ ...d, items: [...(d.items || []), { title: '', description: '' }] }); }
  function removeItem(i) { setFull({ ...d, items: d.items.filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-4">
      <F label="Section Heading" value={d?.heading} onChange={v => setFull({ ...d, heading: v })} />
      <div className="border-t border-gray-100 pt-4 space-y-3">
        {(d?.items || []).map((item, i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-gray-400">Feature {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
            <F label="Title" value={item.title} onChange={v => updateItem(i, 'title', v)} />
            <F label="Description" value={item.description} onChange={v => updateItem(i, 'description', v)} multiline />
          </div>
        ))}
        <button onClick={addItem} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
          <Plus size={14} /> Add Feature
        </button>
      </div>
    </div>
  );
}

function CtaEditor({ d, set }) {
  return <>
    <F label="Heading" value={d?.heading} onChange={v => set('heading', v)} />
    <F label="Body Text" value={d?.body} onChange={v => set('body', v)} multiline />
    <div className="grid grid-cols-2 gap-3">
      <F label="Primary Button" value={d?.primaryCta} onChange={v => set('primaryCta', v)} />
      <F label="Secondary Button" value={d?.secondaryCta} onChange={v => set('secondaryCta', v)} />
    </div>
  </>;
}

function ExploreEditor({ d, set }) {
  return <>
    <F label="Heading" value={d?.heading} onChange={v => set('heading', v)} />
    <F label="Body Text" value={d?.body} onChange={v => set('body', v)} multiline />
    <div className="grid grid-cols-2 gap-3">
      <F label="Primary Button" value={d?.primaryCta} onChange={v => set('primaryCta', v)} />
      <F label="Secondary Button" value={d?.secondaryCta} onChange={v => set('secondaryCta', v)} />
    </div>
  </>;
}

function BlogCtaEditor({ d, set }) {
  return <>
    <F label="Heading" value={d?.heading} onChange={v => set('heading', v)} />
    <F label="Body Text" value={d?.body} onChange={v => set('body', v)} multiline />
    <F label="Button Text" value={d?.button} onChange={v => set('button', v)} />
  </>;
}

function HomeAboutEditor({ d, setFull }) {
  function updateCard(i, val) {
    const cards = [...(d?.cards || [])];
    cards[i] = { ...cards[i], image: val };
    setFull({ ...d, cards });
  }
  return <>
    <F label="Heading" value={d?.heading} onChange={v => setFull({ ...d, heading: v })} />
    <F label="Body Text" value={d?.body} onChange={v => setFull({ ...d, body: v })} multiline />
    <F label="Premium Badge Text" value={d?.premiumBadge} onChange={v => setFull({ ...d, premiumBadge: v })} hint="e.g. Premium Living" />
    <F label="Main Image Path" value={d?.mainImage} onChange={v => setFull({ ...d, mainImage: v })} hint="large image on the left" mono />
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Card Images (3 small cards)</p>
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <F key={i} label={`Card ${i + 1} Image`} value={d?.cards?.[i]?.image || ''} onChange={v => updateCard(i, v)} mono />
        ))}
      </div>
    </div>
  </>;
}

function AboutHeroEditor({ d, set }) {
  return <>
    <F label="Page Title" value={d?.title} onChange={v => set('title', v)} />
    <F label="Subtitle" value={d?.subtitle} onChange={v => set('subtitle', v)} multiline />
    <F label="Hero Background Image" value={d?.heroImage} onChange={v => set('heroImage', v)} hint="path to the full-bleed background photo" mono />
  </>;
}

function FooterBrandEditor({ d, setFull }) {
  return <>
    <F label="Description Text" value={d?.description} onChange={v => setFull({ ...d, description: v })} multiline />
    <F label="Copyright Line" value={d?.copyright} onChange={v => setFull({ ...d, copyright: v })} hint="e.g. © 2026 Bruton Gardens..." />
  </>;
}

function FooterLinksEditor({ d, setFull }) {
  function updateLink(i, key, val) {
    const links = [...(d?.quickLinks || [])];
    links[i] = { ...links[i], [key]: val };
    setFull({ ...d, quickLinks: links });
  }
  function addLink() { setFull({ ...d, quickLinks: [...(d?.quickLinks || []), { href: '/', label: '' }] }); }
  function removeLink(i) { setFull({ ...d, quickLinks: (d?.quickLinks || []).filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-4">
      <F label="Section Heading" value={d?.quickLinksHeading} onChange={v => setFull({ ...d, quickLinksHeading: v })} />
      <div className="border-t border-gray-100 pt-4 space-y-2">
        {(d?.quickLinks || []).map((link, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <F label={i === 0 ? 'Label' : ''} value={link.label} onChange={v => updateLink(i, 'label', v)} />
              <F label={i === 0 ? 'Path (href)' : ''} value={link.href} onChange={v => updateLink(i, 'href', v)} mono />
            </div>
            <button onClick={() => removeLink(i)} className="mt-auto p-1.5 text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={addLink} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
          <Plus size={14} /> Add Link
        </button>
      </div>
    </div>
  );
}

function FooterSocialsEditor({ d, setFull }) {
  function updateSocial(i, key, val) {
    const links = [...(d?.socialLinks || [])];
    links[i] = { ...links[i], [key]: val };
    setFull({ ...d, socialLinks: links });
  }
  function addSocial() { setFull({ ...d, socialLinks: [...(d?.socialLinks || []), { name: '', url: '' }] }); }
  function removeSocial(i) { setFull({ ...d, socialLinks: (d?.socialLinks || []).filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-4">
      <F label="Section Heading" value={d?.connectHeading} onChange={v => setFull({ ...d, connectHeading: v })} />
      <p className="text-xs text-gray-400">Supported icon names: Facebook, Twitter, TikTok, WhatsApp</p>
      <div className="space-y-2">
        {(d?.socialLinks || []).map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <F label={i === 0 ? 'Name' : ''} value={s.name} onChange={v => updateSocial(i, 'name', v)} />
              <F label={i === 0 ? 'URL' : ''} value={s.url} onChange={v => updateSocial(i, 'url', v)} mono />
            </div>
            <button onClick={() => removeSocial(i)} className="mt-auto p-1.5 text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        ))}
        <button onClick={addSocial} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
          <Plus size={14} /> Add Social Link
        </button>
      </div>
    </div>
  );
}

function PromoBannerEditor({ d, setFull }) {
  const enabled = !!d?.enabled;
  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-semibold text-gray-900 text-sm">Banner Enabled</p>
          <p className="text-xs text-gray-400 mt-0.5">Show or hide the banner across all pages</p>
        </div>
        <button
          onClick={() => setFull({ ...d, enabled: !enabled })}
          className={`relative w-12 h-6 rounded-full transition-colors ${enabled ? 'bg-lime-400' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : ''}`} />
        </button>
      </div>
      <F label="Banner Text" value={d?.text} onChange={v => setFull({ ...d, text: v })} hint="the message shown in the banner" />
      <div className="grid grid-cols-2 gap-3">
        <F label="Link URL" value={d?.link} onChange={v => setFull({ ...d, link: v })} hint="leave empty for no link" mono />
        <F label="Link Button Label" value={d?.linkLabel} onChange={v => setFull({ ...d, linkLabel: v })} hint='e.g. "Book Now"' />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Background Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={d?.bgColor || '#a3e635'} onChange={e => setFull({ ...d, bgColor: e.target.value })} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
            <input type="text" value={d?.bgColor || ''} onChange={e => setFull({ ...d, bgColor: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-lime-400" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Text Color</label>
          <div className="flex items-center gap-2">
            <input type="color" value={d?.textColor || '#1e293b'} onChange={e => setFull({ ...d, textColor: e.target.value })} className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0" />
            <input type="text" value={d?.textColor || ''} onChange={e => setFull({ ...d, textColor: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-lime-400" />
          </div>
        </div>
      </div>
      {/* Live Preview */}
      <div className="mt-2">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Preview</p>
        <div
          className="relative text-center py-2.5 px-10 text-sm font-medium rounded-lg"
          style={{ backgroundColor: d?.bgColor || '#a3e635', color: d?.textColor || '#1e293b' }}
        >
          <span>{d?.text || 'Your banner message here'}</span>
          {d?.link && <span className="ml-3 underline font-semibold">{d?.linkLabel || 'Learn more'}</span>}
          <span className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 text-xs">✕</span>
        </div>
        {!enabled && <p className="text-xs text-amber-500 mt-2">⚠ Banner is currently hidden. Toggle &quot;Banner Enabled&quot; to show it.</p>}
      </div>
    </div>
  );
}

function FooterFeaturedEditor({ d, setFull }) {
  function updateItem(i, key, val) {
    const items = [...(d?.featuredItems || [])];
    items[i] = { ...items[i], [key]: val };
    setFull({ ...d, featuredItems: items });
  }
  function addItem() { setFull({ ...d, featuredItems: [...(d?.featuredItems || []), { image: '', title: '', subtitle: '' }] }); }
  function removeItem(i) { setFull({ ...d, featuredItems: (d?.featuredItems || []).filter((_, idx) => idx !== i) }); }

  return (
    <div className="space-y-4">
      {(d?.featuredItems || []).map((item, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-400">Item {i + 1}</span>
            <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
          <F label="Title" value={item.title} onChange={v => updateItem(i, 'title', v)} />
          <F label="Subtitle" value={item.subtitle} onChange={v => updateItem(i, 'subtitle', v)} />
          <F label="Image Path" value={item.image} onChange={v => updateItem(i, 'image', v)} mono />
        </div>
      ))}
      <button onClick={addItem} className="flex items-center gap-1.5 text-lime-600 hover:text-lime-700 text-xs font-medium">
        <Plus size={14} /> Add Item
      </button>
    </div>
  );
}

// ─── Section config per page ────────────────────────────────────────────────
const SECTIONS = {
  home: [
    { id: 'hero', label: 'Hero Banner', hint: 'Main headline, tagline & CTA buttons' },
    { id: 'about', label: 'About Section', hint: 'Heading, body, badge, main image & three card images' },
    { id: 'services', label: 'Services Intro', hint: 'Heading & description above the services video' },
  ],
  about: [
    { id: 'hero', label: 'Page Hero', hint: 'Title, subtitle & hero background image' },
    { id: 'stats', label: 'Stats Row', hint: 'The 4 statistic cards (value + label)' },
    { id: 'story', label: 'Our Story', hint: 'Two-column story section with paragraphs & CTA' },
    { id: 'team', label: 'Team Members', hint: 'Name, role, bio & photo for each team member' },
  ],
  services: [
    { id: 'hero', label: 'Page Hero', hint: 'Title & subtitle in the dark header banner' },
    { id: 'cards', label: 'Service Cards', hint: 'The 4 service cards with title, description & bullets' },
    { id: 'whyChoose', label: 'Why Choose Us', hint: 'Heading & feature list items' },
    { id: 'reviews', label: 'Reviews Heading', hint: 'The "What Our Guests Say" heading' },
  ],
  facilities: [
    { id: 'hero', label: 'Page Hero', hint: 'Title & subtitle in the dark header banner' },
    { id: 'categories', label: 'Facility Categories', hint: 'All facility groups and their items' },
    { id: 'explore', label: 'Explore Section', hint: 'Two-column "Explore Our Apartments" block' },
    { id: 'special', label: 'What Makes Us Special', hint: 'The 3 highlighted feature cards' },
    { id: 'cta', label: 'Call to Action', hint: 'Dark CTA banner at the bottom of the page' },
  ],
  gallery: [
    { id: 'hero', label: 'Page Hero', hint: 'Title & subtitle for the Gallery & Blog page' },
    { id: 'blogCta', label: 'Blog CTA', hint: '"Love Our Space?" banner section' },
  ],
  footer: [
    { id: 'brand', label: 'Brand & Description', hint: 'Logo description text and copyright line' },
    { id: 'quickLinks', label: 'Quick Links', hint: 'Navigation links shown in the footer' },
    { id: 'socialLinks', label: 'Social Links', hint: 'Social network names and URLs' },
    { id: 'featuredItems', label: 'Featured Items', hint: 'Three image+title+subtitle items on the right' },
  ],
  promoBanner: [
    { id: 'config', label: 'Banner Settings', hint: 'Toggle, message, colors and link' },
  ],
};

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function ContentPage() {
  const [content, setContent] = useState(DEFAULTS);
  const [saved, setSaved] = useState(null); // deep-copy of last saved state
  const [activePage, setActivePage] = useState('home');
  const [activeSection, setActiveSection] = useState('hero');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'ok' | 'err'
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    fetch('/api/admin/content')
      .then(r => r.json())
      .then(data => {
        if (data && Object.keys(data).length) {
          const merged = { ...DEFAULTS, ...data };
          setContent(merged);
          setSaved(JSON.stringify(merged));
        } else {
          setSaved(JSON.stringify(DEFAULTS));
        }
        setLoading(false);
      })
      .catch(() => { setSaved(JSON.stringify(DEFAULTS)); setLoading(false); });
  }, []);

  const hasUnsaved = saved !== JSON.stringify(content);

  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        setSaved(JSON.stringify(content));
        setSaveStatus('ok');
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus('err');
      }
    } catch {
      setSaveStatus('err');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    if (saved) setContent(JSON.parse(saved));
  }

  // Deep set helper — sets content[page][section] or a nested path
  function setSection(page, section, val) {
    setContent(prev => ({ ...prev, [page]: { ...prev[page], [section]: val } }));
  }

  function setField(page, section, key, val) {
    setContent(prev => ({
      ...prev,
      [page]: { ...prev[page], [section]: { ...prev[page]?.[section], [key]: val } },
    }));
  }

  const pd = content[activePage];
  // Flat pages store their entire data as one object (no sub-sections by key)
  const isFlat = FLAT_PAGES.includes(activePage);
  const sd = isFlat ? pd : pd?.[activeSection];

  function renderEditor() {
    if (!pd && !isFlat) return null;
    const set = (k, v) => setField(activePage, activeSection, k, v);
    const setFull = isFlat
      ? (v) => setContent(prev => ({ ...prev, [activePage]: v }))
      : (v) => setSection(activePage, activeSection, v);

    if (activePage === 'home') {
      if (activeSection === 'hero') return <HomeHeroEditor d={sd} set={set} />;
      if (activeSection === 'about') return <HomeAboutEditor d={sd} setFull={setFull} />;
      if (activeSection === 'services') return <SimpleTwoFieldEditor d={sd} set={set} />;
    }
    if (activePage === 'footer') {
      if (activeSection === 'brand') return <FooterBrandEditor d={sd} setFull={setFull} />;
      if (activeSection === 'quickLinks') return <FooterLinksEditor d={sd} setFull={setFull} />;
      if (activeSection === 'socialLinks') return <FooterSocialsEditor d={sd} setFull={setFull} />;
      if (activeSection === 'featuredItems') return <FooterFeaturedEditor d={sd} setFull={setFull} />;
    }
    if (activePage === 'promoBanner') {
      return <PromoBannerEditor d={sd} setFull={setFull} />;
    }
    if (activePage === 'about') {
      if (activeSection === 'hero') return <AboutHeroEditor d={sd} set={set} />;
      if (activeSection === 'stats') return <StatsEditor d={sd} setFull={setFull} />;
      if (activeSection === 'story') return <StoryEditor d={sd} set={set} />;
      if (activeSection === 'team') return <TeamEditor d={sd} setFull={setFull} />;
    }
    if (activePage === 'services') {
      if (activeSection === 'hero') return <PageHeroEditor d={sd} set={set} />;
      if (activeSection === 'cards') return <ServiceCardsEditor d={sd} setFull={setFull} />;
      if (activeSection === 'whyChoose') return <WhyChooseEditor d={sd} setFull={setFull} />;
      if (activeSection === 'reviews') return <F label="Section Heading" value={sd?.heading} onChange={v => set('heading', v)} />;
    }
    if (activePage === 'facilities') {
      if (activeSection === 'hero') return <PageHeroEditor d={sd} set={set} />;
      if (activeSection === 'categories') return <CategoriesEditor d={sd} setFull={setFull} />;
      if (activeSection === 'explore') return <ExploreEditor d={sd} set={set} />;
      if (activeSection === 'special') return <SpecialItemsEditor d={sd} setFull={setFull} />;
      if (activeSection === 'cta') return <CtaEditor d={sd} set={set} />;
    }
    if (activePage === 'gallery') {
      if (activeSection === 'hero') return <PageHeroEditor d={sd} set={set} />;
      if (activeSection === 'blogCta') return <BlogCtaEditor d={sd} set={set} />;
    }
    return null;
  }

  const pageConfig = PAGES.find(p => p.key === activePage);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">Page Content</h1>
          {hasUnsaved && (
            <span className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full font-medium">
              <AlertCircle size={12} /> Unsaved changes
            </span>
          )}
          {saveStatus === 'ok' && (
            <span className="flex items-center gap-1.5 text-xs bg-lime-100 text-lime-700 px-2.5 py-1 rounded-full font-medium">
              <CheckCircle size={12} /> Published
            </span>
          )}
          {saveStatus === 'err' && (
            <span className="text-xs text-red-500">Save failed — try again</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={pageConfig?.path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            <ExternalLink size={13} /> View Live
          </a>
          <button
            onClick={() => setShowPreview(p => !p)}
            className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
          >
            {showPreview ? <EyeOff size={13} /> : <Eye size={13} />}
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          {hasUnsaved && (
            <button
              onClick={handleDiscard}
              className="text-xs border border-gray-200 text-gray-500 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors font-medium"
            >
              Discard
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasUnsaved}
            className="flex items-center gap-2 bg-lime-400 hover:bg-lime-500 disabled:opacity-50 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Publishing…' : 'Publish Changes'}
          </button>
        </div>
      </div>

      {/* Page tabs */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 flex gap-1">
        {PAGES.map(pg => (
          <button
            key={pg.key}
            onClick={() => { setActivePage(pg.key); setActiveSection(SECTIONS[pg.key][0].id); }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activePage === pg.key
                ? 'border-lime-400 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200'
            }`}
          >
            {pg.label}
            {saved && JSON.stringify(content[pg.key]) !== JSON.stringify(JSON.parse(saved)?.[pg.key]) && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </button>
        ))}
      </div>

      {/* Main split panel */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400">Loading content…</div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left: section list + editor */}
          <div className={`flex flex-col overflow-hidden border-r border-gray-200 ${showPreview ? 'w-[45%]' : 'w-full'}`}>
            {/* Section pills */}
            <div className="flex-shrink-0 p-4 border-b border-gray-100 flex flex-wrap gap-2 bg-gray-50">
              {SECTIONS[activePage].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  title={sec.hint}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeSection === sec.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Editor fields */}
            <div className="flex-1 overflow-auto p-5">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">
                  {SECTIONS[activePage].find(s => s.id === activeSection)?.label}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {SECTIONS[activePage].find(s => s.id === activeSection)?.hint}
                </p>
              </div>
              <div className="space-y-4">
                {renderEditor()}
              </div>
            </div>
          </div>

          {/* Right: live preview */}
          {showPreview && (
            <div className="flex-1 bg-gray-50 overflow-auto p-6">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Live Preview</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Updates as you type · Changes are draft until you click Publish
                    </p>
                  </div>
                  <a
                    href={pageConfig?.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-lime-600 hover:text-lime-700 font-medium flex items-center gap-1"
                  >
                    <ExternalLink size={12} /> Open full page
                  </a>
                </div>
                <PreviewFrame label={`${pageConfig?.label} — ${SECTIONS[activePage].find(s => s.id === activeSection)?.label}`}>
                  {renderPreview(activePage, activeSection, sd)}
                </PreviewFrame>

                {/* Context: show other sections dimmed */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Other sections on this page
                  </p>
                  <div className="space-y-2">
                    {SECTIONS[activePage]
                      .filter(s => s.id !== activeSection)
                      .map(sec => (
                        <button
                          key={sec.id}
                          onClick={() => setActiveSection(sec.id)}
                          className="w-full text-left flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          <div className="w-1 h-4 rounded-full bg-gray-200 group-hover:bg-lime-400 transition-colors" />
                          <div>
                            <p className="text-xs font-medium text-gray-600">{sec.label}</p>
                            <p className="text-xs text-gray-400">{sec.hint}</p>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
