'use client';
import { useEffect, useState } from 'react';
import { Save, RefreshCw, CheckCircle } from 'lucide-react';

const defaultContent = {
  home: {
    hero: {
      tagline: 'WELCOME TO BRUTON GARDENS & APARTMENTS',
      title: 'Find Your Perfect Stay at Bruton Gardens & Apartments',
      subtitle: 'Discover luxury living on the outskirts of the city. Experience comfort, style, and convenience at Bruton Gardens & Apartments.',
      primaryCta: 'Booking',
      secondaryCta: 'Schedule Viewing',
    },
    about: {
      heading: 'Experience Luxury Living at Bruton Gardens & Apartments',
      body: 'Discover modern comfort and elegant design in our premium apartments. Each unit is thoughtfully crafted to provide you with the perfect blend of style, functionality, and convenience on the outskirts of the city.',
    },
    services: {
      heading: 'Take The First Step',
      body: 'Discover your perfect home at Bruton Gardens Apartment. Schedule a viewing today and experience luxury living at its finest.',
    },
  },
};

function Field({ label, value, onChange, multiline, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">({hint})</span>}
      </label>
      {multiline ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 resize-none"
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400"
        />
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-5 pb-3 border-b border-gray-100">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export default function ContentPage() {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/content')
      .then((r) => r.json())
      .then((data) => {
        if (data && Object.keys(data).length) {
          setContent(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function setPath(path, value) {
    setContent((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let ref = next;
      for (let i = 0; i < parts.length - 1; i++) {
        ref[parts[i]] = ref[parts[i]] || {};
        ref = ref[parts[i]];
      }
      ref[parts[parts.length - 1]] = value;
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save. Please try again.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setSaving(false);
    }
  }

  const h = content?.home;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Page Content</h1>
          <p className="text-gray-500 text-sm mt-1">Edit headings, body text, and CTAs across the site.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-lime-600 text-sm font-medium">
              <CheckCircle size={16} />
              Saved!
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading content…</div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {/* Hero Banner */}
          <Section title="Home — Hero Banner">
            <Field
              label="Top Tagline"
              value={h?.hero?.tagline}
              onChange={(v) => setPath('home.hero.tagline', v)}
              hint="shown above the main heading"
            />
            <Field
              label="Main Heading"
              value={h?.hero?.title}
              onChange={(v) => setPath('home.hero.title', v)}
            />
            <Field
              label="Subtitle"
              value={h?.hero?.subtitle}
              onChange={(v) => setPath('home.hero.subtitle', v)}
              multiline
            />
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="Primary Button"
                value={h?.hero?.primaryCta}
                onChange={(v) => setPath('home.hero.primaryCta', v)}
                hint="lime button"
              />
              <Field
                label="Secondary Button"
                value={h?.hero?.secondaryCta}
                onChange={(v) => setPath('home.hero.secondaryCta', v)}
                hint="outline button"
              />
            </div>
          </Section>

          {/* About Section */}
          <Section title="Home — About Section">
            <Field
              label="Heading"
              value={h?.about?.heading}
              onChange={(v) => setPath('home.about.heading', v)}
            />
            <Field
              label="Body Text"
              value={h?.about?.body}
              onChange={(v) => setPath('home.about.body', v)}
              multiline
            />
          </Section>

          {/* Services Section */}
          <Section title="Home — Services Section">
            <Field
              label="Heading"
              value={h?.services?.heading}
              onChange={(v) => setPath('home.services.heading', v)}
            />
            <Field
              label="Description"
              value={h?.services?.body}
              onChange={(v) => setPath('home.services.body', v)}
              multiline
            />
          </Section>

          <p className="text-xs text-gray-400 pt-2">
            Changes are saved to the server. Redeploy or refresh the frontend to see updates live.
          </p>
        </div>
      )}
    </div>
  );
}
