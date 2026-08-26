'use client';

import { BookOpen, Search } from 'lucide-react';
import { StudentProgramHero } from '@/features/student/components/student-program-hero';

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
    <StudentProgramHero
      backgroundSrc="/assets/bg-courses.webp"
      badge={{ icon: BookOpen, label: badgeLabel }}
      title="Pilih Kursus"
      titleAccent="Yang Sesuai untuk Kamu"
      subtitle={subtitle}
      fullBleed={fullBleed}
      className={className}
    >
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
    </StudentProgramHero>
  );
}
