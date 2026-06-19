import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type AdminTryoutQuestionRow = {
  id: string;
  sortOrder: number;
  tryoutLevel: LevelJLPT;
  tryoutSection: string;
  questionText: string;
  explanation: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export type AdminTryoutSessionDetail = {
  id: string;
  code: string;
  title: string;
  phaseLabel: string;
  timeLimitMinutes: number;
  isActive: boolean;
};

export const loadAdminTryoutSessionDetail = cache(async function loadAdminTryoutSessionDetail(
  sessionId: string,
): Promise<AdminTryoutSessionDetail | null> {
  const row = await prisma.tryoutSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      code: true,
      title: true,
      phaseLabel: true,
      timeLimitMinutes: true,
      isActive: true,
    },
  });
  return row;
});

export async function loadAdminTryoutQuestions(
  sessionId: string,
  level: LevelJLPT,
): Promise<AdminTryoutQuestionRow[]> {
  const rows = await prisma.question.findMany({
    where: { tryoutSessionId: sessionId, tryoutLevel: level, type: 'TRYOUT' },
    orderBy: [{ tryoutSection: 'asc' }, { sortOrder: 'asc' }],
    include: { options: { orderBy: { id: 'asc' } } },
  });

  return rows.map((row) => ({
    id: row.id,
    sortOrder: row.sortOrder,
    tryoutLevel: row.tryoutLevel!,
    tryoutSection: row.tryoutSection ?? 'MOJI_GOI',
    questionText: row.questionText,
    explanation: row.explanation,
    options: row.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.isCorrect,
    })),
  }));
}

export async function loadAdminTryoutQuestionCounts(sessionId: string) {
  const rows = await prisma.question.groupBy({
    by: ['tryoutLevel'],
    where: { tryoutSessionId: sessionId, type: 'TRYOUT' },
    _count: { _all: true },
  });

  const counts: Record<LevelJLPT, number> = { N5: 0, N4: 0, N3: 0, N2: 0, N1: 0 };
  for (const row of rows) {
    if (row.tryoutLevel) counts[row.tryoutLevel] = row._count._all;
  }
  return counts;
}
