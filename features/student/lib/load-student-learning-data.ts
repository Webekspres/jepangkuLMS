import { cache } from 'react';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import type { ContinueLesson } from '@/features/student/components/dashboard-data';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { getCatalogCourse } from '@/features/learning/lib/course-display';
import {
  getCoursesWithDbIds,
  getUserEnrollments,
  type StudentEnrollmentView,
} from '@/features/learning/lib/queries';
import { prisma } from '@/lib/prisma';
import type { CatalogCourse } from '@/features/learning/components/courses-data';

export type KursusEnrollmentCard = {
  course: CatalogCourse & { dbId: string; lessonCount: number; isPublished: boolean };
  enrollment: {
    courseSlug: string;
    continueLessonSlug: string;
    progress: number;
    status: 'completed' | 'active' | 'not_started';
    lastAccessLabel: string;
  };
};

export type StudentKursusData = {
  courses: (CatalogCourse & { dbId: string; lessonCount: number; isPublished: boolean })[];
  enrollmentBySlug: Record<string, StudentEnrollmentView>;
  enrolledCards: KursusEnrollmentCard[];
  stats: { enrolled: number; active: number; completed: number };
};

function lessonCategoryFromSlug(slug: string): ContinueLesson['category'] {
  if (slug.includes('kanji')) return 'Kanji';
  if (slug.includes('kosakata')) return 'Kosa Kata';
  return 'Tata Bahasa';
}

export const loadStudentKursusData = cache(async function loadStudentKursusData(): Promise<StudentKursusData> {
  const userId = await requireAuthUserId();

  const [courses, enrollments] = await Promise.all([
    getCoursesWithDbIds(),
    getUserEnrollments(userId),
  ]);

  const enrollmentBySlug = Object.fromEntries(
    enrollments.map((e) => [e.courseSlug, e]),
  );

  const enrolledCards: KursusEnrollmentCard[] = enrollments
    .map((enrollment) => {
      const course = courses.find((c) => c.slug === enrollment.courseSlug);
      if (!course || !enrollment.progress.continueLessonSlug) return null;
      return {
        course,
        enrollment: {
          courseSlug: enrollment.courseSlug,
          continueLessonSlug: enrollment.progress.continueLessonSlug,
          progress: enrollment.progress.percent,
          status: enrollment.progress.status,
          lastAccessLabel: enrollment.progress.percent > 0 ? 'Baru-baru ini' : 'Belum dimulai',
        },
      };
    })
    .filter((entry): entry is KursusEnrollmentCard => entry != null);

  return {
    courses,
    enrollmentBySlug,
    enrolledCards,
    stats: {
      enrolled: enrollments.length,
      active: enrollments.filter((e) => e.progress.status === 'active').length,
      completed: enrollments.filter((e) => e.progress.status === 'completed').length,
    },
  };
});

export const loadDashboardContinueLessons = cache(async function loadDashboardContinueLessons(): Promise<
  ContinueLesson[]
> {
  const userId = await requireAuthUserId();
  const enrollments = await getUserEnrollments(userId);

  const active = enrollments.filter((e) => e.progress.status !== 'completed');
  const slice = (active.length > 0 ? active : enrollments).slice(0, 3);

  const lessonSlugs = slice
    .map((e) => e.progress.continueLessonSlug)
    .filter((slug): slug is string => Boolean(slug));

  if (lessonSlugs.length === 0) return [];

  const lessons = await prisma.lesson.findMany({
    where: { slug: { in: lessonSlugs } },
    select: {
      title: true,
      slug: true,
      course: { select: { slug: true, level: true } },
    },
  });

  const lessonBySlug = Object.fromEntries(lessons.map((l) => [l.slug, l]));

  return slice.flatMap((enrollment) => {
    const slug = enrollment.progress.continueLessonSlug;
    if (!slug) return [];
    const lesson = lessonBySlug[slug];
    if (!lesson) return [];

    const catalog = getCatalogCourse(enrollment.courseSlug);

    return [
      {
        title: lesson.title,
        level: lesson.course.level,
        duration: '—',
        progress: enrollment.progress.percent,
        category: lessonCategoryFromSlug(lesson.slug),
        href: STUDENT_ROUTES.belajar(lesson.course.slug, lesson.slug),
        image:
          catalog?.thumb ??
          'https://images.unsplash.com/photo-1613817048356-ef14b4acc3a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400',
      },
    ];
  });
});

export const loadPublishedCatalog = cache(async function loadPublishedCatalog() {
  const courses = await getCoursesWithDbIds();
  return courses.map(({ dbId: _dbId, lessonCount: _lc, ...rest }) => rest);
});
