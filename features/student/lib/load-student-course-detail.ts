import { cache } from 'react';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { isLmsAdmin } from '@/lib/auth/resolve-lms-admin';
import {
  getCachedCourseWithLessons,
  getCachedUserEnrollments,
} from '@/lib/cache/learning-cache';
import { estimateCourseDuration } from '@/features/learning/lib/course-display';
import { prisma } from '@/lib/prisma';
import type { EnrollmentStatus } from '@prisma/client';
import { computeCourseProgressFromLessons } from '@/features/learning/lib/progress';

export const loadStudentCourseDetail = cache(async function loadStudentCourseDetail(
  courseSlug: string,
) {
  const userId = await requireAuthUserId();
  const adminAccess = await isLmsAdmin(userId);

  const [course, enrollmentRow, user, activeEnrollments, completedProgress] = await Promise.all([
    getCachedCourseWithLessons(courseSlug),
    prisma.enrollment.findFirst({
      where: { userId, course: { slug: courseSlug } },
      select: { id: true, status: true, courseId: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    }),
    getCachedUserEnrollments(userId),
    prisma.userProgress.findMany({
      where: {
        userId,
        lesson: { module: { course: { slug: courseSlug } } },
        isCompleted: true,
      },
      select: { lesson: { select: { slug: true } } },
    }),
  ]);

  if (!course) return null;

  // Admin bypass — dianggap enrolled ACTIVE meski tanpa enrollment record
  const enrollmentStatus = adminAccess
    ? 'ACTIVE'
    : ((enrollmentRow?.status ?? null) as EnrollmentStatus | null);
  const isEnrolled = enrollmentStatus === 'ACTIVE';
  const enrollment = activeEnrollments.find((e) => e.courseSlug === courseSlug) ?? null;

  const completedSlugs = new Set(completedProgress.map((p) => p.lesson.slug));
  const progress = computeCourseProgressFromLessons(course.lessons, completedSlugs);

  return {
    course,
    enrollment,
    progress,
    enrollmentStatus,
    isEnrolled,
    isPending: !adminAccess && enrollmentStatus === 'PENDING',
    studentDisplayName: user?.displayName ?? null,
    whatYouLearn: course.outcomes ?? [],
    duration: estimateCourseDuration(course.lessonCount),
    tags: [course.level],
    priceIdr: course.priceIdr,
  };
});
