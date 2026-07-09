'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CatalogCourse } from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

type EnrolledCourseCardProps = {
  course: CatalogCourse & { lessonCount: number };
  progress: number;
  continueLessonSlug: string | null;
  status: 'completed' | 'active' | 'not_started';
  index?: number;
};

function resolveEnrolledAction(
  slug: string,
  progress: number,
  continueLessonSlug: string | null,
  isCompleted: boolean,
) {
  const href = continueLessonSlug
    ? STUDENT_ROUTES.belajar(slug, continueLessonSlug)
    : STUDENT_ROUTES.kursusDetail(slug);

  if (isCompleted) {
    return { href: STUDENT_ROUTES.kursusDetail(slug), label: 'Lihat Kursus' };
  }
  if (progress > 0) {
    return { href, label: 'Lanjutkan Belajar' };
  }
  return { href, label: 'Mulai Belajar' };
}

export function EnrolledCourseCard({
  course,
  progress,
  continueLessonSlug,
  status,
  index = 0,
}: EnrolledCourseCardProps) {
  const accent = JLPT_ACCENT[course.accent];
  const isCompleted = status === 'completed' || progress >= 100;
  const action = resolveEnrolledAction(course.slug, progress, continueLessonSlug, isCompleted);

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative h-40 shrink-0">
        <Image
          src={course.thumb}
          alt=""
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

        <span
          className={cn(
            'absolute top-3 left-3 rounded-md px-2 py-0.5 text-xs font-bold text-white shadow-sm',
            accent.badge,
          )}
        >
          {course.level}
        </span>

        {isCompleted ? (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <CheckCircle2 className="size-3" />
            Selesai
          </span>
        ) : (
          <span className="absolute top-3 right-3 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary-foreground uppercase">
            Terdaftar
          </span>
        )}

        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          {progress}% selesai
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 className="line-clamp-2 text-base font-bold text-brand-navy dark:text-white">
          {course.title}
        </h3>

        <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-muted-foreground">
          {course.desc}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Play className="size-3.5 shrink-0" />
            {course.lessonCount} pelajaran
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 shrink-0" />
            {course.duration}
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] font-medium">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow transition-all"
              style={{ width: `${Math.max(progress > 0 ? 4 : 0, progress)}%` }}
            />
          </div>
        </div>

        <Button asChild className="mt-5 w-full gap-1.5">
          <Link href={action.href}>
            <Play className="size-4 fill-current" />
            {action.label}
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}