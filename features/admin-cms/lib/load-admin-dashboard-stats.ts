import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export type AdminDashboardStats = {
  studentCount: number;
  courseCount: number;
  pendingEnrollments: number;
  activeEnrollments: number;
  totalEnrollments: number;
  publishedLiveClasses: number;
  upcomingLiveClasses: number;
  activeTryoutSessions: number;
  quizAttemptsThisWeek: number;
  enrollmentTrend: { label: string; count: number }[];
};

export const loadAdminDashboardStats = cache(async function loadAdminDashboardStats(): Promise<AdminDashboardStats> {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [
    studentCount,
    courseCount,
    pendingEnrollments,
    activeEnrollments,
    totalEnrollments,
    publishedLiveClasses,
    upcomingLiveClasses,
    activeTryoutSessions,
    quizAttemptsThisWeek,
    recentEnrollments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count({ where: { status: 'PENDING' } }),
    prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
    prisma.enrollment.count(),
    prisma.liveClass.count({ where: { isPublished: true } }),
    prisma.liveClass.count({ where: { isPublished: true, scheduledAt: { gte: now } } }),
    prisma.tryoutSession.count({ where: { isActive: true } }),
    prisma.quizAttempt.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.enrollment.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  const enrollmentTrend: { label: string; count: number }[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const start = new Date();
    start.setDate(start.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const count = recentEnrollments.filter(
      (row) => row.createdAt >= start && row.createdAt <= end,
    ).length;
    enrollmentTrend.push({
      label: start.toLocaleDateString('id-ID', { weekday: 'short' }),
      count,
    });
  }

  return {
    studentCount,
    courseCount,
    pendingEnrollments,
    activeEnrollments,
    totalEnrollments,
    publishedLiveClasses,
    upcomingLiveClasses,
    activeTryoutSessions,
    quizAttemptsThisWeek,
    enrollmentTrend,
  };
});
