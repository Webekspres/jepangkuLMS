'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import {
  LessonQuizPanel,
  type LessonQuizQuestion,
} from '@/features/learning/components/lesson-quiz-panel';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';

export type QuizQuestion = LessonQuizQuestion;

export type QuizWorkspaceProps = {
  lesson: {
    id: string;
    slug: string;
    title: string;
    courseSlug: string;
    courseTitle: string;
  };
  questions: LessonQuizQuestion[];
};

/** Mode fokus penuh — dipakai dari `/dashboard/kuis/[lessonSlug]` (deep link). */
export function QuizWorkspace({ lesson, questions }: QuizWorkspaceProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div>
        <Link
          href={STUDENT_ROUTES.belajar(lesson.courseSlug, lesson.slug)}
          className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="size-3.5" />
          Kembali ke pelajaran
        </Link>
        <p className="text-xs text-muted-foreground">{lesson.courseTitle}</p>
        <h1 className="text-xl font-bold text-foreground sm:text-2xl">Kuis — {lesson.title}</h1>
      </div>
      <LessonQuizPanel
        lessonId={lesson.id}
        lessonSlug={lesson.slug}
        lessonTitle={lesson.title}
        questions={questions}
      />
    </div>
  );
}
