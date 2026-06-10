'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { MarketingLightSurface } from './marketing-light-surface';

type MarketingPageHeroProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Hero halaman publik — gaya terang selaras landing */
export function MarketingPageHero({
  children,
  className,
  contentClassName,
}: MarketingPageHeroProps) {
  return (
    <MarketingLightSurface
      roundedBottom
      className={className}
      contentClassName={cn(
        'px-4 py-16 text-center sm:py-20 md:px-8 md:py-24',
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
    </MarketingLightSurface>
  );
}
