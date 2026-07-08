import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export type AdminUserRow = {
  id: string;
  displayName: string | null;
  ssoDisplayName: string | null;
  ssoEmail: string | null;
  phone: string | null;
  resolvedDisplayName: string;
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
    select: {
      id: true,
      displayName: true,
      ssoDisplayName: true,
      ssoEmail: true,
      phone: true,
      role: true,
      createdAt: true,
      lmsStats: { select: { lmsPoints: true } },
      enrollments: { select: { status: true } },
      _count: { select: { badges: true, enrollments: true } },
    },
  });

  return users.map((user) => ({
    id: user.id,
    displayName: user.displayName,
    ssoDisplayName: user.ssoDisplayName,
    ssoEmail: user.ssoEmail,
    phone: user.phone,
    resolvedDisplayName: resolvePublicDisplayName({
      displayName: user.displayName,
      ssoDisplayName: user.ssoDisplayName,
    }),
    role: user.role,
    lmsPoints: user.lmsStats?.lmsPoints ?? 0,
    badgeCount: user._count.badges,
    enrollmentCount: user._count.enrollments,
    activeEnrollmentCount: user.enrollments.filter((row) => row.status === 'ACTIVE').length,
    createdAt: user.createdAt,
  }));
}
