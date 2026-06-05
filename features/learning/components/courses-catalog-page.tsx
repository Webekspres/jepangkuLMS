'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Play,
  Search,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { PUBLIC_NAV_STICKY_TOP } from '@/features/marketing/components/marketing-nav-layout';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import { cn } from '@/lib/utils';
import {
  CATALOG_COURSES,
  COURSE_CATEGORIES,
  COURSE_LEVELS,
  LEVEL_ACCENT,
  type CourseCategory,
  type CourseLevel,
} from './courses-data';

export function CoursesCatalogPage() {
  const [activeLevel, setActiveLevel] = useState<CourseLevel>('Semua');
  const [activeCategory, setActiveCategory] = useState<CourseCategory>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CATALOG_COURSES.filter((course) => {
      const levelMatch = activeLevel === 'Semua' || course.level === activeLevel;
      const categoryMatch =
        activeCategory === 'Semua' || course.tags.includes(activeCategory);
      const searchMatch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.desc.toLowerCase().includes(query);
      return levelMatch && categoryMatch && searchMatch;
    });
  }, [activeLevel, activeCategory, search]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar activeHref="/kursus" />

      {/* Hero */}
      <section className="bg-linear-to-br from-primary/5 via-background to-secondary/5 px-4 py-16 text-center sm:py-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-4 py-2 shadow-sm">
            <BookOpen className="size-4 text-primary" />
            <span className="text-sm font-medium text-primary">Perpustakaan Kursus</span>
          </div>
          <h1 className="mb-4 text-[clamp(1.75rem,4vw,3rem)] font-extrabold text-foreground">
            Temukan Kursus
            <br />
            <span className="bg-linear-to-r from-brand-red to-brand-orange bg-clip-text text-transparent">
              Bahasa Jepang Terbaik
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Katalog kursus terstruktur N5–N1. Saat peluncuran, modul N5 dibuka lebih dulu — kursus
            lainnya menyusul bertahap.
          </p>

          <div className="relative mx-auto max-w-md">
            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kursus, level, topik..."
              className="w-full rounded-2xl border border-border bg-background py-3.5 pr-4 pl-10 text-sm shadow-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </motion.div>
      </section>

      {/* Filters */}
      <div
        className={cn(
          'sticky z-30 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md md:px-8',
          PUBLIC_NAV_STICKY_TOP,
        )}
      >
        <div className="container mx-auto flex flex-col gap-3 sm:flex-row">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {COURSE_LEVELS.map((level) => {
              const accent =
                level === 'Semua' ? null : JLPT_ACCENT[LEVEL_ACCENT[level]];
              const isActive = activeLevel === level;

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setActiveLevel(level)}
                  className={cn(
                    'shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                    isActive
                      ? level === 'Semua'
                        ? 'bg-secondary text-secondary-foreground'
                        : cn(accent?.badge, 'text-white')
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {level}
                </button>
              );
            })}
          </div>
          <div className="hidden w-px bg-border sm:block" />
          <div className="flex gap-2 overflow-x-auto pb-1">
            {COURSE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={cn(
                  'shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all',
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course grid */}
      <section className="container mx-auto px-4 py-10 md:px-8">
        <p className="mb-6 text-sm text-muted-foreground">{filtered.length} kursus ditemukan</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((course, i) => {
              const accent = JLPT_ACCENT[course.accent];

              return (
                <motion.article
                  key={course.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="relative">
                    <Image
                      src={course.thumb}
                      alt={course.title}
                      width={600}
                      height={176}
                      className="h-44 w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                    {course.featured && (
                      <span className="absolute top-3 left-3 rounded-lg bg-brand-yellow px-2.5 py-1 text-xs font-bold text-foreground">
                        ✨ Unggulan
                      </span>
                    )}
                    <div
                      className={cn(
                        'absolute top-3 right-3 flex size-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow',
                        accent.badge,
                      )}
                    >
                      <span className="font-sans">{course.badge}</span>
                    </div>
                    <span
                      className={cn(
                        'absolute bottom-3 left-3 rounded-md px-2 py-0.5 text-xs font-bold text-white',
                        accent.badge,
                      )}
                    >
                      {course.level}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="mb-2 text-sm font-bold text-foreground">{course.title}</h3>
                    <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {course.desc}
                    </p>

                    <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="size-3" />
                        {course.lessons} pelajaran
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {course.duration}
                      </span>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                          course.availability === 'tersedia'
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {course.availabilityLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-end">
                      <span
                        className={cn(
                          'text-sm font-bold',
                          course.price === 'Gratis' ? 'text-emerald-600' : 'text-primary',
                        )}
                      >
                        {course.price}
                      </span>
                    </div>

                    <Button asChild className="mt-4 h-10 w-full gap-1.5">
                      <Link href={`/kursus/${course.slug}`}>
                        <Play className="size-4" />
                        Lihat Detail
                        <ChevronRight className="size-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="mb-4 text-5xl">🔍</p>
            <p className="text-sm text-muted-foreground">
              Kursus tidak ditemukan. Coba kata kunci lain.
            </p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-muted/40 px-4 py-16 text-center md:px-8">
        <h2 className="mb-2 text-2xl font-extrabold text-foreground">Bingung mulai dari mana?</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Ambil tes penempatan gratis untuk mengetahui level JLPT kamu saat ini.
        </p>
        <Button asChild size="lg" className="h-12 gap-2 px-8 text-base font-bold">
          <Link href="/tryout">
            <Zap className="size-4" />
            Tes Penempatan Gratis
            <ChevronRight className="size-4" />
          </Link>
        </Button>
      </section>

      <MarketingFooter />
    </div>
  );
}
