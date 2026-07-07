import { cache } from 'react';
import { getEnrollmentCountsByProduct } from '@/features/admin-cms/lib/enrollment-counts';
import { prisma } from '@/lib/prisma';

export type AdminCourseRow = {
  id: string;
  title: string;
  slug: string;
  level: string;
  isPublished: boolean;
  moduleCount: number;
  lessonCount: number;
  activeEnrollments: number;
  pendingEnrollments: number;
  createdAt: Date;
};

export const loadAdminCourses = cache(async function loadAdminCourses(): Promise<AdminCourseRow[]> {
  const courses = await prisma.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      modules: {
        select: {
          _count: { select: { lessons: true } },
        },
      },
    },
  });

  const enrollmentCounts = await getEnrollmentCountsByProduct(
    'COURSE',
    courses.map((course) => course.id),
  );

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    level: course.level,
    isPublished: course.isPublished,
    moduleCount: course.modules.length,
    lessonCount: course.modules.reduce((sum, mod) => sum + mod._count.lessons, 0),
    activeEnrollments: enrollmentCounts[course.id]?.active ?? 0,
    pendingEnrollments: enrollmentCounts[course.id]?.pending ?? 0,
    createdAt: course.createdAt,
  }));
});

export const loadAdminCourseById = cache(async function loadAdminCourseById(id: string) {
  return prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { _count: { select: { lessons: true } } },
      },
    },
  });
});

export const loadAdminModuleById = cache(async function loadAdminModuleById(
  courseId: string,
  moduleId: string,
) {
  return prisma.module.findFirst({
    where: { id: moduleId, courseId },
    include: {
      course: { select: { id: true, title: true, slug: true } },
      lessons: {
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: {
              questions: true,
              kosakatas: true,
              kanjis: true,
              tataBahasas: true,
            },
          },
        },
      },
    },
  });
});

export const loadAdminLessonById = cache(async function loadAdminLessonById(
  courseId: string,
  moduleId: string,
  lessonId: string,
) {
  return prisma.lesson.findFirst({
    where: { id: lessonId, moduleId, module: { courseId } },
    include: {
      module: {
        include: { course: { select: { id: true, title: true } } },
      },
    },
  });
});

export async function getNextModuleOrder(courseId: string): Promise<number> {
  const last = await prisma.module.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  return (last?.order ?? 0) + 1;
}

export async function getNextLessonOrder(moduleId: string): Promise<number> {
  const last = await prisma.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: 'desc' },
    select: { order: true },
  });
  return (last?.order ?? 0) + 1;
}
