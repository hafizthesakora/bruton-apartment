'use client';
import { usePathname } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';

// Re-mounts on every navigation, so each public page fades and lifts in.
export default function Template({ children }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  if (pathname?.startsWith('/admin')) return children;

  return (
    <motion.div
      initial={{ opacity: 0, y: reduce ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
