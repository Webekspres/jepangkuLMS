import { cache } from 'react';
import type { EnrollmentLogAction, EnrollmentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AdminEnrollmentHistoryRow = {
  id: string;
  enrollmentId: string | null;
  userId: string;
  type: EnrollmentType;
  action: EnrollmentLogAction;
  productTitle: string;
  productSubtitle: string | null;
  studentName: string | null;
  actorName: string | null;
  createdAt: Date;
};

export const loadAdminEnrollmentHistory = cache(async function loadAdminEnrollmentHistory(): Promise<
  AdminEnrollmentHistoryRow[]
> {
  const rows = await prisma.enrollmentLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    select: {
      id: true,
      enrollmentId: true,
      userId: true,
      type: true,
      action: true,
      productTitle: true,
      productSubtitle: true,
      studentName: true,
      actorName: true,
      createdAt: true,
    },
  });

  return rows;
});
