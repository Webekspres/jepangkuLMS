import { cache } from 'react';
import type { EnrollmentStatus, EnrollmentType } from '@prisma/client';
import { resolvePublicDisplayName } from '@/lib/lms/display-name';
import { prisma } from '@/lib/prisma';

export type ProgramEnrollmentStudentRow = {
  id: string;
  userId: string;
  displayName: string;
  phone: string | null;
  status: EnrollmentStatus;
  createdAt: Date;
};

function enrollmentWhere(type: EnrollmentType, productId: string) {
  if (type === 'COURSE') {
    return { type: 'COURSE' as const, courseId: productId };
  }
  if (type === 'LIVE_CLASS') {
    return { type: 'LIVE_CLASS' as const, liveClassId: productId };
  }
  return { type: 'TRYOUT' as const, tryoutSessionId: productId };
}

export const loadProgramEnrollments = cache(async function loadProgramEnrollments(
  type: EnrollmentType,
  productId: string,
): Promise<ProgramEnrollmentStudentRow[]> {
  const rows = await prisma.enrollment.findMany({
    where: enrollmentWhere(type, productId),
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      user: { select: { id: true, displayName: true, ssoDisplayName: true, phone: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    displayName: resolvePublicDisplayName({
      displayName: row.user.displayName,
      ssoDisplayName: row.user.ssoDisplayName,
    }),
    phone: row.user.phone,
    status: row.status,
    createdAt: row.createdAt,
  }));
});
