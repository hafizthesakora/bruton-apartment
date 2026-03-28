'use client';
import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Trash2, ChevronUp, ChevronDown, Plus, RefreshCw, CheckCircle, GripVertical } from 'lucide-react';

export default function MediaPage() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  async function loadCarousel() {
    try {
      const res = await fetch('/api/admin/carousel');
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      setError('Failed to load images.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCarousel(); }, []);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImages((prev) => [...prev, data.image]);
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

  async function handleDelete(id) {
    if (!confirm('Remove this image from the carousel?')) return;
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== id));
      }
    } catch {
      setError('Failed to delete image.');
    }
  }

  function moveImage(index, direction) {
    const newImages = [...images];
    const target = index + direction;
    if (target < 0 || target >= newImages.length) return;
    [newImages[index], newImages[target]] = [newImages[target], newImages[index]];
    setImages(newImages);
  }

  function updateAlt(id, value) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, alt: value } : img)));
  }

  function updateCaption(id, value) {
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, caption: value } : img)));
  }

  async function handleSaveOrder() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/carousel', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Image Carousel</h1>
          <p className="text-gray-500 text-sm mt-1">Upload, reorder, and manage carousel images shown in the Services section.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-2 text-lime-600 text-sm font-medium">
              <CheckCircle size={16} />
              Saved!
            </div>
          )}
          {error && <p className="text-red-500 text-sm max-w-xs text-right">{error}</p>}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium px-4 py-2.5 rounded-lg transition-colors text-sm"
          >
            {uploading ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
            {uploading ? 'Uploading…' : 'Add Image'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={handleSaveOrder}
            disabled={saving || loading}
            className="flex items-center gap-2 bg-lime-400 hover:bg-lime-500 disabled:opacity-60 text-slate-900 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading images…</div>
      ) : images.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Upload size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No images in carousel</p>
          <p className="text-gray-400 text-sm mt-1">Click &quot;Add Image&quot; to upload your first image</p>
        </div>
      ) : (
        <div className="space-y-3">
          {images.map((img, index) => (
            <div key={img.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              {/* Drag handle / order indicator */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <span className="text-xs font-bold text-gray-400 w-6 text-center">{index + 1}</span>
                <GripVertical size={16} className="text-gray-300" />
              </div>

              {/* Image preview */}
              <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <Image
                  src={img.src}
                  alt={img.alt || 'Carousel image'}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Fields */}
              <div className="flex-1 grid grid-cols-2 gap-3 min-w-0">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Alt Text</label>
                  <input
                    type="text"
                    value={img.alt || ''}
                    onChange={(e) => updateAlt(img.id, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
                    placeholder="Describe the image"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Caption (optional)</label>
                  <input
                    type="text"
                    value={img.caption || ''}
                    onChange={(e) => updateCaption(img.id, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-lime-400"
                    placeholder="Caption text"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
                  title="Move up"
                >
                  <ChevronUp size={18} />
                </button>
                <button
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-30 transition-colors"
                  title="Move down"
                >
                  <ChevronDown size={18} />
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6">
        Changes to order and alt text require &quot;Save Order&quot; to persist. Deletions and uploads are immediate.
      </p>
    </div>
  );
}
