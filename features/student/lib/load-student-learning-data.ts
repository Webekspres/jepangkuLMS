import { cache } from 'react';
import { requireAuthUserId } from '@/lib/auth/require-auth-user';
import { isLmsAdmin } from '@/lib/auth/resolve-lms-admin';
import type {
  ContinueLesson,
  DashboardJlptPathData,
} from '@/features/student/components/dashboard-data';
import { STUDENT_ROUTES } from '@/features/student/components/student-routes';
import { DEFAULT_THUMB } from '@/features/learning/lib/course-display';
import {
  getCoursesWithDbIds,
  getUserEnrollments,
  type StudentEnrollmentView,
} from '@/features/learning/lib/queries';
import { computeCourseProgressFromLessons } from '@/features/learning/lib/progress';
import { analyzeTryoutAttempt } from '@/features/tryout/lib/tryout-attempt-analysis';
import {
  buildJlptPathFromLevelSummaries,
  summarizeTryoutAttempts,
} from '@/features/tryout/lib/jlpt-path-from-tryouts';
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

  // ── Compute fresh real progress directly from DB (bypass cache) ──────────
  const enrolledCourseSlugs = effectiveEnrollments.map((e) => e.courseSlug);

  const [enrolledCoursesWithLessons, completedProgressRows] = await Promise.all([
    prisma.course.findMany({
      where: { slug: { in: enrolledCourseSlugs } },
      select: {
        slug: true,
        modules: {
          orderBy: { order: 'asc' },
          select: {
            lessons: {
              orderBy: { order: 'asc' },
              select: { id: true, slug: true, order: true },
            },
          },
        },
      },
    }),
    prisma.userProgress.findMany({
      where: {
        userId,
        lesson: { module: { course: { slug: { in: enrolledCourseSlugs } } } },
        isCompleted: true,
      },
      select: { lessonId: true },
    }),
  ]);

  const completedLessonIds = new Set(completedProgressRows.map((p) => p.lessonId));

  // Map of courseSlug → computed real progress
  const freshProgressByCourseSlug = new Map<string, ReturnType<typeof computeCourseProgressFromLessons>>();
  for (const c of enrolledCoursesWithLessons) {
    const flatLessons = c.modules.flatMap((m) => m.lessons);
    const completedSlugs = new Set(
      flatLessons.filter((l) => completedLessonIds.has(l.id)).map((l) => l.slug),
    );
    freshProgressByCourseSlug.set(c.slug, computeCourseProgressFromLessons(flatLessons, completedSlugs));
  }

  function withFreshProgress(enrollment: StudentEnrollmentView): StudentEnrollmentView {
    const fresh = freshProgressByCourseSlug.get(enrollment.courseSlug);
    if (!fresh) return enrollment;
    return {
      ...enrollment,
      progress: {
        ...enrollment.progress,
        completedCount: fresh.completedCount,
        totalCount: fresh.totalCount,
        percent: fresh.percent,
        status: fresh.status,
        continueLessonSlug: fresh.continueLessonSlug,
      },
    };
  }

  const enrollmentBySlug = Object.fromEntries(
    effectiveEnrollments.map((e) => [e.courseSlug, withFreshProgress(e)]),
  );

  const enrolledCards: KursusEnrollmentCard[] = effectiveEnrollments
    .map((enrollment) => {
      const course = courses.find((c) => c.slug === enrollment.courseSlug);
      if (!course) return null;

      const synced = withFreshProgress(enrollment);
      const { progress } = synced;

      return {
        course,
        enrollment: {
          courseSlug: enrollment.courseSlug,
          continueLessonSlug: progress.continueLessonSlug ?? '',
          progress: progress.percent,
          status: progress.status,
          lastAccessLabel: progress.percent > 0 ? 'Baru-baru ini' : 'Belum dimulai',
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
      active: enrolledCards.filter((c) => c.enrollment.status === 'active').length,
      completed: enrolledCards.filter((c) => c.enrollment.status === 'completed').length,
    },
  };
});

export const loadDashboardJlptPath = cache(async function loadDashboardJlptPath(): Promise<DashboardJlptPathData> {
  const userId = await requireAuthUserId();

  const attempts = await prisma.quizAttempt.findMany({
    where: {
      userId,
      type: 'TRYOUT',
      tryoutSessionId: { not: null },
    },
    select: {
      id: true,
      answersJson: true,
      paperSnapshotJson: true,
      tryoutSessionId: true,
      tryoutLevel: true,
      correctCount: true,
      totalQuestions: true,
      createdAt: true,
      tryoutSession: { select: { level: true } },
    },
  });

  const analyzed = (await Promise.all(attempts.map(analyzeTryoutAttempt))).filter(
    (attempt): attempt is NonNullable<typeof attempt> => attempt != null,
  );

  return buildJlptPathFromLevelSummaries(
    summarizeTryoutAttempts(analyzed),
    attempts.length > 0,
  );
});

export const loadDashboardContinueLessons = cache(async function loadDashboardContinueLessons(): Promise<
  ContinueLesson[]
> {
  const userId = await requireAuthUserId();
  const enrollments = await getUserEnrollments(userId);

  const active = enrollments.filter((e) => e.progress.status !== 'completed');
  const candidates = active.length > 0 ? active : enrollments;

  const courseIds = candidates.map((e) => e.courseId);
  const latestCompletionByCourse = new Map<string, number>();

  if (courseIds.length > 0) {
    const recentProgress = await prisma.userProgress.findMany({
      where: {
        userId,
        isCompleted: true,
        lesson: { module: { courseId: { in: courseIds } } },
      },
      orderBy: { completedAt: 'desc' },
      select: {
        completedAt: true,
        lesson: { select: { module: { select: { courseId: true } } } },
      },
    });

    for (const row of recentProgress) {
      const courseId = row.lesson.module.courseId;
      if (!latestCompletionByCourse.has(courseId)) {
        latestCompletionByCourse.set(courseId, row.completedAt?.getTime() ?? 0);
      }
    }
  }

  const sorted = [...candidates].sort((a, b) => {
    const aTime = latestCompletionByCourse.get(a.courseId) ?? 0;
    const bTime = latestCompletionByCourse.get(b.courseId) ?? 0;
    return bTime - aTime;
  });

  const slice = sorted.slice(0, 3);

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
