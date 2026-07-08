import type { EnrollmentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type EnrollmentCountSummary = {
  active: number;
  pending: number;
  total: number;
};

export type EnrollmentCountMap = Record<string, EnrollmentCountSummary>;

function emptySummary(): EnrollmentCountSummary {
  return { active: 0, pending: 0, total: 0 };
}

export async function getEnrollmentCountsByProduct(
  type: EnrollmentType,
  productIds: string[],
): Promise<EnrollmentCountMap> {
  const map: EnrollmentCountMap = {};
  for (const id of productIds) {
    map[id] = emptySummary();
  }
  if (productIds.length === 0) return map;

  if (type === 'COURSE') {
    const rows = await prisma.enrollment.groupBy({
      by: ['courseId', 'status'],
      where: { type: 'COURSE', courseId: { in: productIds } },
      _count: { _all: true },
    });
    for (const row of rows) {
      if (!row.courseId || !map[row.courseId]) continue;
      const count = row._count._all;
      map[row.courseId].total += count;
      if (row.status === 'ACTIVE') map[row.courseId].active += count;
      if (row.status === 'PENDING') map[row.courseId].pending += count;
    }
  } else if (type === 'LIVE_CLASS') {
    const rows = await prisma.enrollment.groupBy({
      by: ['liveClassId', 'status'],
      where: { type: 'LIVE_CLASS', liveClassId: { in: productIds } },
      _count: { _all: true },
    });
    for (const row of rows) {
      if (!row.liveClassId || !map[row.liveClassId]) continue;
      const count = row._count._all;
      map[row.liveClassId].total += count;
      if (row.status === 'ACTIVE') map[row.liveClassId].active += count;
      if (row.status === 'PENDING') map[row.liveClassId].pending += count;
    }
  } else {
    const rows = await prisma.enrollment.groupBy({
      by: ['tryoutSessionId', 'status'],
      where: { type: 'TRYOUT', tryoutSessionId: { in: productIds } },
      _count: { _all: true },
    });
    for (const row of rows) {
      if (!row.tryoutSessionId || !map[row.tryoutSessionId]) continue;
      const count = row._count._all;
      map[row.tryoutSessionId].total += count;
      if (row.status === 'ACTIVE') map[row.tryoutSessionId].active += count;
      if (row.status === 'PENDING') map[row.tryoutSessionId].pending += count;
    }
  }

  return map;
}

export async function syncLiveClassFilledSlots(liveClassId: string): Promise<void> {
  const activeCount = await prisma.enrollment.count({
    where: { type: 'LIVE_CLASS', liveClassId, status: 'ACTIVE' },
  });
  await prisma.liveClass.update({
    where: { id: liveClassId },
    data: { filledSlots: activeCount },
  });
}
