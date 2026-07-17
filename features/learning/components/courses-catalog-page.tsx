'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Clock, Play, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CourseCatalogFilterBar } from '@/features/learning/components/course-catalog-filter-bar';
import { CourseCatalogHeroSection } from '@/features/learning/components/course-catalog-hero-section';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { MarketingFooter } from '@/features/marketing/components/marketing-footer';
import { PublicNavbar } from '@/features/marketing/components/public-navbar';
import { isUnoptimizedImageSrc } from '@/lib/media/image-src';
import { cn } from '@/lib/utils';
import {
  courseMatchesTypeFilter,
  type CatalogCourse,
  type CourseLevel,
  type CourseTypeFilter,
} from './courses-data';

type CoursesCatalogPageProps = {
  courses: CatalogCourse[];
};

export function CoursesCatalogPage({ courses }: CoursesCatalogPageProps) {
  const [activeLevel, setActiveLevel] = useState<CourseLevel>('Semua');
  const [activeType, setActiveType] = useState<CourseTypeFilter>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const levelMatch = activeLevel === 'Semua' || course.level === activeLevel;
      const typeMatch = courseMatchesTypeFilter(
        course.categoryType,
        activeType,
        course.tags,
      );
      const searchMatch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.desc.toLowerCase().includes(query) ||
        course.tags.some((tag) => tag.toLowerCase().includes(query));
      return levelMatch && typeMatch && searchMatch;
    });
  }, [courses, activeLevel, activeType, search]);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <PublicNavbar activeHref="/kursus" />

      <CourseCatalogHeroSection
        search={search}
        onSearchChange={setSearch}
        subtitle="Katalog kursus terstruktur N5–N1. Saat peluncuran, modul N5 dibuka lebih dulu — kursus lainnya menyusul bertahap."
      />

      <div className="container mx-auto px-4 md:px-8">
        <CourseCatalogFilterBar
          activeLevel={activeLevel}
          onLevelChange={setActiveLevel}
          activeType={activeType}
          onTypeChange={setActiveType}
          resultCount={filtered.length}
        />
      </div>

      <section className="container mx-auto px-4 pb-10 md:px-8">
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
                      unoptimized={isUnoptimizedImageSrc(course.thumb)}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
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
            description="Coba ubah kata kunci atau filter untuk menemukan kursus yang kamu cari."
          />
        )}
      </section>

      <section className="px-4 py-12 md:px-8">
        <div className="container mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-brand-hero-navy bg-[url('/assets/banner-section.webp')] bg-cover bg-center px-6 py-14 text-center shadow-lg sm:px-12">
            <div className="pointer-events-none absolute inset-0 bg-brand-hero-navy/70" aria-hidden />
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
