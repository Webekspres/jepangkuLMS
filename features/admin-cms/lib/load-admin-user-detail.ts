import { cache } from 'react';
import type { EnrollmentStatus, LevelJLPT } from '@prisma/client';
import { fetchClerkPrimaryEmail } from '@/lib/auth/clerk-user-email';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export type AdminUserCourseEnrollmentRow = {
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

export type AdminUserLiveClassEnrollmentRow = {
  id: string;
  status: EnrollmentStatus;
  createdAt: Date;
  liveClassId: string;
  title: string;
  senseiName: string;
  level: LevelJLPT;
  priceIdr: number;
};

export type AdminUserTryoutEnrollmentRow = {
  id: string;
  status: EnrollmentStatus;
  createdAt: Date;
  tryoutSessionId: string;
  title: string;
  code: string;
  phaseLabel: string;
  level: LevelJLPT;
  priceIdr: number;
};

export type AdminGrantProductOption = { id: string; title: string };

export type AdminUserDetail = {
  id: string;
  displayName: string | null;
  ssoDisplayName: string | null;
  ssoEmail: string | null;
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
  courseEnrollments: AdminUserCourseEnrollmentRow[];
  liveClassEnrollments: AdminUserLiveClassEnrollmentRow[];
  tryoutEnrollments: AdminUserTryoutEnrollmentRow[];
};

export async function loadAdminGrantProductOptions(): Promise<{
  courses: AdminGrantProductOption[];
  liveClasses: AdminGrantProductOption[];
  tryoutSessions: AdminGrantProductOption[];
}> {
  const [courses, liveClasses, tryoutSessions] = await Promise.all([
    prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.liveClass.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.tryoutSession.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true },
    }),
  ]);
  return { courses, liveClasses, tryoutSessions };
}

/** @deprecated Use loadAdminGrantProductOptions */
export async function loadAdminCourseOptions(): Promise<
  { id: string; title: string; slug: string }[]
> {
  return prisma.course.findMany({
    orderBy: { title: 'asc' },
    select: { id: true, title: true, slug: true },
  });
}

async function resolveAdminUserEmail(userId: string, cached: string | null): Promise<string | null> {
  const trimmed = cached?.trim();
  if (trimmed) return trimmed;

  const fetched = await fetchClerkPrimaryEmail(userId);
  if (!fetched) return null;

  await prisma.user
    .update({
      where: { id: userId },
      data: { ssoEmail: fetched },
    })
    .catch(() => undefined);

  return fetched;
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
          liveClass: {
            select: { id: true, title: true, senseiName: true, level: true, priceIdr: true },
          },
          tryoutSession: {
            select: {
              id: true,
              title: true,
              code: true,
              phaseLabel: true,
              level: true,
              priceIdr: true,
            },
          },
        },
      },
      _count: { select: { badges: true, attempts: true, enrollments: true } },
    },
  });

  if (!user) return null;

  const completedLessonIds = new Set(user.progress.map((row) => row.lessonId));

  const courseEnrollments: AdminUserCourseEnrollmentRow[] = [];
  const liveClassEnrollments: AdminUserLiveClassEnrollmentRow[] = [];
  const tryoutEnrollments: AdminUserTryoutEnrollmentRow[] = [];

  for (const row of user.enrollments) {
    if (row.type === 'COURSE' && row.course) {
      const course = row.course;
      const lessonIds = course.modules.flatMap((mod) => mod.lessons.map((lesson) => lesson.id));
      const totalLessons = lessonIds.length;
      const completedLessons = lessonIds.filter((id) => completedLessonIds.has(id)).length;
      courseEnrollments.push({
        id: row.id,
        status: row.status,
        createdAt: row.createdAt,
        courseId: course.id,
        courseTitle: course.title,
        courseSlug: course.slug,
        courseLevel: course.level,
        priceIdr: course.priceIdr,
        completedLessons,
        totalLessons,
      });
    } else if (row.type === 'LIVE_CLASS' && row.liveClass) {
      liveClassEnrollments.push({
        id: row.id,
        status: row.status,
        createdAt: row.createdAt,
        liveClassId: row.liveClass.id,
        title: row.liveClass.title,
        senseiName: row.liveClass.senseiName,
        level: row.liveClass.level,
        priceIdr: row.liveClass.priceIdr,
      });
    } else if (row.type === 'TRYOUT' && row.tryoutSession) {
      tryoutEnrollments.push({
        id: row.id,
        status: row.status,
        createdAt: row.createdAt,
        tryoutSessionId: row.tryoutSession.id,
        title: row.tryoutSession.title,
        code: row.tryoutSession.code,
        phaseLabel: row.tryoutSession.phaseLabel,
        level: row.tryoutSession.level,
        priceIdr: row.tryoutSession.priceIdr,
      });
    }
  }

  const allEnrollments = [...courseEnrollments, ...liveClassEnrollments, ...tryoutEnrollments];
  const ssoEmail = await resolveAdminUserEmail(user.id, user.ssoEmail);

  return {
    id: user.id,
    displayName: user.displayName,
    ssoDisplayName: user.ssoDisplayName,
    ssoEmail,
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
    activeEnrollmentCount: allEnrollments.filter((row) => row.status === 'ACTIVE').length,
    courseEnrollments,
    liveClassEnrollments,
    tryoutEnrollments,
  };
});
