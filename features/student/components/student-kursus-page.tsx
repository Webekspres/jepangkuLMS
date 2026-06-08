'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Play,
  Search,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CATALOG_COURSES,
  COURSE_LEVELS,
  LEVEL_ACCENT,
  type CourseLevel,
} from '@/features/learning/components/courses-data';
import { formatDisplayNumber, JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import {
  getStudentEnrollment,
  STUDENT_ENROLLED_COURSES,
  STUDENT_KURSU_STATS,
} from './student-kursus-data';
import { STUDENT_ROUTES } from './student-routes';

export function StudentKursusPage() {
  const [activeLevel, setActiveLevel] = useState<CourseLevel>('Semua');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return CATALOG_COURSES.filter((course) => {
      const levelMatch = activeLevel === 'Semua' || course.level === activeLevel;
      const searchMatch =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.desc.toLowerCase().includes(query);
      return levelMatch && searchMatch;
    });
  }, [activeLevel, search]);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-primary uppercase">
              Perpustakaan belajar
            </p>
            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">Kursus Saya</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Kursus terdaftar dan katalog JLPT — lanjutkan dari titik terakhir belajar-mu.
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kursus..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pr-3 pl-9 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: 'Terdaftar', value: STUDENT_KURSU_STATS.enrolled, icon: BookOpen },
            { label: 'Sedang jalan', value: STUDENT_KURSU_STATS.active, icon: TrendingUp },
            { label: 'Selesai', value: STUDENT_KURSU_STATS.completed, icon: CheckCircle2 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-muted/30 px-3 py-3 text-center sm:text-left"
            >
              <stat.icon className="mx-auto mb-1 size-4 text-primary sm:mx-0" />
              <p className="text-lg font-bold tabular-nums text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lanjutkan belajar */}
      {STUDENT_ENROLLED_COURSES.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold text-foreground">Lanjutkan belajar</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STUDENT_ENROLLED_COURSES.map(({ course, enrollment }, i) => {
              const accent = JLPT_ACCENT[course.accent];
              return (
                <motion.article
                  key={course.slug}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                >
                  <div className="relative h-32">
                    <Image src={course.thumb} alt="" fill className="object-cover" sizes="400px" />
                    <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
                    <span
                      className={cn(
                        'absolute bottom-2 left-2 rounded-md px-2 py-0.5 text-xs font-bold text-white',
                        accent.badge,
                      )}
                    >
                      {course.level}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-bold text-foreground">{course.title}</h3>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Terakhir: {enrollment.lastAccessLabel}
                    </p>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-[11px] font-medium">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary">{enrollment.progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                    </div>
                    <Button asChild size="sm" className="mt-4 w-full gap-1.5">
                      <Link
                        href={STUDENT_ROUTES.belajar(
                          course.slug,
                          enrollment.continueLessonSlug,
                        )}
                      >
                        <Play className="size-3.5" />
                        {enrollment.status === 'completed' ? 'Review' : 'Lanjutkan'}
                      </Link>
                    </Button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter + katalog */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-foreground">Jelajahi kursus</h2>
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

        <p className="mb-4 text-sm text-muted-foreground">{filtered.length} kursus ditemukan</p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course, i) => {
            const accent = JLPT_ACCENT[course.accent];
            const enrollment = getStudentEnrollment(course.slug);

            return (
              <motion.article
                key={course.slug}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
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
                      {course.lessons} pelajaran
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {course.duration}
                    </span>
                  </div>
                  {enrollment && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  )}
                  <Button
                    asChild
                    variant={enrollment ? 'default' : 'outline'}
                    size="sm"
                    className="mt-4 w-full gap-1.5"
                  >
                    <Link
                      href={
                        enrollment
                          ? STUDENT_ROUTES.belajar(course.slug, enrollment.continueLessonSlug)
                          : `/kursus/${course.slug}`
                      }
                    >
                      {enrollment ? 'Lanjutkan' : 'Lihat detail'}
                      <ChevronRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">Kursus tidak ditemukan.</p>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Data demo — enrollment akan sinkron dari Prisma setelah auth siap.
      </p>
    </div>
  );
}
