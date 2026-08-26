'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export type StudentProgramHeroBadge = {
  icon: LucideIcon;
  label: string;
};

type StudentProgramHeroProps = {
  backgroundSrc: string;
  badge: StudentProgramHeroBadge;
  /** Baris pertama judul (teks navy). */
  title: string;
  /** Baris kedua — aksen gradien brand. */
  titleAccent: string;
  subtitle: string;
  /** Break out of parent container untuk lebar penuh (dashboard siswa). */
  fullBleed?: boolean;
  className?: string;
  children?: ReactNode;
};

/**
 * Shell hero Program siswa — full-bleed light background seperti katalog kursus.
 * Slot `children` untuk search / CTA opsional.
 */
export function StudentProgramHero({
  backgroundSrc,
  badge,
  title,
  titleAccent,
  subtitle,
  fullBleed = false,
  className,
  children,
}: StudentProgramHeroProps) {
  const BadgeIcon = badge.icon;

  return (
    <section
      className={cn(
        'relative overflow-hidden text-center',
        fullBleed &&
          'left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-6 md:-mt-8',
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundSrc}')` }}
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-linear-to-br from-primary/10 via-background/95 to-secondary/15"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-brand-red/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 -left-20 size-80 rounded-full bg-brand-orange/10 blur-3xl"
        aria-hidden
      />

      <Image
        src="/assets/asset-section.webp"
        alt=""
        width={360}
        height={360}
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-6 w-40 select-none opacity-50 sm:w-56 md:right-8 md:w-72"
      />
      <Image
        src="/assets/asset-section.webp"
        alt=""
        width={360}
        height={360}
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-8 hidden w-40 -scale-x-100 select-none opacity-35 sm:block md:w-56"
      />

      <div className="relative z-10 px-4 pt-12 pb-14 sm:pt-14 sm:pb-16 md:px-8 md:pt-16 md:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-card/90 px-4 py-2 shadow-sm backdrop-blur-sm">
            <BadgeIcon className="size-4 text-primary" />
            <span className="text-sm font-medium text-primary">{badge.label}</span>
          </div>

          <h1 className="mb-3 text-[clamp(1.75rem,4vw,3rem)] font-extrabold leading-tight text-brand-navy">
            {title}
            <br />
            <span className="bg-linear-to-r from-brand-red via-brand-orange to-brand-red bg-clip-text text-transparent">
              {titleAccent}
            </span>
          </h1>

          <p
            className={cn(
              'mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base',
              children ? 'mb-8' : 'mb-0',
            )}
          >
            {subtitle}
          </p>

          {children}
        </motion.div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent"
        aria-hidden
      />
    </section>
  );
}
