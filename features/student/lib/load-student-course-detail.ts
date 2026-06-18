import { cache } from 'react';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import {
  getCachedCourseWithLessons,
  getCachedUserEnrollments,
} from '@/lib/cache/learning-cache';
import {
  buildWhatYouLearnFromModules,
  estimateCourseDuration,
} from '@/features/learning/lib/course-display';
import { prisma } from '@/lib/prisma';
import type { EnrollmentStatus } from '@prisma/client';

export const loadStudentCourseDetail = cache(async function loadStudentCourseDetail(
  courseSlug: string,
) {
  const userId = await requireAuthUserId();
  const [course, enrollmentRow, user, activeEnrollments] = await Promise.all([
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
  ]);

  if (!course) return null;

  const modules = course.modules ?? [];
  const enrollmentStatus = (enrollmentRow?.status ?? null) as EnrollmentStatus | null;
  const isEnrolled = enrollmentStatus === 'ACTIVE';
  const enrollment = activeEnrollments.find((e) => e.courseSlug === courseSlug) ?? null;

  return {
    course,
    enrollment,
    enrollmentStatus,
    isEnrolled,
    isPending: enrollmentStatus === 'PENDING',
    studentDisplayName: user?.displayName ?? null,
    whatYouLearn: buildWhatYouLearnFromModules(modules),
    duration: estimateCourseDuration(course.lessonCount),
    tags: [course.level],
    priceIdr: course.priceIdr,
  };
});
