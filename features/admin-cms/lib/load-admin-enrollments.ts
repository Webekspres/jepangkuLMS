import { cache } from 'react';
import type { EnrollmentStatus, EnrollmentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AdminEnrollmentRow = {
  id: string;
  status: EnrollmentStatus;
  type: EnrollmentType;
  createdAt: Date;
  userId: string;
  userDisplayName: string | null;
  /** ID produk yang sesuai dengan `type` (course/liveClass/tryout). */
  productId: string;
  productTitle: string;
  /** Baris kedua: slug kursus / nama sensei / kode tryout. */
  productSubtitle: string;
  priceIdr: number;
};

export type AdminEnrollmentProductOption = { id: string; title: string };

export const loadAdminEnrollments = cache(async function loadAdminEnrollments(): Promise<{
  enrollments: AdminEnrollmentRow[];
  pendingCount: number;
  courses: AdminEnrollmentProductOption[];
  liveClasses: AdminEnrollmentProductOption[];
  tryoutSessions: AdminEnrollmentProductOption[];
}> {
  const [enrollments, courses, liveClasses, tryoutSessions] = await Promise.all([
    prisma.enrollment.findMany({
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        user: { select: { displayName: true } },
        course: { select: { title: true, slug: true, priceIdr: true } },
        liveClass: { select: { title: true, senseiName: true, priceIdr: true } },
        tryoutSession: { select: { title: true, code: true, priceIdr: true } },
      },
    }),
    prisma.course.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.liveClass.findMany({ orderBy: { title: 'asc' }, select: { id: true, title: true } }),
    prisma.tryoutSession.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true },
    }),
  ]);

  const rows: AdminEnrollmentRow[] = [];
  for (const row of enrollments) {
    const base = {
      id: row.id,
      status: row.status,
      type: row.type,
      createdAt: row.createdAt,
      userId: row.userId,
      userDisplayName: row.user.displayName,
    };

    if (row.type === 'COURSE' && row.course && row.courseId) {
      rows.push({
        ...base,
        productId: row.courseId,
        productTitle: row.course.title,
        productSubtitle: row.course.slug,
        priceIdr: row.course.priceIdr,
      });
    } else if (row.type === 'LIVE_CLASS' && row.liveClass && row.liveClassId) {
      rows.push({
        ...base,
        productId: row.liveClassId,
        productTitle: row.liveClass.title,
        productSubtitle: row.liveClass.senseiName,
        priceIdr: row.liveClass.priceIdr,
      });
    } else if (row.type === 'TRYOUT' && row.tryoutSession && row.tryoutSessionId) {
      rows.push({
        ...base,
        productId: row.tryoutSessionId,
        productTitle: row.tryoutSession.title,
        productSubtitle: row.tryoutSession.code,
        priceIdr: row.tryoutSession.priceIdr,
      });
    }
  }

  return {
    enrollments: rows,
    pendingCount: rows.filter((row) => row.status === 'PENDING').length,
    courses,
    liveClasses,
    tryoutSessions,
  };
});
