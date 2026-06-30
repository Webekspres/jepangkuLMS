import { cache } from 'react';
import type { LevelJLPT } from '@prisma/client';
import { compareTryoutSections } from '@/features/admin-cms/lib/tryout-sections';
import { prisma } from '@/lib/prisma';

export type AdminTryoutQuestionRow = {
  id: string;
  sortOrder: number;
  tryoutSection: string;
  questionText: string;
  explanation: string | null;
  audioUrl: string | null;
  audioGroupId: string | null;
  options: { id: string; text: string; isCorrect: boolean }[];
};

export type AdminTryoutSessionDetail = {
  id: string;
  code: string;
  title: string;
  phaseLabel: string;
  level: LevelJLPT;
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
      level: true,
      timeLimitMinutes: true,
      isActive: true,
    },
  });
  return row;
});

export async function loadAdminTryoutQuestions(
  sessionId: string,
): Promise<AdminTryoutQuestionRow[]> {
  const rows = await prisma.question.findMany({
    where: { tryoutSessionId: sessionId, type: 'TRYOUT' },
    orderBy: [{ sortOrder: 'asc' }],
    include: { options: { orderBy: { id: 'asc' } } },
  });

  return rows
    .sort((a, b) => {
      const sectionCmp = compareTryoutSections(
        a.tryoutSection ?? 'MOJI_GOI',
        b.tryoutSection ?? 'MOJI_GOI',
      );
      if (sectionCmp !== 0) return sectionCmp;
      return a.sortOrder - b.sortOrder;
    })
    .map((row) => ({
      id: row.id,
      sortOrder: row.sortOrder,
      tryoutSection: row.tryoutSection ?? 'MOJI_GOI',
      questionText: row.questionText,
      explanation: row.explanation,
      audioUrl: row.audioUrl,
      audioGroupId: row.audioGroupId,
      options: row.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
    }));
}

export async function loadAdminTryoutQuestionCount(sessionId: string): Promise<number> {
  return prisma.question.count({
    where: { tryoutSessionId: sessionId, type: 'TRYOUT' },
  });
}
