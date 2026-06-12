import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { mergeCourseDisplay } from '@/features/learning/lib/course-display';
import type { StudentEnrollmentView } from '@/features/learning/lib/queries';
import { computeCourseProgressFromLessons } from '@/features/learning/lib/progress';

/** Tag untuk invalidation — dipanggil dari server actions saat enroll/progress berubah. */
export const LEARNING_CACHE_TAGS = {
  coursesCatalog: 'courses-catalog',
  allEnrollments: 'enrollments',
  userEnrollments: (userId: string) => `enrollments-${userId}`,
  lessonMaterials: (lessonId: string) => `lesson-materials-${lessonId}`,
} as const;

/** Katalog kursus — sama untuk semua user, jarang berubah. */
export const getCachedCoursesWithDbIds = unstable_cache(
  async () => {
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        level: true,
        isPublished: true,
        _count: { select: { lessons: true } },
      },
    });

    return courses.map((course) => ({
      ...mergeCourseDisplay({
        slug: course.slug,
        title: course.title,
        description: course.description,
        level: course.level,
        isPublished: course.isPublished,
        lessonCount: course._count.lessons,
      }),
      dbId: course.id,
      lessonCount: course._count.lessons,
    }));
  },
  ['learning-courses-catalog-v1'],
  { revalidate: 3600, tags: [LEARNING_CACHE_TAGS.coursesCatalog] },
);

/** Enrollment + progress per user — cache pendek, di-invalidate saat enroll/selesai lesson. */
export function getCachedUserEnrollments(userId: string): Promise<StudentEnrollmentView[]> {
  return unstable_cache(
    async () => {
      const enrollments = await prisma.enrollment.findMany({
        where: { userId, status: 'ACTIVE' },
        include: {
          course: {
            include: {
              lessons: { orderBy: { order: 'asc' }, select: { id: true, slug: true, order: true } },
            },
          },
        },
      });

      const allLessonIds = enrollments.flatMap((e) => e.course.lessons.map((l) => l.id));
      const progressRows =
        allLessonIds.length === 0
          ? []
          : await prisma.userProgress.findMany({
              where: { userId, lessonId: { in: allLessonIds }, isCompleted: true },
              select: { lessonId: true },
            });

      const completedLessonIds = new Set(progressRows.map((p) => p.lessonId));

      return enrollments.map((enrollment) => {
        const completedSlugs = new Set(
          enrollment.course.lessons
            .filter((l) => completedLessonIds.has(l.id))
            .map((l) => l.slug),
        );

        return {
          courseId: enrollment.courseId,
          courseSlug: enrollment.course.slug,
          enrollmentStatus: enrollment.status,
          progress: computeCourseProgressFromLessons(enrollment.course.lessons, completedSlugs),
        };
      });
    },
    ['learning-user-enrollments-v1', userId],
    {
      revalidate: 120,
      tags: [
        LEARNING_CACHE_TAGS.allEnrollments,
        LEARNING_CACHE_TAGS.userEnrollments(userId),
      ],
    },
  )();
}

/** Materi lesson (kanji/kosakata/tata bahasa) — konten statis dari seed/Excel. */
export function getCachedLessonMaterials(lessonId: string) {
  return unstable_cache(
    async (id: string) => {
      const [kanjis, kosakatas, tataBahasas, quizCount] = await prisma.$transaction([
        prisma.materialKanji.findMany({
          where: { lessonId: id },
          include: { category: true },
          take: 50,
          orderBy: { huruf: 'asc' },
        }),
        prisma.materialKosakata.findMany({
          where: { lessonId: id },
          include: { category: true },
          take: 50,
          orderBy: { kosakata: 'asc' },
        }),
        prisma.materialTataBahasa.findMany({
          where: { lessonId: id },
          include: { category: true },
          take: 50,
          orderBy: { tataBahasa: 'asc' },
        }),
        prisma.question.count({ where: { lessonId: id } }),
      ]);

      return { kanjis, kosakatas, tataBahasas, quizCount };
    },
    ['learning-lesson-materials-v1', lessonId],
    {
      revalidate: 3600,
      tags: [LEARNING_CACHE_TAGS.lessonMaterials(lessonId)],
    },
  )(lessonId);
}

/** Ringkasan kursus + silabus DB — cache katalog, tanpa progress user. */
export function getCachedCourseWithLessons(slug: string) {
  return unstable_cache(
    async (courseSlug: string) => {
      const course = await prisma.course.findUnique({
        where: { slug: courseSlug },
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              slug: true,
              title: true,
              order: true,
              content: true,
              videoUrl: true,
              _count: { select: { questions: true } },
            },
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
          hasQuiz: lesson._count.questions > 0,
        })),
      };
    },
    ['learning-course-with-lessons-v1', slug],
    { revalidate: 3600, tags: [LEARNING_CACHE_TAGS.coursesCatalog] },
  )(slug);
}
