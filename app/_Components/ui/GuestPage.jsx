'use client';
import { RevealText, FadeIn } from '../MotionWrapper';

// Shell for the guest-facing app pages (/book, /account, /room-service, booking status):
// light ivory canvas with a serif title, sized to the content width given.
export default function GuestPage({ eyebrow = '', title = '', intro = '', width = 'max-w-5xl', children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ivory pb-24 pt-32 md:pt-40">
      <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[36rem] rounded-full bg-sand/70 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -left-40 top-80 size-[28rem] rounded-full bg-sage/15 blur-3xl" />
      <div className={`relative mx-auto px-5 md:px-8 ${width}`}>
        {(eyebrow || title) && (
          <div className="mb-12 md:mb-16">
            {eyebrow && (
              <FadeIn direction="up">
                <p className="eyebrow mb-5 flex items-center gap-3 text-brass"><span className="h-px w-8 bg-current" />{eyebrow}</p>
              </FadeIn>
            )}
            {title && <RevealText as="h1" text={title} immediate delay={0.1} className="font-display text-5xl leading-[1] text-garden md:text-7xl" />}
            {intro && (
              <FadeIn direction="up" delay={0.3}>
                <p className="mt-6 max-w-2xl text-lg text-ink/60">{intro}</p>
              </FadeIn>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
