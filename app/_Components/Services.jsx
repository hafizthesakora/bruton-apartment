import React, { useState } from 'react';
import {
  CreditCard,
  Navigation,
  X,
  Calendar,
  Video,
  MapPin,
} from 'lucide-react';

const servicesData = [
  {
    image: '/assets/BRTN GRDN-1.JPEG',

    buttonColor: 'bg-primary',
    actions: [
      {
        icon: (
          <Navigation
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: 'Talk to our Agent',
        description: 'Speak to someone from our team',
        type: 'contact',
      },
      {
        icon: (
          <CreditCard
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: 'Book for viewing',
        description: 'Budget On Rent',
        type: 'booking',
      },
    ],
  },
  {
    image: '/assets/BRTN GRDN-26.JPG',

    buttonColor: 'bg-lime-400',
    actions: [
      {
        icon: (
          <Navigation
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: 'Talk to our Agent',
        description: 'Speak to someone from our team',
        type: 'contact',
      },
      {
        icon: (
          <CreditCard
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: 'Book for viewing',
        description: 'Budget On Rent',
        type: 'booking',
      },
    ],
  },
  {
    image: '/assets/BRTN GRDN-27.JPG',

    buttonColor: 'bg-lime-400',
    actions: [
      {
        icon: (
          <Navigation
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: 'Talk to our Agent',
        description: 'Speak to someone from our team',
        type: 'contact',
      },
      {
        icon: (
          <CreditCard
            size={36}
            className="p-2 rounded-lg bg-gray-200 text-black"
          />
        ),
        title: 'Book for viewing',
        description: 'Budget On Rent',
        type: 'booking',
      },
    ],
  },
];

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending email (replace with your actual email service)
    try {
      // Example: You would integrate with EmailJS, SendGrid, or your backend API here
      console.log('Sending email with data:', formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        setFormData({ name: '', email: '', phone: '', message: '' });
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-semibold mb-2">Talk to Our Agent</h2>
        <p className="text-gray-500 mb-6">
          Fill out the form and we'll get back to you shortly
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
              placeholder="+233 123 456 789"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Message *</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
              placeholder="Tell us what you're looking for..."
              required
            />
          </div>

          {submitStatus === 'success' && (
            <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg">
              Message sent successfully!
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg">
              Failed to send message. Please try again.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !formData.name ||
              !formData.email ||
              !formData.message
            }
            className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingModal = ({ isOpen, onClose }) => {
  const [viewingType, setViewingType] = useState('virtual');
  const [bookingData, setBookingData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    setBookingData({
      ...bookingData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would integrate with your calendar API (Google Calendar, Calendly, etc.)
      console.log('Booking data:', { ...bookingData, viewingType });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        setBookingData({
          name: '',
          email: '',
          phone: '',
          date: '',
          time: '',
          notes: '',
        });
        setSubmitStatus(null);
      }, 2000);
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 relative animate-fadeIn max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-semibold mb-2">Book a Viewing</h2>
        <p className="text-gray-500 mb-6">
          Choose your preferred viewing type and select a time slot
        </p>

        {/* Viewing Type Toggle */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setViewingType('virtual')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
              viewingType === 'virtual'
                ? 'border-lime-400 bg-lime-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Video
                size={20}
                className={
                  viewingType === 'virtual' ? 'text-lime-600' : 'text-gray-600'
                }
              />
              <span
                className={`font-medium ${
                  viewingType === 'virtual' ? 'text-lime-600' : 'text-gray-600'
                }`}
              >
                Virtual Demo
              </span>
            </div>
          </button>

          <button
            onClick={() => setViewingType('physical')}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
              viewingType === 'physical'
                ? 'border-lime-400 bg-lime-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MapPin
                size={20}
                className={
                  viewingType === 'physical' ? 'text-lime-600' : 'text-gray-600'
                }
              />
              <span
                className={`font-medium ${
                  viewingType === 'physical' ? 'text-lime-600' : 'text-gray-600'
                }`}
              >
                Physical Viewing
              </span>
            </div>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={bookingData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={bookingData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={bookingData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
              placeholder="+233 123 456 789"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <input
                type="date"
                name="date"
                value={bookingData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time *</label>
              <input
                type="time"
                name="time"
                value={bookingData.time}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={bookingData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-lime-400 resize-none"
              placeholder="Any specific requirements or questions..."
            />
          </div>

          {submitStatus === 'success' && (
            <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg">
              Viewing booked successfully! Check your email for confirmation.
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg">
              Failed to book viewing. Please try again.
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !bookingData.name ||
              !bookingData.email ||
              !bookingData.phone ||
              !bookingData.date ||
              !bookingData.time
            }
            className="w-full bg-lime-400 hover:bg-lime-500 text-black font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Booking...'
              : `Book ${
                  viewingType === 'virtual' ? 'Virtual' : 'Physical'
                } Viewing`}
          </button>
        </div>
      </div>
    </div>
  );
};

const Services = () => {
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  const handleActionClick = (actionType) => {
    if (actionType === 'contact') {
      setContactModalOpen(true);
    } else if (actionType === 'booking') {
      setBookingModalOpen(true);
    }
  };

  return (
    <div className="container mx-auto py-20 p-8">
      <div className="pb-24 space-y-5">
        <h1 className="text-4xl md:text-5xl font-semibold capitalize">
          Take The First <span className="text-lime-400">Step</span>
        </h1>
        <p className="text-lg text-gray-500">
          Discover your perfect home at Bruton Gardens Apartment. Schedule a
          viewing today and experience luxury living at its finest.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-16">
        {servicesData.map((service, index) => (
          <div
            key={index}
            className="bg-white md:p-8 p-5 rounded-4xl shadow-md"
          >
            <div>
              <img
                src={service.image}
                alt="about"
                className="object-cover w-full h-64 rounded-2xl"
              />
            </div>
            <div className="md:flex space-y-4 md:space-y-0 gap-10 pt-5 items-center justify-center w-full">
              {service.actions.map((action, idx) => (
                <div
                  key={idx}
                  onClick={() => handleActionClick(action.type)}
                  className="p-5 md:p-9 rounded-2xl bg-gray-100 text-center flex flex-col items-center space-y-2 hover:bg-lime-400 hover:text-white cursor-pointer transition-all"
                >
                  {action.icon}
                  <h1 className="mt-2 font-medium text-sm md:text-xl">
                    {action.title}
                  </h1>
                  <p className="text-xs md:text-md">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Services;
