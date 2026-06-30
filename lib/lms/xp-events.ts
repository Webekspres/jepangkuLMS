import { Prisma } from '@prisma/client';
import type { LmsCoreSyncStatus } from '@prisma/client';
import type { LmsActivityKind } from '@/lib/core/activity-map';
import { prisma } from '@/lib/prisma';

export type LogLmsXpEventInput = {
  userId: string;
  xpGained: number;
  sourceKey: string;
  sourceType: string;
  sourceId?: string;
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
 * Upsert on sourceKey; P2002 race → silent skip.
 */
export async function logLmsXpEvent(input: LogLmsXpEventInput): Promise<boolean> {
  if (input.xpGained <= 0) return false;

  const coreStatus: LmsCoreSyncStatus = input.coreStatus ?? 'SYNCED';

  try {
    await prisma.lmsXpEvent.upsert({
      where: { sourceKey: input.sourceKey },
      update: {},
      create: {
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
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      console.log(`[XP Idempotency Skip] SourceKey ${input.sourceKey} already exists.`);
      return false;
    }
    throw error;
  }
}
