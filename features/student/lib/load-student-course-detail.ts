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
  const modules = course.modules ?? [];

  return {
    course,
    enrollment,
    isEnrolled: Boolean(enrollment),
    whatYouLearn: buildWhatYouLearnFromModules(modules),
    duration: estimateCourseDuration(course.lessonCount),
    tags: [course.level],
  };
});
