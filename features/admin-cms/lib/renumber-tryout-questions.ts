import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/lib/prisma';

const TRYOUT_SECTIONS = ['MOJI_GOI', 'BUNPOU_DOKKAI', 'CHOKAI'] as const;

/** Renumber sortOrder 1..n per JLPT section (safe during RSC load — no revalidatePath). */
export async function renumberTryoutQuestionsForSession(
  sessionId: string,
  db: PrismaClient = defaultPrisma,
): Promise<number> {
  const updates: ReturnType<PrismaClient['question']['update']>[] = [];

  for (const section of TRYOUT_SECTIONS) {
    const rows = await db.question.findMany({
      where: {
        tryoutSessionId: sessionId,
        tryoutSection: section,
        type: 'TRYOUT',
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      select: { id: true, sortOrder: true },
    });

    rows.forEach((row, index) => {
      const nextOrder = index + 1;
      if (row.sortOrder !== nextOrder) {
        updates.push(
          db.question.update({
            where: { id: row.id },
            data: { sortOrder: nextOrder },
          }),
        );
      }
    });
  }

  if (updates.length > 0) {
    await db.$transaction(updates);
  }

  return updates.length;
}

/** @deprecated Use renumberTryoutQuestionsForSession */
export const renumberTryoutQuestionsForLevel = renumberTryoutQuestionsForSession;
