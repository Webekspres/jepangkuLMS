import { cache } from 'react';
import type { EnrollmentLogAction, EnrollmentType, LevelJLPT } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type DashboardRangeDays = 7 | 30;

export type DashboardTrendPoint = {
  dateKey: string;
  label: string;
  count: number;
};

export type DashboardTopCourse = {
  courseId: string;
  title: string;
  active: number;
  total: number;
};

export type DashboardEnrollmentMix = {
  type: EnrollmentType;
  label: string;
  count: number;
};

export type DashboardTryoutLevelStat = {
  level: LevelJLPT;
  attempts: number;
  avgScore: number;
};

export type DashboardLiveFill = {
  id: string;
  title: string;
  filledSlots: number;
  maxSlots: number;
  fillPercent: number;
};

export type DashboardPlacementMix = {
  level: LevelJLPT;
  count: number;
};

export type DashboardActivityItem = {
  id: string;
  action: EnrollmentLogAction;
  type: EnrollmentType;
  productTitle: string;
  studentName: string | null;
  createdAt: string;
};

export type AdminDashboardInsights = {
  rangeDays: DashboardRangeDays;
  kpis: {
    studentCount: number;
    studentsNewInRange: number;
    courseCount: number;
    publishedCourseCount: number;
    pendingEnrollments: number;
    activeEnrollments: number;
    totalEnrollments: number;
    publishedLiveClasses: number;
    upcomingLiveClasses: number;
    activeTryoutSessions: number;
    quizAttemptsInRange: number;
    tryoutAttemptsInRange: number;
    badgesIssuedTotal: number;
    badgesIssuedInRange: number;
    lessonCompletionsInRange: number;
    /** Avg % of lessons completed among ACTIVE course enrollments (0–100). */
    courseCompletionRate: number | null;
  };
  enrollmentTrend: DashboardTrendPoint[];
  studentGrowth: DashboardTrendPoint[];
  topCourses: DashboardTopCourse[];
  enrollmentMix: DashboardEnrollmentMix[];
  tryoutByLevel: DashboardTryoutLevelStat[];
  liveFill: DashboardLiveFill[];
  placementMix: DashboardPlacementMix[];
  recentActivity: DashboardActivityItem[];
};

const ENROLLMENT_TYPE_LABEL: Record<EnrollmentType, string> = {
  COURSE: 'Kursus',
  LIVE_CLASS: 'Live Class',
  TRYOUT: 'Tryout',
};

const JLPT_LEVELS: LevelJLPT[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKeyOf(d: Date): string {
  const start = startOfDay(d);
  const y = start.getFullYear();
  const m = String(start.getMonth() + 1).padStart(2, '0');
  const day = String(start.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildEmptyBuckets(rangeDays: number, now: Date): DashboardTrendPoint[] {
  const buckets: DashboardTrendPoint[] = [];
  for (let offset = rangeDays - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const start = startOfDay(day);
    buckets.push({
      dateKey: dateKeyOf(start),
      label:
        rangeDays <= 7
          ? start.toLocaleDateString('id-ID', { weekday: 'short' })
          : start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      count: 0,
    });
  }
  return buckets;
}

function fillBuckets(
  buckets: DashboardTrendPoint[],
  rows: { createdAt: Date }[],
): DashboardTrendPoint[] {
  const map = new Map(buckets.map((b) => [b.dateKey, { ...b }]));
  for (const row of rows) {
    const key = dateKeyOf(row.createdAt);
    const bucket = map.get(key);
    if (bucket) bucket.count += 1;
  }
  return buckets.map((b) => map.get(b.dateKey)!);
}

export function parseDashboardRangeDays(raw: string | string[] | undefined): DashboardRangeDays {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === '30' ? 30 : 7;
}

export const loadAdminDashboardInsights = cache(async function loadAdminDashboardInsights(
  rangeDays: DashboardRangeDays = 7,
): Promise<AdminDashboardInsights> {
  const now = new Date();
  const rangeStart = startOfDay(new Date(now));
  rangeStart.setDate(rangeStart.getDate() - (rangeDays - 1));

  const [
    studentCount,
    studentsNewInRange,
    courseCount,
    publishedCourseCount,
    pendingEnrollments,
    activeEnrollments,
    totalEnrollments,
    publishedLiveClasses,
    upcomingLiveClasses,
    activeTryoutSessions,
    quizAttemptsInRange,
    tryoutAttemptsInRange,
    badgesIssuedTotal,
    badgesIssuedInRange,
    lessonCompletionsInRange,
    enrollmentsInRange,
    studentsInRange,
    enrollmentByType,
    courseEnrollmentGroups,
    tryoutAttempts,
    liveClasses,
    placementGroups,
    recentLogs,
    activeCourseEnrollments,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'LMS_STUDENT' } }),
    prisma.user.count({
      where: { role: 'LMS_STUDENT', createdAt: { gte: rangeStart } },
    }),
    prisma.course.count(),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.enrollment.count({ where: { status: 'PENDING' } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.enrollment.count(),
    prisma.liveClass.count({ where: { isPublished: true } }),
    prisma.liveClassSession.count({
      where: { scheduledAt: { gte: now }, liveClass: { isPublished: true } },
    }),
    prisma.tryoutSession.count({ where: { isActive: true } }),
    prisma.quizAttempt.count({
      where: { type: 'QUIZ', createdAt: { gte: rangeStart } },
    }),
    prisma.quizAttempt.count({
      where: { type: 'TRYOUT', createdAt: { gte: rangeStart } },
    }),
    prisma.userBadge.count(),
    prisma.userBadge.count({ where: { unlockedAt: { gte: rangeStart } } }),
    prisma.userProgress.count({ where: { completedAt: { gte: rangeStart } } }),
    prisma.enrollment.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.user.findMany({
      where: { role: 'LMS_STUDENT', createdAt: { gte: rangeStart } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.enrollment.groupBy({
      by: ['type'],
      _count: { _all: true },
    }),
    prisma.enrollment.groupBy({
      by: ['courseId', 'status'],
      where: { type: 'COURSE', courseId: { not: null } },
      _count: { _all: true },
    }),
    prisma.quizAttempt.findMany({
      where: {
        type: 'TRYOUT',
        createdAt: { gte: rangeStart },
        tryoutLevel: { not: null },
      },
      select: { tryoutLevel: true, score: true },
    }),
    prisma.liveClass.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, filledSlots: true, maxSlots: true },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.placementAttempt.groupBy({
      by: ['recommendedLevel'],
      _count: { _all: true },
    }),
    prisma.enrollmentLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        action: true,
        type: true,
        productTitle: true,
        studentName: true,
        createdAt: true,
      },
    }),
    prisma.enrollment.findMany({
      where: { type: 'COURSE', status: 'ACTIVE', courseId: { not: null } },
      select: { userId: true, courseId: true },
      take: 200,
    }),
  ]);

  const courseIds = [
    ...new Set(
      [
        ...courseEnrollmentGroups.map((row) => row.courseId),
        ...activeCourseEnrollments.map((row) => row.courseId),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];

  const courses =
    courseIds.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: {
            id: true,
            title: true,
            modules: { select: { lessons: { select: { id: true } } } },
          },
        })
      : [];

  const courseMeta = new Map(
    courses.map((c) => [
      c.id,
      {
        title: c.title,
        lessonIds: c.modules.flatMap((m) => m.lessons.map((l) => l.id)),
      },
    ]),
  );

  const topAgg = new Map<string, { active: number; total: number }>();
  for (const row of courseEnrollmentGroups) {
    if (!row.courseId) continue;
    const cur = topAgg.get(row.courseId) ?? { active: 0, total: 0 };
    cur.total += row._count._all;
    if (row.status === 'ACTIVE') cur.active += row._count._all;
    topAgg.set(row.courseId, cur);
  }

  const topCourses: DashboardTopCourse[] = [...topAgg.entries()]
    .map(([courseId, counts]) => ({
      courseId,
      title: courseMeta.get(courseId)?.title ?? 'Kursus',
      active: counts.active,
      total: counts.total,
    }))
    .sort((a, b) => b.total - a.total || b.active - a.active)
    .slice(0, 8);

  let courseCompletionRate: number | null = null;
  if (activeCourseEnrollments.length > 0) {
    const lessonIdSet = new Set<string>();
    for (const e of activeCourseEnrollments) {
      const meta = e.courseId ? courseMeta.get(e.courseId) : undefined;
      if (meta) for (const id of meta.lessonIds) lessonIdSet.add(id);
    }
    const lessonIds = [...lessonIdSet];
    const userIds = [...new Set(activeCourseEnrollments.map((e) => e.userId))];

    const progressRows =
      lessonIds.length > 0 && userIds.length > 0
        ? await prisma.userProgress.findMany({
            where: { userId: { in: userIds }, lessonId: { in: lessonIds } },
            select: { userId: true, lessonId: true },
          })
        : [];

    const completed = new Set(progressRows.map((p) => `${p.userId}:${p.lessonId}`));
    let sumRatio = 0;
    let counted = 0;
    for (const e of activeCourseEnrollments) {
      if (!e.courseId) continue;
      const lessons = courseMeta.get(e.courseId)?.lessonIds ?? [];
      if (lessons.length === 0) continue;
      const done = lessons.filter((id) => completed.has(`${e.userId}:${id}`)).length;
      sumRatio += done / lessons.length;
      counted += 1;
    }
    if (counted > 0) {
      courseCompletionRate = Math.round((sumRatio / counted) * 100);
    }
  }

  const tryoutAcc = new Map<LevelJLPT, { sum: number; n: number }>();
  for (const level of JLPT_LEVELS) tryoutAcc.set(level, { sum: 0, n: 0 });
  for (const row of tryoutAttempts) {
    if (!row.tryoutLevel) continue;
    const acc = tryoutAcc.get(row.tryoutLevel) ?? { sum: 0, n: 0 };
    acc.sum += row.score;
    acc.n += 1;
    tryoutAcc.set(row.tryoutLevel, acc);
  }
  const tryoutByLevel: DashboardTryoutLevelStat[] = JLPT_LEVELS.map((level) => {
    const acc = tryoutAcc.get(level)!;
    return {
      level,
      attempts: acc.n,
      avgScore: acc.n > 0 ? Math.round(acc.sum / acc.n) : 0,
    };
  }).filter((row) => row.attempts > 0);

  const enrollmentMix: DashboardEnrollmentMix[] = (
    ['COURSE', 'LIVE_CLASS', 'TRYOUT'] as EnrollmentType[]
  ).map((type) => ({
    type,
    label: ENROLLMENT_TYPE_LABEL[type],
    count: enrollmentByType.find((r) => r.type === type)?._count._all ?? 0,
  }));

  const placementMix: DashboardPlacementMix[] = JLPT_LEVELS.map((level) => ({
    level,
    count: placementGroups.find((r) => r.recommendedLevel === level)?._count._all ?? 0,
  })).filter((r) => r.count > 0);

  const liveFill: DashboardLiveFill[] = liveClasses.map((row) => {
    const maxSlots = Math.max(1, row.maxSlots);
    const filledSlots = Math.max(0, row.filledSlots);
    return {
      id: row.id,
      title: row.title,
      filledSlots,
      maxSlots: row.maxSlots,
      fillPercent: Math.min(100, Math.round((filledSlots / maxSlots) * 100)),
    };
  });

  return {
    rangeDays,
    kpis: {
      studentCount,
      studentsNewInRange,
      courseCount,
      publishedCourseCount,
      pendingEnrollments,
      activeEnrollments,
      totalEnrollments,
      publishedLiveClasses,
      upcomingLiveClasses,
      activeTryoutSessions,
      quizAttemptsInRange,
      tryoutAttemptsInRange,
      badgesIssuedTotal,
      badgesIssuedInRange,
      lessonCompletionsInRange,
      courseCompletionRate,
    },
    enrollmentTrend: fillBuckets(buildEmptyBuckets(rangeDays, now), enrollmentsInRange),
    studentGrowth: fillBuckets(buildEmptyBuckets(rangeDays, now), studentsInRange),
    topCourses,
    enrollmentMix,
    tryoutByLevel,
    liveFill,
    placementMix,
    recentActivity: recentLogs.map((row) => ({
      id: row.id,
      action: row.action,
      type: row.type,
      productTitle: row.productTitle,
      studentName: row.studentName,
      createdAt: row.createdAt.toISOString(),
    })),
  };
});
