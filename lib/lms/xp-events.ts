import type { LmsCoreSyncStatus } from '@prisma/client';
import type { LmsActivityKind } from '@/lib/core/activity-map';
import { prisma } from '@/lib/prisma';

export type LogLmsXpEventInput = {
  userId: string;
  xpGained: number;
  sourceKey: string;
  sourceType: string;
  sourceId?: string;
  // --- Outbox sinkronisasi Core ---
  /** Kind untuk re-dispatch saat retry; wajib agar baris bisa di-retry. */
  coreKind?: LmsActivityKind;
  /** Idempotency key persis yang dikirim/akan dikirim ke Core. */
  coreIdempotencyKey?: string;
  /** Status awal: SYNCED jika Core sudah menerima, PENDING jika perlu retry,
   *  SKIPPED jika Core sengaja tidak dikonfigurasi. Default SYNCED. */
  coreStatus?: LmsCoreSyncStatus;
};

/**
 * Idempotent log XP (grafik mingguan) + baris outbox sinkronisasi Core.
 * Unik per `sourceKey`; create yang gagal (duplikat) dianggap no-op aman.
 */
export async function logLmsXpEvent(input: LogLmsXpEventInput): Promise<boolean> {
  if (input.xpGained <= 0) return false;

  const coreStatus: LmsCoreSyncStatus = input.coreStatus ?? 'SYNCED';

  try {
    await prisma.lmsXpEvent.create({
      data: {
        userId: input.userId,
        xpGained: input.xpGained,
        sourceKey: input.sourceKey,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        coreKind: input.coreKind,
        coreIdempotencyKey: input.coreIdempotencyKey,
        coreStatus,
        coreSyncedAt: coreStatus === 'SYNCED' ? new Date() : null,
      },
    });
    return true;
  } catch {
    return false;
  }
}
