import { cache } from 'react';
import type { EnrollmentStatus, LevelJLPT } from '@prisma/client';
import {
  getCachedCoursesWithDbIds,
  getCachedLessonMaterials,
  getCachedUserEnrollments,
} from '@/lib/cache/learning-cache';
import { prisma } from '@/lib/prisma';
import { isLmsAdmin } from '@/lib/auth/resolve-lms-admin';
import {
  COURSE_TREE_INCLUDE,
  flattenLessonsFromModules,
  mapCourseModulesFromPrisma,
  type ModuleRow,
} from './course-tree';
import { mergeCourseDisplay } from './course-display';
import { type CourseProgress } from './progress';

export type { CourseProgress, ModuleRow };

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

export const getCoursesWithDbIds = getCachedCoursesWithDbIds;

export const getPublishedCourses = cache(async function getPublishedCourses() {
  const courses = await getCoursesWithDbIds();
  return courses
    .filter((course) => course.isPublished)
    .map((course) => {
      const { dbId, lessonCount, ...rest } = course;
      void dbId;
      void lessonCount;
      return rest;
    });
});

export const getCourseBySlug = cache(async function getCourseBySlug(slug: string) {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: COURSE_TREE_INCLUDE,
  });

  if (!course) return null;

  const modules = mapCourseModulesFromPrisma(course.modules);
  const lessons = flattenLessonsFromModules(modules);

  return {
    ...mergeCourseDisplay({
      slug: course.slug,
      title: course.title,
      description: course.description,
      level: course.level,
      isPublished: course.isPublished,
      lessonCount: lessons.length,
      priceIdr: course.priceIdr,
    }),
    dbId: course.id,
    modules,
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
      content: lesson.content ?? null,
      videoUrl: lesson.videoUrl ?? null,
      hasQuiz: lesson.hasQuiz ?? false,
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
    include: COURSE_TREE_INCLUDE,
  });

  if (!course) return null;

  const modules = mapCourseModulesFromPrisma(course.modules);
  const allLessons = flattenLessonsFromModules(modules);
  const lesson = allLessons.find((l) => l.slug === lessonSlug);
  if (!lesson) return null;

  // Admin bypass — akses semua kursus tanpa enrollment
  const adminAccess = await isLmsAdmin(userId);

  if (!adminAccess) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return { accessDenied: true as const, courseSlug, lessonSlug };
    }
  }

  const lessonIds = allLessons.map((l) => l.id);

  const [progress, materialsBundle, lessonRow] = await Promise.all([
    prisma.userProgress.findMany({
      where: { userId, lessonId: { in: lessonIds } },
      select: { lessonId: true, isCompleted: true },
    }),
    getCachedLessonMaterials(lesson.id),
    prisma.lesson.findUnique({
      where: { id: lesson.id },
      select: { content: true, videoUrl: true },
    }),
  ]);

  const completedIds = new Set(
    progress.filter((p) => p.isCompleted).map((p) => p.lessonId),
  );

  const syllabus: LessonNavItem[] = allLessons.map((l) => ({
    id: l.id,
    slug: l.slug,
    title: l.title,
    order: l.order,
    isCompleted: completedIds.has(l.id),
    hasQuiz: l.hasQuiz ?? false,
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
    modules,
    lesson: {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      order: lesson.order,
      content: lessonRow?.content ?? null,
      hasVideo: Boolean(lessonRow?.videoUrl?.trim()),
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
      module: { include: { course: true } },
      questions: {
        include: { options: { orderBy: { id: 'asc' } } },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!lesson) return null;

  const course = lesson.module.course;

  // Admin bypass — akses semua kuis tanpa enrollment
  const adminAccessQuiz = await isLmsAdmin(userId);

  if (!adminAccessQuiz) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } },
    });

    if (!enrollment || enrollment.status !== 'ACTIVE') {
      return { accessDenied: true as const, lessonSlug };
    }
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
      courseSlug: course.slug,
      courseTitle: course.title,
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
