'use client';
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from './MotionWrapper';

const ContactModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitStatus('success');
        setTimeout(() => {
          onClose();
          setFormData({ name: '', email: '', phone: '', country: '', message: '' });
          setSubmitStatus(null);
        }, 2500);
      } else {
        setSubmitStatus('error');
      }
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-garden/60 p-3 backdrop-blur-sm sm:items-center sm:p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div
            data-lenis-prevent
            className="relative max-h-[92svh] w-full max-w-md overflow-y-auto overscroll-contain rounded-[2rem] bg-ivory p-6 text-ink sm:p-8"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-sand/60 rounded-full transition-colors">
              <X size={24} />
            </button>
            <h2 className="font-display text-4xl text-garden mb-2">Talk to Our Agent</h2>
            <p className="text-ink/55 mb-6">Fill out the form and we&apos;ll get back to you shortly</p>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-ink/75">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-garden/20 bg-white focus:outline-none focus:ring-2 focus:ring-brass/30" placeholder="John Doe" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink/75">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-garden/20 bg-white focus:outline-none focus:ring-2 focus:ring-brass/30" placeholder="john@example.com" required />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink/75">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-garden/20 bg-white focus:outline-none focus:ring-2 focus:ring-brass/30" placeholder="+233 123 456 789" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink/75">Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-garden/20 bg-white focus:outline-none focus:ring-2 focus:ring-brass/30" placeholder="e.g. Ghana" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-ink/75">Message *</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows="4" className="w-full px-4 py-3 rounded-2xl border border-garden/20 bg-white focus:outline-none focus:ring-2 focus:ring-brass/30 resize-none" placeholder="Tell us what you're looking for..." required />
              </div>
              {submitStatus === 'success' && <div className="bg-sage/20 text-garden px-4 py-3 rounded-lg">Message sent! Our team will get back to you shortly.</div>}
              {submitStatus === 'error' && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg">Failed to send message. Please try again.</div>}
              <button onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.email || !formData.message} className="w-full bg-brass hover:bg-brass-dark text-white font-medium tracking-wide py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
