import { prisma } from '@/lib/prisma';

export type LogLmsXpEventInput = {
  userId: string;
  xpGained: number;
  sourceKey: string;
  sourceType: string;
  sourceId?: string;
};

/** Idempotent log XP untuk grafik mingguan (mirror Core atau dev fallback). */
export async function logLmsXpEvent(input: LogLmsXpEventInput): Promise<boolean> {
  if (input.xpGained <= 0) return false;

  try {
    await prisma.lmsXpEvent.create({
      data: {
        userId: input.userId,
        xpGained: input.xpGained,
        sourceKey: input.sourceKey,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    });
    return true;
  } catch {
    return false;
  }
}
