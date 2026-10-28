'use client';
import { FadeIn, RevealText } from '../MotionWrapper';
import { cn } from '@/lib/utils';

// Eyebrow label + large serif title (+ optional intro), used to open every section.
export default function SectionHeading({ eyebrow, title, intro, align = 'left', light = false, className, as = 'h2' }) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && (
        <FadeIn direction="up">
          <p className={cn('eyebrow mb-5 flex items-center gap-3', align === 'center' && 'justify-center', light ? 'text-sand' : 'text-brass')}>
            <span className="h-px w-8 bg-current" />
            {eyebrow}
          </p>
        </FadeIn>
      )}
      <RevealText
        as={as}
        text={title}
        className={cn('font-display text-4xl leading-[1.05] md:text-6xl', light ? 'text-ivory' : 'text-garden')}
      />
      {intro && (
        <FadeIn direction="up" delay={0.2}>
          <p className={cn('mt-6 text-lg leading-relaxed', light ? 'text-ivory/75' : 'text-ink/65')}>{intro}</p>
        </FadeIn>
      )}
    </div>
  );
}
