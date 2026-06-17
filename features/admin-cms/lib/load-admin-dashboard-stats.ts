import { cache } from 'react';
import { prisma } from '@/lib/prisma';

export type AdminDashboardStats = {
  studentCount: number;
  courseCount: number;
  pendingEnrollments: number;
};

export const loadAdminDashboardStats = cache(async function loadAdminDashboardStats(): Promise<AdminDashboardStats> {
  const [studentCount, courseCount, pendingEnrollments] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.enrollment.count({ where: { status: 'PENDING' } }),
  ]);

  return { studentCount, courseCount, pendingEnrollments };
});
