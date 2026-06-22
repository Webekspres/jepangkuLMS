import { prisma } from '@/lib/prisma';

export type AdminUserRow = {
  id: string;
  displayName: string | null;
  role: 'LMS_STUDENT' | 'LMS_ADMIN';
  lmsPoints: number;
  badgeCount: number;
  enrollmentCount: number;
  activeEnrollmentCount: number;
  createdAt: Date;
};

export async function loadAdminUsers(): Promise<AdminUserRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      lmsStats: { select: { lmsPoints: true } },
      enrollments: { select: { status: true } },
      _count: { select: { badges: true, enrollments: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    role: user.role,
    lmsPoints: user.lmsStats?.lmsPoints ?? 0,
    badgeCount: user._count.badges,
    enrollmentCount: user._count.enrollments,
    activeEnrollmentCount: user.enrollments.filter((row) => row.status === 'ACTIVE').length,
    createdAt: user.createdAt,
  }));
}
