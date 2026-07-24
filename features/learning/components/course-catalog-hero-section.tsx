'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { BookOpen, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

type CourseCatalogHeroSectionProps = {
  search: string;
  onSearchChange: (value: string) => void;
  badgeLabel?: string;
  subtitle?: string;
  /** Break out of parent container untuk lebar penuh (dashboard siswa). */
  fullBleed?: boolean;
  className?: string;
};

const DEFAULT_SUBTITLE =
  'Katalog kursus terstruktur N5–N1. Jelajahi materi sesuai level dan tujuan belajarmu.';

export function CourseCatalogHeroSection({
  search,
  onSearchChange,
  badgeLabel = 'Perpustakaan Kursus',
  subtitle = DEFAULT_SUBTITLE,
  fullBleed = false,
  className,
}: CourseCatalogHeroSectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden text-center",
        fullBleed &&
          "left-1/2 w-screen max-w-[100vw] -translate-x-1/2 -mt-6 md:-mt-8",
        className,
      )}
    >
      {/* Layered background — full width */}
      <div
        className="absolute inset-0 bg-[url('/assets/bg-courses.webp')] bg-cover bg-center"
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
            <BookOpen className="size-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              {badgeLabel}
            </span>
          </div>

          <h1 className="mb-3 text-[clamp(1.75rem,4vw,3rem)] font-extrabold leading-tight text-brand-navy ">
            Pilih Kursus
            <br />
            <span className="bg-linear-to-r from-brand-red via-brand-orange to-brand-red bg-clip-text text-transparent">
              Yang Sesuai untuk Kamu
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {subtitle}
          </p>

          <div className="relative mx-auto max-w-xl">
            <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari kursus, level, kategori..."
              aria-label="Cari kursus"
              className="w-full rounded-2xl border border-border/80 bg-card/95 py-3.5 pr-4 pl-12 text-base shadow-md outline-none backdrop-blur-sm transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </motion.div>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-background to-transparent"
        aria-hidden
      />
    </section>
  );
}
