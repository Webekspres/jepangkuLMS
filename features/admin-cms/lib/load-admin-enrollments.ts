import { cache } from 'react';
import type { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AdminEnrollmentRow = {
  id: string;
  status: EnrollmentStatus;
  createdAt: Date;
  userId: string;
  userDisplayName: string | null;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  priceIdr: number;
};

export const loadAdminEnrollments = cache(async function loadAdminEnrollments(): Promise<{
  enrollments: AdminEnrollmentRow[];
  pendingCount: number;
  courses: { id: string; title: string; slug: string }[];
}> {
  const [enrollments, courses] = await Promise.all([
    prisma.enrollment.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { displayName: true } },
        course: { select: { title: true, slug: true, priceIdr: true } },
      },
    }),
    prisma.course.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true, slug: true },
    }),
  ]);

  const rows: AdminEnrollmentRow[] = enrollments.map((row) => ({
    id: row.id,
    status: row.status,
    createdAt: row.createdAt,
    userId: row.userId,
    userDisplayName: row.user.displayName,
    courseId: row.courseId,
    courseTitle: row.course.title,
    courseSlug: row.course.slug,
    priceIdr: row.course.priceIdr,
  }));

  return {
    enrollments: rows,
    pendingCount: rows.filter((row) => row.status === 'PENDING').length,
    courses,
  };
});
