import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const lmsLog = loggers.learning.child({ module: 'lms-points' });

export type AwardLmsPointsInput = {
  userId: string;
  pointsGained: number;
  sourceKey: string;
  sourceType: 'LESSON_COMPLETE' | 'QUIZ_PASS' | 'TRYOUT' | 'MANUAL';
  sourceId?: string;
};

/** Tambah poin LMS (leaderboard lokal) — idempotent via sourceKey unik. */
export async function awardLmsPoints(input: AwardLmsPointsInput): Promise<number | null> {
  if (input.pointsGained <= 0) return null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.lmsPointEvent.findUnique({
        where: { sourceKey: input.sourceKey },
        select: { pointsGained: true },
      });
      if (existing) {
        const stats = await tx.userLmsStats.findUnique({
          where: { userId: input.userId },
          select: { lmsPoints: true },
        });
        return stats?.lmsPoints ?? 0;
      }

      await tx.lmsPointEvent.create({
        data: {
          userId: input.userId,
          pointsGained: input.pointsGained,
          sourceKey: input.sourceKey,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
        },
      });

      const stats = await tx.userLmsStats.upsert({
        where: { userId: input.userId },
        create: { userId: input.userId, lmsPoints: input.pointsGained },
        update: { lmsPoints: { increment: input.pointsGained } },
        select: { lmsPoints: true },
      });

      return stats.lmsPoints;
    });

    lmsLog.info(
      { userId: input.userId, pointsGained: input.pointsGained, sourceKey: input.sourceKey, total: result },
      'LMS points awarded',
    );
    return result;
  } catch (error) {
    lmsLog.warn({ userId: input.userId, sourceKey: input.sourceKey, error }, 'LMS points award failed');
    return null;
  }
}

export async function getUserLmsPoints(userId: string): Promise<number> {
  const stats = await prisma.userLmsStats.findUnique({
    where: { userId },
    select: { lmsPoints: true },
  });
  return stats?.lmsPoints ?? 0;
}
