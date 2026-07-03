'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import {
  COURSE_LEVELS,
  LEVEL_ACCENT,
  type CatalogCourse,
  type CourseLevel,
} from '@/features/learning/components/courses-data';
import type { StudentEnrollmentView } from '@/features/learning/lib/queries';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import type { KursusEnrollmentCard } from '@/features/student/lib/load-student-learning-data';
import { STUDENT_ROUTES } from './student-routes';

export type StudentKursusPageProps = {
  courses: (CatalogCourse & { dbId: string; lessonCount: number; isPublished: boolean })[];
  enrollmentBySlug: Record<string, StudentEnrollmentView>;
  enrolledCards: KursusEnrollmentCard[];
  stats: { enrolled: number; active: number; completed: number };
};

export function StudentKursusPage({
  courses,
  enrollmentBySlug,
  enrolledCards,
}: StudentKursusPageProps) {
  const [activeLevel, setActiveLevel] = useState<CourseLevel>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return courses.filter((course) => {
      const levelMatch = activeLevel === 'Semua' || course.level === activeLevel;
      const searchMatch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.desc.toLowerCase().includes(query);
      return levelMatch && searchMatch;
    });
  }, [activeLevel, courses, search]);

  function getEnrollmentView(slug: string) {
    const enrollment = enrollmentBySlug[slug];
    if (!enrollment) return null;
    return {
      progress: enrollment.progress.percent,
      continueLessonSlug: enrollment.progress.continueLessonSlug,
      status: enrollment.progress.status,
    };
  }

  return (
    <div className="space-y-8 pb-8">
      {/* ── Section 1: Kursus Saya (enrolled only) ──────────────────────── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
            <BookOpen className="size-5 text-primary" />
            Kursus Saya
          </h2>
          {enrolledCards.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {enrolledCards.length} kursus terdaftar
            </span>
          )}
        </div>

        {enrolledCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-14 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="size-8 text-primary/60" />
            </div>
            <p className="mb-1 text-base font-semibold text-foreground">
              Anda belum mengikuti kursus apapun
            </p>
            <p className="mb-5 max-w-xs text-sm text-muted-foreground">
              Mulai perjalanan belajar bahasa Jepangmu sekarang. Kursus N5 tersedia gratis!
            </p>
            <Button asChild size="sm" className="gap-2">
              <a href="#jelajahi">
                <Sparkles className="size-4" />
                Jelajahi Kursus
              </a>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrolledCards.map(({ course, enrollment }, i) => {
              const accent = JLPT_ACCENT[course.accent];
              const continueHref = enrollment.continueLessonSlug
                ? STUDENT_ROUTES.belajar(course.slug, enrollment.continueLessonSlug)
                : STUDENT_ROUTES.kursusDetail(course.slug);

              return (
                <motion.article
                  key={course.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative h-36">
                    <Image src={course.thumb} alt="" fill className="object-cover" sizes="400px" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                    {/* Progress badge top-left */}
                    <span className="absolute top-2 left-2 flex items-center gap-1 rounded-lg bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                      {enrollment.progress}% selesai
                    </span>
                    <span
                      className={cn(
                        'absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-xs font-bold text-white',
                        accent.badge,
                      )}
                    >
                      {course.level}
                    </span>
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100">
                      <span className="flex size-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
                        <Play className="size-5 translate-x-0.5 fill-current text-primary" />
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground">{course.title}</h3>
                    <div className="mt-3">
                      <div className="mb-1.5 flex justify-between text-[11px] font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary">{enrollment.progress}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow"
                          style={{ width: `${Math.max(5, enrollment.progress)}%` }}
                        />
                      </div>
                    </div>
                    <Button asChild size="sm" className="mt-4 w-full gap-1.5">
                      <Link href={continueHref}>
                        <Play className="size-3.5 fill-current" />
                        {enrollment.progress > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
                      </Link>
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Section 2: Jelajahi Kursus (catalog, unenrolled) ────────────── */}
      <section id="jelajahi">
        {/* Section header */}
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-foreground">
            <Sparkles className="size-5 text-primary" />
            Jelajahi Kursus
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Temukan kursus JLPT yang sesuai dengan level dan tujuan belajarmu.
          </p>
        </div>

        {/* Search + filter bar (inline) */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kursus..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {COURSE_LEVELS.map((level) => {
              const accent = level === 'Semua' ? null : JLPT_ACCENT[LEVEL_ACCENT[level]];
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
        </div>

        {filtered.length > 0 && (
          <p className="mb-4 text-xs text-muted-foreground">
            {filtered.length} kursus ditemukan
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course, i) => {
            const accent = JLPT_ACCENT[course.accent];
            const enrollment = getEnrollmentView(course.slug);

            return (
              <motion.article
                key={course.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-36">
                  <Image src={course.thumb} alt="" fill className="object-cover" sizes="400px" />
                  <div className="absolute inset-0 bg-linear-to-t from-black/55 to-transparent" />
                  <span
                    className={cn(
                      'absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-xs font-bold text-white',
                      accent.badge,
                    )}
                  >
                    {course.level}
                  </span>
                  {enrollment && (
                    <span className="absolute top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                      Terdaftar
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="mb-1 line-clamp-2 text-sm font-bold text-foreground">
                    {course.title}
                  </h3>
                  <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{course.desc}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="size-3" />
                      {course.lessonCount} pelajaran
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {course.duration}
                    </span>
                  </div>
                  <Button asChild variant={enrollment ? "default" : "outline"} size="sm" className="mt-4 w-full gap-1.5">
                    <Link
                      href={
                        enrollment
                          ? enrollment.continueLessonSlug
                            ? STUDENT_ROUTES.belajar(course.slug, enrollment.continueLessonSlug)
                            : STUDENT_ROUTES.kursusDetail(course.slug)
                          : STUDENT_ROUTES.kursusDetail(course.slug)
                      }
                    >
                      {enrollment ? 'Lanjutkan belajar' : 'Lihat detail'}
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <EmptyState
            className="rounded-2xl border border-dashed border-border"
            title={search ? `Tidak ada kursus untuk "${search}"` : 'Tidak ada kursus ditemukan'}
            description="Coba ubah kata kunci atau filter level untuk menemukan kursus lainnya."
            action={
              search ? (
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                  onClick={() => setSearch('')}
                >
                  Hapus pencarian
                </button>
              ) : null
            }
          />
        )}
      </section>
    </div>
  );
}
