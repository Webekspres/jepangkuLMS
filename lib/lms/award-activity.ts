import type { LmsCoreSyncStatus } from '@prisma/client';
import type { LmsActivityKind } from '@/lib/core/activity-map';
import { buildLmsIdempotencyKey } from '@/lib/core/activity-map';
import {
  awardLmsXp,
  coreResultToSyncStatus,
  isCoreAwardConfigured,
} from '@/lib/core/gamification';
import { awardLmsPoints, type LmsPointSourceType } from '@/lib/lms/points';
import { logLmsXpEvent } from '@/lib/lms/xp-events';

export type LmsPointsSourceType = LmsPointSourceType;

export type LmsPointEventInput = {
  amount: number;
  pointsSourceKey: string;
  pointsSourceType: LmsPointsSourceType;
  sourceId?: string;
};

export type AwardLmsActivityInput = {
  userId: string;
  amount: number;
  /** Override poin leaderboard; default = `amount`. */
  pointsAmount?: number;
  /** Override XP Core + log lokal; default = `amount`. */
  xpAmount?: number;
  coreKind: LmsActivityKind;
  pointsSourceKey: string;
  pointsSourceType: LmsPointsSourceType;
  sourceId?: string;
  idempotencyKey?: string;
};

export type AwardLmsSplitActivityInput = {
  userId: string;
  coreKind: LmsActivityKind;
  xpAmount: number;
  pointEvents: LmsPointEventInput[];
  sourceId?: string;
  idempotencyKey: string;
  xpSourceType: LmsPointsSourceType;
};

/**
 * Award LMS points (leaderboard) + Core XP (level) + local XP log (weekly chart).
 */
export async function awardLmsActivity(input: AwardLmsActivityInput): Promise<{
  pointsTotal: number | null;
  coreAwarded: boolean;
}> {
  const {
    userId,
    amount,
    coreKind,
    pointsSourceKey,
    pointsSourceType,
    sourceId,
  } = input;
  const pointsAmount = input.pointsAmount ?? amount;
  const xpAmount = input.xpAmount ?? amount;
  if (pointsAmount <= 0 && xpAmount <= 0) return { pointsTotal: null, coreAwarded: false };

  let pointsTotal: number | null = null;
  if (pointsAmount > 0) {
    const pointsResult = await awardLmsPoints({
      userId,
      pointsGained: pointsAmount,
      sourceKey: pointsSourceKey,
      sourceType: pointsSourceType,
      sourceId,
    });
    pointsTotal = pointsResult?.total ?? null;
  }

  const xpSourceKey = `xp:${pointsSourceKey}`;
  let coreAwarded = false;

  if (xpAmount > 0) {
    const coreIdempotencyKey =
      input.idempotencyKey ??
      buildLmsIdempotencyKey(coreKind, userId, sourceId ?? pointsSourceKey);

    // Attempt Core FIRST so the local outbox row records the real sync status.
    let coreStatus: LmsCoreSyncStatus = 'SKIPPED';
    if (isCoreAwardConfigured()) {
      const coreResult = await awardLmsXp({
        userId,
        kind: coreKind,
        xpGained: xpAmount,
        sourceRefId: sourceId,
        idempotencyKey: coreIdempotencyKey,
      });
      coreStatus = coreResultToSyncStatus(coreResult);
      coreAwarded = coreStatus === 'SYNCED';
    }

    // Outbox: PENDING rows are re-dispatched by retryPendingCoreXp().
    await logLmsXpEvent({
      userId,
      xpGained: xpAmount,
      sourceKey: xpSourceKey,
      sourceType: pointsSourceType,
      sourceId,
      coreKind,
      coreIdempotencyKey,
      coreStatus,
    });
  }

  return { pointsTotal, coreAwarded };
}

/** Award beberapa transaksi poin (base + bonus) dengan satu XP Core. */
export async function awardLmsSplitActivity(input: AwardLmsSplitActivityInput): Promise<{
  pointsTotal: number | null;
  coreAwarded: boolean;
  awardedPointEvents: number;
}> {
  const { userId, coreKind, xpAmount, pointEvents, sourceId, idempotencyKey, xpSourceType } = input;

  let pointsTotal: number | null = null;
  let awardedPointEvents = 0;

  for (const event of pointEvents) {
    if (event.amount <= 0) continue;
    const result = await awardLmsPoints({
      userId,
      pointsGained: event.amount,
      sourceKey: event.pointsSourceKey,
      sourceType: event.pointsSourceType,
      sourceId: event.sourceId ?? sourceId,
    });
    if (result?.awarded) {
      pointsTotal = result.total;
      awardedPointEvents += 1;
    } else if (result && pointsTotal == null) {
      pointsTotal = result.total;
    }
  }

  let coreAwarded = false;
  if (xpAmount > 0) {
    let coreStatus: LmsCoreSyncStatus = 'SKIPPED';
    if (isCoreAwardConfigured()) {
      const coreResult = await awardLmsXp({
        userId,
        kind: coreKind,
        xpGained: xpAmount,
        sourceRefId: sourceId,
        idempotencyKey,
      });
      coreStatus = coreResultToSyncStatus(coreResult);
      coreAwarded = coreStatus === 'SYNCED';
    }

    await logLmsXpEvent({
      userId,
      xpGained: xpAmount,
      sourceKey: `xp:${idempotencyKey}`,
      sourceType: xpSourceType,
      sourceId,
      coreKind,
      coreIdempotencyKey: idempotencyKey,
      coreStatus,
    });
  }

  return { pointsTotal, coreAwarded, awardedPointEvents };
}
