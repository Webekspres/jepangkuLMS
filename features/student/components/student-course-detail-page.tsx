'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Lock,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { CourseDetail } from '@/features/learning/components/course-detail-data';
import { JLPT_ACCENT } from '@/features/marketing/components/landing-data';
import { cn } from '@/lib/utils';
import { STUDENT_ROUTES } from './student-routes';

type DbLesson = {
  id: string;
  slug: string;
  title: string;
  order: number;
  content: string | null;
  hasQuiz: boolean;
};

type DbCourse = {
  slug: string;
  title: string;
  level: string;
  desc: string;
  thumb: string;
  accent: keyof typeof JLPT_ACCENT;
  lessonCount: number;
  isPublished: boolean;
  lessons: DbLesson[];
};

export type StudentCourseDetailPageProps = {
  course: DbCourse;
  marketing: CourseDetail | undefined;
  isEnrolled: boolean;
  progressPercent: number;
  continueLessonSlug: string | null;
};

export function StudentCourseDetailPage({
  course,
  marketing,
  isEnrolled,
  progressPercent,
  continueLessonSlug,
}: StudentCourseDetailPageProps) {
  const accent = JLPT_ACCENT[course.accent];
  const whatYouLearn = marketing?.whatYouLearn ?? [];
  const fullDesc = marketing?.fullDesc ?? course.desc;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href={STUDENT_ROUTES.kursus} className="inline-flex items-center gap-1 hover:text-primary">
          <ArrowLeft className="size-4" />
          Kursus Saya
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="line-clamp-1 font-medium text-foreground">{course.title}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
            <div className="relative h-52 sm:h-64">
              <Image src={course.thumb} alt="" fill className="object-cover" sizes="800px" priority />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                <Badge className={cn('border-0 text-white', accent.badge)}>{course.level}</Badge>
                {marketing?.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-0 bg-white/20 text-white backdrop-blur-sm"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">{course.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{fullDesc}</p>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Play className="size-4 text-primary" />
                {course.lessonCount} pelajaran
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                {marketing?.duration ?? '—'}
              </span>
            </div>
          </div>

          {whatYouLearn.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-5 text-primary" />
                  Yang akan kamu pelajari
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {whatYouLearn.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-base">Silabus kursus</CardTitle>
              <Badge variant="outline">Preview</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.lessons.map((lesson, index) => {
                const locked = !isEnrolled && index > 0;
                return (
                  <div
                    key={lesson.id}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3',
                      locked && 'opacity-60',
                    )}
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                      {lesson.content && (
                        <p className="line-clamp-1 text-xs text-muted-foreground">{lesson.content}</p>
                      )}
                    </div>
                    {locked ? (
                      <Lock className="size-4 shrink-0 text-muted-foreground" />
                    ) : lesson.hasQuiz ? (
                      <Badge variant="secondary" className="shrink-0">
                        Quiz
                      </Badge>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-5 p-6">
              {isEnrolled ? (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Progress kamu
                    </p>
                    <p className="mt-1 text-3xl font-extrabold tabular-nums text-primary">
                      {progressPercent}%
                    </p>
                    <Progress value={progressPercent} className="mt-3" />
                  </div>
                  <Button asChild className="h-11 w-full gap-2">
                    <Link
                      href={STUDENT_ROUTES.belajar(
                        course.slug,
                        continueLessonSlug ?? course.lessons[0]?.slug ?? '',
                      )}
                    >
                      <Play className="size-4" />
                      Lanjutkan belajar
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Daftar kursus ini untuk membuka semua modul, materi, dan kuis.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={STUDENT_ROUTES.kursus}>Kembali & daftar</Link>
                  </Button>
                </>
              )}
              <Button asChild variant="ghost" className="w-full">
                <Link href={`/kursus/${course.slug}`}>Lihat halaman publik</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
