'use client';

import { motion, type MotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

type RewardAnimationProps = MotionProps & {
  children: React.ReactNode;
  className?: string;
  variant?: 'toast' | 'dialog' | 'sheet' | 'celebration';
};

const VARIANTS = {
  toast: {
    initial: { opacity: 0, y: -20, scale: 0.97 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -10, scale: 0.98 },
    transition: { type: 'spring', stiffness: 400, damping: 30 },
  },
  dialog: {
    initial: { opacity: 0, scale: 0.94 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { type: 'spring', stiffness: 360, damping: 28 },
  },
  sheet: {
    initial: { opacity: 0, y: '100%' },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: '100%' },
    transition: { type: 'spring', stiffness: 320, damping: 32 },
  },
  celebration: {
    initial: { opacity: 0, scale: 0.88, y: 16 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.94, y: 8 },
    transition: { type: 'spring', stiffness: 280, damping: 22 },
  },
} as const;

export function RewardAnimation({
  children,
  className,
  variant = 'dialog',
  ...props
}: RewardAnimationProps) {
  const preset = VARIANTS[variant];

  return (
    <motion.div className={cn(className)} {...preset} {...props}>
      {children}
    </motion.div>
  );
}

export function RewardSparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: 6 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute size-2 rounded-full bg-brand-yellow/80"
          style={{
            left: `${12 + index * 14}%`,
            top: `${18 + (index % 3) * 18}%`,
          }}
          initial={{ opacity: 0, scale: 0, y: 8 }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.6], y: [-4, -18, -28] }}
          transition={{ duration: 1.4, delay: index * 0.08, repeat: Infinity, repeatDelay: 2.2 }}
        />
      ))}
    </div>
  );
}
