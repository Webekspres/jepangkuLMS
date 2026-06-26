import { cache } from 'react';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { isLmsAdmin } from '@/lib/auth/resolve-lms-admin';
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
  const adminAccess = await isLmsAdmin(userId);

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

  // Admin bypass — dianggap enrolled ACTIVE meski tanpa enrollment record
  const enrollmentStatus = adminAccess
    ? 'ACTIVE'
    : ((enrollmentRow?.status ?? null) as EnrollmentStatus | null);
  const isEnrolled = enrollmentStatus === 'ACTIVE';
  const enrollment = activeEnrollments.find((e) => e.courseSlug === courseSlug) ?? null;

  return {
    course,
    enrollment,
    enrollmentStatus,
    isEnrolled,
    isPending: !adminAccess && enrollmentStatus === 'PENDING',
    studentDisplayName: user?.displayName ?? null,
    whatYouLearn: buildWhatYouLearnFromModules(modules),
    duration: estimateCourseDuration(course.lessonCount),
    tags: [course.level],
    priceIdr: course.priceIdr,
  };
});
