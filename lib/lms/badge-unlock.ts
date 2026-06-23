import type { LmsBadgeUnlockRule } from '@prisma/client';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import { awardLmsXp, isCoreAwardConfigured } from '@/lib/core/gamification';
import { logLmsXpEvent } from '@/lib/lms/xp-events';
import { notifyBadgeUnlocked } from '@/lib/lms/notifications';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const badgeLog = loggers.learning.child({ module: 'badge-unlock' });

export type BadgeUnlockEvent =
  | { type: 'FIRST_LESSON' }
  | { type: 'FIRST_QUIZ' }
  | { type: 'TRYOUT_PASS'; score: number };

function eventToRule(event: BadgeUnlockEvent): LmsBadgeUnlockRule {
  switch (event.type) {
    case 'FIRST_LESSON':
      return 'FIRST_LESSON';
    case 'FIRST_QUIZ':
      return 'FIRST_QUIZ';
    case 'TRYOUT_PASS':
      return 'TRYOUT_PASS';
  }
}

function matchesUnlockValue(
  rule: LmsBadgeUnlockRule,
  unlockValue: number | null,
  event: BadgeUnlockEvent,
): boolean {
  if (rule === 'TRYOUT_PASS') {
    const minScore = unlockValue ?? 60;
    return event.type === 'TRYOUT_PASS' && event.score >= minScore;
  }
  return true;
}

async function awardBadgeBonusXp(userId: string, badgeId: string, xpBonus: number): Promise<void> {
  if (xpBonus <= 0) return;

  const sourceKey = `badge:${badgeId}`;
  if (isCoreAwardConfigured()) {
    await awardLmsXp({
      userId,
      kind: 'badge_unlock',
      xpGained: xpBonus,
      sourceRefId: badgeId,
      idempotencyKey: buildLmsIdempotencyKey('badge_unlock', userId, badgeId),
    });
  }

  await logLmsXpEvent({
    userId,
    xpGained: xpBonus,
    sourceKey: `xp:${sourceKey}`,
    sourceType: 'BADGE_UNLOCK',
    sourceId: badgeId,
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
