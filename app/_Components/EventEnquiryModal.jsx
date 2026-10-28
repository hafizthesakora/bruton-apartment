'use client';
import React, { useState } from 'react';
import { X, PartyPopper, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from './MotionWrapper';
import { EVENT_TYPES } from '@/lib/events/types';

const EMPTY = { name: '', phone: '', email: '', eventType: EVENT_TYPES[0], eventDate: '', headcount: '', cateringRequired: false, notes: '' };
const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-garden/20 focus:outline-none focus:ring-2 focus:ring-brass/30 text-sm bg-white';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function EventEnquiryModal({ isOpen, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const handleClose = () => {
    onClose();
    setForm(EMPTY);
    setError('');
    setResult(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/events/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, headcount: Number(form.headcount) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <button onClick={handleClose} aria-label="Close" className="absolute top-4 right-4 p-2 hover:bg-sand/60 rounded-full transition-colors">
              <X size={24} />
            </button>

            {result ? (
              <div className="text-center py-4">
                <CheckCircle2 size={48} className="text-brass mx-auto mb-4" />
                <h2 className="font-display text-4xl text-garden mb-2">Thanks — we’ve got it!</h2>
                <p className="text-ink/60 text-sm mb-4">
                  Our events team will contact you shortly with a quote. We’ve sent a copy of your enquiry to your phone{form.email ? ' and email' : ''}.
                </p>
                {result.dateBooked && (
                  <p className="bg-amber-50 text-amber-800 text-sm rounded-lg px-4 py-3 mb-4">
                    Heads up: we already have an event on that date. We’ll let you know what’s possible, or suggest nearby dates.
                  </p>
                )}
                <p className="text-xs text-ink/40 mb-6">Your reference: <span className="font-mono font-semibold text-ink/75">{result.reference}</span></p>
                <button onClick={handleClose} className="w-full bg-brass hover:bg-brass-dark text-white font-medium tracking-wide py-3 rounded-full transition-colors">Done</button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <div className="flex items-center gap-3 mb-1">
                  <PartyPopper size={22} className="text-brass-dark" />
                  <h2 className="font-display text-4xl text-garden">Plan an Event</h2>
                </div>
                <p className="text-ink/55 mb-5 text-sm">Tell us about your event and we’ll send you a quote.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block sm:col-span-2">
                    <span className="block text-sm font-medium mb-1">Type of event *</span>
                    <select className={inputCls} value={form.eventType} onChange={set('eventType')}>
                      {EVENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">Event date *</span>
                    <input type="date" className={inputCls} min={todayISO()} required value={form.eventDate} onChange={set('eventDate')} />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">Number of guests *</span>
                    <input type="number" min="1" inputMode="numeric" className={inputCls} required value={form.headcount} onChange={set('headcount')} placeholder="e.g. 120" />
                  </label>
                  <label className="flex items-center gap-2 sm:col-span-2 text-sm py-1">
                    <input type="checkbox" className="accent-[#B08D57] w-4 h-4" checked={form.cateringRequired} onChange={set('cateringRequired')} />
                    I’d like catering arranged through Bruton Gardens
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="block text-sm font-medium mb-1">Full name *</span>
                    <input className={inputCls} required autoComplete="name" value={form.name} onChange={set('name')} />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">Phone *</span>
                    <input type="tel" className={inputCls} required autoComplete="tel" placeholder="+233 …" value={form.phone} onChange={set('phone')} />
                  </label>
                  <label className="block">
                    <span className="block text-sm font-medium mb-1">Email</span>
                    <input type="email" className={inputCls} autoComplete="email" value={form.email} onChange={set('email')} />
                  </label>
                  <label className="block sm:col-span-2">
                    <span className="block text-sm font-medium mb-1">Anything else?</span>
                    <textarea rows={3} className={`${inputCls} resize-none`} placeholder="Timings, decor, equipment, budget…" value={form.notes} onChange={set('notes')} />
                  </label>
                </div>

                {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mt-3 text-sm">{error}</div>}

                <button type="submit" disabled={submitting}
                  className="w-full mt-5 bg-brass hover:bg-brass-dark text-white font-medium tracking-wide py-3 rounded-full transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  Send enquiry
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
