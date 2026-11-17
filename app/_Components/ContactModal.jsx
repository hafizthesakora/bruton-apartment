'use client';
import React, { useId, useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from './MotionWrapper';

const ContactModal = ({ isOpen, onClose }) => {
  const formId = useId();
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
        <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 z-[90] flex items-end justify-center bg-garden/60 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <DialogPanel as={motion.div}
            data-lenis-prevent
            className="relative max-h-[92svh] w-full max-w-md overflow-y-auto overscroll-contain rounded-[2rem] bg-ivory p-6 text-[#1A1A1A] sm:p-8"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <button type="button" aria-label="Close contact form" onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-sand/60 rounded-full transition-colors">
              <X size={24} />
            </button>
            <DialogTitle className="font-display text-4xl text-garden mb-2 pr-6">Talk to Our Team</DialogTitle>
            <p className="text-gray-700 mb-6">Fill out the form and we&apos;ll get back to you shortly</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={`${formId}-name`} className="mb-2 block text-sm font-medium text-gray-800">Full Name *</label>
                <input type="text" minLength={2} maxLength={120} autoComplete="name" id={`${formId}-name`} name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-garden/30 bg-white text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-brass/30" placeholder="John Doe" required />
              </div>
              <div>
                <label htmlFor={`${formId}-email`} className="mb-2 block text-sm font-medium text-gray-800">Email Address *</label>
                <input type="email" id={`${formId}-email`} name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-garden/30 bg-white text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-brass/30" placeholder="john@example.com" required />
              </div>
              <div>
                <label htmlFor={`${formId}-phone`} className="mb-2 block text-sm font-medium text-gray-800">Phone Number</label>
                <input type="tel" id={`${formId}-phone`} name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-garden/30 bg-white text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-brass/30" placeholder="+233 123 456 789" />
              </div>
              <div>
                <label htmlFor={`${formId}-country`} className="mb-2 block text-sm font-medium text-gray-800">Country</label>
                <input type="text" id={`${formId}-country`} name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-3 rounded-2xl border border-garden/30 bg-white text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-brass/30" placeholder="e.g. Ghana" />
              </div>
              <div>
                <label htmlFor={`${formId}-message`} className="mb-2 block text-sm font-medium text-gray-800">Message *</label>
                <textarea id={`${formId}-message`} name="message" value={formData.message} onChange={handleChange} rows="4" maxLength={5000} className="w-full px-4 py-3 rounded-2xl border border-garden/30 bg-white text-gray-900 placeholder:text-gray-500 placeholder:opacity-100 focus:outline-none focus:ring-2 focus:ring-brass/30 resize-none" placeholder="Tell us what you're looking for..." required />
              </div>
              {submitStatus === 'success' && <div role="status" className="bg-sage/20 text-garden px-4 py-3 rounded-lg">Message sent! Our team will get back to you shortly.</div>}
              {submitStatus === 'error' && <div role="alert" className="bg-red-100 text-red-700 px-4 py-3 rounded-lg">Failed to send message. Please try again.</div>}
              <button type="submit" disabled={isSubmitting || !formData.name || !formData.email || !formData.message} className="w-full bg-garden hover:bg-garden-light text-white font-medium tracking-wide py-3 rounded-full transition-colors disabled:opacity-75 disabled:cursor-not-allowed">
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </DialogPanel>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default ContactModal;
