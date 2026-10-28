'use client';
import React, { useState } from 'react';
import { MessageCircle, CalendarCheck, ArrowUpRight } from 'lucide-react';
import { FadeIn, Parallax, StaggerContainer, StaggerItem } from './MotionWrapper';
import SectionHeading from './ui/SectionHeading';
import ContactModal from './ContactModal';
import BookingModal from './BookingModal';

// "Take the first step": the property film plus the two ways to talk to the team.
const Services = ({ content = {} }) => {
  const {
    heading = 'Take The First Step',
    body = 'Discover your perfect home at Bruton Gardens Apartment. Schedule a viewing today and experience luxury living at its finest.',
  } = content;
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [viewingModalOpen, setViewingModalOpen] = useState(false);

  const actions = [
    { icon: MessageCircle, title: 'Talk to our team', text: 'Questions about a stay, an event or the property? Send us a message.', onClick: () => setContactModalOpen(true) },
    { icon: CalendarCheck, title: 'Book a viewing', text: 'Pick a date and time on our calendar and come and see for yourself.', onClick: () => setViewingModalOpen(true) },
  ];

  return (
    <section id="services-section" className="section-y bg-sand/50">
      <div className="container-luxe grid items-center gap-16 lg:grid-cols-2">
        <Parallax speed={0.1} className="relative aspect-[4/5] rounded-[2rem] md:aspect-[5/6]">
          <video autoPlay loop muted playsInline className="h-full w-full object-cover">
            <source src="/assets/bruton-vid.mp4" type="video/mp4" />
          </video>
        </Parallax>

        <div>
          <SectionHeading eyebrow="Visit us" title={heading} intro={body} />
          <StaggerContainer staggerDelay={0.15} className="mt-12 divide-y divide-garden/10 border-y border-garden/10">
            {actions.map(({ icon: Icon, title, text, onClick }) => (
              <StaggerItem key={title}>
                <button
                  type="button"
                  onClick={onClick}
                  className="group flex w-full items-center gap-6 py-8 text-left"
                >
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-garden text-ivory transition-colors duration-500 group-hover:bg-brass">
                    <Icon size={22} strokeWidth={1.5} />
                  </span>
                  <span className="flex-1">
                    <span className="font-display block text-3xl text-garden">{title}</span>
                    <span className="mt-1 block text-ink/60">{text}</span>
                  </span>
                  <ArrowUpRight className="shrink-0 text-garden transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:rotate-45" />
                </button>
              </StaggerItem>
            ))}
          </StaggerContainer>
          <FadeIn direction="up" delay={0.3}>
            <p className="mt-8 text-sm text-ink/50">Ready to stay? <a href="/book" className="text-garden underline underline-offset-4 hover:text-brass">Check availability and book online</a>.</p>
          </FadeIn>
        </div>
      </div>

      <ContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} />
      <BookingModal isOpen={viewingModalOpen} onClose={() => setViewingModalOpen(false)} />
    </section>
  );
};

export default Services;
