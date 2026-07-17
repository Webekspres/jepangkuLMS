import type { LmsBadgeUnlockRule, LmsCoreSyncStatus } from '@prisma/client';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import {
  awardLmsXp,
  coreResultToSyncStatus,
  isCoreAwardConfigured,
} from '@/lib/core/gamification';
import { logLmsXpEvent } from '@/lib/lms/xp-events';
import { notifyBadgeUnlocked } from '@/lib/lms/notifications';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const badgeLog = loggers.learning.child({ module: 'badge-unlock' });

export type BadgeUnlockEvent =
  | { type: 'FIRST_LESSON' }
  | { type: 'FIRST_QUIZ' }
  | { type: 'TRYOUT_SCORE_THRESHOLD'; score: number }
  | { type: 'TRYOUT_PASS'; score: number }
  | {
      type: 'SPECIFIC_COURSE_COMPLETE';
      courseId: string;
    }
  | {
      type: 'SPECIFIC_MODULE_COMPLETE';
      courseId: string;
      moduleId: string;
    }
  | {
      type: 'SPECIFIC_LESSON_COMPLETE';
      courseId: string;
      moduleId: string;
      lessonId: string;
    };

function eventToRule(event: BadgeUnlockEvent): LmsBadgeUnlockRule {
  switch (event.type) {
    case 'FIRST_LESSON':
      return 'FIRST_LESSON';
    case 'FIRST_QUIZ':
      return 'FIRST_QUIZ';
    case 'TRYOUT_SCORE_THRESHOLD':
      return 'TRYOUT_SCORE_THRESHOLD';
    case 'TRYOUT_PASS':
      return 'TRYOUT_PASS';
    case 'SPECIFIC_COURSE_COMPLETE':
      return 'SPECIFIC_COURSE_COMPLETE';
    case 'SPECIFIC_MODULE_COMPLETE':
      return 'SPECIFIC_MODULE_COMPLETE';
    case 'SPECIFIC_LESSON_COMPLETE':
      return 'SPECIFIC_LESSON_COMPLETE';
  }
}

function matchesUnlockValue(
  rule: LmsBadgeUnlockRule,
  unlockValue: number | null,
  event: BadgeUnlockEvent,
): boolean {
  if (rule === 'TRYOUT_PASS' || rule === 'TRYOUT_SCORE_THRESHOLD') {
    const minScore = unlockValue ?? 60;
    return (
      (event.type === 'TRYOUT_PASS' || event.type === 'TRYOUT_SCORE_THRESHOLD') &&
      event.score >= minScore
    );
  }
  return true;
}

function matchesUnlockTarget(
  badge: {
    targetCourseId: string | null;
    targetModuleId: string | null;
    targetLessonId: string | null;
  },
  event: BadgeUnlockEvent,
): boolean {
  if (event.type === 'SPECIFIC_COURSE_COMPLETE') {
    return badge.targetCourseId === event.courseId;
  }
  if (event.type === 'SPECIFIC_MODULE_COMPLETE') {
    return badge.targetCourseId === event.courseId && badge.targetModuleId === event.moduleId;
  }
  if (event.type === 'SPECIFIC_LESSON_COMPLETE') {
    return (
      badge.targetCourseId === event.courseId &&
      badge.targetModuleId === event.moduleId &&
      badge.targetLessonId === event.lessonId
    );
  }
  return true;
}

async function awardBadgeBonusXp(userId: string, badgeId: string, xpBonus: number): Promise<void> {
  if (xpBonus <= 0) return;

  const sourceKey = `badge:${badgeId}`;
  const coreIdempotencyKey = buildLmsIdempotencyKey('badge_unlock', userId, badgeId);
  let coreStatus: LmsCoreSyncStatus = 'SKIPPED';
  if (isCoreAwardConfigured()) {
    const coreResult = await awardLmsXp({
      userId,
      kind: 'badge_unlock',
      xpGained: xpBonus,
      sourceRefId: badgeId,
      idempotencyKey: coreIdempotencyKey,
    });
    coreStatus = coreResultToSyncStatus(coreResult);
  }

  await logLmsXpEvent({
    userId,
    xpGained: xpBonus,
    sourceKey: `xp:${sourceKey}`,
    sourceType: 'BADGE_UNLOCK',
    sourceId: badgeId,
    coreKind: 'badge_unlock',
    coreIdempotencyKey,
    coreStatus,
  });
}

/** Evaluasi & unlock badge berdasarkan rule — idempotent + bonus XP sekali. */
export async function evaluateBadgeUnlocks(
  userId: string,
  event: BadgeUnlockEvent,
): Promise<string[]> {
  const rule = eventToRule(event);
  const badges = await prisma.lmsBadge.findMany({
    where: { unlockRule: rule },
    orderBy: { sortOrder: 'asc' },
  });

  const unlockedCodes: string[] = [];

  for (const badge of badges) {
    if (!matchesUnlockValue(badge.unlockRule, badge.unlockValue, event)) continue;
    if (!matchesUnlockTarget(badge, event)) continue;

    const existing = await prisma.userBadge.findUnique({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
    });
    if (existing) continue;

    await prisma.userBadge.create({
      data: { userId, badgeId: badge.id, xpBonusAwarded: badge.xpBonus > 0 },
    });

    await awardBadgeBonusXp(userId, badge.id, badge.xpBonus);
    unlockedCodes.push(badge.code);

    await notifyBadgeUnlocked({
      userId,
      badgeId: badge.id,
      badgeTitle: badge.title,
      xpBonus: badge.xpBonus,
    });

    badgeLog.info({ userId, badgeCode: badge.code, xpBonus: badge.xpBonus, event: event.type }, 'Badge unlocked');
  }

  return unlockedCodes;
}

/** Grant manual badge (admin). */
export async function grantBadgeToUser(userId: string, badgeId: string): Promise<boolean> {
  const badge = await prisma.lmsBadge.findUnique({ where: { id: badgeId } });
  if (!badge) return false;

  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId } },
  });
  if (existing) return false;

  await prisma.userBadge.create({
    data: { userId, badgeId, xpBonusAwarded: badge.xpBonus > 0 },
  });
  await awardBadgeBonusXp(userId, badge.id, badge.xpBonus);
  return true;
}
