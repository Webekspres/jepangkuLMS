import 'server-only';

import { prisma } from '@/lib/prisma';
import type { XpActivityRow } from '@/lib/lms/xp-activity-types';

export type { XpActivityRow } from '@/lib/lms/xp-activity-types';

const SOURCE_LABELS: Record<string, string> = {
  DAILY_LOGIN: 'Login harian',
  LESSON_COMPLETE: 'Menyelesaikan pelajaran',
  QUIZ_PASS: 'Lulus kuis',
  QUIZ_CORRECT: 'Jawaban benar kuis',
  TRYOUT: 'Menyelesaikan tryout',
  TRYOUT_CORRECT: 'Jawaban benar tryout',
  FLASHCARD_VISIT: 'Menjelajahi flashcard',
  LESSON_COMMENT: 'Komentar pelajaran',
  BADGE_UNLOCK: 'Bonus unlock badge',
  ENROLLMENT: 'Bonus enrollment',
};

async function resolveActivityLabel(
  sourceType: string,
  sourceId: string | null,
): Promise<string> {
  const base = SOURCE_LABELS[sourceType] ?? 'Aktivitas belajar';

  if (sourceType === 'LESSON_COMPLETE' && sourceId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: sourceId },
      select: { title: true },
    });
    if (lesson?.title) return `${base}: ${lesson.title}`;
  }

  if (sourceType === 'QUIZ_PASS' && sourceId) {
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: sourceId },
      select: { score: true },
    });
    if (attempt) return `${base} dengan skor ${attempt.score}%`;
  }

  if (sourceType === 'BADGE_UNLOCK' && sourceId) {
    const badge = await prisma.lmsBadge.findUnique({
      where: { id: sourceId },
      select: { title: true },
    });
    if (badge?.title) return `Bonus badge: ${badge.title}`;
  }

  return base;
}

export async function loadRecentXpActivity(
  userId: string,
  limit = 10,
): Promise<XpActivityRow[]> {
  const rows = await prisma.lmsXpEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      xpGained: true,
      sourceType: true,
      sourceId: true,
      createdAt: true,
    },
  });

  return Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      label: await resolveActivityLabel(row.sourceType, row.sourceId),
      xpGained: row.xpGained,
      createdAt: row.createdAt,
    })),
  );
}
