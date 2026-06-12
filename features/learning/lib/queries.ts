import { cache } from 'react';
import type { EnrollmentStatus, LevelJLPT } from '@prisma/client';
import {
  getCachedCoursesWithDbIds,
  getCachedLessonMaterials,
  getCachedUserEnrollments,
} from '@/lib/cache/learning-cache';
import { prisma } from '@/lib/prisma';
import { mergeCourseDisplay } from './course-display';
import {
  computeCourseProgressFromLessons,
  type CourseProgress,
} from './progress';

export type { CourseProgress };

export type StudentEnrollmentView = {
  courseId: string;
  courseSlug: string;
  enrollmentStatus: EnrollmentStatus;
  progress: CourseProgress;
};

export type LessonNavItem = {
  id: string;
  slug: string;
  title: string;
  order: number;
  isCompleted: boolean;
  hasQuiz: boolean;
};

function computeProgress(
  lessons: { slug: string; order: number }[],
  completedSlugs: Set<string>,
): CourseProgress {
  return computeCourseProgressFromLessons(lessons, completedSlugs);
}

export const getCoursesWithDbIds = getCachedCoursesWithDbIds;

export const getPublishedCourses = cache(async function getPublishedCourses() {
  const courses = await getCoursesWithDbIds();
  return courses.map(({ dbId: _dbId, lessonCount: _lc, ...rest }) => rest);
});

export const getCourseBySlug = cache(async function getCourseBySlug(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { questions: true } } },
      },
    },
  });

  if (!course) return null;

  return {
    ...mergeCourseDisplay({
      slug: course.slug,
      title: course.title,
      description: course.description,
      level: course.level,
      isPublished: course.isPublished,
      lessonCount: course.lessons.length,
    }),
    dbId: course.id,
    lessons: course.lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      hasQuiz: lesson._count.questions > 0,
    })),
  };
});

export const getUserEnrollments = getCachedUserEnrollments;

export async function getLessonWorkspace(
  userId: string,
  courseSlug: string,
  lessonSlug: string,
) {
  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          _count: { select: { questions: true } },
        },
      },
    },
  });

  if (!course) return null;

  const lesson = course.lessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
  });

  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return { accessDenied: true as const, courseSlug, lessonSlug };
  }

  const [progress, materialsBundle] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId, lessonId: { in: course.lessons.map((l) => l.id) } },
      select: { lessonId: true, isCompleted: true },
    }),
    getCachedLessonMaterials(lesson.id),
  ]);

  const completedIds = new Set(
    progress.filter((p) => p.isCompleted).map((p) => p.lessonId),
  );

  const syllabus: LessonNavItem[] = course.lessons.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    order: l.order,
    isCompleted: completedIds.has(l.id),
    hasQuiz: l._count.questions > 0,
  }));

  const { kanjis, kosakatas, tataBahasas, quizCount } = materialsBundle;

  const questions =
    quizCount > 0
      ? await prisma.question.findMany({
          where: { lessonId: lesson.id },
          include: { options: { orderBy: { id: 'asc' } } },
          orderBy: { id: 'asc' },
        })
      : [];

  return {
    accessDenied: false as const,
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      level: course.level as LevelJLPT,
    },
    lesson: {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
      content: lesson.content,
      videoUrl: lesson.videoUrl,
      isCompleted: completedIds.has(lesson.id),
      quizCount,
    },
    syllabus,
    materials: { kanjis, kosakatas, tataBahasas },
    questions: questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      explanation: q.explanation,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

export async function getLessonQuizBySlug(lessonSlug: string, userId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { slug: lessonSlug },
    include: {
      course: true,
      questions: {
        include: { options: { orderBy: { id: 'asc' } } },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!lesson) return null;

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.courseId } },
  });

  if (!enrollment || enrollment.status !== 'ACTIVE') {
    return { accessDenied: true as const, lessonSlug };
  }

  if (lesson.questions.length === 0) {
    return { accessDenied: false as const, lesson, questions: [], empty: true as const };
  }

  return {
    accessDenied: false as const,
    lesson: {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      courseSlug: lesson.course.slug,
      courseTitle: lesson.course.title,
    },
    questions: lesson.questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      explanation: q.explanation,
      xpReward: q.xpReward,
      options: q.options.map((o) => ({
        id: o.id,
        text: o.text,
      })),
    })),
    empty: false as const,
  };
}

export async function getLatestQuizAttempt(userId: string, lessonId: string) {
  return prisma.quizAttempt.findFirst({
    where: { userId, lessonId, type: 'QUIZ' },
    orderBy: { createdAt: 'desc' },
  });
}
