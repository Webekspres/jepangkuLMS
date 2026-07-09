'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CatalogCourse } from '@/features/learning/components/courses-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export type CourseCatalogEnrollmentView = {
  progress: number;
  continueLessonSlug: string | null;
  status: 'completed' | 'active' | 'not_started';
};

type CourseCatalogCardProps = {
  course: CatalogCourse & { lessonCount: number };
  enrollment?: CourseCatalogEnrollmentView | null;
  index?: number;
};

function resolveCourseAction(
  slug: string,
  enrollment?: CourseCatalogEnrollmentView | null,
) {
  if (!enrollment) {
    return {
      href: STUDENT_ROUTES.kursusDetail(slug),
      label: 'Daftar Kursus',
      variant: 'outline' as const,
    };
  }

  const href = enrollment.continueLessonSlug
    ? STUDENT_ROUTES.belajar(slug, enrollment.continueLessonSlug)
    : STUDENT_ROUTES.kursusDetail(slug);

  return {
    href,
    label: enrollment.progress > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar',
    variant: 'default' as const,
  };
}

export function CourseCatalogCard({ course, enrollment, index = 0 }: CourseCatalogCardProps) {
  const accent = JLPT_ACCENT[course.accent];
  const isEnrolled = Boolean(enrollment);
  const action = resolveCourseAction(course.slug, enrollment);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
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
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

        {isEnrolled ? (
          <span className="absolute top-3 left-3 rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
            {enrollment!.progress}% selesai
          </span>
        ) : null}

        <span
          className={cn(
            'absolute bottom-3 left-3 rounded-md px-2.5 py-1 text-xs font-bold text-white',
            accent.badge,
          )}
        >
          {course.level}
        </span>

        {isEnrolled ? (
          <span className="absolute top-3 right-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
            Terdaftar
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4 md:p-5">
        <h3 className="line-clamp-2 text-base font-bold text-foreground">{course.title}</h3>
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

        {isEnrolled ? (
          <div className="mt-4">
            <div className="mb-2 flex justify-between text-[11px] font-medium">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary">{enrollment!.progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-linear-to-r from-brand-red via-brand-orange to-brand-yellow transition-all"
                style={{ width: `${Math.max(enrollment!.progress > 0 ? 4 : 0, enrollment!.progress)}%` }}
              />
            </div>
          </div>
        ) : null}

        <Button asChild variant={action.variant} size="default" className="mt-5 w-full gap-1.5">
          <Link href={action.href}>
            {action.variant === 'default' ? <Play className="size-4 fill-current" /> : null}
            {action.label}
            {action.variant === 'outline' ? <ChevronRight className="size-4" /> : null}
          </Link>
        </Button>
      </div>
    </motion.article>
  );
}
