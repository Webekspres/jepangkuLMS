import { LMS_TO_CORE_ACTIVITY, type LmsActivityKind } from '@/lib/core/activity-map';
import { awardLmsXp, isCoreAwardConfigured } from '@/lib/core/gamification';
import { prisma } from '@/lib/prisma';
import { loggers } from '@/lib/logger';

const retryLog = loggers.core.child({ module: 'core-xp-retry' });

/** Hentikan retry per-baris setelah sekian percobaan gagal (hindari hot-loop). */
const MAX_CORE_SYNC_ATTEMPTS = 10;

export type RetryPendingCoreXpResult = {
  processed: number;
  synced: number;
  failed: number;
  skipped: boolean;
};

function isKnownActivityKind(kind: string | null): kind is LmsActivityKind {
  return kind != null && kind in LMS_TO_CORE_ACTIVITY;
}

/**
 * Drain outbox: re-dispatch `LmsXpEvent` PENDING ke Core (idempoten via
 * `coreIdempotencyKey`). Aman dipanggil berkali-kali / paralel — Core balas
 * replay idempoten untuk key yang sudah tercatat.
 *
 * @param opts.userId  Batasi ke satu user (drain oportunistik pasca-aktivitas).
 * @param opts.limit   Maks baris per panggilan (default 25).
 */
export async function retryPendingCoreXp(opts?: {
  userId?: string;
  limit?: number;
}): Promise<RetryPendingCoreXpResult> {
  const base: RetryPendingCoreXpResult = {
    processed: 0,
    synced: 0,
    failed: 0,
    skipped: false,
  };

  // Core mati / tidak dikonfigurasi → jangan sentuh outbox (tetap PENDING).
  if (!isCoreAwardConfigured()) {
    return { ...base, skipped: true };
  }

  const limit = opts?.limit ?? 25;
  const pending = await prisma.lmsXpEvent.findMany({
    where: {
      coreStatus: 'PENDING',
      coreIdempotencyKey: { not: null },
      coreKind: { not: null },
      coreAttempts: { lt: MAX_CORE_SYNC_ATTEMPTS },
      ...(opts?.userId ? { userId: opts.userId } : {}),
    },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  if (pending.length === 0) return base;

  let synced = 0;
  let failed = 0;

  for (const event of pending) {
    if (!isKnownActivityKind(event.coreKind) || !event.coreIdempotencyKey) {
      // Baris korup / kind tak dikenal — keluarkan dari antrian retry.
      await prisma.lmsXpEvent.update({
        where: { id: event.id },
        data: { coreStatus: 'SKIPPED', coreLastError: 'unknown_core_kind' },
      });
      continue;
    }

    const result = await awardLmsXp({
      userId: event.userId,
      kind: event.coreKind,
      xpGained: event.xpGained,
      sourceRefId: event.sourceId ?? undefined,
      idempotencyKey: event.coreIdempotencyKey,
    });

    if (result.status === 'synced') {
      await prisma.lmsXpEvent.update({
        where: { id: event.id },
        data: {
          coreStatus: 'SYNCED',
          coreSyncedAt: new Date(),
          coreAttempts: { increment: 1 },
          coreLastError: null,
        },
      });
      synced += 1;
    } else if (result.status === 'skipped') {
      // Config dimatikan di tengah jalan — stop, sisanya biarkan PENDING.
      return { processed: synced + failed, synced, failed, skipped: true };
    } else {
      const reason =
        result.reason === 'http_error'
          ? `http_${result.httpStatus ?? 'error'}`
          : result.reason;
      await prisma.lmsXpEvent.update({
        where: { id: event.id },
        data: { coreAttempts: { increment: 1 }, coreLastError: reason },
      });
      failed += 1;
    }
  }

  if (synced > 0 || failed > 0) {
    retryLog.info(
      { userId: opts?.userId, processed: pending.length, synced, failed },
      'Core XP outbox drained',
    );
  }

  return { processed: pending.length, synced, failed, skipped: false };
}
