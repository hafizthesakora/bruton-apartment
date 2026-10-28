'use client';
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

export function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className = '',
  ...props
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
    none: { y: 0, x: 0 },
  };

  const { x, y } = directions[direction] || directions.up;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x, y }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x, y }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = '',
  ...props
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  direction = 'up',
  className = '',
  ...props
}) {
  const directions = {
    up: { y: 30, x: 0 },
    down: { y: -30, x: 0 },
    left: { y: 0, x: 30 },
    right: { y: 0, x: -30 },
  };

  const { x, y } = directions[direction] || directions.up;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x, y },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  className = '',
  ...props
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({ target, duration = 2, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [displayValue, setDisplayValue] = useState(target);

  useEffect(() => {
    if (!isInView) return;

    // Extract the first number from the target string
    const match = target.match(/(\d+\.?\d*)/);
    if (!match) {
      // No number found (e.g. "Prime") — just show it directly
      setDisplayValue(target);
      return;
    }

    const numericTarget = parseFloat(match[1]);
    const beforeNum = target.slice(0, match.index);
    const afterNum = target.slice(match.index + match[1].length);
    const hasDecimal = match[1].includes('.');
    const decimalPlaces = hasDecimal ? match[1].split('.')[1].length : 0;

    let startTime;
    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const elapsed = (currentTime - startTime) / (duration * 1000);
      const progress = Math.min(elapsed, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = numericTarget * eased;

      if (hasDecimal) {
        setDisplayValue(`${beforeNum}${current.toFixed(decimalPlaces)}${afterNum}`);
      } else {
        setDisplayValue(`${beforeNum}${Math.floor(current)}${afterNum}`);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, target, duration]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}

export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const EASE_LUXE = [0.22, 1, 0.36, 1];

// Heading whose words rise out of a mask, one after another.
export function RevealText({
  text = '',
  as: Tag = 'h2',
  className = '',
  delay = 0,
  stagger = 0.06,
  immediate = false,
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();
  const show = immediate || isInView;
  const words = String(text).split(' ');

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className="inline-block"
            initial={{ y: reduce ? 0 : '110%', opacity: reduce ? 0 : 1 }}
            animate={show ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 1, delay: delay + i * stagger, ease: EASE_LUXE }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

// Content drifts slower than the page as you scroll past it.
export function Parallax({ children, speed = 0.15, className = '' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 100}%`, `${speed * 100}%`]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div className="relative h-full w-full scale-[1.25]" style={reduce ? undefined : { y }}>
        {children}
      </motion.div>
    </div>
  );
}

// Image is wiped into view (clip-path) with a slight settle.
export function ImageReveal({ children, className = '', delay = 0, from = 'bottom' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();
  const hidden = {
    bottom: 'inset(100% 0% 0% 0%)',
    left: 'inset(0% 100% 0% 0%)',
    right: 'inset(0% 0% 0% 100%)',
  }[from];

  // The observed wrapper is never clipped: a fully clipped element reports no intersection
  // in some browsers, which left the image hidden for good.
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        className="absolute inset-0"
        initial={reduce ? { opacity: 0 } : { clipPath: hidden }}
        animate={isInView ? (reduce ? { opacity: 1 } : { clipPath: 'inset(0% 0% 0% 0%)' }) : {}}
        transition={{ duration: 1.3, delay, ease: EASE_LUXE }}
      >
        <motion.div
          className="relative h-full w-full"
          initial={reduce ? {} : { scale: 1.2 }}
          animate={isInView && !reduce ? { scale: 1 } : {}}
          transition={{ duration: 1.6, delay, ease: EASE_LUXE }}
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}

// Endless horizontal strip. Children are rendered twice for a seamless loop.
export function Marquee({ children, duration = 40, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <div className={`flex overflow-hidden ${className}`}>
      {[0, 1].map((copy) => (
        <motion.div
          key={copy}
          aria-hidden={copy === 1}
          className="flex shrink-0 items-center"
          animate={reduce ? {} : { x: ['0%', '-100%'] }}
          transition={{ duration, ease: 'linear', repeat: Infinity }}
        >
          {children}
        </motion.div>
      ))}
    </div>
  );
}

// Wrapper that leans gently toward the cursor (fine pointers only).
export function Magnetic({ children, strength = 0.25, className = '' }) {
  const ref = useRef(null);
  const x = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const y = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });

  const onMove = (e) => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} onMouseMove={onMove} onMouseLeave={reset} style={{ x, y }} className={`inline-block ${className}`}>
      {children}
    </motion.div>
  );
}

export { motion, AnimatePresence, EASE_LUXE };
