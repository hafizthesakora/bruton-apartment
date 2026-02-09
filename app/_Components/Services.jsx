'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  CreditCard,
  Navigation,
  X,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Download,
} from 'lucide-react';
import { FadeIn, motion, AnimatePresence } from './MotionWrapper';

const carouselImages = [
  '/assets/BRTN GRDN-1.JPEG',
  '/assets/BRTN GRDN-22.JPG',
  '/assets/BRTN GRDN-26.JPG',
  '/assets/BRTN GRDN-6.JPEG',
  '/assets/BRTN GRDN-27.JPG',
];

// ── Contact Modal (WhatsApp) ────────────────────────────────────────────────

const ContactModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
    try {
      const msg = encodeURIComponent(
        `Hello Bruton Gardens!\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone || 'Not provided'}\n\nMessage:\n${formData.message}`
      );
      window.open(`https://wa.me/233123456789?text=${msg}`, '_blank');
      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        setFormData({ name: '', email: '', phone: '', message: '' });
        setSubmitStatus(null);
      }, 2000);
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-3xl max-w-md w-full p-8 relative"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
          >
            <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-3xl font-semibold mb-2">Talk to Our Agent</h2>
            <p className="text-gray-500 mb-6">Fill out the form and we&apos;ll get back to you shortly</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400" placeholder="John Doe" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400" placeholder="john@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400" placeholder="+233 123 456 789" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Message *</label>
                <textarea name="message" value={formData.message} onChange={handleChange} rows="4" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none" placeholder="Tell us what you're looking for..." required />
              </div>
              {submitStatus === 'success' && <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg">Message sent successfully!</div>}
              {submitStatus === 'error' && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg">Failed to send message. Please try again.</div>}
              <button onClick={handleSubmit} disabled={isSubmitting || !formData.name || !formData.email || !formData.message} className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ── Booking Calendar Modal ──────────────────────────────────────────────────

const BRUTON_WHATSAPP = '233123456789';
const BRUTON_EMAIL = 'bookings@brutongardens.com';

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function formatICSDate(date) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function generateICS({ title, startDate, endDate, description, location, organizerEmail, attendeeEmail, attendeeName }) {
  const now = formatICSDate(new Date());
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@brutongardens.com`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bruton Gardens//Booking System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    `ORGANIZER;CN=Bruton Gardens:mailto:${organizerEmail}`,
    `ATTENDEE;CN=${attendeeName};RSVP=TRUE:mailto:${attendeeEmail}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Bruton Gardens Viewing in 30 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadICS(icsContent, filename) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function buildGoogleCalendarUrl({ title, startDate, endDate, description, location }) {
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.set('action', 'TEMPLATE');
  url.searchParams.set('text', title);
  url.searchParams.set('dates', `${formatICSDate(startDate)}/${formatICSDate(endDate)}`);
  url.searchParams.set('details', description);
  url.searchParams.set('location', location);
  return url.toString();
}

const BookingModal = ({ isOpen, onClose }) => {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [viewingType, setViewingType] = useState('physical');
  const [step, setStep] = useState(1); // 1 = calendar, 2 = details, 3 = confirmation
  const [bookingData, setBookingData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [calendarLinks, setCalendarLinks] = useState({ google: '', icsContent: '' });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const isPastDate = (day) => {
    const date = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const handleDateSelect = (day) => {
    if (isPastDate(day)) return;
    setSelectedDate(new Date(currentYear, currentMonth, day));
    setSelectedTime(null);
  };

  const handleChange = (e) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const viewingLabel = viewingType === 'virtual' ? 'Virtual Demo' : 'Physical Viewing';
      const dateStr = selectedDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

      const startDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

      const location = viewingType === 'physical' ? 'Bruton Gardens Apartment' : 'Virtual (link will be shared)';
      const title = `Bruton Gardens - ${viewingLabel}`;
      const description = `Viewing Type: ${viewingLabel}\nGuest: ${bookingData.name}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phone}\nDate: ${dateStr}\nTime: ${selectedTime}\nNotes: ${bookingData.notes || 'None'}`;

      // Format date for API: YYYY-MM-DD
      const apiDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

      // Try direct Google Calendar API first
      let apiSuccess = false;
      try {
        const res = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: bookingData.name,
            email: bookingData.email,
            phone: bookingData.phone,
            notes: bookingData.notes,
            date: apiDate,
            time: selectedTime,
            viewingType,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          apiSuccess = true;
        }
      } catch {
        // API not available, fall through to .ics fallback
      }

      // Generate .ics as backup (always available)
      const icsContent = generateICS({
        title,
        startDate,
        endDate,
        description,
        location,
        organizerEmail: BRUTON_EMAIL,
        attendeeEmail: bookingData.email,
        attendeeName: bookingData.name,
      });

      const googleUrl = buildGoogleCalendarUrl({ title, startDate, endDate, description, location });

      if (!apiSuccess) {
        // Fallback: auto-download .ics file for user's calendar
        downloadICS(icsContent, `bruton-gardens-viewing-${apiDate}.ics`);

        // Notify Bruton via WhatsApp
        const whatsappMsg = encodeURIComponent(
          `NEW BOOKING\n\nGuest: ${bookingData.name}\nEmail: ${bookingData.email}\nPhone: ${bookingData.phone}\nType: ${viewingLabel}\nDate: ${dateStr}\nTime: ${selectedTime}\nNotes: ${bookingData.notes || 'None'}`
        );
        window.open(`https://wa.me/${BRUTON_WHATSAPP}?text=${whatsappMsg}`, '_blank');
      }

      setCalendarLinks({ google: googleUrl, icsContent, apiSuccess });
      setSubmitStatus('success');
      setStep(3);
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setSelectedDate(null);
    setSelectedTime(null);
    setSubmitStatus(null);
    setCalendarLinks({ google: '', icsContent: '' });
    setBookingData({ name: '', email: '', phone: '', notes: '' });
  };

  const canGoBack = currentYear > today.getFullYear() || (currentYear === today.getFullYear() && currentMonth > today.getMonth());

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
            <button onClick={handleClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-semibold mb-1">Book a Viewing</h2>
            <p className="text-gray-500 mb-5 text-sm">
              {step === 3 ? 'Your booking is confirmed!' : 'Select a date, time, and provide your details'}
            </p>

            {/* Viewing Type Toggle */}
            {step < 3 && (
              <div className="flex gap-3 mb-5">
                <button onClick={() => setViewingType('physical')} className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all text-sm ${viewingType === 'physical' ? 'border-lime-400 bg-lime-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <div className="flex items-center justify-center gap-2">
                    <MapPin size={16} className={viewingType === 'physical' ? 'text-lime-600' : 'text-gray-600'} />
                    <span className={`font-medium ${viewingType === 'physical' ? 'text-lime-600' : 'text-gray-600'}`}>Physical Viewing</span>
                  </div>
                </button>
                <button onClick={() => setViewingType('virtual')} className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all text-sm ${viewingType === 'virtual' ? 'border-lime-400 bg-lime-50' : 'border-gray-300 hover:border-gray-400'}`}>
                  <div className="flex items-center justify-center gap-2">
                    <Video size={16} className={viewingType === 'virtual' ? 'text-lime-600' : 'text-gray-600'} />
                    <span className={`font-medium ${viewingType === 'virtual' ? 'text-lime-600' : 'text-gray-600'}`}>Virtual Demo</span>
                  </div>
                </button>
              </div>
            )}

            {/* Step indicator */}
            <div className="flex gap-2 mb-5">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-lime-400' : 'bg-gray-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-lime-400' : 'bg-gray-200'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-lime-400' : 'bg-gray-200'}`} />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  {/* Calendar */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={prevMonth} disabled={!canGoBack} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft size={18} />
                      </button>
                      <h3 className="font-semibold text-lg">{monthNames[currentMonth]} {currentYear}</h3>
                      <button onClick={nextMonth} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-gray-500 py-1">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                        const past = isPastDate(day);
                        const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth && selectedDate.getFullYear() === currentYear;
                        const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                        return (
                          <button
                            key={day}
                            onClick={() => handleDateSelect(day)}
                            disabled={past}
                            className={`h-9 w-full rounded-lg text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-lime-400 text-gray-900 shadow-md'
                                : isToday
                                  ? 'bg-lime-100 text-lime-700 hover:bg-lime-200'
                                  : past
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-700 hover:bg-lime-50'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          {selectedDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {timeSlots.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                              selectedTime === time
                                ? 'bg-lime-400 text-gray-900 shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-lime-50'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  {/* Summary */}
                  <div className="bg-lime-50 rounded-xl p-4 mb-4 flex items-center gap-3">
                    <CalendarIcon size={20} className="text-lime-600" />
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {selectedDate?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">{selectedTime} &middot; {viewingType === 'physical' ? 'Physical Viewing' : 'Virtual Demo'}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="ml-auto text-sm text-lime-600 hover:underline">Change</button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input type="text" name="name" value={bookingData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm" placeholder="John Doe" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email Address *</label>
                      <input type="email" name="email" value={bookingData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm" placeholder="john@example.com" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <input type="tel" name="phone" value={bookingData.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 text-sm" placeholder="+233 123 456 789" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Notes</label>
                      <textarea name="notes" value={bookingData.notes} onChange={handleChange} rows="2" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none text-sm" placeholder="Any specific requirements..." />
                    </div>
                  </div>

                  {submitStatus === 'error' && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mt-3 text-sm">Failed to book. Please try again.</div>}

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-colors hover:bg-gray-50">
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !bookingData.name || !bookingData.email || !bookingData.phone}
                      className="flex-1 bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                  {/* Confirmation Screen */}
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-lime-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon size={32} className="text-lime-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Booking Confirmed!</h3>
                    <p className="text-gray-500 text-sm mb-6">
                      {calendarLinks.apiSuccess
                        ? 'Your viewing has been added to the Bruton Gardens calendar. A calendar invite has been sent to your email.'
                        : 'Your viewing has been scheduled. A calendar file has been downloaded to your device — open it to add the event to your calendar.'}
                    </p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <CalendarIcon size={18} className="text-lime-600" />
                        <p className="font-medium text-sm">
                          {selectedDate?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <Clock size={18} className="text-lime-600" />
                        <p className="text-sm text-gray-600">{selectedTime} (1 hour)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {viewingType === 'physical' ? <MapPin size={18} className="text-lime-600" /> : <Video size={18} className="text-lime-600" />}
                        <p className="text-sm text-gray-600">{viewingType === 'physical' ? 'Bruton Gardens Apartment' : 'Virtual Demo (link will be shared)'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-4">Add to your preferred calendar:</p>

                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => window.open(calendarLinks.google, '_blank')}
                        className="flex-1 bg-white border-2 border-gray-200 hover:border-lime-400 text-gray-700 font-medium py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <CalendarIcon size={16} />
                        Google Calendar
                      </button>
                      <button
                        onClick={() => downloadICS(calendarLinks.icsContent, `bruton-viewing-${selectedDate?.toISOString().slice(0, 10)}.ics`)}
                        className="flex-1 bg-white border-2 border-gray-200 hover:border-lime-400 text-gray-700 font-medium py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        Download .ics
                      </button>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ── Image Carousel ──────────────────────────────────────────────────────────

const ImageCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={carouselImages[current]}
            alt={`Bruton Gardens ${current + 1}`}
            fill
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
        {carouselImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-lime-400 w-5' : 'bg-white/60'}`}
          />
        ))}
      </div>
    </div>
  );
};

// ── Main Services Component ─────────────────────────────────────────────────

const Services = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <div id="services-section" className="container mx-auto py-20 p-8">
      <div className="pb-16 space-y-5">
        <FadeIn direction="up">
          <h1 className="text-4xl md:text-5xl font-semibold capitalize">
            Take The First <span className="text-lime-400">Step</span>
          </h1>
        </FadeIn>
        <FadeIn direction="up" delay={0.1}>
          <p className="text-lg text-gray-500">
            Discover your perfect home at Bruton Gardens Apartment. Schedule a
            viewing today and experience luxury living at its finest.
          </p>
        </FadeIn>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-center">
        {/* Left — Video */}
        <FadeIn direction="right" delay={0.1}>
          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-[400px] md:h-[520px] object-cover"
            >
              <source src="/assets/bruton-vid.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <p className="text-sm font-medium opacity-80">Experience</p>
              <h3 className="text-2xl font-bold">Bruton Gardens</h3>
            </div>
          </div>
        </FadeIn>

        {/* Right — Carousel + Action Buttons */}
        <FadeIn direction="left" delay={0.2}>
          <div className="space-y-6">
            <ImageCarousel />

            <div className="grid grid-cols-2 gap-4">
              <motion.div
                onClick={() => setContactModalOpen(true)}
                className="p-6 rounded-2xl bg-gray-100 text-center flex flex-col items-center space-y-3 hover:bg-lime-400 hover:text-white cursor-pointer transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Navigation size={32} className="p-1.5 rounded-lg bg-gray-200 text-black" />
                <h3 className="font-medium text-lg">Talk to our Agent</h3>
                <p className="text-sm opacity-80">Speak to someone from our team</p>
              </motion.div>

              <motion.div
                onClick={() => setBookingModalOpen(true)}
                className="p-6 rounded-2xl bg-gray-100 text-center flex flex-col items-center space-y-3 hover:bg-lime-400 hover:text-white cursor-pointer transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <CreditCard size={32} className="p-1.5 rounded-lg bg-gray-200 text-black" />
                <h3 className="font-medium text-lg">Book a Viewing</h3>
                <p className="text-sm opacity-80">Schedule a visit on our calendar</p>
              </motion.div>
            </div>
          </div>
        </FadeIn>
      </div>

      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
      <BookingModal isOpen={bookingModalOpen} onClose={() => setBookingModalOpen(false)} />
    </div>
  );
};

export default Services;
