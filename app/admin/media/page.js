'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload, Trash2, ChevronUp, ChevronDown, Plus, RefreshCw,
  CheckCircle, GripVertical, Images, PlusCircle, X,
} from 'lucide-react';

const CAROUSEL_LABELS = {
  'home-services': 'Home — Services Carousel',
  'about-slideshow': 'About — Story Slideshow',
};

export default function MediaPage() {
  const [allCarousels, setAllCarousels] = useState({});
  const [activeCarousel, setActiveCarousel] = useState('home-services');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showNewCarousel, setShowNewCarousel] = useState(false);
  const [newCarouselName, setNewCarouselName] = useState('');
  const [newCarouselLabel, setNewCarouselLabel] = useState('');
  const fileRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/carousel');
      const data = await res.json();
      setAllCarousels(data || {});
      if (Object.keys(data).length && !data[activeCarousel]) {
        setActiveCarousel(Object.keys(data)[0]);
      }
    } catch {
      setError('Failed to load carousels.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const images = allCarousels[activeCarousel]?.images || [];

  function setImages(newImages) {
    setAllCarousels(prev => ({
      ...prev,
      [activeCarousel]: { ...prev[activeCarousel], images: newImages },
    }));
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('carousel', activeCarousel);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImages([...images, data.image]);
      } else {
        setError(data.error || 'Upload failed.');
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleDelete(imageId) {
    if (!confirm('Remove this image?')) return;
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeCarousel, imageId }),
      });
      if (res.ok) setImages(images.filter(img => img.id !== imageId));
    } catch {
      setError('Failed to delete image.');
    }
  }

  async function handleDeleteCarousel(name) {
    if (!confirm(`Delete the entire "${allCarousels[name]?.label || name}" carousel? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, deleteCarousel: true }),
      });
      if (res.ok) {
        const updated = { ...allCarousels };
        delete updated[name];
        setAllCarousels(updated);
        setActiveCarousel(Object.keys(updated)[0] || '');
      }
    } catch {
      setError('Failed to delete carousel.');
    }
  }

  async function handleCreateCarousel() {
    if (!newCarouselName.trim()) return;
    const slug = newCarouselName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: slug, label: newCarouselLabel || newCarouselName }),
      });
      if (res.ok) {
        setAllCarousels(prev => ({ ...prev, [slug]: { label: newCarouselLabel || newCarouselName, images: [] } }));
        setActiveCarousel(slug);
        setShowNewCarousel(false);
        setNewCarouselName('');
        setNewCarouselLabel('');
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to create.');
      }
    } catch {
      setError('Failed to create carousel.');
    }
  }

  function moveImage(index, direction) {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  }

  function updateField(id, key, value) {
    setImages(images.map(img => img.id === id ? { ...img, [key]: value } : img));
  }

  async function handleSaveOrder() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeCarousel, carousel: allCarousels[activeCarousel] }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Failed to save.');
      }
    } catch {
      setError('Connection error.');
    } finally {
      setSaving(false);
    }
  }

  const carouselKeys = Object.keys(allCarousels);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Image Carousels</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all image carousels and slideshows across the site.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <div className="flex items-center gap-2 text-lime-600 text-sm font-medium"><CheckCircle size={16} /> Saved!</div>}
          {error && <p className="text-red-500 text-sm max-w-xs text-right">{error}</p>}
          <button
            onClick={() => setShowNewCarousel(true)}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-lg text-sm"
          >
            <PlusCircle size={15} /> New Carousel
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading || !activeCarousel}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-lg text-sm"
          >
            {uploading ? <RefreshCw size={15} className="animate-spin" /> : <Plus size={15} />}
            {uploading ? 'Uploading…' : 'Add Image'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          <button
            onClick={handleSaveOrder}
            disabled={saving || loading || !activeCarousel}
            className="flex items-center gap-2 bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm"
          >
            {saving ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle size={15} />}
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </div>

      {/* New carousel modal */}
      {showNewCarousel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">New Carousel</h3>
              <button onClick={() => setShowNewCarousel(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Display Label</label>
                <input
                  type="text"
                  placeholder="e.g. Gallery Page Carousel"
                  value={newCarouselLabel}
                  onChange={e => setNewCarouselLabel(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Slug / ID <span className="text-gray-400">(auto-generated from label)</span></label>
                <input
                  type="text"
                  placeholder="e.g. gallery-page"
                  value={newCarouselName}
                  onChange={e => setNewCarouselName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-lime-400"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCreateCarousel} className="flex-1 bg-lime-400 hover:bg-lime-500 text-slate-900 font-semibold py-2.5 rounded-lg text-sm">Create</button>
              <button onClick={() => setShowNewCarousel(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Carousel tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {carouselKeys.map(key => (
          <button
            key={key}
            onClick={() => setActiveCarousel(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
              activeCarousel === key
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <Images size={14} />
            {allCarousels[key]?.label || CAROUSEL_LABELS[key] || key}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeCarousel === key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {allCarousels[key]?.images?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Carousel header */}
      {activeCarousel && allCarousels[activeCarousel] && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">{allCarousels[activeCarousel]?.label || activeCarousel}</h2>
            <p className="text-xs text-gray-400">Slug: <code className="bg-gray-100 px-1 rounded">{activeCarousel}</code></p>
          </div>
          {!['home-services', 'about-slideshow'].includes(activeCarousel) && (
            <button
              onClick={() => handleDeleteCarousel(activeCarousel)}
              className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 size={13} /> Delete carousel
            </button>
          )}
        </div>
      )}

      {/* Images list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : !activeCarousel || images.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Upload size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No images in this carousel</p>
          <p className="text-gray-400 text-sm mt-1">Click &quot;Add Image&quot; to upload</p>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((img, index) => (
            <div key={img.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className="text-xs font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                <GripVertical size={16} className="text-gray-300" />
              </div>
              <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <Image src={img.src} alt={img.alt || 'Image'} fill className="object-cover" />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Alt Text</label>
                  <input
                    type="text"
                    value={img.alt || ''}
                    onChange={e => updateField(img.id, 'alt', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
                    placeholder="Describe the image"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Caption (optional)</label>
                  <input
                    type="text"
                    value={img.caption || ''}
                    onChange={e => updateField(img.id, 'caption', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
                    placeholder="Caption text"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => moveImage(index, -1)} disabled={index === 0} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30">
                  <ChevronUp size={18} />
                </button>
                <button onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30">
                  <ChevronDown size={18} />
                </button>
                <button onClick={() => handleDelete(img.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-400 mt-4">Reorder/alt text changes require Save. Deletions and uploads are immediate.</p>
    </div>
  );
}
