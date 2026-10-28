'use client';
import Image from 'next/image';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { RevealText, FadeIn } from '../MotionWrapper';

// Full-bleed photo header for inner pages: slow parallax, title rising from a mask.
export default function PageHero({ eyebrow, title, intro, image = '/assets/BRTN GRDN-22.JPG', children }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-[78vh] items-end overflow-hidden bg-garden text-ivory">
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y }}>
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover animate-[kenburns_9s_var(--ease-luxe)_both]" />
        <div className="absolute inset-0 bg-gradient-to-t from-garden via-garden/40 to-garden/10" />
      </motion.div>

      <motion.div className="container-luxe relative z-10 pb-16 pt-40 md:pb-24" style={reduce ? undefined : { opacity: fade }}>
        {eyebrow && (
          <FadeIn direction="up" delay={0.2}>
            <p className="eyebrow mb-6 flex items-center gap-3 text-sand">
              <span className="h-px w-8 bg-current" />
              {eyebrow}
            </p>
          </FadeIn>
        )}
        <RevealText as="h1" text={title} immediate delay={0.3} className="font-display max-w-5xl text-5xl leading-[1] md:text-8xl" />
        {intro && (
          <FadeIn direction="up" delay={0.7}>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ivory/80">{intro}</p>
          </FadeIn>
        )}
        {children}
      </motion.div>
    </section>
  );
}
