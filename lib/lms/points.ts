import { getJakartaDateKey } from '@/lib/jakarta-calendar';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import { awardLmsXp, isCoreAwardConfigured } from '@/lib/core/gamification';
import { GAMIFICATION_REWARDS } from '@/features/student/lib/gamification-rewards';
import { LMS_POINTS, lmsDailyLoginSourceKey } from '@/lib/lms/point-rules';
import { logLmsXpEvent } from '@/lib/lms/xp-events';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const lmsLog = loggers.learning.child({ module: 'lms-points' });

export type LmsPointSourceType =
  | 'DAILY_LOGIN'
  | 'LESSON_COMPLETE'
  | 'QUIZ_PASS'
  | 'QUIZ_CORRECT'
  | 'TRYOUT'
  | 'TRYOUT_CORRECT'
  | 'FLASHCARD_VISIT'
  | 'LESSON_COMMENT'
  | 'MANUAL';

export type AwardLmsPointsInput = {
  userId: string;
  pointsGained: number;
  sourceKey: string;
  sourceType: LmsPointSourceType;
  sourceId?: string;
};

/** Tambah poin LMS (leaderboard lokal) — idempotent via sourceKey unik. */
export async function awardLmsPoints(input: AwardLmsPointsInput): Promise<{
  total: number;
  awarded: boolean;
} | null> {
  if (input.pointsGained <= 0) return null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.lmsPointEvent.findUnique({
        where: { sourceKey: input.sourceKey },
        select: { userId: true, pointsGained: true },
      });
      if (existing) {
        const stats = await tx.userLmsStats.findUnique({
          where: { userId: input.userId },
          select: { lmsPoints: true },
        });
        return { total: stats?.lmsPoints ?? 0, awarded: false };
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

      return { total: stats.lmsPoints, awarded: true };
    });

    if (result.awarded) {
      lmsLog.info(
        {
          userId: input.userId,
          pointsGained: input.pointsGained,
          sourceKey: input.sourceKey,
          total: result.total,
        },
        'LMS points awarded',
      );
    }
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

/** Daily login reward — idempotent per calendar day (Asia/Jakarta). */
export async function checkDailyLoginLms(userId: string): Promise<boolean> {
  const today = getJakartaDateKey();
  const result = await awardLmsPoints({
    userId,
    pointsGained: LMS_POINTS.DAILY_LOGIN,
    sourceKey: lmsDailyLoginSourceKey(userId, today),
    sourceType: 'DAILY_LOGIN',
    sourceId: today,
  });

  const awarded = result?.awarded ?? false;
  // Hanya award XP saat poin baru diberikan → Core dipanggil maksimal sekali/hari.
  const dailyLoginXp = GAMIFICATION_REWARDS.DAILY_LOGIN.xp;
  if (awarded && dailyLoginXp > 0) {
    if (isCoreAwardConfigured()) {
      await awardLmsXp({
        userId,
        kind: 'daily_login',
        xpGained: dailyLoginXp,
        sourceRefId: today,
        idempotencyKey: buildLmsIdempotencyKey('daily_login', userId, today),
      }).catch((error) => {
        lmsLog.warn({ userId, error }, 'Daily login Core XP skipped');
      });
    }
    await logLmsXpEvent({
      userId,
      xpGained: dailyLoginXp,
      sourceKey: `xp:${lmsDailyLoginSourceKey(userId, today)}`,
      sourceType: 'DAILY_LOGIN',
      sourceId: today,
    });
  }

  return awarded;
}
