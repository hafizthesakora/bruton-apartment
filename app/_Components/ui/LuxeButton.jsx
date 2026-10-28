'use client';
import Link from 'next/link';
import { cva } from 'class-variance-authority';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const luxeButton = cva(
  'group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full font-medium tracking-wide transition-colors duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass cursor-pointer disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        brass: 'bg-brass text-white hover:bg-brass-dark',
        garden: 'bg-garden text-ivory hover:bg-garden-light',
        light: 'bg-ivory text-garden hover:bg-white',
        outline: 'border border-current text-current hover:bg-current/10',
        ghost: 'text-current px-0! hover:opacity-70',
      },
      size: {
        sm: 'h-10 px-5 text-sm',
        md: 'h-12 px-7 text-sm',
        lg: 'h-14 px-9 text-base',
      },
    },
    defaultVariants: { variant: 'brass', size: 'md' },
  }
);

function Inner({ children, arrow }) {
  return (
    <>
      <span className="relative">{children}</span>
      {arrow && (
        <span className="relative inline-flex size-5 items-center justify-center overflow-hidden">
          <ArrowUpRight size={18} className="transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:-translate-y-5 group-hover:translate-x-5" />
          <ArrowUpRight size={18} className="absolute -translate-x-5 translate-y-5 transition-transform duration-500 ease-[var(--ease-luxe)] group-hover:translate-x-0 group-hover:translate-y-0" />
        </span>
      )}
    </>
  );
}

// A button that is a link when given href, otherwise a <button>.
export default function LuxeButton({ href, variant, size, arrow = false, className, children, ...props }) {
  const classes = cn(luxeButton({ variant, size }), className);
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        <Inner arrow={arrow}>{children}</Inner>
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...props}>
      <Inner arrow={arrow}>{children}</Inner>
    </button>
  );
}
