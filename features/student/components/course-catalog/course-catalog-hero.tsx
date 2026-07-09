'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { BookOpen, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type CourseCatalogHeroProps = {
  search: string;
  onSearchChange: (value: string) => void;
  badgeLabel?: string;
  className?: string;
};

export function CourseCatalogHero({
  search,
  onSearchChange,
  badgeLabel = 'Perpustakaan Kursus',
  className,
}: CourseCatalogHeroProps) {
  return (
    <section
      className={cn(
        'relative -mx-4 overflow-hidden bg-linear-to-br from-primary/5 via-background to-secondary/5 px-4 py-12 text-center sm:py-16 md:-mx-8 md:px-8',
        className,
      )}
    >
      <Image
        src="/assets/asset-section.webp"
        alt=""
        width={320}
        height={320}
        aria-hidden
        className="pointer-events-none absolute -top-8 -right-8 w-36 select-none opacity-40 sm:w-52 md:w-64"
      />
      <Image
        src="/assets/asset-section.webp"
        alt=""
        width={320}
        height={320}
        aria-hidden
        className="pointer-events-none absolute -bottom-10 -left-10 hidden w-36 -scale-x-100 select-none opacity-30 sm:block sm:w-48"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 mx-auto max-w-3xl"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-2 shadow-sm">
          <BookOpen className="size-4 text-primary" />
          <span className="text-sm font-medium text-primary">{badgeLabel}</span>
        </div>

        <h1 className="mb-3 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight text-brand-navy dark:text-white">
          Temukan Kursus
          <br />
          <span className="bg-linear-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
            Bahasa Jepang Terbaik
          </span>
        </h1>

        <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
          Katalog kursus terstruktur N5–N1. Jelajahi materi sesuai level dan tujuan belajarmu.
        </p>

        <div className="relative mx-auto max-w-xl">
          <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Cari kursus, level, topik..."
            aria-label="Cari kursus"
            className="w-full rounded-2xl border border-border bg-card py-3.5 pr-4 pl-12 text-base shadow-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </motion.div>
    </section>
  );
}
