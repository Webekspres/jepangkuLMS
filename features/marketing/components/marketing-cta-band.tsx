'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

type MarketingCtaBandProps = {
  children: ReactNode;
  className?: string;
  /** Garis atas — hanya jika section di atas punya tone berbeda */
  showTopDivider?: boolean;
};

/** Blok CTA full-width — selaras lebar container navbar */
export function MarketingCtaBand({
  children,
  className,
  showTopDivider = false,
}: MarketingCtaBandProps) {
  return (
    <section
      className={cn(
        'bg-muted/30',
        showTopDivider && 'border-t border-border/60',
        className,
      )}
    >
      <div className="container mx-auto px-4 py-14 sm:py-16 md:px-8 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          {children}
        </motion.div>
      </div>
    </section>
  );
}
