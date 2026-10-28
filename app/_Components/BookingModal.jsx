'use client';
import React, { useState, useMemo } from 'react';
import {
  X,
  Video,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from './MotionWrapper';

const BRUTON_EMAIL = 'info@brutongardens.com';

function toApiDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

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

const BookingModal = ({ isOpen, onClose, defaultViewingType = 'physical' }) => {
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [viewingType, setViewingType] = useState(defaultViewingType);
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({ name: '', email: '', phone: '', notes: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [calendarLinks, setCalendarLinks] = useState({ google: '', icsContent: '' });
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const loadSlots = async (date) => {
    setSlotsLoading(true);
    try {
      const res = await fetch(`/api/viewings/slots?date=${toApiDate(date)}`);
      const data = await res.json();
      setSlots(res.ok ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateSelect = (day) => {
    if (isPastDate(day)) return;
    const date = new Date(currentYear, currentMonth, day);
    setSelectedDate(date);
    setSelectedTime(null);
    loadSlots(date);
  };

  const handleChange = (e) => {
    setBookingData({ ...bookingData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');
    try {
      const apiDate = toApiDate(selectedDate);
      const res = await fetch('/api/viewings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookingData, date: apiDate, time: selectedTime, type: viewingType }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        // Someone took the slot in the meantime — back to the calendar with fresh availability.
        setErrorMessage(data.error);
        setSelectedTime(null);
        setStep(1);
        loadSlots(selectedDate);
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Failed to book. Please try again.');

      const viewingLabel = viewingType === 'virtual' ? 'Virtual Demo' : 'Physical Viewing';
      const startDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      const location = viewingType === 'physical' ? 'Bruton Gardens Apartment' : 'Virtual (link will be shared)';
      const title = `Bruton Gardens - ${viewingLabel}`;
      const description = `${viewingLabel} at Bruton Gardens & Apartments\nName: ${bookingData.name}\nPhone: ${bookingData.phone}`;
      const event = { title, startDate, endDate, description, location };

      setCalendarLinks({
        google: buildGoogleCalendarUrl(event),
        icsContent: generateICS({ ...event, organizerEmail: BRUTON_EMAIL, attendeeEmail: bookingData.email, attendeeName: bookingData.name }),
      });
      setSubmitStatus('success');
      setStep(3);
    } catch (err) {
      setErrorMessage(err.message);
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
    setSlots([]);
    setErrorMessage('');
    setBookingData({ name: '', email: '', phone: '', notes: '' });
    setViewingType(defaultViewingType);
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
            <button onClick={handleClose} className="absolute top-4 right-4 p-2 hover:bg-sand/60 rounded-full transition-colors">
              <X size={24} />
            </button>

            <h2 className="font-display text-4xl text-garden mb-1">Book a Viewing</h2>
            <p className="text-ink/55 mb-5 text-sm">
              {step === 3 ? 'Your booking is confirmed!' : 'Select a date, time, and provide your details'}
            </p>

            {step < 3 && (
              <div className="flex gap-3 mb-5">
                <button onClick={() => setViewingType('physical')} className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all text-sm ${viewingType === 'physical' ? 'border-brass bg-brass/10' : 'border-garden/20 hover:border-ink/40'}`}>
                  <div className="flex items-center justify-center gap-2">
                    <MapPin size={16} className={viewingType === 'physical' ? 'text-brass-dark' : 'text-ink/60'} />
                    <span className={`font-medium ${viewingType === 'physical' ? 'text-brass-dark' : 'text-ink/60'}`}>Physical Viewing</span>
                  </div>
                </button>
                <button onClick={() => setViewingType('virtual')} className={`flex-1 py-2.5 px-3 rounded-lg border-2 transition-all text-sm ${viewingType === 'virtual' ? 'border-brass bg-brass/10' : 'border-garden/20 hover:border-ink/40'}`}>
                  <div className="flex items-center justify-center gap-2">
                    <Video size={16} className={viewingType === 'virtual' ? 'text-brass-dark' : 'text-ink/60'} />
                    <span className={`font-medium ${viewingType === 'virtual' ? 'text-brass-dark' : 'text-ink/60'}`}>Virtual Demo</span>
                  </div>
                </button>
              </div>
            )}

            <div className="flex gap-2 mb-5">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-brass' : 'bg-sand'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-brass' : 'bg-sand'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-brass' : 'bg-sand'}`} />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                  <div className="bg-sand/40 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <button onClick={prevMonth} disabled={!canGoBack} className="p-1.5 hover:bg-sand rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft size={18} />
                      </button>
                      <h3 className="font-display text-2xl text-garden">{monthNames[currentMonth]} {currentYear}</h3>
                      <button onClick={nextMonth} className="p-1.5 hover:bg-sand rounded-lg transition-colors">
                        <ChevronRight size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-xs font-medium text-ink/55 py-1">{d}</div>
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
                                ? 'bg-brass text-white shadow-md'
                                : isToday
                                  ? 'bg-brass/15 text-brass-dark hover:bg-brass/30'
                                  : past
                                    ? 'text-ink/30 cursor-not-allowed'
                                    : 'text-ink/75 hover:bg-brass/10'
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedDate && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={16} className="text-ink/55" />
                        <span className="text-sm font-medium text-ink/75">
                          {selectedDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {slotsLoading ? (
                        <p className="text-sm text-ink/40 py-3">Checking available times…</p>
                      ) : slots.some((s) => s.available) ? (
                        <div className="grid grid-cols-3 gap-2">
                          {slots.map(({ time, available }) => (
                            <button
                              key={time}
                              onClick={() => setSelectedTime(time)}
                              disabled={!available}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                selectedTime === time
                                  ? 'bg-brass text-white shadow-md'
                                  : available
                                    ? 'bg-sand/60 text-ink/75 hover:bg-brass/10'
                                    : 'bg-sand/40 text-ink/30 line-through cursor-not-allowed'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-ink/55 py-3">No times left on this day — please pick another date.</p>
                      )}
                    </motion.div>
                  )}

                  {errorMessage && <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-lg mb-3 text-sm">{errorMessage}</div>}

                  <button
                    onClick={() => { setErrorMessage(''); setStep(2); }}
                    disabled={!selectedDate || !selectedTime}
                    className="w-full bg-brass hover:bg-brass-dark text-white font-medium tracking-wide py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <div className="bg-brass/10 rounded-xl p-4 mb-4 flex items-center gap-3">
                    <CalendarIcon size={20} className="text-brass-dark" />
                    <div>
                      <p className="font-medium text-sm text-garden">
                        {selectedDate?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-ink/60">{selectedTime} &middot; {viewingType === 'physical' ? 'Physical Viewing' : 'Virtual Demo'}</p>
                    </div>
                    <button onClick={() => setStep(1)} className="ml-auto text-sm text-brass-dark hover:underline">Change</button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input type="text" name="name" value={bookingData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-garden/20 focus:outline-none focus:ring-2 focus:ring-brass/30 text-sm" placeholder="John Doe" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email Address *</label>
                      <input type="email" name="email" value={bookingData.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-garden/20 focus:outline-none focus:ring-2 focus:ring-brass/30 text-sm" placeholder="john@example.com" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <input type="tel" name="phone" value={bookingData.phone} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-garden/20 focus:outline-none focus:ring-2 focus:ring-brass/30 text-sm" placeholder="+233 123 456 789" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Additional Notes</label>
                      <textarea name="notes" value={bookingData.notes} onChange={handleChange} rows="2" className="w-full px-4 py-2.5 rounded-lg border border-garden/20 focus:outline-none focus:ring-2 focus:ring-brass/30 resize-none text-sm" placeholder="Any specific requirements..." />
                    </div>
                  </div>

                  {submitStatus === 'error' && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mt-3 text-sm">{errorMessage || 'Failed to book. Please try again.'}</div>}

                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setStep(1)} className="flex-1 border-2 border-garden/20 text-ink/75 font-semibold py-3 rounded-lg transition-colors hover:bg-sand/50">
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !bookingData.name || !bookingData.email || !bookingData.phone}
                      className="flex-1 bg-brass hover:bg-brass-dark text-white font-medium tracking-wide py-3 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-brass/15 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon size={32} className="text-brass-dark" />
                    </div>
                    <h3 className="font-display text-3xl text-garden mb-2">Booking Confirmed!</h3>
                    <p className="text-ink/55 text-sm mb-6">
                      We&apos;ve booked your slot and sent the details to your email and phone. See you then!
                    </p>

                    <div className="bg-sand/40 rounded-xl p-4 mb-6 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <CalendarIcon size={18} className="text-brass-dark" />
                        <p className="font-medium text-sm">
                          {selectedDate?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <Clock size={18} className="text-brass-dark" />
                        <p className="text-sm text-ink/60">{selectedTime} (1 hour)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {viewingType === 'physical' ? <MapPin size={18} className="text-brass-dark" /> : <Video size={18} className="text-brass-dark" />}
                        <p className="text-sm text-ink/60">{viewingType === 'physical' ? 'Bruton Gardens Apartment' : 'Virtual Demo (link will be shared)'}</p>
                      </div>
                    </div>

                    <p className="text-xs text-ink/40 mb-4">Add to your preferred calendar:</p>

                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => window.open(calendarLinks.google, '_blank')}
                        className="flex-1 bg-white border-2 border-garden/15 hover:border-brass text-ink/75 font-medium py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <CalendarIcon size={16} />
                        Google Calendar
                      </button>
                      <button
                        onClick={() => downloadICS(calendarLinks.icsContent, `bruton-viewing-${selectedDate?.toISOString().slice(0, 10)}.ics`)}
                        className="flex-1 bg-white border-2 border-garden/15 hover:border-brass text-ink/75 font-medium py-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        Download .ics
                      </button>
                    </div>

                    <button
                      onClick={handleClose}
                      className="w-full bg-brass hover:bg-brass-dark text-white font-medium tracking-wide py-3 rounded-full transition-colors"
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

export default BookingModal;
