import { cache } from 'react';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { isLmsAdmin } from '@/lib/auth/resolve-lms-admin';
import type { ContinueLesson, JlptPathItem } from '@/features/student/components/dashboard-data';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { DEFAULT_THUMB } from '@/features/learning/lib/course-display';
import type { CourseProgress } from '@/features/learning/lib/progress';
import {
  getCoursesWithDbIds,
  getUserEnrollments,
  type StudentEnrollmentView,
} from '@/features/learning/lib/queries';
import { prisma } from '@/lib/prisma';
import type { CatalogCourse } from '@/features/learning/components/courses-data';

export type KursusEnrollmentCard = {
  course: CatalogCourse & { dbId: string; lessonCount: number; isPublished: boolean; priceIdr: number };
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

function lessonCategoryFromMaterials(counts: {
  kanjis: number;
  kosakatas: number;
  tataBahasas: number;
}): ContinueLesson['category'] {
  if (counts.kanjis > 0) return 'Kanji';
  if (counts.kosakatas > 0) return 'Kosa Kata';
  if (counts.tataBahasas > 0) return 'Tata Bahasa';
  return 'Tata Bahasa';
}

const JLPT_LEVEL_ORDER: JlptPathItem['level'][] = ['N5', 'N4', 'N3', 'N2', 'N1'];

function buildJlptPath(
  enrollments: StudentEnrollmentView[],
  courses: (CatalogCourse & { dbId: string; lessonCount: number; isPublished: boolean })[],
): JlptPathItem[] {
  const courseBySlug = Object.fromEntries(courses.map((c) => [c.slug, c]));
  const levelStats = new Map<
    JlptPathItem['level'],
    { percent: number; status: CourseProgress['status'] }
  >();

  for (const enrollment of enrollments) {
    const course = courseBySlug[enrollment.courseSlug];
    if (!course) continue;
    const level = course.level as JlptPathItem['level'];
    if (!JLPT_LEVEL_ORDER.includes(level)) continue;

    const current = levelStats.get(level);
    if (!current || enrollment.progress.percent > current.percent) {
      levelStats.set(level, {
        percent: enrollment.progress.percent,
        status: enrollment.progress.status,
      });
    }
  }

  const hasPublished = (level: JlptPathItem['level']) =>
    courses.some((c) => c.level === level && c.isPublished);

  const path: JlptPathItem[] = [];
  let chainUnlocked = true;

  for (const level of JLPT_LEVEL_ORDER) {
    const stat = levelStats.get(level);

    if (stat?.status === 'completed') {
      path.push({ level, status: 'done' });
      continue;
    }

    if (stat && stat.status !== 'not_started' && chainUnlocked) {
      path.push({ level, status: 'active', progress: stat.percent });
      chainUnlocked = false;
      continue;
    }

    if (chainUnlocked && hasPublished(level)) {
      path.push({ level, status: 'active', progress: stat?.percent ?? 0 });
      chainUnlocked = false;
      continue;
    }

    path.push({ level, status: 'locked' });
    chainUnlocked = false;
  }

  return path;
}

export const loadStudentKursusData = cache(async function loadStudentKursusData(): Promise<StudentKursusData> {
  const userId = await requireAuthUserId();
  const adminAccess = await isLmsAdmin(userId);

  const [allCourses, enrollments] = await Promise.all([
    getCoursesWithDbIds(),
    getUserEnrollments(userId),
  ]);

  const courses = allCourses.filter((c) => c.isPublished);

  // Admin bypass — untuk kursus yang belum di-enroll, buat synthetic enrollment
  let effectiveEnrollments = enrollments;
  if (adminAccess) {
    const enrolledSlugs = new Set(enrollments.map((e) => e.courseSlug));
    const syntheticEnrollments: StudentEnrollmentView[] = courses
      .filter((c) => !enrolledSlugs.has(c.slug))
      .map((c) => ({
        courseId: c.dbId,
        courseSlug: c.slug,
        enrollmentStatus: 'ACTIVE' as const,
        progress: {
          completedCount: 0,
          totalCount: c.lessonCount,
          percent: 0,
          status: 'not_started' as const,
          continueLessonSlug: null,
        },
      }));
    effectiveEnrollments = [...enrollments, ...syntheticEnrollments];
  }

  const enrollmentBySlug = Object.fromEntries(
    effectiveEnrollments.map((e) => [e.courseSlug, e]),
  );

  const enrolledCards: KursusEnrollmentCard[] = effectiveEnrollments
    .map((enrollment) => {
      const course = courses.find((c) => c.slug === enrollment.courseSlug);
      if (!course) return null;
      return {
        course,
        enrollment: {
          courseSlug: enrollment.courseSlug,
          continueLessonSlug: enrollment.progress.continueLessonSlug ?? '',
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
      enrolled: effectiveEnrollments.length,
      active: effectiveEnrollments.filter((e) => e.progress.status === 'active').length,
      completed: effectiveEnrollments.filter((e) => e.progress.status === 'completed').length,
    },
  };
});

export const loadDashboardJlptPath = cache(async function loadDashboardJlptPath(): Promise<
  JlptPathItem[]
> {
  const userId = await requireAuthUserId();
  const [allCourses, enrollments] = await Promise.all([
    getCoursesWithDbIds(),
    getUserEnrollments(userId),
  ]);
  const courses = allCourses.filter((c) => c.isPublished);
  return buildJlptPath(enrollments, courses);
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

  const courses = await getCoursesWithDbIds();
  const courseBySlug = Object.fromEntries(courses.map((c) => [c.slug, c]));

  const lessons = await prisma.lesson.findMany({
    where: { slug: { in: lessonSlugs } },
    select: {
      title: true,
      slug: true,
      module: { select: { course: { select: { slug: true, level: true } } } },
      _count: { select: { kanjis: true, kosakatas: true, tataBahasas: true } },
    },
  });

  const lessonBySlug = Object.fromEntries(lessons.map((l) => [l.slug, l]));

  return slice.flatMap((enrollment) => {
    const slug = enrollment.progress.continueLessonSlug;
    if (!slug) return [];
    const lesson = lessonBySlug[slug];
    if (!lesson) return [];

    const course = courseBySlug[enrollment.courseSlug];

    return [
      {
        title: lesson.title,
        level: lesson.module.course.level,
        duration: '—',
        progress: enrollment.progress.percent,
        category: lessonCategoryFromMaterials(lesson._count),
        href: STUDENT_ROUTES.belajar(lesson.module.course.slug, lesson.slug),
        image: course?.thumb ?? DEFAULT_THUMB,
      },
    ];
  });
});

export const loadPublishedCatalog = cache(async function loadPublishedCatalog() {
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
