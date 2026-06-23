import { cache } from 'react';
import type { EnrollmentStatus, LevelJLPT } from '@prisma/client';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export type AdminUserEnrollmentRow = {
  id: string;
  status: EnrollmentStatus;
  createdAt: Date;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseLevel: LevelJLPT;
  priceIdr: number;
  completedLessons: number;
  totalLessons: number;
};

export type AdminUserDetail = {
  id: string;
  displayName: string | null;
  ssoDisplayName: string | null;
  resolvedDisplayName: string;
  avatarUrl: string | null;
  role: 'LMS_STUDENT' | 'LMS_ADMIN';
  lmsPoints: number;
  badgeCount: number;
  equippedBadgeTitle: string | null;
  createdAt: Date;
  completedLessonsTotal: number;
  quizAttempts: number;
  enrollmentCount: number;
  activeEnrollmentCount: number;
  enrollments: AdminUserEnrollmentRow[];
};

export async function loadAdminCourseOptions(): Promise<
  { id: string; title: string; slug: string }[]
> {
  return prisma.course.findMany({
    orderBy: { title: 'asc' },
    select: { id: true, title: true, slug: true },
  });
}

export const loadAdminUserDetail = cache(async function loadAdminUserDetail(
  userId: string,
): Promise<AdminUserDetail | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      lmsStats: { select: { lmsPoints: true } },
      equippedBadge: { select: { title: true } },
      progress: { where: { isCompleted: true }, select: { lessonId: true } },
      enrollments: {
        orderBy: { createdAt: 'desc' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              level: true,
              priceIdr: true,
              modules: { select: { lessons: { select: { id: true } } } },
            },
          },
        },
      },
      _count: { select: { badges: true, attempts: true, enrollments: true } },
    },
  });

  if (!user) return null;

  const completedLessonIds = new Set(user.progress.map((row) => row.lessonId));

  const enrollments: AdminUserEnrollmentRow[] = user.enrollments.map((row) => {
    const lessonIds = row.course.modules.flatMap((mod) => mod.lessons.map((lesson) => lesson.id));
    const totalLessons = lessonIds.length;
    const completedLessons = lessonIds.filter((id) => completedLessonIds.has(id)).length;

    return {
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      courseId: row.course.id,
      courseTitle: row.course.title,
      courseSlug: row.course.slug,
      courseLevel: row.course.level,
      priceIdr: row.course.priceIdr,
      completedLessons,
      totalLessons,
    };
  });

  return {
    id: user.id,
    displayName: user.displayName,
    ssoDisplayName: user.ssoDisplayName,
    resolvedDisplayName: resolvePublicDisplayName({
      displayName: user.displayName,
      ssoDisplayName: user.ssoDisplayName,
    }),
    avatarUrl: user.avatarUrl,
    role: user.role,
    lmsPoints: user.lmsStats?.lmsPoints ?? 0,
    badgeCount: user._count.badges,
    equippedBadgeTitle: user.equippedBadge?.title ?? null,
    createdAt: user.createdAt,
    completedLessonsTotal: user.progress.length,
    quizAttempts: user._count.attempts,
    enrollmentCount: user._count.enrollments,
    activeEnrollmentCount: enrollments.filter((row) => row.status === 'ACTIVE').length,
    enrollments,
  };
});
