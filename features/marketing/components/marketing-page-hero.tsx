'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import {
  LANDING_HERO_GRID_STYLE,
  LANDING_SEIGAIHA,
} from './landing-data';

type MarketingPageHeroProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/**
 * Hero halaman publik (Tentang Kami, Kursus, dll).
 * Menggunakan dark navy yang sama dengan hero landing agar konsisten.
 */
export function MarketingPageHero({
  children,
  className,
  contentClassName,
}: MarketingPageHeroProps) {
  return (
    <section
      className={cn('bg-brand-hero-navy relative overflow-hidden', className)}
      style={{ borderRadius: '0 0 50% 50% / 0 0 5rem 5rem' }}
    >
      {/* Seigaiha pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(LANDING_SEIGAIHA)}")`,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Grid overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={LANDING_HERO_GRID_STYLE}
      />

      <div
        className={cn(
          'relative container mx-auto px-4 pt-32 pb-16 text-center sm:pt-36 sm:pb-20 md:px-8 md:pb-24',
          contentClassName,
        )}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mx-auto max-w-3xl"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
