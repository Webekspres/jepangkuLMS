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
  Star,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import { cn } from '@/lib/utils';
import {
  COURSE_CATEGORIES,
  COURSE_FEATURE_FILTERS,
  COURSE_LEVELS,
  LEVEL_ACCENT,
  type CatalogCourse,
  type CourseCategory,
  type CourseFeatureFilter,
  type CourseLevel,
} from './courses-data';

type CoursesCatalogPageProps = {
  courses: CatalogCourse[];
};

/** Floating badge pill — glass/outline inactive, brand-color active. */
const BADGE_BASE =
  'inline-flex shrink-0 cursor-pointer items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-all';
const BADGE_INACTIVE =
  'border-border bg-background/60 text-muted-foreground shadow-sm backdrop-blur-sm hover:bg-muted hover:text-foreground';
const BADGE_ACTIVE = 'border-transparent shadow-md';

export function CoursesCatalogPage({ courses }: CoursesCatalogPageProps) {
  const [activeLevel, setActiveLevel] = useState<CourseLevel>('Semua');
  const [activeCategory, setActiveCategory] = useState<CourseCategory>('Semua');
  const [activeFeature, setActiveFeature] = useState<CourseFeatureFilter>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const levelMatch = activeLevel === 'Semua' || course.level === activeLevel;
      const categoryMatch =
        activeCategory === 'Semua' || course.tags.includes(activeCategory);
      const featureMatch =
        activeFeature === 'Semua' || (activeFeature === 'Unggulan' && course.featured);
      const searchMatch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.desc.toLowerCase().includes(query);
      return levelMatch && categoryMatch && featureMatch && searchMatch;
    });
  }, [courses, activeLevel, activeCategory, activeFeature, search]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar activeHref="/kursus" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary/5 via-background to-secondary/5 px-4 py-16 text-center sm:py-20 md:px-8">
        {/* Sakura decorative accent */}
        <Image
          src="/assets/asset-section.webp"
          alt=""
          width={320}
          height={320}
          aria-hidden
          className="pointer-events-none absolute -top-8 -right-8 w-40 select-none opacity-40 sm:w-56 md:w-64"
        />
        <Image
          src="/assets/asset-section.webp"
          alt=""
          width={320}
          height={320}
          aria-hidden
          className="pointer-events-none absolute -bottom-10 -left-10 hidden w-40 -scale-x-100 select-none opacity-30 sm:block sm:w-52"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
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

      {/* Filters — floating badges directly on the page background */}
      <div className="container mx-auto flex flex-col items-center gap-3 px-4 pt-8 md:px-8">
        <div className="flex flex-wrap justify-center gap-2">
          {COURSE_LEVELS.map((level) => {
            const accent = level === 'Semua' ? null : JLPT_ACCENT[LEVEL_ACCENT[level]];
            const isActive = activeLevel === level;

            return (
              <button
                key={level}
                type="button"
                onClick={() => setActiveLevel(level)}
                className={cn(
                  BADGE_BASE,
                  isActive
                    ? level === 'Semua'
                      ? cn(BADGE_ACTIVE, 'bg-secondary text-secondary-foreground')
                      : cn(BADGE_ACTIVE, accent?.badge, 'text-white')
                    : BADGE_INACTIVE,
                )}
              >
                {level}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {COURSE_FEATURE_FILTERS.map((feature) => (
            <button
              key={feature}
              type="button"
              onClick={() => setActiveFeature(feature)}
              className={cn(
                BADGE_BASE,
                'gap-1',
                activeFeature === feature
                  ? cn(BADGE_ACTIVE, 'bg-brand-yellow text-foreground')
                  : BADGE_INACTIVE,
              )}
            >
              {feature === 'Unggulan' ? <Star className="size-3.5" /> : null}
              {feature}
            </button>
          ))}
          {COURSE_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={cn(
                BADGE_BASE,
                activeCategory === category
                  ? cn(BADGE_ACTIVE, 'bg-primary text-primary-foreground')
                  : BADGE_INACTIVE,
              )}
            >
              {category}
            </button>
          ))}
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
          <EmptyState
            title="Kursus tidak ditemukan"
            description="Coba ubah kata kunci atau filter level untuk menemukan kursus yang kamu cari."
          />
        )}
      </section>

      {/* CTA banner */}
      <section className="px-4 py-12 md:px-8">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-brand-hero-navy bg-[url('/assets/banner-section.webp')] bg-cover bg-center px-6 py-14 text-center shadow-lg sm:px-12">
            {/* Overlay protects text contrast over the banner image */}
            <div className="pointer-events-none absolute inset-0 bg-brand-hero-navy/70" aria-hidden />
            {/* Sakura decorative accent */}
            <Image
              src="/assets/asset-section.webp"
              alt=""
              width={200}
              height={200}
              aria-hidden
              className="pointer-events-none absolute -top-6 -right-6 w-28 select-none opacity-60 sm:w-40"
            />
            <div className="relative z-10">
              <h2 className="mb-2 text-2xl font-extrabold text-white">Bingung mulai dari mana?</h2>
              <p className="mb-6 text-sm text-white/75">
                Ambil tes penempatan gratis untuk mengetahui level JLPT kamu saat ini.
              </p>
              <Button asChild size="lg" className="h-12 gap-2 px-8 text-base font-bold">
                <Link href="/tryout">
                  <Zap className="size-4" />
                  Tes Penempatan Gratis
                  <ChevronRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
