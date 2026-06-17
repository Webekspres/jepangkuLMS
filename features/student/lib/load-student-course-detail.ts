import { cache } from 'react';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import {
  getCachedCourseWithLessons,
  getCachedUserEnrollments,
} from '@/lib/cache/learning-cache';
import { getCourseBySlug as getMarketingCourseDetail } from '@/features/learning/components/course-detail-data';

export const loadStudentCourseDetail = cache(async function loadStudentCourseDetail(
  courseSlug: string,
) {
  const userId = await requireAuthUserId();
  const [course, enrollments] = await Promise.all([
    getCachedCourseWithLessons(courseSlug),
    getCachedUserEnrollments(userId),
  ]);

  if (!course) return null;

  const enrollment = enrollments.find((e) => e.courseSlug === courseSlug) ?? null;
  const marketing = getMarketingCourseDetail(courseSlug);

  return {
    course,
    enrollment,
    marketing,
    isEnrolled: Boolean(enrollment),
  };
});
